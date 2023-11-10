/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

const NUM_FREE_REQUESTS_LIMIT = 20;

const aiAssistantFeature = window?.Jetpack_Editor_Initial_State?.[ 'ai-assistant' ];

export const AI_Assistant_Initial_State = {
	hasFeature: !! aiAssistantFeature?.[ 'has-feature' ],
	isOverLimit: !! aiAssistantFeature?.[ 'is-over-limit' ],
	requestsCount: aiAssistantFeature?.[ 'requests-count' ] || 0,
	requestsLimit: aiAssistantFeature?.[ 'requests-limit' ] || NUM_FREE_REQUESTS_LIMIT,
	requireUpgrade: !! aiAssistantFeature?.[ 'site-require-upgrade' ],
	errorMessage: aiAssistantFeature?.[ 'error-message' ] || '',
	errorCode: aiAssistantFeature?.[ 'error-code' ],
	upgradeType: aiAssistantFeature?.[ 'upgrade-type' ] || 'default',
	usagePeriod: {
		currentStart: aiAssistantFeature?.[ 'usage-period' ]?.[ 'current-start' ],
		nextStart: aiAssistantFeature?.[ 'usage-period' ]?.[ 'next-start' ],
		requestsCount: aiAssistantFeature?.[ 'usage-period' ]?.[ 'requests-count' ] || 0,
	},
	currentTier: aiAssistantFeature?.[ 'current-tier' ],
	nextTier: aiAssistantFeature?.[ 'next-tier' ] || null,
};

export default function useAiFeature() {
	const { data, loading } = useSelect( select => {
		const { getAiAssistantFeature, getIsRequestingAiAssistantFeature } =
			select( 'wordpress-com/plans' );

		return {
			data: getAiAssistantFeature(),
			loading: getIsRequestingAiAssistantFeature(),
		};
	}, [] );

	const {
		fetchAiAssistantFeature: loadFeatures,
		increaseAiAssistantRequestsCount: increaseRequestsCount,
	} = useDispatch( 'wordpress-com/plans' );

	return {
		...data,
		loading,
		error: null, // @todo: handle error at store level
		refresh: loadFeatures,
		increaseRequestsCount,
	};
}
