/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DonationsIcon } from '../../shared/icons';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import {
	ANNUAL_DONATION_TAB,
	MONTHLY_DONATION_TAB,
	ONE_TIME_DONATION_TAB,
} from './common/constants';

export const name = 'donations-editable-blocks';
export const title = 'Donations Editable Blocks';

export const settings = {
	title,
	description: __( 'New donations block with inner blocks', 'jetpack' ),
	icon: DonationsIcon,
	category: 'earn',
	keywords: [ __( 'donations', 'jetpack' ) ],
	attributes: {
		[ ONE_TIME_DONATION_TAB ]: {
			type: 'boolean',
			default: true,
		},
		[ MONTHLY_DONATION_TAB ]: {
			type: 'boolean',
			default: true,
		},
		[ ANNUAL_DONATION_TAB ]: {
			type: 'boolean',
			default: true,
		},
	},
	supports: {
		align: true,
		alignWide: false,
		html: false,
	},
	edit,
	save,
};
