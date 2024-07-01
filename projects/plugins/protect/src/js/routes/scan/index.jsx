import { AdminSectionHero, Container, Col, H3, Text } from '@automattic/jetpack-components';
import { ConnectionError, useConnection } from '@automattic/jetpack-connection';
import { Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import React, { useEffect, useMemo } from 'react';
import AdminPage from '../../components/admin-page';
import AlertSVGIcon from '../../components/alert-icon';
import ProgressBar from '../../components/progress-bar';
import ScanFooter from '../../components/scan-footer';
import SeventyFiveLayout from '../../components/seventy-five-layout';
import Summary from '../../components/summary';
import ThreatsList from '../../components/threats-list';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useCredentials from '../../hooks/use-credentials';
import { OnboardingContext } from '../../hooks/use-onboarding';
import useProtectData from '../../hooks/use-protect-data';
import useStatusPolling from '../../hooks/use-status-polling';
import { STORE_ID } from '../../state/store';
import inProgressImage from './in-progress.png';
import onboardingSteps from './onboarding-steps';
import styles from './styles.module.scss';

const SectionHeader = () => {
	const { hasConnectionError } = useConnection();
	return (
		<Container horizontalSpacing={ 0 }>
			{ hasConnectionError && (
				<Col className={ styles[ 'connection-error-col' ] }>
					<ConnectionError />
				</Col>
			) }
			<Col>
				<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
			</Col>
		</Container>
	);
};

const ErrorSection = ( { errorMessage, errorCode } ) => {
	return (
		<>
			<SectionHeader />
			<SeventyFiveLayout
				main={
					<div className={ styles[ 'main-content' ] }>
						<AlertSVGIcon className={ styles[ 'alert-icon-wrapper' ] } />
						<H3>{ __( 'We are having problems scanning your site', 'jetpack-protect' ) }</H3>
						{ !! errorMessage && <Text>{ `${ errorMessage } (${ errorCode }).` }</Text> }
					</div>
				}
				secondary={
					<div className={ styles.illustration }>
						<img src={ inProgressImage } alt="" />
					</div>
				}
				preserveSecondaryOnMobile={ false }
			/>
		</>
	);
};

const ScanningSection = ( { currentProgress } ) => {
	return (
		<>
			<SectionHeader />
			<SeventyFiveLayout
				main={
					<div className={ styles[ 'main-content' ] }>
						<Container horizontalSpacing={ 3 } horizontalGap={ 7 }>
							<Col className={ styles[ 'loading-content' ] }>
								<Spinner
									style={ {
										color: 'black',
										marginTop: 0,
										marginLeft: 0,
									} }
								/>
								<span>{ __( 'Scanning your site…', 'jetpack-protect' ) }</span>
							</Col>
							<Col>
								<H3 style={ { textWrap: 'balance' } }>
									{ __( 'Your results will be ready soon', 'jetpack-protect' ) }
								</H3>
								{ currentProgress !== null && currentProgress >= 0 && (
									<ProgressBar value={ currentProgress } />
								) }
								<Text>
									{ __(
										'We are scanning for security threats from our more than 22,000 listed vulnerabilities, powered by WPScan. This could take a minute or two.',
										'jetpack-protect'
									) }
								</Text>
							</Col>
						</Container>
					</div>
				}
				secondary={
					<div className={ styles.illustration }>
						<img src={ inProgressImage } alt="" />
					</div>
				}
				preserveSecondaryOnMobile={ false }
			/>
		</>
	);
};

const DefaultSection = () => {
	return (
		<>
			<SectionHeader />
			<Container horizontalSpacing={ 3 } horizontalGap={ 7 }>
				<Col>
					<Summary />
				</Col>
				<Col>
					<ThreatsList />
				</Col>
			</Container>
		</>
	);
};

const ScanPage = () => {
	const { lastChecked, error, errorCode, errorMessage, hasRequiredPlan } = useProtectData();
	const { refreshStatus } = useDispatch( STORE_ID );
	const { statusIsFetching, scanIsUnavailable, status } = useSelect( select => ( {
		statusIsFetching: select( STORE_ID ).getStatusIsFetching(),
		scanIsUnavailable: select( STORE_ID ).getScanIsUnavailable(),
		status: select( STORE_ID ).getStatus(),
	} ) );

	let currentScanStatus;
	if ( status.error || scanIsUnavailable ) {
		currentScanStatus = 'error';
	} else if ( ! lastChecked ) {
		currentScanStatus = 'in_progress';
	} else {
		currentScanStatus = 'active';
	}

	// Track view for Protect admin page.
	useAnalyticsTracks( {
		pageViewEventName: 'protect_admin',
		pageViewEventProperties: {
			check_status: currentScanStatus,
			has_plan: hasRequiredPlan,
		},
	} );

	useStatusPolling();
	useCredentials();

	// retry fetching status if it is not available
	useEffect( () => {
		if ( ! statusIsFetching && 'unavailable' === status.status && ! scanIsUnavailable ) {
			refreshStatus( true );
		}
	}, [ statusIsFetching, status.status, refreshStatus, scanIsUnavailable ] );

	const renderSection = useMemo( () => {
		// Error
		if ( error ) {
			return <ErrorSection errorMessage={ errorMessage } errorCode={ errorCode } />;
		}

		// Scanning
		const scanningStatuses = new Set( [ 'scheduled', 'scanning', 'optimistically_scanning' ] );
		if ( scanningStatuses.has( status.status ) || ! lastChecked ) {
			return <ScanningSection currentProgress={ status.currentProgress } />;
		}

		return <DefaultSection />;
	}, [ error, errorMessage, errorCode, status.status, status.currentProgress, lastChecked ] );

	return (
		<OnboardingContext.Provider value={ onboardingSteps }>
			<AdminPage>
				<AdminSectionHero>{ renderSection }</AdminSectionHero>
				<ScanFooter />
			</AdminPage>
		</OnboardingContext.Provider>
	);
};

export default ScanPage;
