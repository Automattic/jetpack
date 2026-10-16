/**
 * Short-lived snackbar notices for the result of a merchant action.
 *
 * @package
 */

import { dispatch } from '@wordpress/data';
import { store as noticesStore } from '@wordpress/notices';

/**
 * Show a snackbar.
 *
 * Dispatches at module level rather than useDispatch(), because the save sync calls
 * this from the editor.preSavePost filter, outside React. Core's SnackbarList handles
 * dismissal.
 *
 * @param {string} status  - 'error', 'warning' or 'success'.
 * @param {string} message - What to say.
 * @param {string} [id]    - Notice id. Repeat calls with the same id replace each other.
 */
export function toast( status, message, id ) {
	dispatch( noticesStore ).createNotice( status, message, { type: 'snackbar', id } );
}
