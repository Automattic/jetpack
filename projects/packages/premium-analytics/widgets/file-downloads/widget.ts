/**
 * WordPress dependencies
 */
import { download } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * The File downloads widget has no configurable attributes: it requests
 * the shared `WIDGET_ROW_LIMIT` rows and renders as many of them as its tile
 * fits.
 *
 * `Record< never, never >` (not `Record< string, never >`) so the render-only
 * type can compose host fields such as `reportParams` without collapsing them
 * to `never`.
 */
export type FileDownloadsAttributes = Record< never, never >;

/**
 * File downloads widget type definition.
 *
 * Shows the most-downloaded files for the period via the PA proxy at
 * `stats/file-downloads`. Date range comes from WidgetRoot's reportParams
 * (the shared dashboard date picker).
 */
export default {
	icon: download,
	attributes: [] as WidgetAttributeField< FileDownloadsAttributes >[],
	example: {
		attributes: {},
	},
};
