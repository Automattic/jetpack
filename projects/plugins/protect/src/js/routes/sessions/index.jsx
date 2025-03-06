import { AdminSection, Container, Col, SessionsReport } from '@automattic/jetpack-components';
import { useCallback } from 'react';
import AdminPage from '../../components/admin-page';
import useSessionsMutation from '../../data/sessions/use-sessions-mutation';
import useSessionsQuery from '../../data/sessions/use-sessions-query';
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
	const sessionsMutation = useSessionsMutation();

	const terminateSessions = useCallback(
		selectedItems => {
			sessionsMutation.mutate( selectedItems );
		},
		[ sessionsMutation ]
	);

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
