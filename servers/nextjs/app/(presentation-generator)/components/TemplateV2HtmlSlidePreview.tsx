"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  hasTemplateV2RenderableUi,
  TEMPLATE_V2_HTML_HEIGHT,
  TEMPLATE_V2_HTML_WIDTH,
  templateV2UiToHtml,
} from "@/lib/template-v2-json-to-html";

function readString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function hasTemplateV2Identity(slide: unknown): boolean {
  if (!slide || typeof slide !== "object") return false;
  const record = slide as Record<string, unknown>;
  const layoutGroup = readString(record.layout_group);
  const layout = readString(record.layout);
  return layoutGroup.startsWith("template-v2") || layout.startsWith("template-v2");
}

export function shouldRenderTemplateV2HtmlPreview(
  slide: unknown,
  presentationVersion?: unknown
): boolean {
  if (!slide || typeof slide !== "object") return false;
  const record = slide as Record<string, unknown>;
  const isTemplateV2Presentation = presentationVersion === "v2-standard";
  return (
    (isTemplateV2Presentation || hasTemplateV2Identity(slide)) &&
    hasTemplateV2RenderableUi(record.ui)
  );
}

export function TemplateV2HtmlSlidePreview({
  slide,
  fonts,
  className = "",
}: {
  slide: unknown;
  fonts?: unknown;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const html = useMemo(() => {
    if (!slide || typeof slide !== "object") return null;
    return templateV2UiToHtml((slide as Record<string, unknown>).ui, { fonts });
  }, [fonts, slide]);

  useEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => setContainerWidth(element.clientWidth);
    updateWidth();

    const resizeObserver = new ResizeObserver(updateWidth);
    resizeObserver.observe(element);
    return () => resizeObserver.disconnect();
  }, []);

  const scale = containerWidth
    ? Math.min((containerWidth / TEMPLATE_V2_HTML_WIDTH) * 0.98, 1)
    : 0;
  const previewHeight = TEMPLATE_V2_HTML_HEIGHT * (scale || 1);

  if (!html) {
    return (
      <div
        ref={containerRef}
        className={`relative flex aspect-video w-full items-center justify-center bg-white text-xs text-gray-500 ${className}`}
      >
        Preview unavailable
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-white ${className}`}
      style={{ height: scale ? previewHeight : undefined, aspectRatio: scale ? undefined : "16 / 9" }}
    >
      <div
        className="absolute left-1/2 top-0"
        style={{
          width: TEMPLATE_V2_HTML_WIDTH,
          height: TEMPLATE_V2_HTML_HEIGHT,
          transform: `translateX(-50%) scale(${scale || 1})`,
          transformOrigin: "top center",
          opacity: scale ? 1 : 0,
        }}
      >
        <iframe
          aria-label="Template v2 slide preview"
          className="block h-full w-full border-0 bg-white"
          sandbox="allow-scripts allow-same-origin"
          srcDoc={html}
          tabIndex={-1}
          title="Template v2 slide preview"
          style={{ pointerEvents: "none" }}
        />
      </div>
    </div>
  );
}
