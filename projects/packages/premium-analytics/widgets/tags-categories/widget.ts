/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { category } from '@wordpress/icons';

/**
 * Configurable attributes for the Tags & categories widget. Mirrors the
 * `attributes` declared on the widget definition below; the host passes the
 * selected values through to `render.tsx`. The date range is owned by the
 * dashboard picker and read from report params, not from attributes.
 */
export type TagsCategoriesAttributes = {
	/**
	 * Maximum number of rows to show; `0` means all. Maps to the WPCOM stats
	 * `max` param. Integer form controls can serialize the value to a string, so
	 * the render entry accepts either.
	 */
	max?: string | number;
};

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances. The
 * date range comes from the dashboard picker.
 */
export default {
	name: 'jpa/tags-categories',
	title: __( 'Tags & categories', 'jetpack-premium-analytics' ),
	icon: category,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer' as const,
		},
	],
	example: {
		attributes: {
			max: 10,
		},
	},
};
