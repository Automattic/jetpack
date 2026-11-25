import { dispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Confirms a finished action in a snackbar, which the boot root renders.
 *
 * @param message - What happened.
 */
export function showSuccessSnackbar( message: string ) {
	dispatch( noticesStore ).createSuccessNotice( message, { type: 'snackbar' } );
}
