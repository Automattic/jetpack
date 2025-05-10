import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, Button, PanelBody } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plugins } from '@wordpress/icons';
import IntegrationsModal from './jetpack-integrations-modal';
import ActiveIntegrations from './jetpack-integrations-modal/active-integrations';
import { useIntegrationsStatus } from './jetpack-integrations-modal/hooks/useIntegrationsStatus';

/**
 * Integration controls component containing Panel for settings sidebar and block toolbar.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @return {object} The IntegrationControls component.
 */
export default function IntegrationControls( { attributes, setAttributes } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const { integrations, refreshIntegrations, isLoading } = useIntegrationsStatus();
	const { tracks } = useAnalytics();

	const handleOpenModal = entry_point => {
		tracks.recordEvent( 'jetpack_forms_block_modal_view', { entry_point } );
		setIsModalOpen( true );
	};

	return (
		<>
			<PanelBody
				title={ __( 'Integrations', 'jetpack-forms' ) }
				className="jetpack-contact-form__integrations-panel"
				initialOpen={ false }
			>
				<ActiveIntegrations
					integrations={ integrations }
					attributes={ attributes }
					isLoading={ isLoading }
				/>
				<Button
					variant="secondary"
					onClick={ () => handleOpenModal( 'block-sidebar' ) }
					__next40pxDefaultSize={ true }
				>
					{ __( 'Manage integrations', 'jetpack-forms' ) }
				</Button>
			</PanelBody>

			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={ plugins }
						onClick={ () => handleOpenModal( 'block-toolbar' ) }
						style={ { paddingLeft: 0 } }
					>
						{ __( 'Integrations', 'jetpack-forms' ) }
					</ToolbarButton>
				</ToolbarGroup>
			</BlockControls>

			<IntegrationsModal
				isOpen={ isModalOpen }
				onClose={ () => setIsModalOpen( false ) }
				attributes={ attributes }
				setAttributes={ setAttributes }
				integrationsData={ integrations }
				refreshIntegrations={ refreshIntegrations }
			/>
		</>
	);
}
