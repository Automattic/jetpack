/*
 * External dependencies
 */
import { useSelect } from '@wordpress/data';
/*
 * Internal dependencies
 */
import getBreveAvailability from '../utils/get-availability';

type WordPressComPlansSelect = {
	getAiAssistantFeature: () => {
		currentTier?: {
			value?: number;
		};
	};
};

export default function useBreveAvailability() {
	// Plan is checked here because it takes a while to load the plan data.
	const { getAiAssistantFeature } = useSelect( select => {
		const selector = select( 'wordpress-com/plans' ) as WordPressComPlansSelect;

		return { getAiAssistantFeature: selector.getAiAssistantFeature };
	}, [] );

	const isFreePlan = getAiAssistantFeature().currentTier?.value === 0;

	return getBreveAvailability( isFreePlan );
}
