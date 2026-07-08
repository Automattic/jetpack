import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, Button, PanelBody } from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plugins } from '@wordpress/icons';
import useConfigValue from '../../../hooks/use-config-value.ts';
import { INTEGRATIONS_STORE } from '../../../store/integrations/index.ts';
import ActiveIntegrations from './jetpack-integrations-modal/active-integrations/index.js';
import ConsentToggle from './jetpack-integrations-modal/components/consent-toggle.tsx';
import IntegrationsModal from './jetpack-integrations-modal/index.tsx';

/**
 * Integration controls component containing Panel for settings sidebar and block toolbar.
 *
 * @param {object}   props               - Component props.
 * @param {object}   props.attributes    - Block attributes.
 * @param {Function} props.setAttributes - Function to set block attributes.
 * @return {import('react').ReactNode} The IntegrationControls component.
 */
export default function IntegrationControls( { attributes, setAttributes } ) {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const integrations = useSelect( select => {
		const store = select( INTEGRATIONS_STORE );
		return store.getIntegrations() || [];
	}, [] );
	const isLoading = useSelect( select => select( INTEGRATIONS_STORE ).isIntegrationsLoading(), [] );
	const { refreshIntegrations } = useDispatch( INTEGRATIONS_STORE );
	const { tracks } = useAnalytics();
	const showIntegrationIcons = useConfigValue( 'showIntegrationIcons' );

	// Provide block-editor specific components to the modal
	const components = useMemo( () => ( { ConsentToggle } ), [] );

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
				{ showIntegrationIcons !== false && (
					<ActiveIntegrations
						integrations={ integrations }
						attributes={ attributes }
						isLoading={ isLoading }
					/>
				) }
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
				components={ components }
			/>
		</>
	);
}
