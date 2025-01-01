import { AdminSection, Container, Col, ScanReport } from '@automattic/jetpack-components';
import { useMemo } from 'react';
import AdminPage from '../../components/admin-page';
import { SCAN_IN_PROGRESS_STATUSES } from '../../constants';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import HomeAdminSectionHero from './home-admin-section-hero';
import styles from './styles.module.scss';

/**
 * Home Page
 *
 * The entry point for the Home page.
 *
 * @return {Component} The root component for the scan page.
 */
const HomePage = () => {
	const { data: status } = useScanStatusQuery( { usePolling: true } );

	const data = useMemo(
		() => [
			...( Object.keys( status.core ).length ? [ status.core ] : [] ),
			...status.plugins,
			...status.themes,
			...( status.dataSource === 'scan_api'
				? [
						{
							checked: !! status.lastChecked,
							threats: status.files,
							type: 'files',
						},
				  ]
				: [] ),
		],
		[ status ]
	);

	const showReport =
		!! status.lastChecked || SCAN_IN_PROGRESS_STATUSES.indexOf( status?.status ) >= 0;

	return (
		<AdminPage>
			<HomeAdminSectionHero />
			{ showReport && (
				<AdminSection>
					<Container
						className={ styles[ 'scan-report-container' ] }
						horizontalSpacing={ 5 }
						horizontalGap={ 4 }
					>
						<Col>
							<ScanReport dataSource={ status.dataSource } data={ data } />
						</Col>
					</Container>
				</AdminSection>
			) }
		</AdminPage>
	);
};

export default HomePage;
