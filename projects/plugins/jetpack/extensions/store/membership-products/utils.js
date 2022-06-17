import { store as noticesStore } from '@wordpress/notices';

export const onError = ( message, registry ) =>
	registry.dispatch( noticesStore ).createErrorNotice( message, { type: 'snackbar' } );

export const onSuccess = ( message, registry ) =>
	registry.dispatch( noticesStore ).createSuccessNotice( message, { type: 'snackbar' } );
