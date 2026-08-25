/**
 * WordPress dependencies
 */
import { people } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type SubscribersListAttributes = Record< never, never >;

/**
 * Widget type definition.
 */
export default {
	icon: people,
	attributes: [] as WidgetAttributeField< SubscribersListAttributes >[],
	example: {
		attributes: {},
	},
};
