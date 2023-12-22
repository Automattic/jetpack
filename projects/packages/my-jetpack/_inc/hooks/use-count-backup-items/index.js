import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the count of things that the site has that can be backed up
 *
 * @returns {object} product data
 */
export default function useCountBackupItems() {
	return {
		countBackupItems: useSelect( select => select( STORE_ID ).getCountBackupItems() ),
		fetchingCountBackupItems: useSelect( select =>
			select( STORE_ID ).isFetchingCountBackupItems()
		),
	};
}
