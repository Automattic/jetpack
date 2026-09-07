/**
 * WordPress dependencies
 */
import { globe } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type ReferrersAttributes = Record< never, never >;

/**
 * Shows the websites and search engines referring visitors for the selected
 * dashboard date range via the PA proxy at `stats/referrers`.
 */
export default {
	icon: globe,
	attributes: [] as WidgetAttributeField< ReferrersAttributes >[],
	example: {
		attributes: {},
	},
};
