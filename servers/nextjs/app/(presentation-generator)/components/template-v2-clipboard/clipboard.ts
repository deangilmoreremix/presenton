export type TemplateV2ClipboardRecord = Record<string, unknown>;

export type TemplateV2ClipboardBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TemplateV2ClipboardSelection =
  | { kind: "component"; componentIndex: number }
  | null;

export type TemplateV2ClipboardPayload = {
  format: "presenton/template-v2";
  version: 1;
  kind: "component";
  data: TemplateV2ClipboardRecord;
  absoluteBox: TemplateV2ClipboardBox;
};

export type TemplateV2ClipboardPasteResult<TUi> = {
  ui: TUi;
  selection: Exclude<TemplateV2ClipboardSelection, null>;
};

type PasteOptions<TUi extends TemplateV2ClipboardRecord> = {
  sourceUi: TUi;
  payload: TemplateV2ClipboardPayload;
  offset: number;
};

export function createTemplateV2ClipboardPayload(
  data: TemplateV2ClipboardRecord,
  absoluteBox: TemplateV2ClipboardBox,
): TemplateV2ClipboardPayload {
  return {
    format: "presenton/template-v2",
    version: 1,
    kind: "component",
    data: cloneJson(data),
    absoluteBox: { ...absoluteBox },
  };
}

export function pasteTemplateV2ClipboardPayload<
  TUi extends TemplateV2ClipboardRecord,
>({
  sourceUi,
  payload,
  offset,
}: PasteOptions<TUi>): TemplateV2ClipboardPasteResult<TUi> | null {
  if (payload.kind !== "component") return null;
  const components = [...readArray(sourceUi.components)];
  const component = cloneJson(payload.data);
  const box = payload.absoluteBox;
  const componentIndex = components.length;
  components.push({
    ...withUniquePastedComponentIdentity(component, components),
    position: { x: box.x + offset, y: box.y + offset },
  });
  return {
    ui: { ...sourceUi, components } as TUi,
    selection: { kind: "component", componentIndex },
  };
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function withUniquePastedComponentIdentity(
  component: TemplateV2ClipboardRecord,
  siblings: unknown[],
) {
  const next = { ...component };
  next.id = uniqueComponentId(
    `${normalizeId(
      readString(component.id) ??
        readString(component.name) ??
        readString(component.description) ??
        "component",
    )}_copy`,
    siblings,
  );
  return next;
}

function uniqueComponentId(base: string, siblings: unknown[]) {
  const existingIds = new Set(
    siblings
      .map((component) =>
        isRecord(component) ? readString(component.id) : null,
      )
      .filter(Boolean),
  );
  if (!existingIds.has(base)) return base;
  let index = 2;
  while (existingIds.has(`${base}_${index}`)) {
    index += 1;
  }
  return `${base}_${index}`;
}

function normalizeId(value: string) {
  const normalized = value
    .trim()
    .replace(/[^a-zA-Z0-9_-]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || "component";
}

function readString(value: unknown) {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return Boolean(value && typeof value === "object" && !Array.isArray(value));
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
