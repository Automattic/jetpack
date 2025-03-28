import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import IntegrationsModal from './jetpack-integrations-modal';

/**
 * Integration Panel component.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @return {object} The IntegrationPanel component.
 */
export default function IntegrationPanel( { attributes, setAttributes } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	return (
		<div className="jetpack-forms-integration-panel">
			<Button
				variant="secondary"
				onClick={ () => setIsModalOpen( true ) }
				__next40pxDefaultSize={ true }
			>
				{ __( 'Manage Integrations', 'jetpack-forms' ) }
			</Button>
			<IntegrationsModal
				isOpen={ isModalOpen }
				onClose={ () => setIsModalOpen( false ) }
				attributes={ attributes }
				setAttributes={ setAttributes }
			/>
		</div>
	);
}
