/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { people } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Configurable attributes for the Latest Subscribers widget. Mirrors the
 * `attributes` declared on the widget definition below; the host passes the
 * selected values through to `render.tsx`.
 */
export type SubscribersListAttributes = {
	/**
	 * Number of subscribers to show. Maps to the WPCOM stats `max` param.
	 */
	max?: number;
};

/**
 * Widget type definition.
 *
 * `example.attributes` doubles as the defaults applied to new instances: the
 * six most recent subscribers.
 */
export default {
	icon: people,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
	] as WidgetAttributeField< SubscribersListAttributes >[],
	example: {
		attributes: {
			max: 6,
		},
	},
};
