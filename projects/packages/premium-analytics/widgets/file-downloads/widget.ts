/**
 * WordPress dependencies
 */
import { download } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
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
