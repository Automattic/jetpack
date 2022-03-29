/**
 * WordPress dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { ExternalLink } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { createBlock } from '@wordpress/blocks';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import icon from './button/icon';
import { getIconColor } from '../../shared/block-icons';
import { getSupportLink } from './util';
import deprecatedV2 from './deprecated/v2';
import deprecatedV1 from './deprecated/v1';

export const name = 'recurring-payments';
export const title = __( 'Payment Buttons', 'jetpack' );

const supportLink = getSupportLink();

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
	},
	apiVersion: 2,
	edit,
	save,
	deprecated: [ deprecatedV2, deprecatedV1 ],
	transforms: {
		from: [
			{
				type: 'block',
				blocks: [ 'core/buttons' ],
				transform: ( fromBlockAttribs, fromInnerBlocks ) => {
					const toBlockAttribs = {
						layout: fromBlockAttribs?.layout,
					};
					const transformedInnerBlocks = fromInnerBlocks.map( fromInnerBlock => {
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
						return createBlock( 'jetpack/' + name + '-button', {}, [ toJetpackButton ] );
					} );

					return createBlock( 'jetpack/' + name, toBlockAttribs, transformedInnerBlocks );
				},
			},
		],
	},
};
