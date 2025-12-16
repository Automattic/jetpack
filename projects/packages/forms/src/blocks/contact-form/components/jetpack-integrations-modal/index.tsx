/**
 * External dependencies
 */
import { Modal, __experimentalVStack as VStack } from '@wordpress/components'; // eslint-disable-line @wordpress/no-unsafe-wp-apis
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import IntegrationsList from './integrations-list.tsx';
import './style.scss';
/**
 * Types
 */
import type { Integration } from '../../../../types/index.ts';

type BlockAttributes = Record< string, unknown >;

type IntegrationsModalProps = {
	isOpen: boolean;
	onClose: () => void;
	attributes?: BlockAttributes;
	setAttributes?: ( attributes: BlockAttributes ) => void;
	integrationsData: Integration[];
	refreshIntegrations: () => Promise< void >;
	context?: 'block-editor' | 'dashboard';
};

const IntegrationsModal = ( {
	isOpen,
	onClose,
	attributes,
	setAttributes,
	integrationsData,
	refreshIntegrations,
	context = 'block-editor',
}: IntegrationsModalProps ) => {
	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Manage integrations', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			size="large"
			className="jetpack-forms-integrations-modal"
		>
			<VStack spacing="4">
				<IntegrationsList
					integrations={ integrationsData }
					refreshIntegrations={ refreshIntegrations }
					context={ context }
					attributes={ attributes }
					setAttributes={ setAttributes }
				/>
			</VStack>
		</Modal>
	);
};

export default IntegrationsModal;
