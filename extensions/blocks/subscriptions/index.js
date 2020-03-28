/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { isEmpty } from 'lodash';
import { Path } from '@wordpress/components';
import { RawHTML } from '@wordpress/element';

/**
 * Internal dependencies
 */
import edit from './edit';
import save from './save';
import renderMaterialIcon from '../../shared/render-material-icon';
import { supportsCollections } from '../../shared/block-category';

export const name = 'subscriptions';
export const settings = {
	title: __( 'Subscription Form', 'jetpack' ),

	description: (
		<p>
			{ __(
				'A form enabling readers to get notifications when new posts are published from this site.',
				'jetpack'
			) }
		</p>
	),
	icon: renderMaterialIcon(
		<Path d="M23 16v2h-3v3h-2v-3h-3v-2h3v-3h2v3h3zM20 2v9h-4v3h-3v4H4c-1.1 0-2-.9-2-2V2h18zM8 13v-1H4v1h4zm3-3H4v1h7v-1zm0-2H4v1h7V8zm7-4H4v2h14V4z" />
	),
	category: supportsCollections() ? 'grow' : 'jetpack',

	keywords: [
		_x( 'subscribe', 'block search term', 'jetpack' ),
		_x( 'join', 'block search term', 'jetpack' ),
		_x( 'follow', 'block search term', 'jetpack' ),
	],

	attributes: {
		subscribePlaceholder: {
			type: 'string',
			default: __( 'Enter your email here', 'jetpack' ),
		},
		showSubscribersTotal: {
			type: 'boolean',
			default: false,
		},
		buttonOnNewLine: {
			type: 'boolean',
			default: false,
		},
		submitButtonText: {
			type: 'string',
			default: __( 'Sign Up', 'jetpack' ),
		},
		emailFieldBackgroundColor: {
			type: 'string',
		},
		customEmailFieldBackgroundColor: {
			type: 'string',
		},
		emailFieldGradient: {
			type: 'string',
		},
		customEmailFieldGradient: {
			type: 'string',
		},
		buttonBackgroundColor: {
			type: 'string',
			default: 'accent',
		},
		customButtonBackgroundColor: {
			type: 'string',
		},
		buttonGradient: {
			type: 'string',
		},
		customButtonGradient: {
			type: 'string',
		},
		textColor: {
			type: 'string',
			default: 'background',
		},
		customTextColor: {
			type: 'string',
		},
		fontSize: {
			type: 'number',
		},
		customFontSize: {
			type: 'number',
			default: 18,
		},
		borderRadius: {
			type: 'number',
			default: 6,
		},
		borderWeight: {
			type: 'number',
			default: 2,
		},
		borderColor: {
			type: 'string',
		},
		customBorderColor: {
			type: 'string',
		},
		padding: {
			type: 'number',
			default: 15,
		},
		spacing: {
			type: 'number',
			default: 10,
		},
	},
	edit,
	save,
	example: {
		attributes: {},
	},
	deprecated: [
		{
			attributes: {
				subscribeButton: { type: 'string', default: __( 'Subscribe', 'jetpack' ) },
				showSubscribersTotal: { type: 'boolean', default: false },
			},
			migrate: attr => {
				return {
					subscribeButton: '',
					submitButtonText: attr.subscribeButton,
					showSubscribersTotal: attr.showSubscribersTotal,
					customBackgroundButtonColor: '',
					customTextButtonColor: '',
					submitButtonClasses: '',
				};
			},

			isEligible: attr => {
				if ( ! isEmpty( attr.subscribeButton ) ) {
					return false;
				}
				return true;
			},
			save: function( { attributes } ) {
				return (
					<RawHTML>{ `[jetpack_subscription_form show_subscribers_total="${ attributes.showSubscribersTotal }" show_only_email_and_button="true"]` }</RawHTML>
				);
			},
		},
	],
};
