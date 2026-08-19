/**
 * WordPress dependencies
 */
import { link } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The Clicks widget has no configurable attributes: it requests
 * the shared `WIDGET_ROW_LIMIT` rows and renders as many of them as its tile
 * fits.
 *
 * `Record< never, never >` (not `Record< string, never >`) so the render-only
 * type can compose host fields such as `reportParams` without collapsing them
 * to `never`.
 */
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
