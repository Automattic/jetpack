import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the backup rewindable events
 *
 * @returns {object} product data
 */
export default function useBackupRewindableEvents() {
	return {
		backupRewindableEvents: useSelect( select => select( STORE_ID ).getBackupRewindableEvents() ),
		fetchingBackupRewindableEvents: useSelect( select =>
			select( STORE_ID ).isFetchingBackupRewindableEvents()
		),
	};
}
