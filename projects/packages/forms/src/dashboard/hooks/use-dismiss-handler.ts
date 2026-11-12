/**
 * WordPress dependencies
 */
import { useCallback } from '@wordpress/element';

/**
 * Returns an AlertDialog `onOpenChange` handler that calls `onCancel` when the user dismisses the dialog.
 *
 * @param onCancel - Function to call on Cancel, Escape or any other dismissal.
 * @return The `onOpenChange` handler.
 */
export default function useDismissHandler( onCancel: () => void ) {
	// A successful confirm also closes through here, with the 'imperative-action' reason.
	return useCallback(
		( open: boolean, { reason }: { reason: string } ) => {
			if ( ! open && reason !== 'imperative-action' ) {
				onCancel();
			}
		},
		[ onCancel ]
	);
}
