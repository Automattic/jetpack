import { __ } from '@wordpress/i18n';
import { Connection } from '../../../../social-store/types';
import { GlobalCustomizationForm } from '../../customization-forms/global';
import { PerNetworkCustomizationForm } from '../../customization-forms/per-network';
import styles from './styles.module.scss';

type CustomizationSectionProps = {
	connection?: Connection;
};

/**
 * Customization Section component.
 *
 * @param {CustomizationSectionProps} props - The component props.
 * @return - Customization Section component.
 */
export function CustomizationSection( { connection }: CustomizationSectionProps ) {
	return (
		<section
			aria-label={ __( 'Customization form', 'jetpack-publicize-pkg' ) }
			className={ styles[ 'customization-section' ] }
		>
			{ connection ? (
				<PerNetworkCustomizationForm connection={ connection } />
			) : (
				<GlobalCustomizationForm />
			) }
		</section>
	);
}
