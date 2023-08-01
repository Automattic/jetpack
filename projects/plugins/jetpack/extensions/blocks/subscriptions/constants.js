import { __ } from '@wordpress/i18n';

export const MIN_BORDER_RADIUS_VALUE = 0;
export const MAX_BORDER_RADIUS_VALUE = 50;
export const DEFAULT_BORDER_RADIUS_VALUE = 0;

export const MIN_BORDER_WEIGHT_VALUE = 0;
export const MAX_BORDER_WEIGHT_VALUE = 15;
export const DEFAULT_BORDER_WEIGHT_VALUE = 1;

export const MIN_PADDING_VALUE = 5;
export const MAX_PADDING_VALUE = 50;
export const DEFAULT_PADDING_VALUE = 15;

export const MIN_SPACING_VALUE = 0;
export const MAX_SPACING_VALUE = 50;
export const DEFAULT_SPACING_VALUE = 10;

export const DEFAULT_FONTSIZE_VALUE = '16px';

export const META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS = '_jetpack_newsletter_access';

export const accessOptions = {
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
	// This is called "everybody" because everyone can access the post on the site,
	// but label says "No one" to indicate that no subscriber will receive the email.
	everybody: {
		key: 'everybody',
		label: __( 'No one', 'jetpack' ),
		panelHeading: __( 'No one', 'jetpack' ),
	},
};
