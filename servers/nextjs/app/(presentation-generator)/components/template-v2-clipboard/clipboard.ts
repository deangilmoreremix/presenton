export type TemplateV2ClipboardRecord = Record<string, unknown>;

export type TemplateV2ClipboardBox = {
  x: number;
  y: number;
  width: number;
  height: number;
};

export type TemplateV2ClipboardSelection =
  | { kind: "component"; componentIndex: number }
  | { kind: "element"; componentIndex: number; elementPath: number[] }
  | null;

export type TemplateV2ClipboardPayload = {
  format: "presenton/template-v2";
  version: 1;
  kind: "component" | "element";
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
  stageSize: { width: number; height: number };
};

export function createTemplateV2ClipboardPayload(
  kind: TemplateV2ClipboardPayload["kind"],
  data: TemplateV2ClipboardRecord,
  absoluteBox: TemplateV2ClipboardBox,
): TemplateV2ClipboardPayload {
  return {
    format: "presenton/template-v2",
    version: 1,
    kind,
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
  stageSize,
}: PasteOptions<TUi>): TemplateV2ClipboardPasteResult<TUi> | null {
  const stageBox = { x: 0, y: 0, ...stageSize };
  if (payload.kind === "component") {
    const components = [...readArray(sourceUi.components)];
    const component = cloneJson(payload.data);
    const box = payload.absoluteBox;
    const componentIndex = components.length;
    components.push({
      ...component,
      position: clampPosition(
        { x: box.x + offset, y: box.y + offset },
        box,
        stageBox,
      ),
    });
    return {
      ui: { ...sourceUi, components } as TUi,
      selection: { kind: "component", componentIndex },
    };
  }

  const element = cloneJson(payload.data);
  const box = payload.absoluteBox;
  const components = [...readArray(sourceUi.components)];
  const componentIndex = components.length;
  components.push({
    position: clampPosition(
      { x: box.x + offset, y: box.y + offset },
      box,
      stageBox,
    ),
    size: { width: box.width, height: box.height },
    elements: [
      {
        ...element,
        position: { x: 0, y: 0 },
        size: { width: box.width, height: box.height },
      },
    ],
  });
  return {
    ui: { ...sourceUi, components } as TUi,
    selection: {
      kind: "element",
      componentIndex,
      elementPath: [0],
    },
  };
}

function clampPosition(
  position: { x: number; y: number },
  box: { width: number; height: number },
  parent: { width: number; height: number },
) {
  return {
    x: clamp(position.x, 0, Math.max(0, parent.width - box.width)),
    y: clamp(position.y, 0, Math.max(0, parent.height - box.height)),
  };
}

function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max);
}

function cloneJson<T>(value: T): T {
  return JSON.parse(JSON.stringify(value));
}
