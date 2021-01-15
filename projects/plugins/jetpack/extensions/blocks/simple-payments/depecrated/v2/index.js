/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { ExternalLink, Path, SVG } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEFAULT_CURRENCY } from '../../constants';
import { isAtomicSite, isSimpleSite } from '../../../../shared/site-type-utils';
import { getIconColor } from '../../../../shared/block-icons';
import edit from './edit';
import save from './save';

export const icon = (
	<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
		<Path fill="none" d="M0 0h24v24H0V0z" />
		<Path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
	</SVG>
);

const supportLink =
	isSimpleSite() || isAtomicSite()
		? 'https://wordpress.com/support/pay-with-paypal/'
		: 'https://jetpack.com/support/jetpack-blocks/pay-with-paypal/';

const settings = {
	title: __( 'Pay with PayPal', 'jetpack' ),

	description: (
		<Fragment>
			<p>
				{ __(
					'Lets you add credit and debit card payment buttons with minimal setup.',
					'jetpack'
				) }
			</p>
			<p>
				{ __( 'Good for collecting donations or payments for products and services.', 'jetpack' ) }
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
		_x( 'commerce', 'block search term', 'jetpack' ),
		_x( 'products', 'block search term', 'jetpack' ),
		_x( 'purchase', 'block search term', 'jetpack' ),
		_x( 'sell', 'block search term', 'jetpack' ),
		_x( 'shop', 'block search term', 'jetpack' ),
		_x( 'simple', 'block search term', 'jetpack' ),
		_x( 'payments', 'block search term', 'jetpack' ),
		'PayPal',
	],

	attributes: {
		currency: {
			type: 'string',
			default: DEFAULT_CURRENCY,
		},
		content: {
			type: 'string',
			source: 'html',
			selector: '.jetpack-simple-payments-description p',
			default: '',
		},
		email: {
			type: 'string',
			default: '',
		},
		featuredMediaId: {
			type: 'number',
			default: 0,
		},
		featuredMediaUrl: {
			type: 'string',
			source: 'attribute',
			selector: '.jetpack-simple-payments-image img',
			attribute: 'src',
			default: null,
		},
		featuredMediaTitle: {
			type: 'string',
			source: 'attribute',
			selector: '.jetpack-simple-payments-image img',
			attribute: 'alt',
			default: null,
		},
		multiple: {
			type: 'boolean',
			default: false,
		},
		postLinkUrl: {
			type: 'string',
			source: 'attribute',
			selector: '.jetpack-simple-payments-purchase',
			attribute: 'href',
		},
		postLinkText: {
			type: 'string',
			source: 'html',
			selector: '.jetpack-simple-payments-purchase',
			default: __( 'Click here to purchase.', 'jetpack' ),
		},
		price: {
			type: 'number',
		},
		productId: {
			type: 'number',
		},
		title: {
			type: 'string',
			source: 'html',
			selector: '.jetpack-simple-payments-title p',
			default: '',
		},
	},

	transforms: {
		from: [
			{
				type: 'shortcode',
				tag: 'simple-payment',
				attributes: {
					productId: {
						type: 'number',
						shortcode: ( { named: { id } } ) => {
							if ( ! id ) {
								return;
							}

							const result = parseInt( id, 10 );
							if ( result ) {
								return result;
							}
						},
					},
				},
			},
		],
	},

	edit,

	save,

	supports: {
		className: false,
		customClassName: false,
		html: false,
		// Disabled due several problems because the block uses custom post type to store information
		// https://github.com/Automattic/jetpack/issues/11789
		reusable: false,
	},
};

export default settings;
