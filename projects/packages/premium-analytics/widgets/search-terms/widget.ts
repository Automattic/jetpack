/**
 * WordPress dependencies
 */
import { search } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type SearchTermsAttributes = Record< never, never >;

/**
 * Ported from the Jetpack Stats "Search Terms" module; data via the PA proxy at
 * `stats/search-terms`.
 */
export default {
	icon: search,
	attributes: [] as WidgetAttributeField< SearchTermsAttributes >[],
	example: {
		attributes: {},
	},
};
