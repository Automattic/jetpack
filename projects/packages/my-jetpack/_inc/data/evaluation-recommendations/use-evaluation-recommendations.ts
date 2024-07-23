import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import {
	QUERY_EVALUATE_KEY,
	QUERY_REMOVE_EVALUATION_KEY,
	QUERY_SAVE_EVALUATION_KEY,
	REST_API_EVALUATE_SITE_RECOMMENDATIONS,
	REST_API_SITE_EVALUATION_RESULT,
} from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';
import useWelcomeBanner from '../welcome-banner/use-welcome-banner';

type SubmitRecommendationsResult = Record< string, number >;

const useEvaluationRecommendations = () => {
	const { isWelcomeBannerVisible, showWelcomeBanner } = useWelcomeBanner();
	const [ recommendedModules, setRecommendedModules ] = useValueStore(
		'recommendedModules',
		getMyJetpackWindowInitialState().recommendedModules
	);
	const { mutate: handleSubmitRecommendations } = useSimpleMutation< SubmitRecommendationsResult >(
		{
			name: QUERY_EVALUATE_KEY,
			query: {
				path: REST_API_EVALUATE_SITE_RECOMMENDATIONS,
				method: 'GET',
			},
			errorMessage: __( 'Failed to evaluate site recommendations', 'jetpack-my-jetpack' ),
		}
	);
	const { mutate: handleSaveEvaluationResult } = useSimpleMutation< JetpackModule[] >( {
		name: QUERY_SAVE_EVALUATION_KEY,
		query: {
			path: REST_API_SITE_EVALUATION_RESULT,
			method: 'POST',
		},
		errorMessage: __( 'Failed to save evaluation results. Please try again', 'jetpack-my-jetpack' ),
	} );
	const { mutate: handleRemoveEvaluationResult } = useSimpleMutation< JetpackModule[] >( {
		name: QUERY_REMOVE_EVALUATION_KEY,
		query: {
			path: REST_API_SITE_EVALUATION_RESULT,
			method: 'DELETE',
		},
		errorMessage: __( 'Failed to hide evaluation results. Please try again', 'jetpack-my-jetpack' ),
	} );

	const submitEvaluation = useCallback(
		( goals: string[] ) =>
			new Promise< SubmitRecommendationsResult >( ( resolve, reject ) => {
				handleSubmitRecommendations(
					{ queryParams: { goals } },
					{
						onSuccess: resolve,
						onError: reject,
					}
				);
			} ),
		[ handleSubmitRecommendations ]
	);

	const saveEvaluationResult = useCallback(
		( recommendations: SubmitRecommendationsResult ) =>
			new Promise< void >( ( resolve, reject ) => {
				handleSaveEvaluationResult(
					{ data: { recommendations } },
					{
						onSuccess: response => {
							setRecommendedModules( response );
							resolve();
						},
						onError: reject,
					}
				);
			} ),
		[ handleSaveEvaluationResult, setRecommendedModules ]
	);

	const removeEvaluationResult = useCallback( () => {
		handleRemoveEvaluationResult(
			{},
			{
				onSuccess: () => {
					setRecommendedModules( null );
				},
			}
		);
	}, [ handleRemoveEvaluationResult, setRecommendedModules ] );

	const redoEvaluation = useCallback( () => {
		handleRemoveEvaluationResult(
			{ queryParams: { showWelcomeBanner: 'true' } },
			{
				onSuccess: () => {
					setRecommendedModules( null );
					showWelcomeBanner();
				},
			}
		);
	}, [ handleRemoveEvaluationResult, setRecommendedModules, showWelcomeBanner ] );

	return {
		submitEvaluation,
		saveEvaluationResult,
		removeEvaluationResult,
		redoEvaluation,
		recommendedModules,
		isSectionVisible: recommendedModules !== null && ! isWelcomeBannerVisible,
	};
};

export default useEvaluationRecommendations;
