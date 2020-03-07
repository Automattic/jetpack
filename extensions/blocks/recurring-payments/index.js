/**
 * External dependencies
 */
import { Path, Rect, SVG, G } from '@wordpress/components';

/**
 * Internal dependencies
 */
import { __, _x } from '@wordpress/i18n';
import edit from './edit';
import './editor.scss';

export const name = 'recurring-payments';

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="24" height="24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="M20 4H4c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2h16c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2zm0 2v2H4V6h16zM4 18v-6h16v6H4zm2-4h7v2H6v-2zm9 0h3v2h-3v-2z" />
		</G>
	</SVG>
);

export const settings = {
	title: __( 'Recurring Payments button', 'jetpack' ),
	icon,
	description: __( 'Button allowing you to sell subscription products.', 'jetpack' ),
	category: 'jetpack',
	keywords: [
		_x( 'sell', 'block search term', 'jetpack' ),
		_x( 'subscriptions', 'block search term', 'jetpack' ),
		'stripe',
		_x( 'memberships', 'block search term', 'jetpack' ),
	],
	attributes: {
		planId: {
			type: 'integer',
		},
		submitButtonText: {
			type: 'string',
		},
		submitButtonClasses: {
			type: 'string',
		},
		backgroundButtonColor: {
			type: 'string',
		},
		textButtonColor: {
			type: 'string',
		},
		customBackgroundButtonColor: {
			type: 'string',
		},
		customTextButtonColor: {
			type: 'string',
		},
		align: {
			type: 'string',
		},
	},
	edit,
	save: () => null,
	supports: {
		html: false,
		align: true,
	},
};

// These are Stripe Settlement currencies https://stripe.com/docs/currencies since memberships supports only Stripe ATM.
export const SUPPORTED_CURRENCY_LIST = [
	'USD',
	'AUD',
	'BRL',
	'CAD',
	'CHF',
	'DKK',
	'EUR',
	'GBP',
	'HKD',
	'JPY',
	'MXN',
	'NOK',
	'NZD',
	'SEK',
	'SGD',
];
