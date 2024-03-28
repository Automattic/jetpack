/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';
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
