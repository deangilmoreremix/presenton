"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { isClerkEnabled } from "@/utils/clerkConfig";

/**
 * Renders Clerk auth controls. When signed out: Sign in / Sign up (links to the
 * custom /sign-in and /sign-up pages). When signed in: the user avatar button.
 * Hidden entirely when Clerk is not configured (falls back to built-in auth).
 */
export default function AuthControls() {
  if (!isClerkEnabled()) return null;

  return (
    <div className="flex items-center gap-2">
      <UserButtonAfterAuth />
      <SignedOutControls />
    </div>
  );
}

function SignedOutControls() {
  const { isSignedIn } = useUser();
  if (isSignedIn) return null;
  return (
    <>
      <Link
        href="/auth/login"
        className="rounded-md bg-[#7C51F8] px-3 py-1.5 text-sm font-medium text-white hover:opacity-90"
      >
        Sign in
      </Link>
      <Link
        href="/auth/signup"
        className="rounded-md border border-[#7C51F8] px-3 py-1.5 text-sm font-medium text-[#7C51F8] hover:bg-[#7C51F8]/5"
      >
        Sign up
      </Link>
    </>
  );
}

function UserButtonAfterAuth() {
  const { isSignedIn } = useUser();
  if (!isSignedIn) return null;
  return (
    <UserButton>
      <UserButton.Action label="signOut" />
    </UserButton>
  );
}
