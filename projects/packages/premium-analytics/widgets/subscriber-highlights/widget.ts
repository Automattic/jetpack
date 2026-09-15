/**
 * WordPress dependencies
 */
import { backup } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * No configurable attributes. A `metrics` subset persisted by an earlier version is ignored.
 */
export type SubscriberHighlightsAttributes = Record< never, never >;

/**
 * Ported from the Jetpack Stats Subscribers "All-time stats" card.
 */
export default {
	icon: backup,
	attributes: [] as WidgetAttributeField< SubscriberHighlightsAttributes >[],
	example: {
		attributes: {},
	},
};
