/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { ExternalLink, Path, SVG } from '@wordpress/components';
import { Fragment } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { DEFAULT_CURRENCY } from './constants';
import { isAtomicSite, isSimpleSite } from '../../shared/site-type-utils';
import edit from './edit';
import save from './save';

/**
 * Example image
 */
import simplePaymentsExample1 from './simple-payments_example-1.jpg';

/**
 * Styles
 */
import './editor.scss';

export const name = 'simple-payments';

const supportLink =
	isSimpleSite() || isAtomicSite()
		? 'https://support.wordpress.com/simple-payments/'
		: 'https://jetpack.com/support/jetpack-blocks/simple-payments-block/';

export const settings = {
	title: __( 'Simple Payments button', 'jetpack' ),

	description: (
		<Fragment>
			<p>
				{ __(
					'Lets you create and embed credit and debit card payment buttons with minimal setup.',
					'jetpack'
				) }
			</p>
			<ExternalLink href={ supportLink }>{ __( 'Support reference', 'jetpack' ) }</ExternalLink>
		</Fragment>
	),

	icon: (
		<SVG xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24">
			<Path fill="none" d="M0 0h24v24H0V0z" />
			<Path d="M20 4H4c-1.11 0-1.99.89-1.99 2L2 18c0 1.11.89 2 2 2h16c1.11 0 2-.89 2-2V6c0-1.11-.89-2-2-2zm0 14H4v-6h16v6zm0-10H4V6h16v2z" />
		</SVG>
	),

	category: 'jetpack',

	keywords: [
		_x( 'shop', 'block search term', 'jetpack' ),
		_x( 'sell', 'block search term', 'jetpack' ),
		'PayPal',
	],

	attributes: {
		currency: {
			type: 'string',
			default: DEFAULT_CURRENCY,
		},
		content: {
			type: 'string',
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
			default: null,
		},
		featuredMediaTitle: {
			type: 'string',
			default: null,
		},
		multiple: {
			type: 'boolean',
			default: false,
		},
		price: {
			type: 'number',
		},
		productId: {
			type: 'number',
		},
		title: {
			type: 'string',
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
				'Take flight in ultimate comfort with ths stylish t-shirt featuring the Jetpack logo.',
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
};
