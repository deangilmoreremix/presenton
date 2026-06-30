"use client";

import { useEffect } from "react";
import type { TemplateV2ClipboardPayload } from "./clipboard";

const CLIPBOARD_MIME = "application/x-presenton-template-v2";
const CLIPBOARD_PREFIX = "PRESENTON_TEMPLATE_V2:";
const CLIPBOARD_STORAGE_KEY = "presenton:template-v2-clipboard";
const PASTE_OFFSET = 16;
let pasteSequence = 0;

type UseTemplateV2ClipboardOptions = {
  enabled: boolean;
  isSurfaceActive: () => boolean;
  isEditableTarget: (target: EventTarget | null) => boolean;
  onCopy: () => TemplateV2ClipboardPayload | null;
  onPaste: (payload: TemplateV2ClipboardPayload, offset: number) => void;
};

export function useTemplateV2Clipboard({
  enabled,
  isSurfaceActive,
  isEditableTarget,
  onCopy,
  onPaste,
}: UseTemplateV2ClipboardOptions) {
  useEffect(() => {
    if (!enabled || typeof document === "undefined") return;

    const handleCopy = (event: ClipboardEvent) => {
      if (!isSurfaceActive() || isEditableTarget(event.target)) return;
      const payload = onCopy();
      if (!payload) return;
      const serialized = JSON.stringify(payload);
      pasteSequence = 0;
      writeStoredPayload(serialized);
      event.clipboardData?.setData(CLIPBOARD_MIME, serialized);
      event.clipboardData?.setData(
        "text/plain",
        `${CLIPBOARD_PREFIX}${serialized}`,
      );
      event.preventDefault();
      event.stopPropagation();
    };

    const handlePaste = (event: ClipboardEvent) => {
      if (!isSurfaceActive() || isEditableTarget(event.target)) return;
      const payload = readPayload(event);
      if (!payload) return;
      pasteSequence += 1;
      event.preventDefault();
      event.stopPropagation();
      onPaste(payload, PASTE_OFFSET * pasteSequence);
    };

    document.addEventListener("copy", handleCopy);
    document.addEventListener("paste", handlePaste);
    return () => {
      document.removeEventListener("copy", handleCopy);
      document.removeEventListener("paste", handlePaste);
    };
  }, [enabled, isEditableTarget, isSurfaceActive, onCopy, onPaste]);
}

function writeStoredPayload(serialized: string) {
  try {
    window.localStorage.setItem(CLIPBOARD_STORAGE_KEY, serialized);
  } catch {
    // Native clipboard data remains available when storage is unavailable.
  }
}

function readPayload(event: ClipboardEvent): TemplateV2ClipboardPayload | null {
  const direct = event.clipboardData?.getData(CLIPBOARD_MIME) ?? "";
  const plain = event.clipboardData?.getData("text/plain") ?? "";
  const serialized =
    direct ||
    (plain.startsWith(CLIPBOARD_PREFIX)
      ? plain.slice(CLIPBOARD_PREFIX.length)
      : "");
  if (serialized) return parsePayload(serialized);

  if (event.clipboardData && event.clipboardData.types.length > 0) return null;
  try {
    const stored = window.localStorage.getItem(CLIPBOARD_STORAGE_KEY);
    return stored ? parsePayload(stored) : null;
  } catch {
    return null;
  }
}

function parsePayload(serialized: string): TemplateV2ClipboardPayload | null {
  try {
    const parsed = JSON.parse(serialized) as Partial<TemplateV2ClipboardPayload>;
    const box = parsed.absoluteBox;
    if (
      parsed.format !== "presenton/template-v2" ||
      parsed.version !== 1 ||
      (parsed.kind !== "component" && parsed.kind !== "element") ||
      !parsed.data ||
      typeof parsed.data !== "object" ||
      !box ||
      !Number.isFinite(box.x) ||
      !Number.isFinite(box.y) ||
      !Number.isFinite(box.width) ||
      !Number.isFinite(box.height) ||
      box.width <= 0 ||
      box.height <= 0
    ) {
      return null;
    }
    return parsed as TemplateV2ClipboardPayload;
  } catch {
    return null;
  }
}
