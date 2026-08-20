import {
	BlockControls,
	InspectorControls,
	store as blockEditorStore,
} from '@wordpress/block-editor';
import { Button, PanelBody, ToolbarButton, ToolbarGroup } from '@wordpress/components';
import { useDispatch } from '@wordpress/data';
import { useCallback, useEffect, useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { seen, unseen } from '@wordpress/icons';
import { Stack, Text } from '@wordpress/ui';
import clsx from 'clsx';
import useFixDuplicateFieldIds from '../../hooks/use-fix-duplicate-field-ids.js';
import useFormFieldIds from '../../hooks/use-form-field-ids.js';
import { getDuplicateFieldIds } from '../../util/duplicate-ids.js';
import {
	countRules,
	getPrimaryGroup,
	normalizeLogic,
	startsHidden,
	withPrimaryGroupRules,
} from '../constants.js';
import useSubjectFields from '../hooks/use-subject-fields.js';
import {
	describeRule,
	getActiveConditions,
	getSummaryHeading,
	getSummaryText,
} from '../util/summary.js';
import ConditionalLogicModal from './rules-modal.jsx';
import '../editor.scss';

/**
 * One condition in the inspector summary, which highlights its subject block on hover.
 *
 * The same outline the block list draws when you hover a row there, and the same store action
 * behind it -- so pointing at "Phone (Dropdown field)" shows you which field that is on the
 * canvas rather than leaving you to find it by name.
 *
 * @param {object} props         - Component props.
 * @param {object} props.rule    - The rule to describe.
 * @param {object} props.subject - The rule's subject field descriptor.
 * @return {object} The rendered line.
 */
const ConditionSummaryLine = ( { rule, subject } ) => {
	const { toggleBlockHighlight } = useDispatch( blockEditorStore );
	const clientId = subject?.clientId;

	const highlight = useCallback(
		on => clientId && toggleBlockHighlight( clientId, on ),
		[ clientId, toggleBlockHighlight ]
	);

	// Clear the highlight if this line goes away while the pointer is still over it --
	// selecting another block unmounts the panel, and mouseleave never arrives.
	useEffect( () => () => highlight( false ), [ highlight ] );

	return (
		<li
			className="jetpack-contact-form__conditional-logic-summary-item"
			onMouseEnter={ () => highlight( true ) }
			onMouseLeave={ () => highlight( false ) }
			onFocus={ () => highlight( true ) }
			onBlur={ () => highlight( false ) }
		>
			<Text variant="body-sm">{ describeRule( rule, subject ) }</Text>
		</li>
	);
};

/**
 * The "Conditional logic" inspector panel, injected into every field block and into
 * container blocks that sit inside a form.
 *
 * Holds a summary and a button; the rules themselves are edited in a dialog, because three
 * controls per condition do not fit the inspector's width without stacking into a card per
 * condition, and a handful of those outgrows the viewport.
 *
 * @param {object}   props               - Component props.
 * @param {string}   props.clientId      - The block's client id.
 * @param {object}   props.attributes    - The block's attributes.
 * @param {Function} props.setAttributes - The block's attribute setter.
 * @param {boolean}  props.isContainer   - Whether the block is a container rather than a field.
 * @return {object} The rendered panel.
 */
const ConditionalLogicPanel = ( { clientId, attributes, setAttributes, isContainer = false } ) => {
	const [ isModalOpen, setIsModalOpen ] = useState( false );

	const logic = useMemo(
		() => normalizeLogic( attributes.conditionalLogic ),
		[ attributes.conditionalLogic ]
	);

	const fields = useSubjectFields( clientId );
	const group = getPrimaryGroup( logic );

	const hasConditions = countRules( logic ) > 0;

	// Taken from the whole form rather than from `fields`, which drops this very block: a
	// subject sharing an id with the field being edited is just as ambiguous, and a list
	// missing one of the two cannot see that. See getDuplicateFieldIds() for why ids collide.
	//
	// Walked while the dialog is open, and while this field carries conditions -- the summary
	// and the toolbar tooltip describe those, and a condition on a duplicated id is no more
	// active there than the builder says it is. A field with neither pays nothing.
	const formFieldIds = useFormFieldIds( clientId, isModalOpen || hasConditions );
	const fixDuplicateFieldIds = useFixDuplicateFieldIds( clientId );
	const duplicateFieldIds = useMemo( () => getDuplicateFieldIds( formFieldIds ), [ formFieldIds ] );

	const updateLogic = useCallback(
		next => setAttributes( { conditionalLogic: next } ),
		[ setAttributes ]
	);

	const handleActionChange = useCallback(
		action => updateLogic( { ...logic, action } ),
		[ logic, updateLogic ]
	);

	const handleMatchChange = useCallback(
		logicalOperator => updateLogic( withPrimaryGroupRules( logic, group.rules, logicalOperator ) ),
		[ group.rules, logic, updateLogic ]
	);

	const handleRulesChange = useCallback(
		rules => updateLogic( withPrimaryGroupRules( logic, rules, group.logicalOperator ) ),
		[ group.logicalOperator, logic, updateLogic ]
	);

	const openModal = useCallback( () => setIsModalOpen( true ), [] );
	const closeModal = useCallback( () => setIsModalOpen( false ), [] );

	// The conditions the field will actually be governed by. Incomplete ones are skipped by
	// both evaluators, so listing them here would describe behaviour the field does not have.
	const activeConditions = getActiveConditions( group, fields, duplicateFieldIds );

	return (
		<>
			{ /* Present on every block that supports conditional logic, the way Required is,
			     rather than appearing once rules exist. A control that comes and goes is
			     harder to find than one that is always there, and this is also how an author
			     reaches the builder from the canvas rather than the sidebar. */ }
			<BlockControls __experimentalShareWithChildBlocks>
				<ToolbarGroup>
					<ToolbarButton
						// The field's state before any condition is met, which is what an
						// author sees on the canvas.
						icon={ startsHidden( logic ) ? unseen : seen }
						title={
							activeConditions.length
								? getSummaryText( logic, group, fields, duplicateFieldIds, isContainer )
								: __( 'Add conditional logic', 'jetpack-forms' )
						}
						onClick={ openModal }
						// Inverted while the field carries conditions, the same treatment
						// Required uses for a field that is required.
						className={ clsx( 'jetpack-contact-form__conditional-logic-toolbar', {
							'is-pressed': hasConditions,
						} ) }
					/>
				</ToolbarGroup>
			</BlockControls>

			<InspectorControls>
				<PanelBody
					title={ __( 'Conditional logic', 'jetpack-forms' ) }
					initialOpen={ false }
					className="jetpack-contact-form__panel jetpack-contact-form__conditional-logic"
				>
					<Stack direction="column" gap="md">
						{ activeConditions.length ? (
							<Stack direction="column" gap="xs">
								<Text
									variant="body-sm"
									className="jetpack-contact-form__conditional-logic-summary-text"
								>
									{ getSummaryHeading( logic, group, isContainer ) }
								</Text>
								{ /* A list rather than stacked paragraphs, so a screen reader
								     announces how many conditions there are before reading them. */ }
								<ul className="jetpack-contact-form__conditional-logic-summary-list">
									{ activeConditions.map( ( { rule, subject }, index ) => (
										<ConditionSummaryLine key={ index } rule={ rule } subject={ subject } />
									) ) }
								</ul>
							</Stack>
						) : (
							<Text
								variant="body-sm"
								className="jetpack-contact-form__conditional-logic-summary-text"
							>
								{ isContainer
									? __(
											'Show or hide this group, and everything in it, based on the answer to a field.',
											'jetpack-forms'
									  )
									: __(
											'Show or hide this field based on the answer to another field.',
											'jetpack-forms',
											0
									  ) }
							</Text>
						) }

						<Button
							variant="secondary"
							onClick={ openModal }
							__next40pxDefaultSize={ true }
							className="jetpack-contact-form__conditional-logic-edit"
						>
							{ /* The trailing 0 is deliberate, and matches how this is handled
							     elsewhere in the package. Two identically shaped __() calls in a
							     ternary get folded by the production minifier into
							     __( cond ? 'a' : 'b', domain ), whose msgid is no longer a
							     literal and so cannot be extracted for translation — which
							     fails the build. The extra argument is ignored at runtime and
							     keeps the two calls apart. */ }
							{ hasConditions
								? __( 'Edit conditions', 'jetpack-forms' )
								: __( 'Add conditions', 'jetpack-forms', 0 ) }
						</Button>
					</Stack>
				</PanelBody>

			</InspectorControls>

			{ /* Outside InspectorControls: that is a slot fill, and a fill renders nothing while
			     the settings sidebar is closed -- which is exactly when the toolbar button is
			     used. Modal portals to the document body, so its position is otherwise
			     immaterial. */ }
			<ConditionalLogicModal
				isOpen={ isModalOpen }
				onClose={ closeModal }
				logic={ logic }
				group={ group }
				fields={ fields }
				duplicateFieldIds={ duplicateFieldIds }
				onFixDuplicateIds={ fixDuplicateFieldIds }
				isContainer={ isContainer }
				onActionChange={ handleActionChange }
				onMatchChange={ handleMatchChange }
				onRulesChange={ handleRulesChange }
			/>
		</>
	);
};

export default ConditionalLogicPanel;
