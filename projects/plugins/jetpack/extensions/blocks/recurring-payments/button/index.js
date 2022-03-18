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
import deprecatedV1 from './deprecated/v1';
import edit from './edit';
import { isPriceValid } from '../../../shared/currencies';
import './editor.scss';
import icon from './icon';
import { getSupportLink } from '../util';

export const name = 'recurring-payments-button';

const supportLink = getSupportLink();

export const settings = {
	title: __( 'Payment Button', 'jetpack' ),
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
		__experimentalExposeControlsToChildren: true,
	},
	deprecated: [ deprecatedV1 ],
	transforms: {},
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
 * @param {Array<Product>} products - List of membership products.
 * @returns {Array<Product>} List of products with invalid products removed.
 */
export function removeInvalidProducts( products ) {
	return products.filter( product => isPriceValid( product.currency, product.price ) );
}
