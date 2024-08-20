import { useSelect } from '@wordpress/data';

/**
 * Fetches loading state for site values.
 *
 * @return {object} isLoading state.
 */
export default function useSiteLoadingState() {
	const site = useSelect( select => select( 'core' ).getSite() );
	return { isLoading: ! site };
}
