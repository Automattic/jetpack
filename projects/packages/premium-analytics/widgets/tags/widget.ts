/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { tag } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

export type TagsAttributes = {
	/**
	 * Maximum number of rows to display.
	 */
	max?: number;
};

/**
 * Widget type definition for the Tags & categories widget.
 *
 * Ported from the Jetpack Stats "Tags & categories" module. Lists the site's
 * most visited tags and categories for the selected period, ranked by views.
 *
 * Data: read from the `stats/tags` endpoint via `useStatsTags`. A row can group
 * several tags/categories that share a post; those grouped rows have no single
 * archive URL and drill down to their individual members instead.
 */
export default {
	name: 'jpa/tags',
	title: __( 'Tags & categories', 'jetpack-premium-analytics' ),
	help: {
		content: __(
			'Most visited tags & categories. Learn about the most engaging topics.',
			'jetpack-premium-analytics'
		),
	},
	icon: tag,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
	] as WidgetAttributeField< TagsAttributes >[],
	example: {
		attributes: {
			max: 10,
		},
	},
};
