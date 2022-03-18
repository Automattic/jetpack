/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import icon from './button/icon';
import { getIconColor } from '../../shared/block-icons';

import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';

export const name = 'recurring-payments';
export const title = __( 'Payment Buttons', 'jetpack' );

// TODO: this is copied and pasted from -button
const supportLink =
	isSimpleSite() || isAtomicSite()
		? 'https://wordpress.com/support/video-tutorials-add-payments-features-to-your-site-with-our-guides/#how-to-use-the-payments-block-video'
		: 'https://jetpack.com/support/jetpack-blocks/payments-block/';

export const settings = {
	title,
	description: (
		<Fragment>
			<p>
				{ __( 'Group of buttons allowing you to sell products and subscriptions.', 'jetpack' ) }
			</p>
			<ExternalLink href={ supportLink }>{ __( 'Support reference', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'earn',
	keywords: [
		_x( 'buy', 'block search term', 'jetpack' ),
		_x( 'contribution', 'block search term', 'jetpack' ),
		_x( 'commerce', 'block search term', 'jetpack' ),
		_x( 'credit card', 'block search term', 'jetpack' ),
		_x( 'debit card', 'block search term', 'jetpack' ),
		_x( 'donate', 'block search term', 'jetpack' ),
		_x( 'Donations', 'block search term', 'jetpack' ),
		_x( 'earn', 'block search term', 'jetpack' ),
		_x( 'ecommerce', 'block search term', 'jetpack' ),
		'gofundme',
		_x( 'memberships', 'block search term', 'jetpack' ),
		_x( 'money', 'block search term', 'jetpack' ),
		_x( 'paid', 'block search term', 'jetpack' ),
		'patreon',
		_x( 'pay', 'block search term', 'jetpack' ),
		_x( 'payments', 'block search term', 'jetpack' ),
		_x( 'products', 'block search term', 'jetpack' ),
		_x( 'purchase', 'block search term', 'jetpack' ),
		_x( 'recurring', 'block search term', 'jetpack' ),
		_x( 'sell', 'block search term', 'jetpack' ),
		_x( 'shop', 'block search term', 'jetpack' ),
		'stripe',
		_x( 'subscribe', 'block search term', 'jetpack' ),
		_x( 'subscriptions', 'block search term', 'jetpack' ),
		_x( 'sponsor', 'block search term', 'jetpack' ),
		'square',
		'toast',
		'venmo',
	],
	usesContext: [ 'isPremiumContentChild' ],
	// TODO: Check these all make sense
	supports: {
		align: true,
		anchor: true,
		__experimentalExposeControlsToChildren: true,
		html: false,
		__experimentalLayout: {
			allowSwitching: false,
			allowInheriting: false,
			default: {
				type: 'flex',
			},
		},
		spacing: {
			blockGap: true,
			margin: [ 'top', 'bottom' ],
			__experimentalDefaultControls: {
				blockGap: true,
			},
		},
	},
	edit,
	save,
};
