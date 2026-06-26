# Widgets

A widget is a folder under `widgets/`, auto-discovered by convention (no registration):

- `widget.json` — static metadata (name, title, description, category, presentation).
- `widget.ts` — live metadata (default export: title, icon, attributes, example).
- `render.tsx` — default-export React component.
- `style.module.css` — optional; CSS Modules, tokens from `@wordpress/theme` (`--wpds-*`).

The render component is bound by `WidgetRenderProps<Item>` from
`@wordpress/widget-primitives`: it receives only `{ attributes, setAttributes }`.
`attributes` may arrive empty — default it (`= {}`).

The attribute shape (`Item`) is declared and exported once from `widget.ts`,
alongside the `attributes`/`example` schema it describes; `render.tsx` imports it
rather than redeclaring it, so the schema and the render props cannot drift.

The host owns all chrome. The widget renders body only — never a `Card`, header,
title, or remove control. `presentation` in `widget.json` declares how the widget
wants to be framed; the host decides how.

## Two-component structure

Every widget that reads dashboard state splits into two components:

```tsx
// outer — receives host props, seeds WidgetRoot
export default function MyWidget( { attributes = {} }: { attributes?: MyAttributes } ) {
    return (
        <WidgetRoot attributes={ attributes }>
            <MyWidgetInner />
        </WidgetRoot>
    );
}

// inner — reads dashboard context, does all data work
function MyWidgetInner() {
    const { reportParams } = useWidgetRootContext();
    // ...
}
```

`useWidgetRootContext()` must be called inside a `<WidgetRoot>` — calling it in the
outer component throws. `reportParams` always comes from context; the dashboard date
picker owns it. Never read date range from `attributes`.

<!-- TODO: link to the canonical widget API declaration (contract types). -->
