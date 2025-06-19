import { useParams } from 'react-router';
import useAnalytics from '../../../hooks/use-analytics';
import { MY_JETPACK_SECTION_OVERVIEW } from '../constants';

type HelpType = 'contact_support' | 'documentation' | 'faq';

/**
 * Custom hook for tracking help interactions.
 *
 * @return Object with trackHelpRequest function
 */
export function useHelpTracking() {
	const { recordEvent } = useAnalytics();
	const params = useParams();

	// Determine the source tab
	const sourceTab = params.section ?? MY_JETPACK_SECTION_OVERVIEW;

	/**
	 * Track a help request event.
	 *
	 * @param {HelpType} helpType - The type of help being requested
	 * @param {string}   context  - Additional context about what the user was trying to do
	 */
	const trackHelpRequest = ( helpType: HelpType, context: string ) => {
		recordEvent( 'jetpack_myjetpack_help_request', {
			source_tab: sourceTab,
			help_type: helpType,
			context,
		} );
	};

	return { trackHelpRequest };
}
