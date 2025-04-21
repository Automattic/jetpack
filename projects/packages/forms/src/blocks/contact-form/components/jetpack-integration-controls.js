import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, Button, PanelBody } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plugins } from '@wordpress/icons';
import IntegrationsModal from './jetpack-integrations-modal';
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
	const { integrations, refreshIntegrations } = useIntegrationsStatus();

	return (
		<>
			<PanelBody
				title={ __( 'Manage integrations', 'jetpack-forms' ) }
				className="jetpack-contact-form__integrations-panel"
				initialOpen={ false }
			>
				<Button
					variant="secondary"
					onClick={ () => setIsModalOpen( true ) }
					__next40pxDefaultSize={ true }
				>
					{ __( 'Manage integrations', 'jetpack-forms' ) }
				</Button>
			</PanelBody>

			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={ plugins }
						onClick={ () => setIsModalOpen( true ) }
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
