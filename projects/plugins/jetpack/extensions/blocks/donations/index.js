import { __, _x } from '@wordpress/i18n';
import { DonationsIcon } from '../../shared/icons';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import save from './save';

import './editor.scss';

export const name = 'donations';
export const title = __( 'Donations Form', 'jetpack' );

export const settings = {
	title,
	description: __( 'Collect one-time, monthly, or annually recurring donations.', 'jetpack' ),
	icon: DonationsIcon,
	category: 'earn',
	keywords: [
		_x( 'charity', 'block search term', 'jetpack' ),
		_x( 'contribution', 'block search term', 'jetpack' ),
		_x( 'credit card', 'block search term', 'jetpack' ),
		_x( 'debit card', 'block search term', 'jetpack' ),
		_x( 'donate', 'block search term', 'jetpack' ),
		_x( 'earn', 'block search term', 'jetpack' ),
		_x( 'ecommerce', 'block search term', 'jetpack' ),
		_x( 'fundraising', 'block search term', 'jetpack' ),
		_x( 'fundraiser', 'block search term', 'jetpack' ),
		'gofundme',
		_x( 'money', 'block search term', 'jetpack' ),
		_x( 'nonprofit', 'block search term', 'jetpack' ),
		_x( 'non-profit', 'block search term', 'jetpack' ),
		_x( 'paid', 'block search term', 'jetpack' ),
		'patreon',
		_x( 'pay', 'block search term', 'jetpack' ),
		_x( 'payments', 'block search term', 'jetpack' ),
		_x( 'recurring', 'block search term', 'jetpack' ),
		'stripe',
		_x( 'sponsor', 'block search term', 'jetpack' ),
		'square',
		_x( 'tipping', 'block search term', 'jetpack' ),
		'venmo',
	],
	supports: {
		html: false,
	},
	edit,
	save,
	example: {},
	deprecated: [ deprecatedV1 ],
};
