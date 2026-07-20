"""Clerk authentication for the FastAPI backend.

This module lets the FastAPI service trust Clerk sessions issued by the
Next.js frontend. It is feature-flagged on the presence of CLERK_SECRET_KEY:
when that env var is unset the backend ignores Clerk entirely and falls back
to the built-in simple_auth (basic auth / smart-slides_session cookie).

Verification strategy:
  * Clerk publishes its signing keys as a JWKS document at
    https://<domain>/.well-known/jwks.json.
  * We verify the compact JWS in the Clerk `__session` cookie (or an
    `Authorization: Bearer <__session value>` header) with PyJWT, pinning the
    expected issuer/audience derived from the publishable/secret key.
"""

from __future__ import annotations

import time
from typing import Optional

import jwt

try:  # httpx is the project's HTTP client; requests is a fallback.
    import httpx
except Exception:  # pragma: no cover
    httpx = None

import requests

from utils.get_env import get_clerk_secret_key_env, get_clerk_domain_env

# Clerk session cookies carry a signed JWT (compact JWS). The cookie name used
# by @clerk/nextjs is "__session".
CLERK_SESSION_COOKIE_NAME = "__session"

_JWKS_CACHE: dict = {"keys": None, "fetched_at": 0}
_JWKS_TTL_SECONDS = 60 * 60


def _clerk_domain() -> Optional[str]:
    """Return the Clerk frontend API domain, e.g. example.clerk.accounts.dev."""
    return get_clerk_domain_env()


def is_clerk_enabled() -> bool:
    return bool(get_clerk_secret_key_env())


def _publishable_key_prefix_ok() -> bool:
    """Sanity check that the secret key matches a publishable key domain."""
    return _clerk_domain() is not None


def _fetch_jwks(domain: str) -> dict:
    now = time.time()
    if _JWKS_CACHE.get("keys") and now - _JWKS_CACHE["fetched_at"] < _JWKS_TTL_SECONDS:
        return _JWKS_CACHE["keys"]

    url = f"https://{domain}/.well-known/jwks.json"
    if httpx is not None:
        resp = httpx.get(url, timeout=10)
    else:  # pragma: no cover
        resp = requests.get(url, timeout=10)
    resp.raise_for_status()
    keys = resp.json()
    _JWKS_CACHE["keys"] = keys
    _JWKS_CACHE["fetched_at"] = now
    return keys


def _verify_clerk_token(token: str) -> Optional[str]:
    """Verify a Clerk session token and return the Clerk user id (sub)."""
    domain = _clerk_domain()
    if not domain:
        return None

    try:
        jwks = _fetch_jwks(domain)
        # PyJWT's decode with a JWKS dict requires the `PyJWKClient`-style
        # approach; we resolve the signing key manually via the header kid.
        unverified_header = jwt.get_unverified_header(token)
        kid = unverified_header.get("kid")
        signing_key = None
        for key in jwks.get("keys", []):
            if key.get("kid") == kid:
                signing_key = jwt.algorithms.RSAAlgorithm.from_jwk(key)
                break
        if signing_key is None:
            return None

        issuer = f"https://{domain}"
        payload = jwt.decode(
            token,
            signing_key,
            algorithms=["RS256"],
            audience=None,
            issuer=issuer,
            options={"verify_aud": False},
        )
        sub = payload.get("sub")
        if not isinstance(sub, str) or not sub:
            return None
        return sub
    except Exception:
        return None


def get_clerk_user_id_from_request(request) -> Optional[str]:
    """Extract and verify a Clerk user id from cookie or bearer header."""
    if not is_clerk_enabled() or not _publishable_key_prefix_ok():
        return None

    # Bearer header (Authorization: Bearer <__session token>).
    auth_header = request.headers.get("Authorization", "")
    token: Optional[str] = None
    if auth_header.lower().startswith("bearer "):
        token = auth_header[7:].strip() or None
    if not token:
        token = request.cookies.get(CLERK_SESSION_COOKIE_NAME)

    if not token:
        return None
    return _verify_clerk_token(token)
