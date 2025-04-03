import apiFetch from '@wordpress/api-fetch';
import { Button } from '@wordpress/components';
import { useState, useCallback, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { createNotice } from '@wordpress/notices';
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
	const [ integrationsData, setIntegrationsData ] = useState( {} );

	const refreshIntegrations = useCallback( async () => {
		try {
			const response = await apiFetch( {
				path: '/wp/v2/feedback/integrations',
			} );
			setIntegrationsData( response );
		} catch {
			createNotice(
				'error',
				__( 'Failed to fetch integrations. Please try again later.', 'jetpack-forms' )
			);
		}
	}, [] );

	// Fetch integrations data when the panel is mounted
	useEffect( () => {
		refreshIntegrations();
	}, [ refreshIntegrations ] );

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
				integrationsData={ integrationsData }
				refreshIntegrations={ refreshIntegrations }
			/>
		</div>
	);
}
