import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, Button, PanelBody } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plugins } from '@wordpress/icons';
import useConfigValue from '../../../hooks/use-config-value';
import { INTEGRATIONS_STORE } from '../../../store/integrations';
import IntegrationsModal from './jetpack-integrations-modal';
import ActiveIntegrations from './jetpack-integrations-modal/active-integrations';

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
	const isIntegrationsEnabled = useConfigValue( 'isIntegrationsEnabled' );
	const { integrations, isLoading } = useSelect(
		select => {
			if ( isIntegrationsEnabled === false ) {
				return { integrations: [], isLoading: false };
			}
			const store = select( INTEGRATIONS_STORE );
			return {
				integrations: store.getIntegrations() || [],
				isLoading: store.isIntegrationsLoading(),
			};
		},
		[ isIntegrationsEnabled ]
	);
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE );
	const { tracks } = useAnalytics();

	const handleOpenModal = entry_point => {
		tracks.recordEvent( 'jetpack_forms_block_modal_view', { entry_point } );
		setIsModalOpen( true );
	};

	return (
		<>
			<PanelBody
				title={ __( 'Integrations', 'jetpack-forms' ) }
				className="jetpack-contact-form__panel jetpack-contact-form__integrations-panel"
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
