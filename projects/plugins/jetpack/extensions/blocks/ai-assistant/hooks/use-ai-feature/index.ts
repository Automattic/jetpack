/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
import {
	PLAN_TYPE_FREE,
	PLAN_TYPE_TIERED,
	usePlanType as getPlanType,
} from '../../../../shared/use-plan-type';
import type { WordPressPlansSelectors } from 'extensions/store/wordpress-com';

export default function useAiFeature() {
	const { data, loading, requestsLimit, requestsCount } = useSelect( select => {
		const { getAiAssistantFeature, getIsRequestingAiAssistantFeature } = select(
			'wordpress-com/plans'
		) as WordPressPlansSelectors;

		const featureData = getAiAssistantFeature();

		const {
			currentTier,
			usagePeriod,
			requestsCount: allTimeRequestsCount,
			requestsLimit: freeRequestsLimit,
		} = featureData;

		const planType = getPlanType( currentTier );

		const actualRequestsCount =
			planType === PLAN_TYPE_TIERED ? usagePeriod?.requestsCount : allTimeRequestsCount;
		const actualRequestsLimit =
			planType === PLAN_TYPE_FREE ? freeRequestsLimit : currentTier?.limit;

		return {
			data: featureData,
			loading: getIsRequestingAiAssistantFeature(),
			requestsCount: actualRequestsCount,
			requestsLimit: actualRequestsLimit,
		};
	}, [] );

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
