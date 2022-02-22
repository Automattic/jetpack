/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import {
	ANNUAL_DONATION,
	DEFAULT_TAB,
	MONTHLY_DONATION,
	ONE_TIME_DONATION,
} from '../common/constants';
import { DonationsIcon } from '../../../shared/icons';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';

const name = 'donations-view';

const blockTitles = {
	[ ONE_TIME_DONATION ]: __( 'One Time Donation View', 'jetpack' ),
	[ MONTHLY_DONATION ]: __( 'Monthly Donation View', 'jetpack' ),
	[ ANNUAL_DONATION ]: __( 'Annual Donation View', 'jetpack' ),
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
		fallbackLinkUrl: {
			type: 'string',
			default: '',
		},
		planId: {
			type: 'string',
			default: '',
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
