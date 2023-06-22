/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

export const ERROR_QUOTA_EXCEEDED = {
	code: 'error_quota_exceeded',
	message: __( 'You have reached the limit of requests for this site.', 'jetpack' ),
	status: 'info',
};

export const ERROR_UNCLEAR_PROMPT = {
	code: 'error_unclear_prompt',
	message: __( 'Your request was unclear. Mind trying again?', 'jetpack' ),
	status: 'info',
};

export const ERROR_SERVICE_UNAVAILABLE = {
	code: 'error_service_unavailable',
	message: __(
		'Jetpack AI services are currently unavailable. Sorry for the inconvenience.',
		'jetpack'
	),
	status: 'info',
};

export const ERROR_MODERATION = {
	code: 'error_moderation',
	message: __(
		'This request has been flagged by our moderation system. Please try to rephrase it and try again.',
		'jetpack'
	),
	status: 'info',
};

export const ERROR_NETWORK = {
	code: 'error_network',
	message: __( 'It was not possible to process your request. Mind trying again?', 'jetpack' ),
	status: 'info',
};
