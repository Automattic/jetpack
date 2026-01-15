import { __ } from '@wordpress/i18n';
import { Connection } from '../../../../social-store/types';
import { SharePostForm } from '../../../form/share-post-form';
import { ConnectionToggle } from '../../connection-toggle';
import { CustomizationToggle } from '../../customization-toggle';
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
	return (
		<section
			aria-label={ __( 'Customization form', 'jetpack-publicize-pkg' ) }
			className={ styles[ 'customization-section' ] }
		>
			<CustomizationToggle />
			<ConnectionToggle connection={ connection } />
			<SharePostForm
				// TODO Wire up per-network customization state to the form.
				analyticsData={ { location: 'preview-modal' } }
				isInsideNavigatorModal
				disabled={ usingPerNetworkCustomization && ! connection?.enabled }
			/>
		</section>
	);
}
