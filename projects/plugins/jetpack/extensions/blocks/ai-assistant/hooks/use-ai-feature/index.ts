/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';

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
	currentTier: {
		value: aiAssistantFeature?.[ 'current-tier' ]?.value || 1,
	},
	nextTier: aiAssistantFeature?.[ 'next-tier' ] || {},
};

export default function useAiFeature() {
	const [ error ] = useState< Error >( null );

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

	// @todo: remove once optimistic updates are implemented.
	useEffect( () => {
		loadFeatures();
	}, [ loadFeatures ] );

	return {
		...data,
		loading,
		error,
		refresh: loadFeatures,
		increaseRequestsCount,
	};
}
