/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import edit from './edit';
import icon from './icon';
import variations from './variations';
import { getIconColor } from '../../shared/block-icons';

/**
 * Style dependencies
 */
import './editor.scss';

export const name = 'one-payment';
export const title = __( 'One payment', 'jetpack' );
export const settings = {
	title,
	description: __( 'Sell products and services or receive donations on your website', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	category: 'earn',
	keywords: [
		_x( 'sell', 'block search term', 'jetpack' ),
		_x( 'subscriptions', 'block search term', 'jetpack' ),
		_x( 'product', 'block search term', 'jetpack' ),
		'stripe',
		_x( 'memberships', 'block search term', 'jetpack' ),
		_x( 'donations', 'block search term', 'jetpack' ),
		_x( 'tip', 'block search term', 'jetpack' ),
		_x( 'paid', 'block search term', 'jetpack' ),
		_x( 'pay', 'block search term', 'jetpack' ),
		_x( 'money', 'block search term', 'jetpack' ),
		_x( 'checkout', 'block search term', 'jetpack' ),
	],
	supports: {
		// This block acts as a dumb wrapper and so should offer minimal capabilities for customisation. In general,
		// individual feature support is up to the individual blocks wrapped. Exceptions to avoid confusion will exist
		// such as `multiple` and `reusable` features.
		alignWide: false,
		// Setting this to false suppress the ability to edit a block’s markup individually.
		html: false,
	},
	edit,
	save: () => <InnerBlocks.Content />,
	variations,
};
