import { Disabled, Flex } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Connection } from '../../../../social-store/types';
import { SharePostForm } from '../../../form/share-post-form';
import { ConnectionToggle } from '../../connection-toggle';
import styles from './styles.module.scss';

type CustomizationSectionProps = {
	connection?: Connection;
};

/**
 * Global Customization Form component.
 *
 * @return - Global Customization Form component.
 */
function GlobalCustomization() {
	return (
		<div>
			<SharePostForm analyticsData={ { location: 'preview-modal' } } isInsideNavigatorModal />
		</div>
	);
}

/**
 * Per-Network Customization Form component.
 *
 * @param {CustomizationSectionProps} props - The component props.
 *
 * @return - Per-Network Customization Form component.
 */
function PerNetworkCustomization( { connection }: CustomizationSectionProps ) {
	return (
		<Flex direction="column" gap={ 8 }>
			<ConnectionToggle connection={ connection } />
			<Disabled isDisabled={ ! connection.enabled }>
				<SharePostForm
					// TODO Wire up per-network customization state to the form.
					analyticsData={ { location: 'preview-modal' } }
					isInsideNavigatorModal
				/>
			</Disabled>
		</Flex>
	);
}

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
				<PerNetworkCustomization connection={ connection } />
			) : (
				<GlobalCustomization />
			) }
		</section>
	);
}
