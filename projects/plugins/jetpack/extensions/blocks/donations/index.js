/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import deprecatedV1 from './deprecated/v1';
import { DonationsIcon } from '../../shared/icons';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'donations';
export const title = __( 'Donations', 'jetpack' );

export const settings = {
	title,
	description: __( 'Collect one-time, monthly, or annually recurring donations.', 'jetpack' ),
	icon: DonationsIcon,
	category: 'earn',
	keywords: [
		_x( 'accept', 'block search term', 'jetpack' ),
		_x( 'charity', 'block search term', 'jetpack' ),
		_x( 'contribution', 'block search term', 'jetpack' ),
		_x( 'commerce', 'block search term', 'jetpack' ),
		_x( 'credit card', 'block search term', 'jetpack' ),
		_x( 'debit card', 'block search term', 'jetpack' ),
		_x( 'donate', 'block search term', 'jetpack' ),
		_x( 'Donations', 'block search term', 'jetpack' ),
		_x( 'earn', 'block search term', 'jetpack' ),
		_x( 'ecommerce', 'block search term', 'jetpack' ),
		_x( 'form', 'block search term', 'jetpack' ),
		_x( 'fundraising', 'block search term', 'jetpack' ),
		_x( 'fundraiser', 'block search term', 'jetpack' ),
		_x( 'give', 'block search term', 'jetpack' ),
		_x( 'giving', 'block search term', 'jetpack' ),
		'gofundme',
		'go fund me',
		_x( 'gratuity', 'block search term', 'jetpack' ),
		_x( 'memberships', 'block search term', 'jetpack' ),
		_x( 'money', 'block search term', 'jetpack' ),
		_x( 'monthly', 'block search term', 'jetpack' ),
		_x( 'nonprofit', 'block search term', 'jetpack' ),
		_x( 'non-profit', 'block search term', 'jetpack' ),
		_x( 'onetime', 'block search term', 'jetpack' ),
		_x( 'one time', 'block search term', 'jetpack' ),
		_x( 'paid', 'block search term', 'jetpack' ),
		'patreon',
		_x( 'pay', 'block search term', 'jetpack' ),
		_x( 'payments', 'block search term', 'jetpack' ),
		_x( 'processing', 'block search term', 'jetpack' ),
		_x( 'processor', 'block search term', 'jetpack' ),
		_x( 'recurring', 'block search term', 'jetpack' ),
		_x( 'repeat', 'block search term', 'jetpack' ),
		'stripe',
		_x( 'subscribe', 'block search term', 'jetpack' ),
		_x( 'subscriptions', 'block search term', 'jetpack' ),
		_x( 'support', 'block search term', 'jetpack' ),
		_x( 'sponsor', 'block search term', 'jetpack' ),
		'square',
		_x( 'tipping', 'block search term', 'jetpack' ),
		'toast',
		'venmo',
		_x( 'yearly', 'block search term', 'jetpack' ),
	],
	supports: {
		html: false,
	},
	edit,
	save,
	example: {},
	deprecated: [ deprecatedV1 ],
};
