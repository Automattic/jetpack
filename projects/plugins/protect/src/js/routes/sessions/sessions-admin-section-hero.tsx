import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import AdminSectionHero from '../../components/admin-section-hero';
import SessionsStatCards from './sessions-statcards';

const SessionsAdminSectionHero: React.FC = () => {
	return (
		<AdminSectionHero>
			<AdminSectionHero.Main>
				<>
					<AdminSectionHero.Heading>
						{ __( 'Manage active sessions', 'jetpack-protect' ) }
					</AdminSectionHero.Heading>
					<Text>
						{ __(
							'Monitor login activity and protect your site from unauthorized access.',
							'jetpack-protect'
						) }
					</Text>
				</>
			</AdminSectionHero.Main>
			<AdminSectionHero.Aside>
				<SessionsStatCards />
			</AdminSectionHero.Aside>
		</AdminSectionHero>
	);
};

export default SessionsAdminSectionHero;
