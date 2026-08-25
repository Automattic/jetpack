/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { page } from '@wordpress/icons';
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
 * New instances default to the Posts & pages view.
 */
export default {
	icon: page,
	attributes: [
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
			contentView: 'posts',
		},
	},
};
