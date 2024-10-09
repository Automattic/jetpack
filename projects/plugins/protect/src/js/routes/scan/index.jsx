import {
	AdminSection,
	Container,
	Col,
	Text,
	getIconBySlug,
	useBreakpointMatch,
} from '@automattic/jetpack-components';
import { dateI18n } from '@wordpress/date';
import { __, sprintf } from '@wordpress/i18n';
import { useMemo, useState } from 'react';
import AdminPage from '../../components/admin-page';
import ErrorHeader from '../../components/error-header';
import Header from '../../components/header';
import OnboardingPopover from '../../components/onboarding-popover';
import ScanFooter from '../../components/scan-footer';
import ScanningHeader from '../../components/scanning-header';
import ThreatsList from '../../components/threats-list';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { OnboardingContext } from '../../hooks/use-onboarding';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
import onboardingSteps from './onboarding-steps';
import styles from './styles.module.scss';

/**
 * Scan Page
 *
 * The entry point for the Scan page.
 *
 * @return {Component} The root component for the scan page.
 */
const ScanPage = () => {
	const { hasPlan } = usePlan();
	const {
		counts: {
			current: { threats: numThreats },
		},
		lastChecked,
	} = useProtectData();
	const { data: status } = useScanStatusQuery( { usePolling: true } );
	const [ isSm ] = useBreakpointMatch( 'sm' );

	// Popover anchor
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );

	const Icon = getIconBySlug( 'protect' );

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

	let lastCheckedLocalTimestamp = null;
	if ( lastChecked ) {
		// Convert the lastChecked UTC date to a local timestamp
		lastCheckedLocalTimestamp = new Date( lastChecked + ' UTC' ).getTime();
	}

	const renderHeader = useMemo( () => {
		const singularType = hasPlan ? 'threat' : 'vulnerability';
		const pluralType = hasPlan ? 'threats' : 'vulnerabilities';

		if ( isScanInProgress( status ) ) {
			return <ScanningHeader currentProgress={ status?.currentProgress } />;
		}

		if ( status.error ) {
			return (
				<ErrorHeader
					baseErrorMessage={ __( 'We are having problems scanning your site.', 'jetpack-protect' ) }
					errorMessage={ status.errorMessage }
					errorCode={ status.errorCode }
				/>
			);
		}

		return (
			<Header
				status={ 'active' }
				statusLabel={ __( 'Active', 'jetpack-protect' ) }
				heading={
					<>
						{ numThreats > 0
							? sprintf(
									/* translators: %s: Total number of threats/vulnerabilities */
									__( '%1$s %2$s found', 'jetpack-protect' ),
									numThreats,
									numThreats === 1 ? singularType : pluralType
							  )
							: sprintf(
									/* translators: %s: Pluralized type of threat/vulnerability */
									__( 'No %s found', 'jetpack-protect' ),
									pluralType
							  ) }
						<Icon className={ styles[ 'heading-icon' ] } size={ 32 } />
					</>
				}
				subheading={
					<>
						<Text ref={ setDailyScansPopoverAnchor }>
							{ lastCheckedLocalTimestamp ? (
								<>
									<span className={ styles[ 'subheading-content' ] }>
										{ dateI18n( 'F jS g:i A', lastCheckedLocalTimestamp ) }
									</span>
									&nbsp;
									{ __( 'results', 'jetpack-protect' ) }
								</>
							) : (
								__( 'Most recent results', 'jetpack-protect' )
							) }
						</Text>
						{ ! hasPlan && (
							<OnboardingPopover
								id="free-daily-scans"
								position={ isSm ? 'bottom' : 'middle left' }
								anchor={ dailyScansPopoverAnchor }
							/>
						) }
					</>
				}
				showNavigation={ true }
			/>
		);
	}, [
		status,
		Icon,
		lastCheckedLocalTimestamp,
		numThreats,
		hasPlan,
		isSm,
		dailyScansPopoverAnchor,
	] );

	return (
		<OnboardingContext.Provider value={ onboardingSteps }>
			<AdminPage>
				{ renderHeader }
				{ ( ! status.error || ( status.error && numThreats > 0 ) ) && (
					<AdminSection>
						{ ' ' }
						<Container horizontalSpacing={ 3 } horizontalGap={ 4 }>
							<Col>
								<ThreatsList />
							</Col>
						</Container>
					</AdminSection>
				) }
				<ScanFooter />
			</AdminPage>
		</OnboardingContext.Provider>
	);
};

export default ScanPage;
