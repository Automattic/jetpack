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
	category: 'jetpack',

	keywords: [
		_x( 'subscribe', 'block search term', 'jetpack' ),
		_x( 'join', 'block search term', 'jetpack' ),
		_x( 'follow', 'block search term', 'jetpack' ),
	],

	attributes: {
		subscribePlaceholder: { type: 'string', default: __( 'Email Address', 'jetpack' ) },
		subscribeButton: { type: 'string', default: __( 'Subscribe', 'jetpack' ) },
		showSubscribersTotal: { type: 'boolean', default: false },
		submitButtonText: {
			type: 'string',
			default: __( 'Subscribe', 'jetpack' ),
		},
		customBackgroundButtonColor: { type: 'string' },
		customTextButtonColor: { type: 'string' },
		submitButtonClasses: { type: 'string' },
	},
	edit,
	save,
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
					<RawHTML>{ `[jetpack_subscription_form show_subscribers_total="${
						attributes.showSubscribersTotal
					}" show_only_email_and_button="true"]` }</RawHTML>
				);
			},
		},
	],
};
