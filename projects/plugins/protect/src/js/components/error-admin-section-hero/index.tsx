import { Text, ShieldIcon } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import AdminSectionHero from '../admin-section-hero';
import ScanNavigation from '../scan-navigation';
import styles from './styles.module.scss';

interface ErrorAdminSectionHeroProps {
	baseErrorMessage: string;
	errorMessage?: string;
	errorCode?: string;
}

const ErrorAdminSectionHero: React.FC< ErrorAdminSectionHeroProps > = ( {
	baseErrorMessage,
	errorMessage,
	errorCode,
} ) => {
	let displayErrorMessage = errorMessage ? `${ errorMessage } (${ errorCode }).` : baseErrorMessage;
	displayErrorMessage += ' ' + __( 'Try again in a few minutes.', 'jetpack-protect' );

	return (
		<AdminSectionHero
			main={
				<>
					<AdminSectionHero.Heading>
						<div className={ styles.heading }>
							{ __( 'An error occurred', 'jetpack-protect' ) }
							<ShieldIcon className={ styles.warning } variant="error" height={ 38 } outline />
						</div>
					</AdminSectionHero.Heading>
					<AdminSectionHero.Subheading>
						<Text>{ displayErrorMessage }</Text>
					</AdminSectionHero.Subheading>
					<div className={ styles[ 'scan-navigation' ] }>
						<ScanNavigation />
					</div>
				</>
			}
			preserveSecondaryOnMobile={ false }
		/>
	);
};

export default ErrorAdminSectionHero;
