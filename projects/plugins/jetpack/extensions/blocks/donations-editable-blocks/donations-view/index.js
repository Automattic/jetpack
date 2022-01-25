/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { DonationsIcon } from '../../../shared/icons';
import {
	ANNUAL_DONATION_TAB,
	DEFAULT_TAB,
	MONTHLY_DONATION_TAB,
	ONE_TIME_DONATION_TAB,
} from '../common/constants';

const name = 'donations-view';

const blockTitles = {
	[ ONE_TIME_DONATION_TAB ]: __( 'One Time Donation View', 'jetpack' ),
	[ MONTHLY_DONATION_TAB ]: __( 'Monthly Donation View', 'jetpack' ),
	[ ANNUAL_DONATION_TAB ]: __( 'Annual Donation View', 'jetpack' ),
};

const settings = {
	title: __( 'Donations View', 'jetpack' ),
	description: __( 'Collect one-time, monthly, or annually recurring donations.', 'jetpack' ),
	icon: DonationsIcon,
	__experimentalLabel: ( { type } ) => blockTitles[ type ],
	category: 'earn',
	attributes: {
		type: {
			type: 'string',
			default: DEFAULT_TAB,
		},
	},
	edit,
	save,
	supports: {
		inserter: false,
		html: false,
	},
};

export { name, settings };
