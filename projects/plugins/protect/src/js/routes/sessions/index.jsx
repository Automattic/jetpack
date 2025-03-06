import { AdminSection, Container, Col, SessionsReport } from '@automattic/jetpack-components';
import { useCallback } from 'react';
import AdminPage from '../../components/admin-page';
import useSessionsQuery from '../../data/use-sessions-query';
import HomeAdminSectionHero from './sessions-admin-section-hero';
import styles from './styles.module.scss';
/**
 * Home Page
 *
 * The entry point for the Home page.
 *
 * @return {Component} The root component for the scan page.
 */
const SessionsPage = () => {
	const { data: sessions } = useSessionsQuery();

	const terminateSessions = useCallback( selectedItems => {
		console.log( 'Terminate sessions:', selectedItems );
	}, [] );

	const getProfileLink = useCallback( userId => {
		return `/wp-admin/user-edit.php?user_id=${ userId }`;
	}, [] );

	return (
		<AdminPage>
			<HomeAdminSectionHero />
			<AdminSection>
				<Container
					className={ styles[ 'sessions-report-container' ] }
					horizontalSpacing={ 3 }
					horizontalGap={ 4 }
				>
					<Col>
						<SessionsReport
							data={ sessions }
							getProfileLink={ getProfileLink }
							terminateSessions={ terminateSessions }
						/>
					</Col>
				</Container>
			</AdminSection>
		</AdminPage>
	);
};

export default SessionsPage;
