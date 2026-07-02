/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { share } from '@wordpress/icons';

/**
 * Configurable attributes for the Shares widget. Mirrors the `attributes`
 * declared on the widget definition below; the host passes the selected values
 * through to `render.tsx`.
 */
export type SharesAttributes = {
	/**
	 * Maximum number of connected accounts to show; `0` means all. Integer form
	 * controls can serialize the value to a string, so the render entry accepts
	 * either.
	 */
	max?: string | number;
};

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances: all
 * connected accounts (`max: 0`), since sites usually connect only a handful.
 */
export default {
	name: 'jpa/shares',
	title: __( 'Shares', 'jetpack-premium-analytics' ),
	icon: share,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics' ),
			type: 'integer' as const,
		},
	],
	example: {
		attributes: {
			max: 0,
		},
	},
};
