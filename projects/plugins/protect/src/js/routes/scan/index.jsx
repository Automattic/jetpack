import { AdminSectionHero, Container, Col, H3, Text } from '@automattic/jetpack-components';
import { useConnectionErrorNotice, ConnectionError } from '@automattic/jetpack-connection';
import { Spinner } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { __, sprintf } from '@wordpress/i18n';
import React, { useEffect, useMemo } from 'react';
import inProgressImage from '../../../../assets/images/in-progress.png';
import AdminPage from '../../components/admin-page';
import ErrorScreen from '../../components/error-section';
import ProgressBar from '../../components/progress-bar';
import ScanFooter from '../../components/scan-footer';
import SeventyFiveLayout from '../../components/seventy-five-layout';
import Summary from '../../components/summary';
import ThreatsList from '../../components/threats-list';
import { SCAN_STATUS_UNAVAILABLE } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { OnboardingContext } from '../../hooks/use-onboarding';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import { STORE_ID } from '../../state/store';
import onboardingSteps from './onboarding-steps';
import ScanSectionHeader from './scan-section-header';
import styles from './styles.module.scss';
import useCredentials from './use-credentials';
import useStatusPolling from './use-status-polling';

const ConnectionErrorCol = () => {
	const { hasConnectionError } = useConnectionErrorNotice();

	return (
		<>
			{ hasConnectionError && (
				<Col className={ styles[ 'connection-error-col' ] }>
					<ConnectionError />
				</Col>
			) }
			<Col>
				<div id="jp-admin-notices" className="my-jetpack-jitm-card" />
			</Col>
		</>
	);
};

const HeaderContainer = () => {
	return (
		<Container horizontalSpacing={ 0 }>
			<ConnectionErrorCol />
		</Container>
	);
};

const ErrorSection = ( { errorMessage, errorCode } ) => {
	return (
		<>
			<HeaderContainer />
			<Container horizontalSpacing={ 3 } horizontalGap={ 4 }>
				<Col>
					<ScanSectionHeader />
				</Col>
				<Col>
					<ErrorScreen
						baseErrorMessage={ __(
							'We are having problems scanning your site.',
							'jetpack-protect'
						) }
						errorMessage={ errorMessage }
						errorCode={ errorCode }
					/>
				</Col>
			</Container>
		</>
	);
};

const ScanningSection = ( { currentProgress } ) => {
	const { hasRequiredPlan } = useProtectData();
	const { stats } = useWafData();
	const { globalStats } = stats;
	const totalVulnerabilities = parseInt( globalStats?.totalVulnerabilities );
	const totalVulnerabilitiesFormatted = isNaN( totalVulnerabilities )
		? '50,000'
		: totalVulnerabilities.toLocaleString();

	return (
		<>
			<HeaderContainer />
			<Container horizontalSpacing={ 3 } horizontalGap={ 4 }>
				<Col>
					<ScanSectionHeader />
				</Col>
				<Col>
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
										{ hasRequiredPlan && currentProgress !== null && currentProgress >= 0 && (
											<ProgressBar value={ currentProgress } />
										) }
										<Text>
											{ sprintf(
												// translators: placeholder is the number of total vulnerabilities i.e. "22,000".
												__(
													'We are scanning for security threats from our more than %s listed vulnerabilities, powered by WPScan. This could take a minute or two.',
													'jetpack-protect'
												),
												totalVulnerabilitiesFormatted
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
				</Col>
			</Container>
		</>
	);
};

const DefaultSection = () => {
	return (
		<>
			<HeaderContainer />
			<Container horizontalSpacing={ 3 } horizontalGap={ 4 }>
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
	const { lastChecked, hasRequiredPlan } = useProtectData();
	const { refreshStatus } = useDispatch( STORE_ID );
	const { scanInProgress, statusIsFetching, scanIsUnavailable, status, scanError } = useSelect(
		select => ( {
			scanError: select( STORE_ID ).scanError(),
			scanInProgress: select( STORE_ID ).scanInProgress(),
			scanIsUnavailable: select( STORE_ID ).getScanIsUnavailable(),
			status: select( STORE_ID ).getStatus(),
			statusIsFetching: select( STORE_ID ).getStatusIsFetching(),
		} )
	);

	let currentScanStatus;
	if ( scanError ) {
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
		if ( ! statusIsFetching && SCAN_STATUS_UNAVAILABLE === status.status && ! scanIsUnavailable ) {
			refreshStatus( true );
		}
	}, [ statusIsFetching, status.status, refreshStatus, scanIsUnavailable ] );

	const renderSection = useMemo( () => {
		if ( scanInProgress ) {
			return <ScanningSection currentProgress={ status.currentProgress } />;
		}

		if ( scanError ) {
			return <ErrorSection errorMessage={ scanError.message } errorCode={ scanError.code } />;
		}

		return <DefaultSection />;
	}, [ scanInProgress, status.currentProgress, scanError ] );

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
