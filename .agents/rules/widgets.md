# Widgets

A registered dashboard widget is a folder under `widgets/`, auto-discovered by convention
(no registration):

- `package.json` — workspace package for the lazy-loaded render bundle.
- `widget.json` — everything JSON can carry: name, icon, title, description, help, category, presentation, and every attribute whose field is static (`type`, `label`, fixed `elements`, `relevance`). Icons, on the widget and on an option, are `jpa/<name>` references resolved against the collection `packages/icons/src/resolve.ts` lists: `@wordpress/icons` glyphs by kebab-case name plus the dashboard's own illustrations. A name outside that list resolves to nothing, so add it to the map before naming it.
- `widget.ts` — only what JSON cannot express (default export: `attributes`, `example`): an attribute with `getElements`, `getValue` or `setValue`, one a helper builds (`reportParamsAttributeField()`, `chartIntervalField`), and `example`, which the build does not read from `widget.json` yet. Record and module entries merge by `id`, the record's first; a module-only control keeps its position by listing `{ "id" }` in `widget.json` (`projects/packages/premium-analytics/docs/dashboard-widgets.md`). A widget with none of that has no `widget.ts`: the dashboard builds its type from the record alone, and its attribute type lives in `render.tsx`.
- `render.tsx` — default-export React component.
- `style.module.css` — optional; CSS Modules, tokens from `@wordpress/theme` (`--wpds-*`).

These rules apply to registered dashboard widgets. Presentational-only folders under
`widgets/` are out of scope unless they are being converted into registered widgets.

Chart components always come from `@jetpack-premium-analytics/widgets-toolkit` — a shared
script module bundled once for the whole dashboard. Never import `@automattic/charts`
directly from a widget: that inlines the entire charting stack (charts, visx, react-spring)
into the widget's render bundle. If a chart component isn't exposed yet, re-export it from
the toolkit's "Charts passthrough" section.

Design-system components (`@wordpress/ui`, `@wordpress/dataviews`) come from
`@jetpack-premium-analytics/externals`, the passthrough script module, for the same reason.
ESLint enforces both rules; see `packages/externals/README.md`.

The render component is bound by `WidgetRenderProps<Item>` from
`@wordpress/widget-primitives`: it receives only `{ attributes, setAttributes }`.
`attributes` may arrive empty — default it (`= {}`).

The attribute shape (`Item`) is declared once. A widget with a `widget.ts`
declares and exports it there, alongside the `attributes`/`example` schema it
describes, and `render.tsx` imports it rather than redeclaring it, so the schema
and the render props cannot drift. A widget without one declares it in
`render.tsx`.
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

// A widget with a `widget.ts` imports this from './widget' instead.
export type MyAttributes = Record< never, never >;

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
picker owns it. Never read date range from `attributes` — except in the one case below.

The outer component must still pass host `attributes` into `<WidgetRoot>`. Do not
drop them just because the inner component needs none of the widget's own settings;
otherwise host-provided `reportParams` and comparison controls are discarded.

**A widget that hosts its own date control.** A section can set
`date_filter_options.with_header_date_control` to `false`, which renders no header date
control and hands it to that section's widgets. Such a widget declares a `reportParams`
attribute built by `reportParamsAttributeField( … )` from
`@jetpack-premium-analytics/fields`, and the host renders that control in the widget's
own header. Pass it the widget's `grain` — the windows its report can fill and the
buckets its chart draws — so the control offers neither one the widget would drop.

`WidgetRoot` prefers `attributes.reportParams` over the URL, but an instance saved
without them still falls back to it — the section date state this widget no longer
follows. So the outer component defaults the attribute
(`attributes.reportParams ?? DEFAULT_REPORT_PARAMS`) and wraps `WidgetRoot` in the scope
its body supports (`<ReportScopeProvider offersComparison={ false }>` for a report with
no comparison). `projects/packages/ads/widgets/wordads-chart-tabs/` is the reference.

<!-- TODO: link to the canonical widget API declaration (contract types). -->
