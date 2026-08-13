import { Modal, SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Stack } from '@wordpress/ui';
import FieldValueControl from '../controls/field-value/edit.jsx';

const ACTION_OPTIONS = [
	{ value: 'show', label: __( 'Show', 'jetpack-forms' ) },
	{ value: 'hide', label: __( 'Hide', 'jetpack-forms' ) },
];

const MATCH_OPTIONS = [
	{ value: 'any', label: __( 'any', 'jetpack-forms' ) },
	{ value: 'all', label: __( 'all', 'jetpack-forms' ) },
];

/**
 * The rule builder, in a dialog rather than the inspector.
 *
 * The inspector column is about 280px wide, and a condition needs three controls. Stacked in
 * that column each condition became a card tall enough that three or four of them outgrew the
 * viewport. Here the three controls sit on one row, so a long list reads as aligned columns.
 *
 * Edits commit straight to the block attribute, like every other control in the inspector --
 * there is no draft state and no Save button. Undo is the editor's own. That matches the
 * integrations modal in this package and keeps one source of truth for the rules.
 *
 * @param {object}   props                - Component props.
 * @param {boolean}  props.isOpen         - Whether the dialog is open.
 * @param {Function} props.onClose        - Called when the dialog is dismissed.
 * @param {object}   props.logic          - The normalized conditional-logic attribute.
 * @param {object}   props.group          - The group being edited.
 * @param {Array}    props.fields         - Fields available as rule subjects.
 * @param {string}   props.ownFieldId     - Id of the field the panel belongs to.
 * @param {Function} props.onActionChange - Called with the next show/hide action.
 * @param {Function} props.onMatchChange  - Called with the next any/all operator.
 * @param {Function} props.onRulesChange  - Called with the group's next rules.
 * @return {object|null} The dialog, or null when closed.
 */
const ConditionalLogicModal = ( {
	isOpen,
	onClose,
	logic,
	group,
	fields,
	ownFieldId,
	onActionChange,
	onMatchChange,
	onRulesChange,
} ) => {
	if ( ! isOpen ) {
		return null;
	}

	return (
		<Modal
			title={ __( 'Conditional logic', 'jetpack-forms' ) }
			onRequestClose={ onClose }
			size="large"
			className="jetpack-contact-form__conditional-logic-modal"
		>
			<Stack direction="column" gap="lg">
				{ /* Both selectors sit inside the sentence rather than above it as labelled
				     fields: the action and the match mode are what the sentence says, and
				     reading it back is how an author checks the rule is what they meant. */ }
				<Stack
					direction="row"
					align="center"
					gap="sm"
					className="jetpack-contact-form__conditional-logic-sentence"
				>
					<SelectControl
						label={ __( 'Action', 'jetpack-forms' ) }
						hideLabelFromVision
						value={ logic.action }
						options={ ACTION_OPTIONS }
						onChange={ onActionChange }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
					<span>{ __( 'this field when', 'jetpack-forms' ) }</span>
					<SelectControl
						label={ __( 'Match', 'jetpack-forms' ) }
						hideLabelFromVision
						value={ group.logicalOperator }
						options={ MATCH_OPTIONS }
						onChange={ onMatchChange }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
					<span>{ __( 'of these match:', 'jetpack-forms' ) }</span>
				</Stack>

				<FieldValueControl
					rules={ group.rules }
					fields={ fields }
					ownFieldId={ ownFieldId }
					onChange={ onRulesChange }
				/>
			</Stack>
		</Modal>
	);
};

export default ConditionalLogicModal;
