import { Container, Col, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { close } from '@wordpress/icons';
import { useCallback, useMemo, useState } from 'react';
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
	const { siteIsRegistered, siteIsRegistering, handleRegisterSite } = useMyJetpackConnection( {
		skipUserConnection: true,
	} );
	const [ visible, setVisible ] = useState( isWelcomeBannerVisible );
	const [ isProcessingEvaluation, setIsProcessingEvaluation ] = useState( false );

	const currentStep = useMemo( () => {
		if ( ! siteIsRegistered ) {
			return 'connection';
		} else if ( ! isProcessingEvaluation ) {
			return 'evaluation';
		}

		return 'evaluation-processing';
	}, [ isProcessingEvaluation, siteIsRegistered ] );

	const onDismissClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_welcome_banner_dismiss_click' );
		setVisible( false );
		dismissWelcomeBanner();
	}, [ recordEvent, dismissWelcomeBanner ] );

	const handleEvaluation = useCallback(
		( _values: { [ key in EvaluationAreas ]: boolean } ) => {
			setIsProcessingEvaluation( true );
			setTimeout( () => {
				// TODO: Mock "evaluation": Implement the evaluation endpoint
				setVisible( false );
				dismissWelcomeBanner();
			}, 3_000 );
		},
		[ dismissWelcomeBanner ]
	);

	if ( ! visible ) {
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
