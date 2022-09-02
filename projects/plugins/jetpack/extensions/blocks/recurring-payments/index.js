import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { createBlock } from '@wordpress/blocks';
import { Path, Rect, SVG, G, ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import { isPriceValid } from '../../shared/currencies';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import edit from './edit';
import save from './save';
import './editor.scss';

export const name = 'recurring-payments';
export const title = __( 'Payment Button', 'jetpack' );
export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Rect x="0" fill="none" width="24" height="24" />
		<G>
			<Path d="M20 4H4c-1.105 0-2 .895-2 2v12c0 1.105.895 2 2 2h16c1.105 0 2-.895 2-2V6c0-1.105-.895-2-2-2zm0 2v2H4V6h16zM4 18v-6h16v6H4zm2-4h7v2H6v-2zm9 0h3v2h-3v-2z" />
		</G>
	</SVG>
);

const supportLink =
	isSimpleSite() || isAtomicSite()
		? 'https://wordpress.com/support/video-tutorials-add-payments-features-to-your-site-with-our-guides/#how-to-use-the-payments-block-video'
		: 'https://jetpack.com/support/jetpack-blocks/payments-block/';

export const settings = {
	apiVersion: 2,
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
	providesContext: {
		'jetpack/parentBlockWidth': 'width',
	},
	attributes: {
		planId: {
			type: 'integer',
		},
		align: {
			type: 'string',
		},
		url: {
			type: 'string',
			// Used for blocks created without the payment form auto open feature.
			default: '#',
		},
		uniqueId: {
			type: 'string',
			// Used for blocks created without the payment form auto open feature.
			default: 'id',
		},
		width: {
			type: 'string',
		},
		buyerCanChangeAmount: {
			type: 'bool',
			default: false,
		},
	},
	edit,
	save,
	parent: [ 'jetpack/payment-buttons' ],
	supports: {
		html: false,
		__experimentalExposeControlsToChildren: true,
	},
	deprecated: [ deprecatedV2, deprecatedV1 ],
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/buttons' ],
				isMatch: ( _, block ) => {
					// core/buttons blocks contain one or more core/button block, it's these that
					// should be equivalent to a payment button but as the result of the transformation
					// must be of the same type as the block that defines the transformation, only one
					// can be transformed.
					// Detecting this is only possible from Gutenberg 11.5+ when the isMatch API was changed
					// to provide the block parameters.
					return (
						block !== undefined &&
						1 === block.innerBlocks.length &&
						'core/button' === block.innerBlocks[ 0 ].name
					);
				},
				transform: ( _, fromInnerBlocks ) => {
					const fromInnerBlock = fromInnerBlocks[ 0 ];
					const toButtonAttrs = {
						element: 'a',
						text: fromInnerBlock.attributes.text ?? '',
						className: fromInnerBlock.attributes.className ?? '',
					};

					const width = fromInnerBlock.attributes.width;
					if ( width ) {
						toButtonAttrs.width = width.toString() + '%';
					}

					// Map borderRadius from nnpx to nn.
					// core/button has a max button radius of 100, but jetpack/button has a max of 50
					// this relies upon jetpack/button enforcing it's maximum.
					const borderRadius = fromInnerBlock.attributes.style?.border?.radius;
					if ( borderRadius ) {
						toButtonAttrs.borderRadius = parseInt(
							borderRadius.substring( 0, borderRadius.length - 2 )
						);
					}

					const toJetpackButton = createBlock( 'jetpack/button', toButtonAttrs, [] );
					return createBlock( 'jetpack/' + name, {}, [ toJetpackButton ] );
				},
			},
		],
	},
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
