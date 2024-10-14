import { AdminSection, Container, Col } from '@automattic/jetpack-components';
import { Navigate } from 'react-router-dom';
import AdminPage from '../../../components/admin-page';
import useAnalyticsTracks from '../../../hooks/use-analytics-tracks';
import usePlan from '../../../hooks/use-plan';
import ScanFooter from '../scan-footer';
import HistoryAdminSectionHero from './history-admin-section-hero';
import ScanHistoryDataView from './scan-history-data-view';

const ScanHistoryRoute = () => {
	// Track page view.
	useAnalyticsTracks( { pageViewEventName: 'protect_scan_history' } );

	const { hasPlan } = usePlan();

	// Threat history is only available for paid plans.
	if ( ! hasPlan ) {
		return <Navigate to="/scan" />;
	}

	return (
		<AdminPage>
			<HistoryAdminSectionHero />
			<AdminSection>
				<Container horizontalSpacing={ 3 } horizontalGap={ 4 }>
					<Col>
						<ScanHistoryDataView />
					</Col>
				</Container>
			</AdminSection>
			<ScanFooter />
		</AdminPage>
	);
};

export default ScanHistoryRoute;
