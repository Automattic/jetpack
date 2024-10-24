import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
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
							<Icon className={ styles.warning } icon={ warning } size={ 54 } />
							{ __( 'An error occurred', 'jetpack-protect' ) }
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
