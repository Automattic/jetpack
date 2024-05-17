import { RawHTML } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { isEmpty } from 'lodash';

/**
 * Deprecation reason:
 *
 * Block moved from `subscribeButton` attribute to `submitButtonText` when it
 * had an empty value set.
 */
export default {
	attributes: {
		subscribeButton: { type: 'string', default: __( 'Subscribe', 'jetpack' ) },
		showSubscribersTotal: { type: 'boolean', default: false },
	},
	migrate: oldAttributes => {
		return {
			submitButtonText: oldAttributes.subscribeButton,
			showSubscribersTotal: oldAttributes.showSubscribersTotal,
		};
	},
	isEligible: attr => {
		// Newer block versions do not have `subscribeButton` attribute.
		if ( ! attr.hasOwnProperty( 'subscribeButton' ) || ! isEmpty( attr.subscribeButton ) ) {
			return false;
		}
		return true;
	},
	save: function ( { attributes } ) {
		return (
			<RawHTML>{ `[jetpack_subscription_form show_subscribers_total="${ attributes.showSubscribersTotal }" show_only_email_and_button="true"]` }</RawHTML>
		);
	},
};
