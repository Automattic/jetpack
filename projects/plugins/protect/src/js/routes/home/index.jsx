import { AdminSection, Container, Col } from '@automattic/jetpack-components';
import AdminPage from '../../components/admin-page';
import HomeAdminSectionHero from './home-admin-section-hero';

/**
 * Home Page
 *
 * The entry point for the Home page.
 *
 * @return {Component} The root component for the scan page.
 */
const HomePage = () => {
	return (
		<AdminPage>
			<HomeAdminSectionHero />
			<AdminSection>
				<Container horizontalSpacing={ 7 } horizontalGap={ 4 }>
					<Col>{ /* TODO: Add ScanReport component here */ }</Col>
				</Container>
			</AdminSection>
		</AdminPage>
	);
};

export default HomePage;
