/**
 * WordPress dependencies
 */
import { useSelect } from '@wordpress/data';

/**
 * Fetches loading state for site values.
 *
 * @returns {object} isLoading state.
 */
export default function useSiteLoadingState() {
	const site = useSelect( select => select( 'core' ).getSite() );
	return { isLoading: ! site };
}
