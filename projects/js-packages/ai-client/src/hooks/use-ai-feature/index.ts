/**
 * External dependencies
 */
import {
	PLAN_TYPE_FREE,
	usePlanType as getPlanType,
} from '@automattic/jetpack-shared-extension-utils';
import { useDispatch, useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';
import type { WordPressPlansSelectors } from '@automattic/jetpack-shared-extension-utils/store/wordpress-com';

/**
 * Hook to get properties for AiFeature
 * @return {object} - Object containing properties for AiFeature.
 */
export default function useAiFeature() {
	const data = useSelect(
		select =>
			( select( 'wordpress-com/plans' ) as WordPressPlansSelectors ).getAiAssistantFeature(),
		[]
	);

	const loading = useSelect(
		select =>
			(
				select( 'wordpress-com/plans' ) as WordPressPlansSelectors
			 ).getIsRequestingAiAssistantFeature(),
		[]
	);

	const {
		fetchAiAssistantFeature: loadFeatures,
		increaseAiAssistantRequestsCount: increaseRequestsCount,
		dequeueAiAssistantFeatureAsyncRequest: dequeueAsyncRequest,
	} = useDispatch( 'wordpress-com/plans' );

	return useMemo( () => {
		const planType = getPlanType( data?.currentTier );
		const currentTierLimit = data?.currentTier?.limit || data?.requestsLimit;

		const requestsCount =
			planType === PLAN_TYPE_FREE ? data?.requestsCount : data?.usagePeriod?.requestsCount;

		const requestsLimit = planType === PLAN_TYPE_FREE ? data?.requestsLimit : currentTierLimit;

		return {
			...data,
			requestsCount,
			requestsLimit,
			loading,
			error: null, // @todo: handle error at store level
			refresh: loadFeatures,
			increaseRequestsCount,
			dequeueAsyncRequest,
		};
	}, [ data, loading, loadFeatures, increaseRequestsCount, dequeueAsyncRequest ] );
}
