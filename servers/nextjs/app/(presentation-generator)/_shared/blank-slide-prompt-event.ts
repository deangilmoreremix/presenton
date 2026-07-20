import type { TemplateV2Layout } from "@/components/slide-editor/importing/template-v2-import";

export const SMART_SLIDES_BLANK_SLIDE_PROMPT_EVENT =
  "smart-slides:blank-slide-prompt";

export type BlankSlidePromptEventDetail = {
  prompt: string;
  slideIndex?: number | null;
  layoutId?: string | null;
  promptKind?: "blank" | "layout";
  layout?: TemplateV2Layout | null;
};
