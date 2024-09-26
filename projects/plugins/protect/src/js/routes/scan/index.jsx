import { AdminSection, Container, Col, useBreakpointMatch } from '@automattic/jetpack-components';
import { useState } from 'react';
import AdminPage from '../../components/admin-page';
import OnboardingPopover from '../../components/onboarding-popover';
import ScanFooter from '../../components/scan-footer';
import ScanHeader from '../../components/scan-header';
import Summary from '../../components/summary';
import ThreatsList from '../../components/threats-list';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { OnboardingContext } from '../../hooks/use-onboarding';
import usePlan from '../../hooks/use-plan';
import useProtectData from '../../hooks/use-protect-data';
import onboardingSteps from './onboarding-steps';

const ScanPage = () => {
	const { hasPlan } = usePlan();
	const { lastChecked } = useProtectData();
	const { data: status } = useScanStatusQuery( { usePolling: true } );
	const [ isSm ] = useBreakpointMatch( 'sm' );

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

	// Popover anchors
	const [ dailyScansPopoverAnchor, setDailyScansPopoverAnchor ] = useState( null );

	return (
		<OnboardingContext.Provider value={ onboardingSteps }>
			<AdminPage>
				<ScanHeader
					isScanning={ isScanInProgress( status ) }
					currentProgress={ status.currentProgress }
					error={ status.error }
					errorMessage={ status.errorMessage }
					errorCode={ status.errorCode }
					summary={
						<>
							<div ref={ setDailyScansPopoverAnchor }>
								<Summary />
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
				/>
				<AdminSection>
					<Container horizontalSpacing={ 7 } horizontalGap={ 3 }>
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
