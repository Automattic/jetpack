import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { ExternalLink, Path, SVG } from '@wordpress/components';
import { Fragment } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { getIconColor } from '../../shared/block-icons';
import { DEFAULT_CURRENCY } from './constants';
import deprecatedV1 from './deprecated/v1';
import deprecatedV2 from './deprecated/v2';
import edit from './edit';
import save from './save';
import simplePaymentsExample1 from './simple-payments_example-1.jpg';

import './editor.scss';

export const name = 'simple-payments';

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

export const settings = {
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
		_x( 'credit card', 'block search term', 'jetpack' ),
		_x( 'debit card', 'block search term', 'jetpack' ),
		_x( 'earn', 'block search term', 'jetpack' ),
		_x( 'ecommerce', 'block search term', 'jetpack' ),
		_x( 'money', 'block search term', 'jetpack' ),
		_x( 'paid', 'block search term', 'jetpack' ),
		_x( 'payments', 'block search term', 'jetpack' ),
		_x( 'products', 'block search term', 'jetpack' ),
		_x( 'purchase', 'block search term', 'jetpack' ),
		_x( 'sell', 'block search term', 'jetpack' ),
		_x( 'shop', 'block search term', 'jetpack' ),
		'square',
		_x( 'payments', 'block search term', 'jetpack' ),
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

	example: {
		attributes: {
			price: 25.0,
			title: __( 'Jetpack t-shirt', 'jetpack' ),
			content: __(
				'Take flight in ultimate comfort with this stylish t-shirt featuring the Jetpack logo.',
				'jetpack'
			),
			email: 'jetpack@jetpack.com',
			featuredMediaUrl: simplePaymentsExample1,
		},
	},

	supports: {
		className: false,
		customClassName: false,
		html: false,
		// Disabled due several problems because the block uses custom post type to store information
		// https://github.com/Automattic/jetpack/issues/11789
		reusable: false,
	},

	deprecated: [ deprecatedV1, deprecatedV2 ],
};
