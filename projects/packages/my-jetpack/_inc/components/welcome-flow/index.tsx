import { Container, Col, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useEvaluationRecommendations from '../../data/evaluation-recommendations/use-evaluation-recommendations';
import isJetpackUserNew from '../../data/utils/is-jetpack-user-new';
import useWelcomeBanner from '../../data/welcome-banner/use-welcome-banner';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { CardWrapper } from '../card';
import ConnectionStep from './ConnectionStep';
import EvaluationProcessingStep from './EvaluationProcessingStep';
import EvaluationStep, { EvaluationAreas } from './EvaluationStep';
import styles from './style.module.scss';
import type { FC, PropsWithChildren } from 'react';

export type WelcomeFlowExperiment = {
	isLoading: boolean;
	variation: 'control' | 'treatment';
};

interface Props extends PropsWithChildren {
	welcomeFlowExperiment: WelcomeFlowExperiment;
	setWelcomeFlowExperiment: React.Dispatch< React.SetStateAction< WelcomeFlowExperiment > >;
}

const WelcomeFlow: FC< Props > = ( {
	welcomeFlowExperiment,
	setWelcomeFlowExperiment,
	children,
} ) => {
	const { recordEvent } = useAnalytics();
	const { dismissWelcomeBanner } = useWelcomeBanner();
	const { recommendedModules, submitEvaluation, saveEvaluationResult } =
		useEvaluationRecommendations();
	const {
		siteIsRegistered,
		siteIsRegistering,
		isUserConnected,
		isSiteConnected,
		handleRegisterSite,
	} = useMyJetpackConnection( {
		skipUserConnection: true,
	} );
	const [ isProcessingEvaluation, setIsProcessingEvaluation ] = useState( false );
	const [ prevStep, setPrevStep ] = useState( '' );

	const currentStep = useMemo( () => {
		if ( ! siteIsRegistered || welcomeFlowExperiment.isLoading ) {
			return 'connection';
		} else if ( ! isProcessingEvaluation ) {
			if ( ! recommendedModules && ! isJetpackUserNew() ) {
				// If user is not new but doesn't have recommendations, we skip evaluation
				// If user has recommendations, it means they redo the evaluation
				return null;
			}
			// For the "treatment" experiment we immediately jump to the 'evaluation-processing' step if
			// there are no `recommendedModules` loaded yet.
			if (
				'treatment' === welcomeFlowExperiment.variation &&
				! recommendedModules &&
				isJetpackUserNew()
			) {
				return 'evaluation-processing';
			}
			// Otherwise, it means user is either new or just repeats the recommendation
			return 'evaluation';
		}

		return 'evaluation-processing';
	}, [
		isProcessingEvaluation,
		recommendedModules,
		siteIsRegistered,
		welcomeFlowExperiment.isLoading,
		welcomeFlowExperiment.variation,
	] );

	useEffect( () => {
		if ( prevStep !== currentStep ) {
			recordEvent( 'jetpack_myjetpack_welcome_banner_step_view', { current_step: currentStep } );
			setPrevStep( currentStep );
		}
	}, [ currentStep, prevStep, recordEvent ] );

	const onDismissClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_welcome_banner_dismiss_click', {
			current_step: currentStep,
			is_user_connected: isUserConnected,
			is_site_connected: isSiteConnected,
		} );
		dismissWelcomeBanner();
	}, [ recordEvent, currentStep, isUserConnected, isSiteConnected, dismissWelcomeBanner ] );

	const onSkipClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_welcome_banner_skip_recommendations_click' );
		dismissWelcomeBanner();
	}, [ dismissWelcomeBanner, recordEvent ] );

	const handleEvaluation = useCallback(
		async ( values: { [ key in EvaluationAreas ]: boolean } ) => {
			const goals = Object.keys( values ).filter( key => values[ key ] );

			setIsProcessingEvaluation( true );
			recordEvent( 'jetpack_myjetpack_welcome_banner_evaluation_submit', { goals } );

			try {
				const recommendations = await submitEvaluation( goals );
				await saveEvaluationResult( recommendations );

				dismissWelcomeBanner();
			} catch ( error ) {
				setIsProcessingEvaluation( false );
			}
		},
		[ dismissWelcomeBanner, recordEvent, saveEvaluationResult, submitEvaluation ]
	);

	useEffect( () => {
		// For the "treatment" experiment, when there are no `recommendedModules` loaded yet,
		// we immediately submit some default evaluation data (on component mount).
		if (
			'treatment' === welcomeFlowExperiment.variation &&
			! recommendedModules &&
			isJetpackUserNew()
		) {
			handleEvaluation( {
				protect: true,
				performance: true,
				audience: true,
				content: true,
				unsure: false,
			} );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		if ( ! currentStep ) {
			dismissWelcomeBanner();
		}
	}, [
		currentStep,
		dismissWelcomeBanner,
		handleEvaluation,
		recommendedModules,
		welcomeFlowExperiment.variation,
	] );

	if ( ! currentStep ) {
		return null;
	}

	return (
		<Container horizontalSpacing={ 6 } horizontalGap={ 2 }>
			{ children && <Col>{ children }</Col> }
			<Col lg={ 12 } className={ styles.banner }>
				<CardWrapper
					className={ clsx(
						styles[ 'banner-card' ],
						'connection' === currentStep && styles[ 'is-mandatory' ]
					) }
				>
					<Container
						horizontalSpacing={ 0 }
						horizontalGap={ 0 }
						className={ styles[ 'banner-content' ] }
					>
						{ 'connection' === currentStep && (
							<ConnectionStep
								onActivateSite={ handleRegisterSite }
								onUpdateWelcomeFlowExperiment={ setWelcomeFlowExperiment }
								isActivating={ siteIsRegistering || welcomeFlowExperiment.isLoading }
							/>
						) }
						{ 'evaluation' === currentStep && (
							<EvaluationStep
								onSkipOnboarding={ onSkipClick }
								onSubmitEvaluation={ handleEvaluation }
							/>
						) }
						{ 'evaluation-processing' === currentStep && <EvaluationProcessingStep /> }
					</Container>
				</CardWrapper>
				<Button
					className={ styles.dismiss }
					variant="secondary"
					aria-label={ __( 'Don’t show the welcome message again', 'jetpack-my-jetpack' ) }
					size="small"
					icon={ close }
					disabled={ siteIsRegistering }
					onClick={ onDismissClick }
				/>
			</Col>
		</Container>
	);
};

export default WelcomeFlow;
