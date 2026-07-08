/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { download } from '@wordpress/icons';

/**
 * Configurable attributes for the File downloads widget.
 *
 * @property max - Maximum rows to display (0 = all). Defaults to 10.
 */
export type FileDownloadsAttributes = {
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
	icon: download,
	attributes: [
		{
			id: 'max',
			label: __( 'Max rows', 'jetpack-premium-analytics' ),
			type: 'number',
		},
	],
	example: {
		attributes: {
			max: 10,
		},
	},
};
