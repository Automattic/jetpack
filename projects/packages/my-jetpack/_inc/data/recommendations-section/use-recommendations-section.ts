import { __ } from '@wordpress/i18n';
import { QUERY_SAVE_EVALUATION_KEY, REST_API_SAVE_EVALUATION_RECOMMENDATIONS } from '../constants';
import useSimpleMutation from '../use-simple-mutation';

const useRecommendationsSection = () => {
	const { mutate: saveEvaluation } = useSimpleMutation( {
		name: QUERY_SAVE_EVALUATION_KEY,
		query: {
			path: REST_API_SAVE_EVALUATION_RECOMMENDATIONS,
			method: 'POST',
		},
		errorMessage: __( 'Failed to save the evaluation. Please try again', 'jetpack-my-jetpack' ),
	} );

	return {
		saveEvaluation,
	};
};

export default useRecommendationsSection;
