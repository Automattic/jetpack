import { AdminSection, Container, Col } from '@automattic/jetpack-components';
import AdminPage from '../../../components/admin-page';
import useHistoryQuery from '../../../data/scan/use-history-query';
import useScanStatusQuery from '../../../data/scan/use-scan-status-query';
import HistoryAdminSectionHero from './history-admin-section-hero';
import HistoryDataViews from './history-data-views';
import styles from './styles.module.scss';

/**
 * History Page
 *
 * The entry point for the History page.
 *
 * @return {Component} The root component for the scan page.
 */
const HistoryPage = () => {
	const { data: status } = useScanStatusQuery();
	const { data: history } = useHistoryQuery();

	const hasActiveThreats = status && status.threats.length;
	const hasHistory = history && history.threats.length;
	const showResults = hasActiveThreats || hasHistory;

	return (
		<AdminPage>
			<HistoryAdminSectionHero size={ hasHistory ? 'normal' : 'large' } />
			{ showResults && (
				<AdminSection>
					<Container
						className={ styles[ 'history-container' ] }
						horizontalSpacing={ 5 }
						horizontalGap={ 4 }
					>
						<Col>
							<HistoryDataViews />
						</Col>
					</Container>
				</AdminSection>
			) }
		</AdminPage>
	);
};

export default HistoryPage;
