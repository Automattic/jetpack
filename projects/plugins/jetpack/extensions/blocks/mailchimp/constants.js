import { __ } from '@wordpress/i18n';

export const NOTIFICATION_PROCESSING = 'processing';
export const NOTIFICATION_SUCCESS = 'success';
export const NOTIFICATION_ERROR = 'error';

export const BLOCK_CLASS = 'wp-block-jetpack-mailchimp';

export const API_STATE_LOADING = 0;
export const API_STATE_CONNECTED = 1;
export const API_STATE_NOTCONNECTED = 2;

export const DEFAULT_EMAIL_PLACEHOLDER = __( 'Enter your email', 'jetpack' );
export const DEFAULT_CONSENT_TEXT = __(
	'By clicking submit, you agree to share your email address with the site owner and Mailchimp to receive marketing, updates, and other emails from the site owner. Use the unsubscribe link in those emails to opt out at any time.',
	'jetpack'
);
export const DEFAULT_PROCESSING_LABEL = __( 'Processing…', 'jetpack' );
export const DEFAULT_SUCCESS_LABEL = __( "Success! You're on the list.", 'jetpack' );
export const DEFAULT_ERROR_LABEL = __(
	"Whoops! There was an error and we couldn't process your subscription. Please reload the page and try again.",
	'jetpack'
);
