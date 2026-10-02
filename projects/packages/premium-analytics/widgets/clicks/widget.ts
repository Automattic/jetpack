/**
 * WordPress dependencies
 */
import { link } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type ClicksAttributes = Record< never, never >;

/**
 * Clicks widget type definition.
 *
 * Shows the most-clicked external links for the selected dashboard date range
 * via the PA proxy at `stats/clicks`.
 */
export default {
	icon: link,
	attributes: [] as WidgetAttributeField< ClicksAttributes >[],
	example: {
		attributes: {},
	},
};
