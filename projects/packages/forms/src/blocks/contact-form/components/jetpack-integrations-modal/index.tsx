/**
 * External dependencies
 */
import { Modal, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import IntegrationsList from './integrations-list';
import './style.scss';

const IntegrationsModal = ( {
	isOpen,
	onClose,
	attributes,
	setAttributes,
	integrationsData,
	refreshIntegrations,
} ) => {
	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Manage integrations', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			style={ { width: '700px' } }
			className="jetpack-forms-integrations-modal"
		>
			<VStack spacing="4">
				<IntegrationsList
					integrations={ integrationsData }
					refreshIntegrations={ refreshIntegrations }
					context="block-editor"
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			</VStack>
		</Modal>
	);
};

export default IntegrationsModal;
