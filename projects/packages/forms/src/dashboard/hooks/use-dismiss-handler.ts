/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Returns an AlertDialog `onOpenChange` handler that calls `onDismiss` when the user dismisses the dialog.
 *
 * @param onDismiss - Function to call on Cancel, Escape or any other dismissal.
 * @return The `onOpenChange` handler.
 */
export default function useDismissHandler( onDismiss: () => void ) {
	// A successful confirm also closes through here, with the 'imperative-action' reason.
	return useCallback(
		( open: boolean, { reason }: { reason: string } ) => {
			if ( ! open && reason !== 'imperative-action' ) {
				onDismiss();
			}
		},
		[ onDismiss ]
	);
}
