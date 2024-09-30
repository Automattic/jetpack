import { __ } from '@wordpress/i18n';
import { useCallback, useMemo } from 'react';
import { useValueStore } from '../../context/value-store/valueStoreContext';
import useAnalytics from '../../hooks/use-analytics';
import {
	QUERY_EVALUATE_KEY,
	QUERY_REMOVE_EVALUATION_KEY,
	QUERY_SAVE_EVALUATION_KEY,
	REST_API_EVALUATE_SITE_RECOMMENDATIONS,
	REST_API_SITE_EVALUATION_RESULT,
} from '../constants';
import useSimpleMutation from '../use-simple-mutation';
import { getMyJetpackWindowInitialState } from '../utils/get-my-jetpack-window-state';
import isJetpackUserNew from '../utils/is-jetpack-user-new';
import useWelcomeBanner from '../welcome-banner/use-welcome-banner';

type SubmitRecommendationsResult = Record< string, number >;

const getInitialRecommendedModules = (): JetpackModule[] | null => {
	return getMyJetpackWindowInitialState( 'recommendedModules' ).modules;
};
const getInitialIsFirstRun = (): boolean => {
	return getMyJetpackWindowInitialState( 'recommendedModules' ).isFirstRun;
};

const useEvaluationRecommendations = () => {
	const { recordEvent } = useAnalytics();
	const { isWelcomeBannerVisible, showWelcomeBanner } = useWelcomeBanner();
	const [ recommendedModules, setRecommendedModules ] = useValueStore(
		'recommendedModules',
		getInitialRecommendedModules()
	);
	const [ isFirstRun, setIsFirstRun ] = useValueStore( 'isFirstRun', getInitialIsFirstRun() );

	const unownedRecommendedModules = useMemo( () => {
		// TODO: Maybe remove this ternary condition
		// This check is for local development & testing purposes because the monorepo local dev
		// environment unrealistically returns ALL the products/plugins as owned products, resulting
		// in zero(0) unownedRecommendedModules.
		const ownedProducts = (
			process?.env?.NODE_ENV === 'development'
				? [ 'anti-spam', 'creator', 'extras', 'stats', 'jetpack-ai' ]
				: getMyJetpackWindowInitialState( 'lifecycleStats' )?.ownedProducts || []
		) as JetpackModule[];
		// We filter out owned modules, and return top 3 recommendations
		return recommendedModules?.filter( module => ! ownedProducts.includes( module ) ).slice( 0, 3 );
	}, [ recommendedModules ] );

	const isEligibleForRecommendations = useMemo( () => {
		const { dismissed } = getMyJetpackWindowInitialState( 'recommendedModules' );
		return ! dismissed && ! isWelcomeBannerVisible && isJetpackUserNew();
	}, [ isWelcomeBannerVisible ] );

	const [ isSectionVisible, setIsSectionVisible ] = useValueStore(
		'recommendedModulesVisible',
		isEligibleForRecommendations && !! unownedRecommendedModules?.length
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
							setIsSectionVisible( true );
							resolve();
						},
						onError: reject,
					}
				);
			} ),
		[ handleSaveEvaluationResult, setIsSectionVisible, setRecommendedModules ]
	);

	const removeEvaluationResult = useCallback( () => {
		handleRemoveEvaluationResult(
			{},
			{
				onSuccess: () => {
					setIsSectionVisible( false );
					setIsFirstRun( false );
					recordEvent( 'jetpack_myjetpack_evaluation_recommendations_dismiss_click' );
				},
			}
		);
	}, [ handleRemoveEvaluationResult, recordEvent, setIsFirstRun, setIsSectionVisible ] );

	const redoEvaluation = useCallback( () => {
		// It just happens locally - on reload we're back to recommendations view
		setIsSectionVisible( false );
		setIsFirstRun( false );
		showWelcomeBanner();
		recordEvent( 'jetpack_myjetpack_evaluation_recommendations_redo_click' );
	}, [ recordEvent, setIsFirstRun, setIsSectionVisible, showWelcomeBanner ] );

	return {
		submitEvaluation,
		saveEvaluationResult,
		removeEvaluationResult,
		redoEvaluation,
		recommendedModules: unownedRecommendedModules,
		isSectionVisible,
		isFirstRun,
	};
};

export default useEvaluationRecommendations;
