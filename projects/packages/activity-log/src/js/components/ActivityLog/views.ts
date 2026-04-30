import type { SupportedLayouts, View } from '@wordpress/dataviews';

const TABLE_LAYOUT = {
	density: 'balanced' as const,
	styles: {
		published: { minWidth: '240px' },
		published_utc: { minWidth: '240px' },
		actor: { minWidth: '100px' },
		// `width: 100%` makes Event the flex column: it consumes whatever the
		// date and user columns don't use, while still refusing to drop below
		// its minWidth on narrow viewports.
		event: { width: '100%', minWidth: '580px' },
	},
};

export const DEFAULT_VIEW: View = {
	type: 'table',
	perPage: 20,
	sort: {
		field: 'published',
		direction: 'desc',
	},
	fields: [ 'published', 'event', 'actor' ],
	layout: TABLE_LAYOUT,
	showLevels: false,
};

// Passed to `<DataViews defaultLayouts={…} />`. Used two ways:
//   1. Advertises which layouts are available in the cog's layout switcher.
//   2. Spread over the current view when the user switches layouts (see
//      dataviews-view-config/index.tsx — it does
//      `onChangeView({ ...view, type, ...defaultLayouts[type] })`).
//
// That second use is why this file explicitly lists every slot property
// per layout, including the ones set to `undefined` for the Table layout:
// the spread is the only chance to *clear* slot references left over
// from the Activity layout. Without it, switching Activity → Table
// leaves `titleField`/`mediaField`/`descriptionField` set, which causes
// the Table layout to render a duplicate "primary column" in front of
// the regular column list. Same reasoning for `groupBy`.
export const DEFAULT_LAYOUTS: SupportedLayouts = {
	table: {
		fields: [ 'published', 'event', 'actor' ],
		layout: TABLE_LAYOUT,
		titleField: undefined,
		mediaField: undefined,
		descriptionField: undefined,
		groupBy: undefined,
	},
	activity: {
		fields: [ 'published', 'actor' ],
		layout: { density: 'balanced' },
		titleField: 'event_title',
		mediaField: 'event_icon',
		descriptionField: 'event_description',
		// Group consecutive events that fall on the same calendar day
		// (site timezone) under a "Apr 24, 2026" header. `showLabel:
		// false` drops the default "<field label>: " prefix since the
		// date string is self-describing. `direction` is required by
		// the View type but unused by the activity layout (which just
		// groups whatever order the data arrives in).
		groupBy: { field: 'published_date', direction: 'desc', showLabel: false },
	},
};
