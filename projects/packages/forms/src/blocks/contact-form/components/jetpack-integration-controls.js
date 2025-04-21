import colorStudio from '@automattic/color-studio';
import { JetpackIcon } from '@automattic/jetpack-components';
import { useAnalytics } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls } from '@wordpress/block-editor';
import { ToolbarGroup, ToolbarButton, Button, PanelBody } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { plugins } from '@wordpress/icons';
import AkismetIcon from '../../../icons/akismet-icon';
import CreativeMailIcon from '../../../icons/creative-mail-icon';
import IntegrationsModal from './jetpack-integrations-modal';
import { useIntegrationsStatus } from './jetpack-integrations-modal/hooks/useIntegrationsStatus';

const COLOR_JETPACK = colorStudio.colors[ 'Jetpack Green 40' ];

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
	const { integrations, refreshIntegrations } = useIntegrationsStatus( attributes );
	const { tracks } = useAnalytics();

	const handleOpenModal = entry_point => {
		tracks.recordEvent( 'jetpack_forms_block_modal_view', { entry_point } );
		setIsModalOpen( true );
	};

	const getIconForIntegration = key => {
		switch ( key ) {
			case 'akismet':
				return <AkismetIcon width={ 32 } height={ 32 } />;
			case 'zero-bs-crm':
				return <JetpackIcon size={ 32 } color={ COLOR_JETPACK } />;
			case 'creative-mail-by-constant-contact':
				return <CreativeMailIcon width={ 32 } height={ 32 } />;
			default:
				return null;
		}
	};

	const enabledIntegrations = Object.entries( integrations ).filter(
		entry => entry[ 1 ].isEnabledForForm
	);

	return (
		<>
			<PanelBody
				title={ __( 'Manage integrations', 'jetpack-forms' ) }
				className="jetpack-contact-form__integrations-panel"
				initialOpen={ false }
			>
				{ enabledIntegrations.length > 0 && (
					<div className="jetpack-forms-enabled-integrations">
						{ enabledIntegrations.map( ( [ key ] ) => (
							<span
								key={ key }
								className="jetpack-forms-integration-icon"
								style={ { paddingRight: '6px' } }
							>
								{ getIconForIntegration( key ) }
							</span>
						) ) }
					</div>
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
			/>
		</>
	);
}
