/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postList } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';

/**
 * Configurable attributes for the Most viewed widget. Mirrors the
 * `attributes` declared on the widget definition below; the host passes the
 * selected values through to `render.tsx`. The date range is owned by the
 * dashboard picker and read from report params, not from attributes.
 */
export type TopPostsAttributes = {
	/**
	 * Maximum number of rows to display.
	 */
	max?: number;

	/**
	 * Which report the widget shows: published posts and pages (including the
	 * homepage entry, via `skip_archives=1`), or archive pages (taxonomy,
	 * post-type, search, and date archives).
	 */
	contentView?: 'posts' | 'archives';
};

/**
 * Widget type definition.
 *
 * Ported from the Jetpack Stats "Most viewed" card: a leaderboard of the
 * most-viewed posts & pages, switchable to archive pages. The active view is
 * the `contentView` attribute (`relevance: 'high'`), so the widget host
 * renders its control in the frame header.
 *
 * `example.attributes` doubles as the defaults applied to new instances: ten
 * rows, Posts & pages view. The date range comes from the dashboard picker.
 */
export default {
	icon: postList,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
		{
			id: 'contentView',
			label: __( 'View', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			Edit: SelectField,
			elements: [
				{ label: __( 'Posts & pages', 'jetpack-premium-analytics-pkg' ), value: 'posts' },
				{ label: __( 'Archives', 'jetpack-premium-analytics-pkg' ), value: 'archives' },
			],
			relevance: 'high',
		},
	] as WidgetAttributeField< TopPostsAttributes >[],
	example: {
		attributes: {
			max: 10,
			contentView: 'posts',
		},
	},
};
