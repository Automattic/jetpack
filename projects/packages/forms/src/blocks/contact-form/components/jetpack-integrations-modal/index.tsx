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
import type { IntegrationCard } from '../../../../types/index.ts';

type IntegrationsModalProps = {
	isOpen: boolean;
	onClose: () => void;
	integrationCards: IntegrationCard[];
	context?: 'block-editor' | 'dashboard';
};

const IntegrationsModal = ( {
	isOpen,
	onClose,
	integrationCards,
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
				<IntegrationsList integrationCards={ integrationCards } context={ context } />
			</VStack>
		</Modal>
	);
};

export default IntegrationsModal;
