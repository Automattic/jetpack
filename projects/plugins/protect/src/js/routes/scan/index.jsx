import {
	AdminSectionHero,
	Container,
	Col,
	H3,
	Text,
	AdminSection,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { Spinner } from '@wordpress/components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from 'react';
import inProgressImage from '../../../../assets/images/in-progress.png';
import AdminPage from '../../components/admin-page';
import ErrorScreen from '../../components/error-section';
import OnboardingPopover from '../../components/onboarding-popover';
import ProgressBar from '../../components/progress-bar';
import ScanFooter from '../../components/scan-footer';
import SeventyFiveLayout from '../../components/seventy-five-layout';
import ThreatsList from '../../components/threats-list';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { OnboardingContext } from '../../hooks/use-onboarding';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
import useWafData from '../../hooks/use-waf-data';
import onboardingSteps from './onboarding-steps';
import ScanSectionHeader from './scan-section-header';
import ScanSectionNavigation from './scan-section-navigation';
import ScanSectionNotices from './scan-section-notices';
import styles from './styles.module.scss';

/**
 * Scan In Progress Section
 *
 * @param {object} props                 - Component props.
 * @param {number} props.currentProgress - The current progress of the scan.
 *
 * @return {Component} The component.
 */
const ScanInProgressHero = ( { currentProgress } ) => {
	const { hasPlan } = usePlan();
	const { globalStats } = useWafData();
	const totalVulnerabilities = parseInt( globalStats?.totalVulnerabilities );
	const totalVulnerabilitiesFormatted = isNaN( totalVulnerabilities )
		? '50,000'
		: totalVulnerabilities.toLocaleString();

	return (
		<SeventyFiveLayout
			main={
				<Container horizontalSpacing={ 0 } horizontalGap={ 4 } fluid={ true }>
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
					<Col>
						<ScanSectionNavigation />
					</Col>
				</Container>
			}
			secondary={
				<div className={ styles.illustration }>
					<img src={ inProgressImage } alt="" />
				</div>
			}
			preserveSecondaryOnMobile={ false }
			fluid={ true }
		/>
	);
};

/**
 * Scan Results Section
 *
 * @return {Component} The component.
 */
const ScanResultsHero = () => {
	const [ isSm ] = useBreakpointMatch( 'sm' );
	const {
		counts: {
			current: { threats: numThreats },
		},
		lastChecked,
	} = useProtectData();
	const { hasPlan } = usePlan();

	// Popover anchors
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );

	return (
		<ScanSectionHeader
			title={
				numThreats > 0
					? sprintf(
							/* translators: %s: Total number of threats  */
							__( '%1$s %2$s found', 'jetpack-protect' ),
							numThreats,
							numThreats === 1 ? 'threat' : 'threats'
					  )
					: undefined
			}
			subtitle={
				<>
					<div ref={ setDailyScansPopoverAnchor }>
						{ sprintf(
							/* translators: %s: Latest check date  */
							__( 'Latest results as of %s', 'jetpack-protect' ),
							dateI18n( 'F jS', lastChecked )
						) }
					</div>
					{ ! hasPlan && (
						<OnboardingPopover
							id="free-daily-scans"
							position={ isSm ? 'bottom' : 'middle right' }
							anchor={ dailyScansPopoverAnchor }
						/>
					) }
				</>
			}
			showNavigation={ hasPlan }
		/>
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
	const renderSectionHero = useMemo( () => {
		if ( isScanInProgress( status ) ) {
			return <ScanInProgressHero currentProgress={ status.currentProgress || 0 } />;
		}

		if ( status.error ) {
			return (
				<ErrorScreen
					baseErrorMessage={ __( 'We are having problems scanning your site.', 'jetpack-protect' ) }
					errorMessage={ status.errorMessage }
					errorCode={ status.errorCode }
				/>
			);
		}

		return <ScanResultsHero />;
	}, [ status ] );

	return (
		<OnboardingContext.Provider value={ onboardingSteps }>
			<AdminPage>
				<AdminSectionHero>
					<ScanSectionNotices />
					<Container horizontalSpacing={ 7 } horizontalGap={ 4 }>
						<Col>{ renderSectionHero }</Col>
					</Container>
				</AdminSectionHero>
				<AdminSection>
					<Container horizontalSpacing={ 7 } horizontalGap={ 0 } fluid={ false }>
						<Col>
							<ThreatsList />
						</Col>
					</Container>
				</AdminSection>
				<ScanFooter />
			</AdminPage>
		</OnboardingContext.Provider>
	);
};

export default ScanPage;
