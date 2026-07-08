/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { postAuthor } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Configurable attributes for the Authors widget. Mirrors the `attributes`
 * declared on the widget definition below; the host passes the selected values
 * through to `render.tsx`.
 */
export type AuthorsAttributes = {
	/**
	 * Maximum number of authors to display.
	 */
	max?: number;
};

/**
 * Widget type definition.
 */
export default {
	name: 'jpa/authors',
	title: __( 'Authors', 'jetpack-premium-analytics' ),
	icon: postAuthor,
	attributes: [
		{
			id: 'max',
			label: __( 'Maximum authors', 'jetpack-premium-analytics' ),
			type: 'integer',
		},
	] as WidgetAttributeField< AuthorsAttributes >[],
	example: {
		attributes: {
			max: 7,
		},
	},
};
