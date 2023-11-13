/**
 * External dependencies
 */
import { useDispatch, useSelect } from '@wordpress/data';

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
