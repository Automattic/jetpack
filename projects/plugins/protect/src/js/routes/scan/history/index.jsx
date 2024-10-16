import { AdminSectionHero, Container, Col, H3, Text } from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import { Navigate, useParams } from 'react-router-dom';
import AdminPage from '../../../components/admin-page';
import ErrorScreen from '../../../components/error-section';
import ProtectCheck from '../../../components/protect-check-icon';
import ScanFooter from '../../../components/scan-footer';
import useHistoryQuery from '../../../data/scan/use-history-query';
import useAnalyticsTracks from '../../../hooks/use-analytics-tracks';
import usePlan from '../../../hooks/use-plan';
import ScanSectionHeader from '../scan-section-header';
import ScanHistoryDataView from './scan-history-data-view';
import styles from './styles.module.scss';

const ScanHistoryRoute = () => {
	// Track page view.
	useAnalyticsTracks( { pageViewEventName: 'protect_scan_history' } );

	const { hasPlan } = usePlan();
	const { filter = 'all' } = useParams();

	const { data: status } = useHistoryQuery();

	// Threat history is only available for paid plans.
	if ( ! hasPlan ) {
		return <Navigate to="/scan" />;
	}

	return (
		<AdminPage>
			<AdminSectionHero>
				<Container horizontalSpacing={ 3 } horizontalGap={ 4 }>
					<Col>
						<ScanSectionHeader
							subtitle={ status.error ? null : __( 'Threat history', 'jetpack-protect' ) }
							title={
								status.error
									? null
									: sprintf(
											/* translators: %s: Total number of threats  */
											__( '%1$s previously active %2$s', 'jetpack-protect' ),
											status.threats.length,
											status.threats.length === 1 ? 'threat' : 'threats'
									  )
							}
						/>
					</Col>
					{ status.error ? (
						<Col>
							<ErrorScreen
								baseErrorMessage={ __(
									"An error occurred loading your site's threat history.",
									'jetpack-protect'
								) }
								errorMessage={ status.error.message }
								errorCode={ status.error.code }
							/>
						</Col>
					) : (
						<Col>
							{ status.threats.length > 0 ? (
								<div>
									<ScanHistoryDataView />
								</div>
							) : (
								<div className={ styles.empty }>
									<ProtectCheck />
									<H3 weight="bold" mt={ 8 }>
										{ __( "Don't worry about a thing", 'jetpack-protect' ) }
									</H3>
									<Text mb={ 4 }>
										{ sprintf(
											/* translators: %s: Filter type */
											__( 'There are no%sthreats in your scan history.', 'jetpack-protect' ),
											'all' === filter ? ' ' : ` ${ filter } `
										) }
									</Text>
								</div>
							) }
						</Col>
					) }
				</Container>
			</AdminSectionHero>
			<ScanFooter />
		</AdminPage>
	);
};

export default ScanHistoryRoute;
