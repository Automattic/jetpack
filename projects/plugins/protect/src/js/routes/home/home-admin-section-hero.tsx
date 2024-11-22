import { Text, Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import AdminSectionHero from '../../components/admin-section-hero';
import HomeStatCards from './home-statcards';
import styles from './styles.module.scss';

const HomeAdminSectionHero: React.FC = () => {
	const navigate = useNavigate();
	const handleScanReportClick = useCallback( () => {
		navigate( '/scan' );
	}, [ navigate ] );

	return (
		<AdminSectionHero
			main={
				<>
					<AdminSectionHero.Heading>
						{ __( 'Your site is safe with us', 'jetpack-protect' ) }
					</AdminSectionHero.Heading>
					<AdminSectionHero.Subheading>
						<>
							<Text className={ styles[ 'subheading-text' ] }>
								{ __(
									'We stay ahead of security threats to keep your site protected.',
									'jetpack-protect'
								) }
							</Text>
							<Button
								className={ styles[ 'scan-report' ] }
								variant="primary"
								weight="regular"
								onClick={ handleScanReportClick }
							>
								{ __( 'View scan report', 'jetpack-protect' ) }
							</Button>
						</>
					</AdminSectionHero.Subheading>
				</>
			}
			secondary={ <HomeStatCards /> }
		/>
	);
};

export default HomeAdminSectionHero;
