import { Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Connection } from '../../../social-store/types';
import { hasSocialPaidFeatures } from '../../../utils';
import { UpgradeNoticeCustomisation } from '../../form/upgrade-notice-customisation';
import { ConnectionToggle } from '../connection-toggle';
import { GlobalCustomizationForm } from '../customization-forms/global';
import { PerNetworkCustomizationForm } from '../customization-forms/per-network';
import styles from './styles.module.scss';

type CustomizationSectionProps = {
	connection?: Connection;
	usingPerNetworkCustomization: boolean;
};

/**
 * Customization Section component.
 *
 * @param {CustomizationSectionProps} props - The component props.
 * @return - Customization Section component.
 */
export function CustomizationSection( {
	connection,
	usingPerNetworkCustomization,
}: CustomizationSectionProps ) {
	const hasPaidFeatures = hasSocialPaidFeatures();

	return (
		<section
			aria-label={ __( 'Customization form', 'jetpack-publicize-pkg' ) }
			className={ styles[ 'customization-section' ] }
		>
			{ usingPerNetworkCustomization ? (
				<PerNetworkCustomizationForm connection={ connection } />
			) : (
				<Flex direction="column" gap={ 8 } justify="start">
					{ connection ? <ConnectionToggle connection={ connection } /> : null }
					<GlobalCustomizationForm />
					{ ! hasPaidFeatures && <UpgradeNoticeCustomisation /> }
				</Flex>
			) }
		</section>
	);
}
