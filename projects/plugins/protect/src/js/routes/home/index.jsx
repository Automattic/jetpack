import { AdminSection, Container, Col, ScanReport } from '@automattic/jetpack-components';
import AdminPage from '../../components/admin-page';
import useProtectData from '../../hooks/use-protect-data';
import HomeAdminSectionHero from './home-admin-section-hero';

/**
 * Home Page
 *
 * The entry point for the Home page.
 *
 * @return {Component} The root component for the scan page.
 */
const HomePage = () => {
	const {
		results: { core, plugins, themes, files },
	} = useProtectData();

	const data = [
		...core,
		...plugins,
		...themes,
		{ checked: true, threats: files, type: 'files' },
	].map( ( item, index ) => {
		return { ...item, id: index + 1 };
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
