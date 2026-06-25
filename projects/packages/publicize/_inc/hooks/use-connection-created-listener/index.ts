import { useDispatch } from '@wordpress/data';
import { useEffect } from '@wordpress/element';
import { store as socialStore } from '../../social-store';
import { subscribeToConnectionCreated } from '../../utils';

/**
 * In the editor, listen for a connection created in the admin tab opened from here, then refresh
 * the connection list and close the modal. Mount once at the editor level so a broadcast is never
 * missed.
 */
export function useConnectionCreatedListener() {
	const { refreshConnectionTestResults, closeConnectionsModal } = useDispatch( socialStore );

	useEffect(
		() =>
			subscribeToConnectionCreated( () => {
				refreshConnectionTestResults();
				closeConnectionsModal();
			} ),
		[ refreshConnectionTestResults, closeConnectionsModal ]
	);
}
