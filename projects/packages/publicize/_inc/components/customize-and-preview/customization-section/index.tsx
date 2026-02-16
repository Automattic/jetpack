import { VisuallyHidden } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Connection } from '../../../social-store/types';
import { hasSocialPaidFeatures } from '../../../utils';
import { MediaValidationNotices } from '../../form/media-validation-notices';
import { GlobalCustomizationForm } from '../customization-forms/global';
import { PerNetworkCustomizationForm } from '../customization-forms/per-network';
import { PerConnectionNotice } from './per-connection-notice';
import styles from './styles.module.scss';

type CustomizationSectionProps = {
	connection?: Connection;
	usingPerNetworkCustomization?: boolean;
};

/**
 * Legend component.
 *
 * @param { CustomizationSectionProps } props - The component props.
 *
 * @return - Legend component or null.
 */
function Legend( { connection, usingPerNetworkCustomization }: CustomizationSectionProps ) {
	if ( ! hasSocialPaidFeatures() ) {
		return null;
	}

	if ( ! usingPerNetworkCustomization ) {
		return <legend>{ __( 'Customizing for all connections.', 'jetpack-publicize-pkg' ) }</legend>;
	}

	if ( ! connection ) {
		return null;
	}

	const { display_name } = connection;

	const label = (
		// Since the connection name can be truncated in the UI, we use a visually hidden element to
		// ensure screen readers can read the full name.
		<>
			<VisuallyHidden>{ display_name }</VisuallyHidden>
			<b aria-hidden="true" title={ display_name }>
				{ display_name }
			</b>
		</>
	);

	return (
		<legend>
			{ createInterpolateElement(
				sprintf(
					/* translators: %s is the name of the social media account. */
					__( 'Customizing for %s.', 'jetpack-publicize-pkg' ),
					'<accountName/>'
				),
				{ accountName: label }
			) }
		</legend>
	);
}

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
			<Legend
				connection={ connection }
				usingPerNetworkCustomization={ usingPerNetworkCustomization }
			/>

			{ usingPerNetworkCustomization ? (
				<>
					<PerNetworkCustomizationForm connection={ connection } />
					<PerConnectionNotice connection={ connection } />
				</>
			) : (
				<>
					<GlobalCustomizationForm />
					<MediaValidationNotices />
				</>
			) }
		</fieldset>
	);
}
