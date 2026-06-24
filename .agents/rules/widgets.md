# Widgets

A widget is a folder under `widgets/`, auto-discovered by convention (no registration):

- `widget.json` — static metadata (name, title, description, category, presentation).
- `widget.ts` — live metadata (default export: title, icon, attributes, example).
- `render.tsx` — default-export React component.
- `style.module.css` — optional; CSS Modules, tokens from `@wordpress/theme` (`--wpds-*`).

The render component is bound by `WidgetRenderProps<Item>` from
`@wordpress/widget-primitives`: it receives only `{ attributes, setAttributes }`.
`attributes` may arrive empty — default it (`= {}`).

The host owns all chrome. The widget renders body only — never a `Card`, header,
title, or remove control. `presentation` in `widget.json` declares how the widget
wants to be framed; the host decides how.

<!-- TODO: link to the canonical widget API declaration (contract types). -->
