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
	name: 'jpa/file-downloads',
	title: __( 'File downloads', 'jetpack-premium-analytics' ),
	help: {
		content: __( 'Most downloaded files from your site.', 'jetpack-premium-analytics' ),
	},
	icon: download,
	attributes: [
		{
			id: 'max',
			label: __( 'Max rows', 'jetpack-premium-analytics' ),
			type: 'number',
		},
	] as WidgetAttributeField< FileDownloadsAttributes >[],
	example: {
		attributes: {
			max: 10,
		},
	},
};
