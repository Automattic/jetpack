import { Container, Col, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import useRecommendationsSection from '../../data/recommendations-section/use-recommendations-section';
import useWelcomeBanner from '../../data/welcome-banner/use-welcome-banner';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { CardWrapper } from '../card';
import ConnectionStep from './ConnectionStep';
import EvaluationProcessingStep from './EvaluationProcessingStep';
import EvaluationStep, { EvaluationAreas } from './EvaluationStep';
import styles from './style.module.scss';
import type { FC } from 'react';

const WelcomeFlow: FC = () => {
	const { recordEvent } = useAnalytics();
	const { isWelcomeBannerVisible, dismissWelcomeBanner } = useWelcomeBanner();
	const { submitEvaluation, saveEvaluationResult } = useRecommendationsSection();
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
		if ( ! siteIsRegistered ) {
			return 'connection';
		} else if ( ! isProcessingEvaluation ) {
			return 'evaluation';
		}

		return 'evaluation-processing';
	}, [ isProcessingEvaluation, siteIsRegistered ] );

	useEffect( () => {
		if ( prevStep !== currentStep ) {
			recordEvent( 'jetpack_myjetpack_welcome_banner_step_view', { currentStep } );
			setPrevStep( currentStep );
		}
	}, [ currentStep, prevStep, recordEvent ] );

	const onDismissClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_welcome_banner_dismiss_click', {
			currentStep,
			isUserConnected,
			isSiteConnected,
		} );
		dismissWelcomeBanner();
	}, [ recordEvent, currentStep, isUserConnected, isSiteConnected, dismissWelcomeBanner ] );

	const handleEvaluation = useCallback(
		( values: { [ key in EvaluationAreas ]: boolean } ) => {
			const siteGoals = Object.keys( values ).filter( key => values[ key ] );

			setIsProcessingEvaluation( true );
			recordEvent( 'jetpack_myjetpack_welcome_banner_submit_evaluation', { siteGoals } );
			submitEvaluation(
				{ queryParams: { goals: siteGoals } },
				{
					onSuccess: recommendations => {
						// Convert object to array of [key, value] pairs
						const recommendedModules = Object.entries( recommendations )
							.sort( ( a, b ) => b[ 1 ] - a[ 1 ] )
							.map( entry => entry[ 0 ] );

						recordEvent( 'jetpack_myjetpack_welcome_banner_evaluation_success', {
							recommendedModules,
						} );
						saveEvaluationResult(
							{
								data: { recommendations },
							},
							{
								onSuccess: dismissWelcomeBanner,
								onError: () => setIsProcessingEvaluation( false ),
							}
						);
					},
					onError: () => setIsProcessingEvaluation( false ),
				}
			);
		},
		[ dismissWelcomeBanner, recordEvent, saveEvaluationResult, submitEvaluation ]
	);

	if ( ! isWelcomeBannerVisible ) {
		return null;
	}

	return (
		<Container horizontalSpacing={ 3 } className={ styles[ 'banner-container' ] }>
			<Col lg={ 12 } className={ styles.banner }>
				<CardWrapper className={ styles[ 'banner-card' ] }>
					<Container
						horizontalSpacing={ 0 }
						horizontalGap={ 0 }
						className={ styles[ 'banner-content' ] }
					>
						{ 'connection' === currentStep && (
							<ConnectionStep
								onActivateSite={ handleRegisterSite }
								isActivating={ siteIsRegistering }
							/>
						) }
						{ 'evaluation' === currentStep && (
							<EvaluationStep
								onSkipOnboarding={ onDismissClick }
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
