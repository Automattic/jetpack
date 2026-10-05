/**
 * WordPress dependencies
 */
import { chartBar } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type OrdersOverTimeAttributes = Record< never, never >;

export default {
	icon: chartBar,
	attributes: [] as WidgetAttributeField< OrdersOverTimeAttributes >[],
	example: {
		attributes: {},
	},
};
