import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the available licenses data.
 *
 * @returns {object} available licenses data
 */
export default function useAvailableLicenses() {
	return {
		availableLicenses: useSelect( select => select( STORE_ID ).getAvailableLicenses() ),
		fetchingAvailableLicenses: useSelect( select =>
			select( STORE_ID ).isFetchingAvailableLicenses()
		),
	};
}
