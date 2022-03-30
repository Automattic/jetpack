/**
 * WordPress dependencies
 */
import { InnerBlocks } from '@wordpress/block-editor';
import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { __ } from '@wordpress/i18n';
import { getIconColor } from '../../../shared/block-icons';
import edit from './edit';
import { isPriceValid } from '../../../shared/currencies';
import './editor.scss';
import icon from './icon';
import { getSupportLink } from '../util';

export const name = 'recurring-payments-button';
export const title = __( 'Payment Button', 'jetpack' );

const supportLink = getSupportLink();

export const settings = {
	title,
	icon: {
		src: icon,
		foreground: getIconColor(),
	},
	description: (
		<Fragment>
			<p>{ __( 'Button allowing you to sell products and subscriptions.', 'jetpack' ) }</p>
			<ExternalLink href={ supportLink }>{ __( 'Support reference', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),
	category: 'earn',
	keywords: [],
	usesContext: [ 'isPremiumContentChild' ],
	parent: [ 'jetpack/recurring-payments' ],
	attributes: {
		planId: {
			type: 'integer',
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
		__experimentalExposeControlsToChildren: true,
	},
	transforms: {},
};

/**
 * A membership product
 *
 * @typedef {object} Product
 * @property {?boolean} buyer_can_change_amount
 * @property {string} connected_account_product_id
 * @property {string} connected_destination_account_id
 * @property {string} currency
 * @property {string} description
 * @property {number} id
 * @property {string} interval
 * @property {?boolean} multiple_per_user
 * @property {string} price
 * @property {string} site_id
 * @property {string} title
 */

/**
 * Removes products with prices below their minimums.
 *
 * @param {Array<Product>} products - List of membership products.
 * @returns {Array<Product>} List of products with invalid products removed.
 */
export function removeInvalidProducts( products ) {
	return products.filter( product => isPriceValid( product.currency, product.price ) );
}
