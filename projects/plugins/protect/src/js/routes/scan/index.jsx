import { AdminSectionHero, Container, Col, H3, Text } from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo } from 'react';
import inProgressImage from '../../../../assets/images/in-progress.png';
import AdminPage from '../../components/admin-page';
import ErrorScreen from '../../components/error-section';
import ProgressBar from '../../components/progress-bar';
import ScanFooter from '../../components/scan-footer';
import SeventyFiveLayout from '../../components/seventy-five-layout';
import Summary from '../../components/summary';
import ThreatsList from '../../components/threats-list';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { OnboardingContext } from '../../hooks/use-onboarding';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import onboardingSteps from './onboarding-steps';
import ScanSectionHeader from './scan-section-header';
import ScanSectionNotices from './scan-section-notices';
import styles from './styles.module.scss';

/**
 * Error Section
 *
 * @param {object} props              - Component props.
 * @param {string} props.errorMessage - The error message.
 * @param {string} props.errorCode    - The error code.
 *
 * @return {Component} The component.
 */
const ErrorSection = ( { errorMessage, errorCode } ) => {
	return (
		<>
			<Col>
				<ScanSectionHeader />
			</Col>
			<Col>
				<ErrorScreen
					baseErrorMessage={ __( 'We are having problems scanning your site.', 'jetpack-protect' ) }
					errorMessage={ errorMessage }
					errorCode={ errorCode }
				/>
			</Col>
		</>
	);
};

/**
 * Scan In Progress Section
 *
 * @param {object} props                 - Component props.
 * @param {number} props.currentProgress - The current progress of the scan.
 *
 * @return {Component} The component.
 */
const ScanInProgressSection = ( { currentProgress } ) => {
	const { hasPlan } = usePlan();
	const { globalStats } = useWafData();
	const totalVulnerabilities = parseInt( globalStats?.totalVulnerabilities );
	const totalVulnerabilitiesFormatted = isNaN( totalVulnerabilities )
		? '50,000'
		: totalVulnerabilities.toLocaleString();

	return (
		<>
			<Col>
				<ScanSectionHeader />
			</Col>
			<Col>
				<SeventyFiveLayout
					main={
						<div className={ styles[ 'main-content' ] }>
							<Container horizontalSpacing={ 0 } horizontalGap={ 7 } fluid={ true }>
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
									{ hasPlan && <ProgressBar value={ currentProgress || 0 } /> }
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
					fluid={ true }
				/>
			</Col>
		</>
	);
};

/**
 * Scan Results Section
 *
 * @return {Component} The component.
 */
const ScanResultsSection = () => {
	return (
		<>
			<Col>
				<Summary />
			</Col>
			<Col>
				<ThreatsList />
			</Col>
		</>
	);
};

/**
 * Scan Page
 *
 * The entry point for the Scan page.
 *
 * @return {Component} The root component for the scan page.
 */
const ScanPage = () => {
	const { hasPlan } = usePlan();
	const { lastChecked } = useProtectData();
	const { data: status } = useScanStatusQuery( { usePolling: true } );

	let currentScanStatus;
	if ( status.error ) {
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
			has_plan: hasPlan,
		},
	} );

	// Render the appropriate section based on the scan status.
	const renderSection = useMemo( () => {
		if ( isScanInProgress( status ) ) {
			return <ScanInProgressSection currentProgress={ status.currentProgress || 0 } />;
		}

		if ( status.error ) {
			return <ErrorSection errorMessage={ status.errorMessage } errorCode={ status.errorCode } />;
		}

		return <ScanResultsSection />;
	}, [ status ] );

	return (
		<OnboardingContext.Provider value={ onboardingSteps }>
			<AdminPage>
				<AdminSectionHero>
					<ScanSectionNotices />
					<Container horizontalSpacing={ 3 } horizontalGap={ 4 }>
						{ renderSection }
					</Container>
				</AdminSectionHero>
				<ScanFooter />
			</AdminPage>
		</OnboardingContext.Provider>
	);
};

export default ScanPage;
