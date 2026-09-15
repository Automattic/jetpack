import { Modal, Notice, SelectControl } from '@wordpress/components';
import { __, _n, sprintf } from '@wordpress/i18n';
import { Stack, Text } from '@wordpress/ui';
import FieldValueControl from '../controls/field-value/edit.jsx';

// Shared empty set, so a caller that omits the prop does not hand every render a new one.
const NO_DUPLICATE_IDS = new Set();

const ACTION_OPTIONS = [
	{ value: 'show', label: __( 'Show this field', 'jetpack-forms' ) },
	{ value: 'hide', label: __( 'Hide this field', 'jetpack-forms' ) },
];

const MATCH_OPTIONS = [
	{ value: 'any', label: __( 'if any', 'jetpack-forms' ) },
	{ value: 'all', label: __( 'if all', 'jetpack-forms' ) },
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
 * @param {object}   props                   - Component props.
 * @param {boolean}  props.isOpen            - Whether the dialog is open.
 * @param {Function} props.onClose           - Called when the dialog is dismissed.
 * @param {object}   props.logic             - The normalized conditional-logic attribute.
 * @param {object}   props.group             - The group being edited.
 * @param {Array}    props.fields            - Fields available as rule subjects.
 * @param {Set}      props.duplicateFieldIds - Ids claimed by more than one field in the form.
 * @param {Function} props.onFixDuplicateIds - Called with ids to make unique.
 * @param {Function} props.onActionChange    - Called with the next show/hide action.
 * @param {Function} props.onMatchChange     - Called with the next any/all operator.
 * @param {Function} props.onRulesChange     - Called with the group's next rules.
 * @return {object|null} The dialog, or null when closed.
 */
const ConditionalLogicModal = ( {
	isOpen,
	onClose,
	logic,
	group,
	fields,
	duplicateFieldIds = NO_DUPLICATE_IDS,
	onFixDuplicateIds,
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
			<Stack direction="column" gap="md">
				{ /* The two selectors carry the whole sentence between them, so they sit side
				     by side and the clause that finishes it goes underneath. Reading the three
				     lines top to bottom is how an author checks the rule says what they meant. */ }
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
					<SelectControl
						label={ __( 'When', 'jetpack-forms' ) }
						hideLabelFromVision
						value={ group.logicalOperator }
						options={ MATCH_OPTIONS }
						onChange={ onMatchChange }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
				</Stack>

				{ /* States the default, which the selectors above do not: a field with a show
				     rule is hidden until something reveals it, and one with a hide rule is
				     visible until something hides it. Without this an author has to infer
				     what happens before any condition is met. */ }
				<Text variant="body-sm" className="jetpack-contact-form__conditional-logic-hint">
					{ 'hide' === logic.action
						? __(
								'This field is visible by default, until the following conditions are met:',
								'jetpack-forms'
						  )
						: __(
								'This field is hidden by default, until the following conditions are met:',
								'jetpack-forms',
								0
						  ) }
				</Text>

				{ /* Named rather than merely counted, because fixing this means finding the
				     fields in question, and the Name/ID is what the author will see on each
				     one. Not dismissible: the affected fields stay unavailable until it is
				     acted on, so hiding the explanation would leave them looking broken. */ }
				{ duplicateFieldIds.size > 0 && (
					<Notice
						status="warning"
						isDismissible={ false }
						actions={ [
							{
								label: _n(
									'Make it unique',
									'Make them unique',
									duplicateFieldIds.size,
									'jetpack-forms'
								),
								onClick: () => onFixDuplicateIds( [ ...duplicateFieldIds ] ),
								variant: 'link',
							},
						] }
					>
						{ sprintf(
							/* translators: %s: comma-separated list of field names/IDs used by more than one field. */
							_n(
								"Some fields are unavailable because their Name/ID isn't unique: %s. Give each field its own under Advanced → Name/ID.",
								"Some fields are unavailable because their Name/IDs aren't unique: %s. Give each field its own under Advanced → Name/ID.",
								duplicateFieldIds.size,
								'jetpack-forms'
							),
							[ ...duplicateFieldIds ].join( ', ' )
						) }
					</Notice>
				) }

				<FieldValueControl
					rules={ group.rules }
					fields={ fields }
					duplicateFieldIds={ duplicateFieldIds }
					onFixDuplicateIds={ onFixDuplicateIds }
					onChange={ onRulesChange }
				/>
			</Stack>
		</Modal>
	);
};

export default ConditionalLogicModal;
