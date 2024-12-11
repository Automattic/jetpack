import { Text, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSectionHero from '../../components/admin-section-hero';
import usePlan from '../../hooks/use-plan';
import HomeStatCards from './home-statcards';
import styles from './styles.module.scss';

const HomeAdminSectionHero: React.FC = () => {
	const { hasPlan } = usePlan();
	const navigate = useNavigate();
	const handleScanReportClick = useCallback( () => {
		navigate( '/scan' );
	}, [ navigate ] );

	return (
		<AdminSectionHero>
			<AdminSectionHero.Main>
				<>
					<AdminSectionHero.Heading>
						{ __( 'Your site is safe with us', 'jetpack-protect' ) }
					</AdminSectionHero.Heading>
					<Text>
						{ hasPlan
							? __(
									'We stay ahead of security threats to keep your site protected.',
									'jetpack-protect'
							  )
							: __(
									'We stay ahead of security vulnerabilities to keep your site protected.',
									'jetpack-protect',
									/* dummy arg to avoid bad minification */ 0
							  ) }
					</Text>
					<Button
						className={ styles[ 'view-scan-report' ] }
						variant="primary"
						weight="regular"
						onClick={ handleScanReportClick }
					>
						{ __( 'View scan report', 'jetpack-protect' ) }
					</Button>
				</>
			</AdminSectionHero.Main>
			<AdminSectionHero.Aside>{ <HomeStatCards /> }</AdminSectionHero.Aside>
		</AdminSectionHero>
	);
};

export default HomeAdminSectionHero;
