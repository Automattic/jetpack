/**
 * WordPress dependencies
 */
import { download } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/** No configurable attributes; the empty record allows host-provided fields. */
export type FileDownloadsAttributes = Record< never, never >;

/**
 * Reads the PA proxy at `stats/file-downloads`.
 */
export default {
	icon: download,
	attributes: [] as WidgetAttributeField< FileDownloadsAttributes >[],
	example: {
		attributes: {},
	},
};
