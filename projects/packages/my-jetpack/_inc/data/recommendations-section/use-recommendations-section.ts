import { __ } from '@wordpress/i18n';
import {
	QUERY_EVALUATE_KEY,
	QUERY_SAVE_EVALUATION_KEY,
	REST_API_EVALUATE_SITE_RECOMMENDATIONS,
	REST_API_SAVE_EVALUATION_RECOMMENDATIONS,
} from '../constants';
import useSimpleMutation from '../use-simple-mutation';

const useRecommendationsSection = () => {
	const { mutate: submitEvaluation } = useSimpleMutation< Record< string, number > >( {
		name: QUERY_EVALUATE_KEY,
		query: {
			path: REST_API_EVALUATE_SITE_RECOMMENDATIONS,
			method: 'GET',
		},
		errorMessage: __( 'Failed to evaluate site recommendations', 'jetpack-my-jetpack' ),
	} );
	const { mutate: saveEvaluationResult } = useSimpleMutation( {
		name: QUERY_SAVE_EVALUATION_KEY,
		query: {
			path: REST_API_SAVE_EVALUATION_RECOMMENDATIONS,
			method: 'POST',
		},
		errorMessage: __( 'Failed to save the evaluation. Please try again', 'jetpack-my-jetpack' ),
	} );

	return {
		submitEvaluation,
		saveEvaluationResult,
	};
};

export default useRecommendationsSection;
