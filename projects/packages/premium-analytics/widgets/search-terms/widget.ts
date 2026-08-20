/**
 * WordPress dependencies
 */
import { search } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type SearchTermsAttributes = Record< never, never >;

/**
 * Widget type definition for the Search Terms widget.
 *
 * Ported from the Jetpack Stats "Search Terms" module. Displays the top search
 * queries visitors used to reach the site, ranked by view count.
 *
 * Data: fetched via the PA proxy at `stats/search-terms`.
 * Date range comes from WidgetRoot's reportParams (the shared dashboard date picker).
 */
export default {
	icon: search,
	attributes: [] as WidgetAttributeField< SearchTermsAttributes >[],
	example: {
		attributes: {},
	},
};
