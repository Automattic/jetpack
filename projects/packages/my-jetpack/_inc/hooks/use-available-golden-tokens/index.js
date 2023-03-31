import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the available Golden Token data.
 *
 * @returns {object} available golden token data.
 */
export default function useAvailableGoldenTokens() {
	return {
		availableGoldenTokens: useSelect( select => select( STORE_ID ).getAvailableGoldenTokens() ),
		isFetchingAvailableGoldenTokens: useSelect( select =>
			select( STORE_ID ).isFetchingAvailableGoldenTokens()
		),
	};
}
