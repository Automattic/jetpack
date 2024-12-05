import { AdminSection, Container, Col, ScanReport } from '@automattic/jetpack-components';
import AdminPage from '../../components/admin-page';
import useScanStatusQuery from '../../data/scan/use-scan-status-query';
import HomeAdminSectionHero from './home-admin-section-hero';

/**
 * Home Page
 *
 * The entry point for the Home page.
 *
 * @return {Component} The root component for the scan page.
 */
const HomePage = () => {
	const { data: status } = useScanStatusQuery( { usePolling: true } );
	const { core, plugins, themes, files = [] } = status;

	const data = [
		core,
		...plugins,
		...themes,
		{ checked: true, threats: files, type: 'files' },
	].map( ( item, index ) => {
		return { id: index + 1, ...item };
	} );

	return (
		<AdminPage>
			<HomeAdminSectionHero />
			<AdminSection>
				<Container horizontalSpacing={ 7 } horizontalGap={ 4 }>
					<Col>
						<ScanReport data={ data } />
					</Col>
				</Container>
			</AdminSection>
		</AdminPage>
	);
};

export default HomePage;
