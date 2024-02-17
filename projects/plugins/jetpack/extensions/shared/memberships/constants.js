import { __ } from '@wordpress/i18n';

export const META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS = '_jetpack_newsletter_access';
export const META_NAME_FOR_POST_DONT_EMAIL_TO_SUBS = '_jetpack_dont_email_post_to_subs';
export const META_NAME_FOR_POST_TIER_ID_SETTINGS = '_jetpack_newsletter_tier_id';
export const accessOptions = {
	everybody: {
		key: 'everybody',
		label: __( 'Everyone', 'jetpack' ),
		panelHeading: __( 'Everyone', 'jetpack' ),
	},
	subscribers: {
		key: 'subscribers',
		label: __( 'Anyone subscribed', 'jetpack' ),
		panelHeading: __( 'All subscribers', 'jetpack' ),
	},
	paid_subscribers: {
		key: 'paid_subscribers',
		label: __( 'Paid subscribers only', 'jetpack' ),
		panelHeading: __( 'Paid subscribers', 'jetpack' ),
	},
};
