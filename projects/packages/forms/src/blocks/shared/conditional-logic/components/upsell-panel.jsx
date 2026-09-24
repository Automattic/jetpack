import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { Modal, PanelBody, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { UpsellNudge } from '../../components/upsell-nudge/index.jsx';

// Matches the plans that carry `form-conditional-logic` in WPCOM_Features.
const REQUIRED_PLAN = 'business-bundle';

/**
 * The conditional-logic entry points for a site whose plan does not include the feature.
 *
 * Keeps the toolbar button and inspector panel where the builder would be, so the feature is
 * discoverable, but both lead to an upgrade nudge instead of the rules.
 *
 * @param {object} props           - Component props.
 * @param {string} props.blockName - The field block's name, for the upgrade Tracks event.
 * @return {object} The rendered controls.
 */
const ConditionalLogicUpsell = ( { blockName } ) => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const openModal = useCallback( () => setIsModalOpen( true ), [] );
	const closeModal = useCallback( () => setIsModalOpen( false ), [] );

	const nudge = (
		<UpsellNudge
			requiredPlan={ REQUIRED_PLAN }
			block={ blockName }
			title={ __( 'Upgrade to use conditional logic.', 'jetpack-forms' ) }
			description={ __(
				'Show or hide this field based on the answer to another field.',
				'jetpack-forms'
			) }
		/>
	);

	return (
		<>
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarGroup>
					<ToolbarButton
						icon={ seen }
						title={ __( 'Add conditional logic', 'jetpack-forms' ) }
						onClick={ openModal }
						className="jetpack-contact-form__conditional-logic-toolbar"
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody
					title={ __( 'Conditional logic', 'jetpack-forms' ) }
					initialOpen={ false }
					className="jetpack-contact-form__panel jetpack-contact-form__conditional-logic"
				>
					{ nudge }
				</PanelBody>
			</InspectorControls>

			{ /* Outside InspectorControls for the same reason as the builder's modal: a fill
			     renders nothing while the sidebar is closed. */ }
			{ isModalOpen && (
				<Modal
					title={ __( 'Conditional logic', 'jetpack-forms' ) }
					onRequestClose={ closeModal }
					size="small"
				>
					{ nudge }
				</Modal>
			) }
		</>
	);
};

export default ConditionalLogicUpsell;
