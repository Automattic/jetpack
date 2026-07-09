# Widgets

A registered dashboard widget is a folder under `widgets/`, auto-discovered by convention
(no registration):

- `package.json` — workspace package for the lazy-loaded render bundle.
- `widget.json` — static metadata (name, title, description, category, presentation).
- `widget.ts` — live metadata (default export: title, icon, attributes, example).
- `render.tsx` — default-export React component.
- `style.module.css` — optional; CSS Modules, tokens from `@wordpress/theme` (`--wpds-*`).

These rules apply to registered dashboard widgets. Presentational-only folders under
`widgets/` are out of scope unless they are being converted into registered widgets.

Chart components always come from `@jetpack-premium-analytics/widgets-toolkit` — a shared
script module bundled once for the whole dashboard. Never import `@automattic/charts`
directly from a widget: that inlines the entire charting stack (charts, visx, react-spring)
into the widget's render bundle. If a chart component isn't exposed yet, re-export it from
the toolkit's "Charts passthrough" section.

The render component is bound by `WidgetRenderProps<Item>` from
`@wordpress/widget-primitives`: it receives only `{ attributes, setAttributes }`.
`attributes` may arrive empty — default it (`= {}`).

The attribute shape (`Item`) is declared and exported once from `widget.ts`,
alongside the `attributes`/`example` schema it describes; `render.tsx` imports it
rather than redeclaring it, so the schema and the render props cannot drift.
If the host injects extra infrastructure fields through `attributes`, compose a
render-only type from the imported widget attribute type plus the host field type.
Do not re-declare the widget's own attribute shape in `render.tsx`.

A widget with no own attributes must type its shape as `Record< never, never >`,
not `Record< string, never >`. The latter carries an index signature
(`[key: string]: never`), so composing it with a host field type like
`Partial< ReportParamsFieldAttributes >` collapses those fields (e.g.
`reportParams`) to `never` and nothing can satisfy them. `Record< never, never >`
is an empty object with no index signature, so it composes cleanly.

The host owns all chrome. The widget renders body only — never a `Card`, header,
title, or remove control. `presentation` in `widget.json` declares how the widget
wants to be framed; the host decides how.

## Two-component structure

Every widget that reads dashboard state splits into two components:

```tsx
// outer — receives host props, seeds WidgetRoot
import {
	WidgetRoot,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';
import type { MyAttributes } from './widget';

type MyWidgetRenderAttributes = MyAttributes & Partial< ReportParamsFieldAttributes >;

export default function MyWidget( {
	attributes = {},
}: WidgetRenderProps< MyWidgetRenderAttributes > ) {
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

The outer component must still pass host `attributes` into `<WidgetRoot>`. Do not
drop them just because the inner component only needs one widget setting like `max`;
otherwise host-provided `reportParams` and comparison controls are discarded.

<!-- TODO: link to the canonical widget API declaration (contract types). -->
