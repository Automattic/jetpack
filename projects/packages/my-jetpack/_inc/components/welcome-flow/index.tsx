import { Container, Col, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import clsx from 'clsx';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useEvaluationRecommendations from '../../data/evaluation-recommendations/use-evaluation-recommendations';
import useWelcomeBanner from '../../data/welcome-banner/use-welcome-banner';
import useAnalytics from '../../hooks/use-analytics';
import useIsJetpackUserNew from '../../hooks/use-is-jetpack-user-new';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { CardWrapper } from '../card';
import ConnectionStep from './ConnectionStep';
import EvaluationStep, { EvaluationAreas } from './EvaluationStep';
import LoadingStep from './LoadingStep';
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
	const { siteIsRegistered, siteIsRegistering, isUserConnected, isSiteConnected } =
		useMyJetpackConnection( {
			skipUserConnection: true,
		} );
	const [ isProcessingEvaluation, setIsProcessingEvaluation ] = useState( false );
	const [ prevStep, setPrevStep ] = useState( '' );

	const [ isConnectionReady, setIsConnectionReady ] = useState( null );
	const isJetpackUserNew = useIsJetpackUserNew();

	useEffect( () => {
		if ( prevStep === 'site-connecting' && ! siteIsRegistering && siteIsRegistered ) {
			setIsConnectionReady( true );

			const timer = setTimeout( () => setIsConnectionReady( false ), 3000 );

			return () => clearTimeout( timer );
		}
	}, [
		isProcessingEvaluation,
		prevStep,
		recommendedModules,
		siteIsRegistered,
		siteIsRegistering,
	] );

	const currentStep = useMemo( () => {
		if (
			siteIsRegistering ||
			isConnectionReady ||
			( siteIsRegistered && prevStep === 'site-connecting' && isConnectionReady === null )
		) {
			return 'site-connecting';
		} else if ( ! siteIsRegistered || welcomeFlowExperiment.isLoading ) {
			return 'connection';
		} else if ( ! isProcessingEvaluation ) {
			if ( ! recommendedModules && ! isJetpackUserNew ) {
				// If user is not new but doesn't have recommendations, we skip evaluation
				// If user has recommendations, it means they redo the evaluation
				return null;
			}

			// Otherwise, it means user is either new or just repeats the recommendation
			return 'evaluation';
		}

		return 'evaluation-processing';
	}, [
		siteIsRegistered,
		isConnectionReady,
		siteIsRegistering,
		prevStep,
		welcomeFlowExperiment.isLoading,
		isProcessingEvaluation,
		recommendedModules,
		isJetpackUserNew,
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
			} catch {
				setIsProcessingEvaluation( false );
			}
		},
		[ dismissWelcomeBanner, recordEvent, saveEvaluationResult, submitEvaluation ]
	);

	useEffect( () => {
		if ( ! currentStep ) {
			dismissWelcomeBanner();
		}
	}, [ currentStep, dismissWelcomeBanner ] );

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
						{ 'evaluation-processing' === currentStep && <LoadingStep type="recommendations" /> }
						{ 'site-connecting' === currentStep && (
							<LoadingStep type={ 'connecting' } isReady={ isSiteConnected } />
						) }
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
