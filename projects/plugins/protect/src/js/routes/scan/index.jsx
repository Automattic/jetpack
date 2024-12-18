import { AdminSection, Container, Col } from '@automattic/jetpack-components';
import { useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import AdminPage from '../../components/admin-page';
import OnboardingPopover from '../../components/onboarding-popover';
import useHistoryQuery from '../../data/scan/use-history-query';
import useScanStatusQuery, { isScanInProgress } from '../../data/scan/use-scan-status-query';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import { OnboardingContext } from '../../hooks/use-onboarding';
import usePlan from '../../hooks/use-plan';
import onboardingSteps from './onboarding-steps';
import ScanAdminSectionHero from './scan-admin-section-hero';
import ScanResultsDataView from './scan-results-data-view';
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
	const location = useLocation();
	const { filter } = useParams();
	const { data: status } = useScanStatusQuery( { usePolling: true } );
	const { data: history } = useHistoryQuery();

	const [ scanResultsAnchor, setScanResultsAnchor ] = useState( null );

	let currentScanStatus;
	if ( status.error ) {
		currentScanStatus = 'error';
	} else if ( ! status.lastChecked ) {
		currentScanStatus = 'in_progress';
	} else {
		currentScanStatus = 'active';
	}

	const hasActiveThreats = status && status.threats.length;
	const hasHistory = history && history.threats.length;
	const showResults = hasActiveThreats || hasHistory;

	const filters = useMemo( () => {
		if ( location.pathname.includes( '/scan/history' ) ) {
			return [
				{
					field: 'status',
					value: filter ? [ filter ] : [ 'fixed', 'ignored' ],
					operator: 'isAny',
				},
			];
		}

		return [
			{
				field: 'status',
				value: [ 'current' ],
				operator: 'isAny',
			},
		];
	}, [ filter, location.pathname ] );

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
				<ScanAdminSectionHero size={ showResults ? 'normal' : 'large' } />
				{ showResults && (
					<AdminSection>
						<Container
							className={ styles[ 'scan-results-container' ] }
							horizontalSpacing={ 5 }
							horizontalGap={ 4 }
						>
							<Col>
								<div ref={ setScanResultsAnchor }>
									<ScanResultsDataView filters={ filters } />
								</div>
								{ !! status && ! isScanInProgress( status ) && (
									<OnboardingPopover
										id={ hasPlan ? 'paid-scan-results' : 'free-scan-results' }
										anchor={ scanResultsAnchor }
										position={ 'top' }
									/>
								) }
								{ !! status && ! isScanInProgress( status ) && hasPlan && (
									<OnboardingPopover
										id={ 'paid-understand-severity' }
										anchor={ scanResultsAnchor }
										position={ 'top' }
									/>
								) }
							</Col>
						</Container>
					</AdminSection>
				) }
			</AdminPage>
		</OnboardingContext.Provider>
	);
};

export default ScanPage;
