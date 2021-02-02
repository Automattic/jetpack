/**
 * External dependencies
 */
import { Path, Rect, SVG, G } from '@wordpress/components';

/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import { isPriceValid } from '../../shared/currencies';
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
	title: __( 'Payments', 'jetpack' ),
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	description: __( 'Button allowing you to sell products and subscriptions.', 'jetpack' ),
	category: 'earn',
	keywords: [
		_x( 'sell', 'block search term', 'jetpack' ),
		_x( 'subscriptions', 'block search term', 'jetpack' ),
		_x( 'product', 'block search term', 'jetpack' ),
		'stripe',
		_x( 'memberships', 'block search term', 'jetpack' ),
	],
	usesContext: [ 'isPremiumContentChild' ],
	attributes: {
		planId: {
			type: 'integer',
		},
		align: {
			type: 'string',
		},
	},
	edit,
	save: ( { className } ) => (
		<div className={ className }>
			<InnerBlocks.Content />
		</div>
	),
	supports: {
		html: false,
		align: true,
	},
	deprecated: [ deprecatedV1 ],
};

/**
 * Removes products with prices below their minimums.
 *
 * TS compatible typedef, but JSDoc lint doesn't like it.
 * typedef {{
 *   buyer_can_change_amount: ?boolean
 *   connected_account_product_id: string
 *   connected_destination_account_id: string
 *   currency: string
 *   description: string
 *   id: number
 *   interval: string
 *   multiple_per_user: ?boolean
 *   price: string
 *   site_id: string
 *   title: string
 * }} Product
 *
 * @param {Array<Product>} products List of membership products.
 * @return {Array<Product>} List of producits with invalid products removed.
 */
export function removeInvalidProducts( products ) {
	return products.filter( product => isPriceValid( product.currency, product.price ) );
}
