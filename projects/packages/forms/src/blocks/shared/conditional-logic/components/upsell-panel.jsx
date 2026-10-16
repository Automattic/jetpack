import { BlockControls, InspectorControls } from '@wordpress/block-editor';
import { Modal, PanelBody, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { seen } from '@wordpress/icons';
import { UpsellNudge } from '../../components/upsell-nudge/index.jsx';
import { countRules, normalizeLogic } from '../constants.js';

// Matches the plans that carry `form-conditional-logic` in WPCOM_Features.
const REQUIRED_PLAN = 'business-bundle';

/**
 * The conditional-logic entry points for a site whose plan does not include the feature.
 *
 * Keeps the toolbar button and inspector panel where the builder would be, so the feature is
 * discoverable, but both lead to an upgrade nudge instead of the rules. A field that still
 * carries conditions, say after a downgrade, is flagged: the front end now ignores them.
 *
 * @param {object} props                  - Component props.
 * @param {string} props.blockName        - The field block's name, for the upgrade Tracks event.
 * @param {object} props.conditionalLogic - The field's stored conditional logic, if any.
 * @return {object} The rendered controls.
 */
const ConditionalLogicUpsell = ( { blockName, conditionalLogic } ) => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );
	const openModal = useCallback( () => setIsModalOpen( true ), [] );
	const closeModal = useCallback( () => setIsModalOpen( false ), [] );

	const hasConditions = countRules( normalizeLogic( conditionalLogic ) ) > 0;

	const renderNudge = context => (
		<UpsellNudge
			requiredPlan={ REQUIRED_PLAN }
			block={ blockName }
			context={ context }
			title={ __( 'Upgrade to use conditional logic.', 'jetpack-forms' ) }
			description={
				hasConditions
					? __(
							"This field's conditions are not applied on your current plan, so it always shows. Upgrade to apply them again.",
							'jetpack-forms'
						)
					: __(
							'Show or hide this field based on the answer to another field.',
							'jetpack-forms',
							0
						)
			}
		/>
	);

	return (
		<>
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarGroup>
					<ToolbarButton
						icon={ seen }
						title={
							hasConditions
								? __( 'Conditional logic is not applied on your plan', 'jetpack-forms' )
								: __( 'Add conditional logic', 'jetpack-forms', 0 )
						}
						onClick={ openModal }
						className="jetpack-contact-form__conditional-logic-toolbar"
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody
					title={ __( 'Conditional logic', 'jetpack-forms' ) }
					// Open when there are conditions, so the author sees on selection that they are off.
					initialOpen={ hasConditions }
					className="jetpack-contact-form__panel jetpack-contact-form__conditional-logic"
				>
					{ renderNudge( 'sidebar' ) }
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
					{ renderNudge( 'editor' ) }
				</Modal>
			) }
		</>
	);
};

export default ConditionalLogicUpsell;
