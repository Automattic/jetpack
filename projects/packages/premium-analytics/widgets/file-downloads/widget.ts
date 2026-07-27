/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Configurable attributes for the File downloads widget.
 */
export type FileDownloadsAttributes = {
	/**
	 * Maximum rows to display (0 = all). Defaults to 10.
	 */
	max?: number;
};

/**
 * File downloads widget type definition.
 *
 * Shows the most-downloaded files for the period via the PA proxy at
 * `stats/file-downloads`. Date range comes from WidgetRoot's reportParams
 * (the shared dashboard date picker).
 */
export default {
	icon: download,
	attributes: [
		{
			id: 'max',
			label: __( 'Number of results', 'jetpack-premium-analytics-pkg' ),
			type: 'integer',
		},
	] as WidgetAttributeField< FileDownloadsAttributes >[],
	example: {
		attributes: {
			max: 10,
		},
	},
};
