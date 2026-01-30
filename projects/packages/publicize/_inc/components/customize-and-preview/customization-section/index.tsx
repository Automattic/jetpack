import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Connection } from '../../../social-store/types';
import { hasSocialPaidFeatures } from '../../../utils';
import { GlobalCustomizationForm } from '../customization-forms/global';
import { PerNetworkCustomizationForm } from '../customization-forms/per-network';
import styles from './styles.module.scss';

type CustomizationSectionProps = {
	connection?: Connection;
	usingPerNetworkCustomization?: boolean;
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
	return (
		<fieldset
			className={ styles[ 'customization-section' ] }
			data-variant={ usingPerNetworkCustomization ? 'per-network' : 'global' }
		>
			{ hasSocialPaidFeatures() ? (
				<legend>
					{ usingPerNetworkCustomization
						? createInterpolateElement(
								sprintf(
									/* translators: %s is the name of the social media account. */
									__( 'Customizing for %s.', 'jetpack-publicize-pkg' ),
									'<label/>'
								),
								{
									label: <b>{ connection.display_name }</b>,
								}
						  )
						: __( 'Customizing for all the connections.', 'jetpack-publicize-pkg' ) }
				</legend>
			) : null }
			{ usingPerNetworkCustomization ? (
				<PerNetworkCustomizationForm connection={ connection } />
			) : (
				<GlobalCustomizationForm />
			) }
		</fieldset>
	);
}
