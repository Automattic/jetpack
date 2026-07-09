/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Configurable attributes for the Annual highlights widget: one visibility
 * toggle per metric tile. Mirrors the `attributes` declared on the widget
 * definition below; the host renders them as checkboxes and passes the selected
 * values through to `render.tsx`. The widget has no date range — the insights
 * endpoint is not period-scoped.
 */
export type AnnualHighlightsAttributes = {
	/**
	 * Whether the Posts tile is shown.
	 */
	showPosts?: boolean;
	/**
	 * Whether the Words tile is shown.
	 */
	showWords?: boolean;
	/**
	 * Whether the Likes tile is shown.
	 */
	showLikes?: boolean;
	/**
	 * Whether the Comments tile is shown.
	 */
	showComments?: boolean;
};

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances: every
 * metric enabled.
 */
export default {
	name: 'jpa/annual-highlights',
	title: __( 'Annual highlights', 'jetpack-premium-analytics' ),
	icon: calendar,
	// Each metric defaults to enabled. The `getValue` defaults keep the settings
	// checkbox in sync with the render, which also treats a missing flag as
	// enabled: without them a metric absent from `attributes` would show as an
	// unchecked box while its tile still rendered.
	attributes: [
		{
			id: 'showPosts',
			label: __( 'Posts', 'jetpack-premium-analytics' ),
			type: 'boolean',
			getValue: ( { item }: { item: AnnualHighlightsAttributes } ) => item.showPosts ?? true,
		},
		{
			id: 'showWords',
			label: __( 'Words', 'jetpack-premium-analytics' ),
			type: 'boolean',
			getValue: ( { item }: { item: AnnualHighlightsAttributes } ) => item.showWords ?? true,
		},
		{
			id: 'showLikes',
			label: __( 'Likes', 'jetpack-premium-analytics' ),
			type: 'boolean',
			getValue: ( { item }: { item: AnnualHighlightsAttributes } ) => item.showLikes ?? true,
		},
		{
			id: 'showComments',
			label: __( 'Comments', 'jetpack-premium-analytics' ),
			type: 'boolean',
			getValue: ( { item }: { item: AnnualHighlightsAttributes } ) => item.showComments ?? true,
		},
	] as WidgetAttributeField< AnnualHighlightsAttributes >[],
	example: {
		attributes: {
			showPosts: true,
			showWords: true,
			showLikes: true,
			showComments: true,
		},
	},
};
