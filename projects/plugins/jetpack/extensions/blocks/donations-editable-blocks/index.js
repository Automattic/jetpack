/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DonationsIcon } from '../../shared/icons';

/**
 * Internal dependencies
 */
import edit from './edit';

export const name = 'donations-editable-blocks';
export const title = 'Donations Editable Blocks';

export const settings = {
	title,
	description: __( 'New donations block with inner blocks', 'jetpack' ),
	icon: DonationsIcon,
	category: 'earn',
	keywords: [ __( 'donations', 'jetpack' ) ],
	supports: {
		align: true,
		alignWide: false,
		html: false,
	},
	edit,
	save: () => null,
};
