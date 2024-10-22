import { AdminSection, Container, Col } from '@automattic/jetpack-components';
import AdminPage from '../../components/admin-page';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { OnboardingContext } from '../../hooks/use-onboarding';
import usePlan from '../../hooks/use-plan';
import onboardingSteps from './onboarding-steps';
import ScanAdminSectionHero from './scan-admin-section-hero';
import ScanFooter from './scan-footer';
import ScanResultsDataView from './scan-results-data-view';

/**
 * Scan Page
 *
 * The entry point for the Scan page.
 *
 * @return {Component} The root component for the scan page.
 */
const ScanPage = () => {
	const { hasPlan } = usePlan();
	const { data: status } = useScanStatusQuery( { usePolling: true } );

	let currentScanStatus;
	if ( status.error ) {
		currentScanStatus = 'error';
	} else if ( ! status.lastChecked ) {
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

	return (
		<OnboardingContext.Provider value={ onboardingSteps }>
			<AdminPage>
				<ScanAdminSectionHero />
				<AdminSection>
					<Container horizontalSpacing={ 5 } horizontalGap={ 4 }>
						<Col>
							<ScanResultsDataView />
						</Col>
					</Container>
				</AdminSection>
				<ScanFooter />
			</AdminPage>
		</OnboardingContext.Provider>
	);
};

export default ScanPage;
