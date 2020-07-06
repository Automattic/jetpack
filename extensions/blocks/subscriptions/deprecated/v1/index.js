/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { isEmpty } from 'lodash';
import { RawHTML } from '@wordpress/element';

export default {
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
};
