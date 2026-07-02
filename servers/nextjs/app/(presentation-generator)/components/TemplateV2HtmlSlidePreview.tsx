"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import type { Chart as ChartInstance, ChartConfiguration, Plugin } from "chart.js";
import {
  hasTemplateV2RenderableUi,
  TEMPLATE_V2_HTML_HEIGHT,
  TEMPLATE_V2_HTML_WIDTH,
  templateV2UiToHtmlFragment,
} from "@/lib/template-v2-json-to-html";

type PresentonDataLabelOptions = {
  enabled?: boolean;
  color?: string;
  fontFamily?: string;
  fontSize?: number;
};

function chartNumber(value: unknown): number | null {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function formatChartValue(value: unknown): string {
  const parsed = chartNumber(value);
  if (parsed == null) return "";
  if (Math.abs(parsed) % 1 === 0) return String(parsed);
  return String(Math.round(parsed * 100) / 100);
}

function chartPoint(
  element: unknown
): { x: number; y: number } | null {
  const candidate = element as {
    x?: unknown;
    y?: unknown;
    tooltipPosition?: () => { x: number; y: number };
  };
  const point =
    typeof candidate.tooltipPosition === "function"
      ? candidate.tooltipPosition()
      : candidate;

  return typeof point.x === "number" && typeof point.y === "number"
    ? { x: point.x, y: point.y }
    : null;
}

const presentonDataLabelPlugin: Plugin = {
  id: "presentonDataLabels",
  afterDatasetsDraw(chart, _args, options) {
    const labelOptions = options as PresentonDataLabelOptions | undefined;
    if (!labelOptions?.enabled) return;

    const ctx = chart.ctx;
    ctx.save();
    ctx.fillStyle = labelOptions.color || "#374151";
    ctx.font = `600 ${labelOptions.fontSize || 11}px ${
      labelOptions.fontFamily || "Arial, Helvetica, sans-serif"
    }`;
    ctx.textAlign = "center";

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      const meta = chart.getDatasetMeta(datasetIndex);
      if (meta.hidden) return;

      meta.data.forEach((element, index) => {
        const raw = Array.isArray(dataset.data) ? dataset.data[index] : 0;
        const value = chartNumber(raw);
        const label = formatChartValue(raw);
        const point = chartPoint(element);
        if (value == null || !label || !point) return;

        const offset = (meta as { type?: string }).type === "bar"
          ? value >= 0
            ? -6
            : 12
          : 0;
        ctx.textBaseline = offset < 0 ? "bottom" : "top";
        ctx.fillText(label, point.x, point.y + offset);
      });
    });

    ctx.restore();
  },
};

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
  fixedSize = false,
  className = "",
}: {
  slide: unknown;
  fonts?: unknown;
  fixedSize?: boolean;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const contentRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState(0);

  const html = useMemo(() => {
    if (!slide || typeof slide !== "object") return null;
    return templateV2UiToHtmlFragment((slide as Record<string, unknown>).ui, {
      fonts,
    });
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

  useEffect(() => {
    const element = contentRef.current;
    if (!element || !html) return;

    const canvases = Array.from(
      element.querySelectorAll<HTMLCanvasElement>("canvas[data-presenton-chart]")
    );
    if (!canvases.length) return;

    let disposed = false;
    const charts: ChartInstance[] = [];
    element.dataset.presentonCharts = "pending";

    import("chart.js/auto")
      .then(({ default: Chart }) => {
        if (disposed) return;

        try {
          canvases.forEach((canvas) => {
            const configText = canvas.getAttribute("data-chart-config");
            if (!configText) return;

            const existing = Chart.getChart(canvas);
            existing?.destroy();

            const config = JSON.parse(configText) as ChartConfiguration;
            config.options = {
              ...(config.options ?? {}),
              animation: false,
              responsive: false,
              maintainAspectRatio: false,
            };
            config.plugins = [
              ...(Array.isArray(config.plugins) ? config.plugins : []),
              presentonDataLabelPlugin,
            ];

            const chart = new Chart(canvas, config);
            chart.update("none");
            charts.push(chart);
          });

          requestAnimationFrame(() => {
            if (!disposed) element.dataset.presentonCharts = "ready";
          });
        } catch (error) {
          element.dataset.presentonCharts = "error";
          console.error("Failed to render template v2 charts:", error);
        }
      })
      .catch((error) => {
        element.dataset.presentonCharts = "error";
        console.error("Failed to load Chart.js for template v2 preview:", error);
      });

    return () => {
      disposed = true;
      charts.forEach((chart) => chart.destroy());
    };
  }, [html]);

  const scale = fixedSize
    ? 1
    : containerWidth
      ? Math.min((containerWidth / TEMPLATE_V2_HTML_WIDTH) * 0.98, 1)
      : 0;
  const previewHeight = TEMPLATE_V2_HTML_HEIGHT * (scale || 1);

  if (!html) {
    return (
      <div
        ref={containerRef}
        className={`relative flex aspect-video w-full items-center justify-center bg-white text-xs text-gray-500 ${className}`}
        style={
          fixedSize
            ? {
                width: TEMPLATE_V2_HTML_WIDTH,
                height: TEMPLATE_V2_HTML_HEIGHT,
              }
            : undefined
        }
      >
        Preview unavailable
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative w-full overflow-hidden bg-white ${className}`}
      style={
        fixedSize
          ? {
              width: TEMPLATE_V2_HTML_WIDTH,
              height: TEMPLATE_V2_HTML_HEIGHT,
            }
          : {
              height: scale ? previewHeight : undefined,
              aspectRatio: scale ? undefined : "16 / 9",
            }
      }
    >
      <div
        className={
          fixedSize ? "absolute left-0 top-0" : "absolute left-1/2 top-0"
        }
        style={{
          width: TEMPLATE_V2_HTML_WIDTH,
          height: TEMPLATE_V2_HTML_HEIGHT,
          transform: fixedSize
            ? undefined
            : `translateX(-50%) scale(${scale || 1})`,
          transformOrigin: fixedSize ? undefined : "top center",
          opacity: scale ? 1 : 0,
        }}
      >
        <div
          ref={contentRef}
          aria-label="Template v2 slide preview"
          className="block h-full w-full bg-white"
          style={{ pointerEvents: "none" }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      </div>
    </div>
  );
}
