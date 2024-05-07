/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import { PLAN_TYPE_FREE, PLAN_TYPE_TIERED, usePlanType } from '../../../../shared/use-plan-type';
import type { WordPressPlansSelectors } from 'extensions/store/wordpress-com';

export default function useAiFeature() {
	const { data, loading } = useSelect( select => {
		const { getAiAssistantFeature, getIsRequestingAiAssistantFeature } = select(
			'wordpress-com/plans'
		) as WordPressPlansSelectors;

		return {
			data: getAiAssistantFeature(),
			loading: getIsRequestingAiAssistantFeature(),
		};
	}, [] );

	const {
		currentTier,
		usagePeriod,
		requestsCount: allTimeRequestsCount,
		requestsLimit: freeRequestsLimit,
	} = data;

	const planType = usePlanType( currentTier );

	const requestsCount =
		planType === PLAN_TYPE_TIERED ? usagePeriod?.requestsCount : allTimeRequestsCount;
	const requestsLimit = planType === PLAN_TYPE_FREE ? freeRequestsLimit : currentTier?.limit;

	const {
		fetchAiAssistantFeature: loadFeatures,
		increaseAiAssistantRequestsCount: increaseRequestsCount,
		dequeueAiAssistantFeatureAsyncRequest: dequeueAsyncRequest,
	} = useDispatch( 'wordpress-com/plans' );

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
}
