import { useSelect } from '@wordpress/data';
import { STORE_ID } from '../../state/store';

/**
 * React custom hook to get the detached licenses data.
 *
 * @returns {object} detached licenses data
 */
export default function useDetachedLicenses() {
	return {
		detachedLicenses: useSelect( select => select( STORE_ID ).getDetachedLicenses() ),
		fetchingDetachedLicenses: useSelect( select =>
			select( STORE_ID ).isFetchingDetachedLicenses()
		),
	};
}
