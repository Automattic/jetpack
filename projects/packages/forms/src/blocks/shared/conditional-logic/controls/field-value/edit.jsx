import { Icon, Notice, SelectControl, TextControl } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { check, plus, trash } from '@wordpress/icons';
import { Button, IconButton, Stack, Text } from '@wordpress/ui';
import { RULE_TYPE_FIELD_VALUE } from '../../constants.js';
import { useEnsureFieldId } from '../../hooks/use-subject-fields.js';
import {
	OPERATORS,
	getOperatorsForTypeKey,
	getValueInputForTypeKey,
	operatorNeedsValue,
} from '../../util/field-types.ts';
import { getOperatorLabel } from '../../util/operator-labels.ts';
import { areRulesComplete, isRuleComplete, isRuleStarted } from '../../util/rule-validity.js';

/**
 * HTML input type for each value-input kind that renders a text box.
 */
const INPUT_TYPE_BY_KIND = {
	number: 'number',
	date: 'date',
	time: 'time',
};

/**
 * Dropdown value for a subject field.
 *
 * Fields that have no id yet are keyed by client id, so they are still selectable; picking
 * one assigns a real field id.
 *
 * @param {object} field - Subject field descriptor.
 * @return {string} A value unique within the dropdown.
 */
const selectionValue = field => field.id || `clientId:${ field.clientId }`;

/**
 * Dropdown text for a subject field.
 *
 * The field type is appended so an author can tell entries apart when the labels are
 * unhelpful — two fields both reading "Untitled field", or several sharing a label.
 *
 * @param {object} field - Subject field descriptor.
 * @return {string} Text to show in the dropdown.
 */
const optionLabel = field =>
	field.typeLabel
		? sprintf(
				/* translators: 1: form field label, 2: the field's type, e.g. "Dropdown field" */
				__( '%1$s (%2$s)', 'jetpack-forms' ),
				field.label,
				field.typeLabel
		  )
		: field.label;

/**
 * Default operator for a newly added rule, chosen from the subject field's own operator set
 * so the rule is valid the moment it appears.
 *
 * @param {string} typeKey - The subject field's comparison behavior.
 * @return {string} Operator wire string.
 */
const defaultOperatorFor = typeKey => {
	const operators = getOperatorsForTypeKey( typeKey );
	return operators.length ? operators[ 0 ] : OPERATORS.IS;
};

/**
 * The value control for a rule, chosen by the subject field's type.
 *
 * @param {object}   props          - Component props.
 * @param {object}   props.rule     - The rule being edited.
 * @param {object}   props.subject  - The subject field descriptor.
 * @param {Function} props.onChange - Called with the new value.
 * @return {object|null} The rendered control, or null when the operator takes no value.
 */
const RuleValueControl = ( { rule, subject, onChange } ) => {
	if ( ! operatorNeedsValue( rule.operator ) ) {
		return null;
	}

	const kind = getValueInputForTypeKey( subject?.typeKey || 'string' );

	if ( 'none' === kind ) {
		return null;
	}

	const value = rule.value ?? '';
	const label = __( 'Value', 'jetpack-forms' );

	if ( 'options' === kind ) {
		const options = subject?.options || [];

		if ( ! options.length ) {
			return (
				<Notice status="warning" isDismissible={ false }>
					{ __( 'This field has no options yet. Add one to compare against it.', 'jetpack-forms' ) }
				</Notice>
			);
		}

		return (
			<SelectControl
				label={ label }
				hideLabelFromVision
				value={ value }
				options={ [ { value: '', label: __( 'Select an option…', 'jetpack-forms' ) }, ...options ] }
				onChange={ onChange }
				__nextHasNoMarginBottom={ true }
				__next40pxDefaultSize={ true }
			/>
		);
	}

	const type = INPUT_TYPE_BY_KIND[ kind ] || 'text';

	return (
		<TextControl
			label={ label }
			hideLabelFromVision
			placeholder={ __( 'Value', 'jetpack-forms' ) }
			type={ type }
			value={ value }
			onChange={ onChange }
			__nextHasNoMarginBottom={ true }
			__next40pxDefaultSize={ true }
		/>
	);
};

/**
 * A single condition row: subject field, operator, and value.
 *
 * @param {object}   props            - Component props.
 * @param {object}   props.rule       - The rule being edited.
 * @param {number}   props.index      - Zero-based rule index.
 * @param {Array}    props.fields     - Available subject fields.
 * @param {string}   props.ownFieldId - Id of the field the panel belongs to, which is absent
 *                                    from `fields` and so invisible to the uniqueness check.
 * @param {Function} props.onChange   - Called with (index, patch).
 * @param {Function} props.onRemove   - Called with (index).
 * @return {object} The rendered rule row.
 */
const RuleRow = ( { rule, index, fields, ownFieldId, onChange, onRemove } ) => {
	const ensureFieldId = useEnsureFieldId();

	const subject = fields.find( field => field.id && field.id === rule.field );
	const missingSubject = rule.field && ! subject;

	const handleFieldChange = useCallback(
		selection => {
			const nextSubject = fields.find( field => selectionValue( field ) === selection );

			if ( ! nextSubject ) {
				onChange( index, { field: '', operator: OPERATORS.IS, value: '' } );
				return;
			}

			// A rule has to name the field id the renderer will use. Most fields have none:
			// the renderer derives one from the label at output time, which would also mean a
			// rule silently stopped matching as soon as someone edited that label. Assign a
			// stable id instead — the same thing the field's own Name/ID control writes.
			// useSubjectFields() deliberately excludes the field that owns the panel, so its
			// id is the one this list cannot see. Without it, an unnamed "Email" subject
			// picked from a panel on a field already using the id `email` gets handed `email`
			// unchanged, and PHP's duplicate guard then renames whichever parses second. The
			// saved rule keeps pointing at `email` and starts evaluating the wrong field --
			// or the owner is the one renamed and its response key changes underneath a form
			// that may already have responses.
			const usedIds = [ ...fields.map( field => field.id ), ownFieldId ].filter( Boolean );
			const fieldId = ensureFieldId( nextSubject, usedIds );

			const operators = getOperatorsForTypeKey( nextSubject.typeKey );
			// Switching subject can invalidate the operator (a number field has no "contains"),
			// so fall back to the new type's first operator rather than leaving a dead rule.
			const operator = operators.includes( rule.operator )
				? rule.operator
				: defaultOperatorFor( nextSubject.typeKey );

			onChange( index, { field: fieldId, operator, value: '' } );
		},
		[ ensureFieldId, fields, ownFieldId, index, onChange, rule.operator ]
	);

	const handleOperatorChange = useCallback(
		operator => onChange( index, { operator } ),
		[ index, onChange ]
	);

	const handleValueChange = useCallback(
		value => onChange( index, { value } ),
		[ index, onChange ]
	);

	const handleRemove = useCallback( () => onRemove( index ), [ index, onRemove ] );

	const operators = getOperatorsForTypeKey( subject?.typeKey || 'string' );
	const isComplete = isRuleComplete( rule, subject );
	// Only complain once the author has actually started this row: an untouched one is empty,
	// not wrong, and the builder opens with one waiting.
	const isUnfinished = isRuleStarted( rule ) && ! isComplete && ! missingSubject;

	// Group by step so an author can see that a later-step field is not yet answered when
	// this one is evaluated.
	const grouped = fields.reduce( ( groups, field ) => {
		const key = field.step
			? sprintf(
					/* translators: %d: step number in a multi-step form */
					__( 'Step %d', 'jetpack-forms' ),
					field.step
			  )
			: __( 'Fields', 'jetpack-forms' );
		groups[ key ] = groups[ key ] || [];
		groups[ key ].push( field );
		return groups;
	}, {} );

	return (
		<Stack direction="column" gap="xs" className="jetpack-contact-form__conditional-logic-rule">
			{ missingSubject && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'The referenced field no longer exists. Pick another field or remove this condition.',
						'jetpack-forms'
					) }
				</Notice>
			) }

			{ /* One row per condition, reading as a sentence: subject, comparison, value. The
			     remove control sits at the end of the row rather than in a header, so a long
			     list is three aligned columns instead of a stack of cards. */ }
			<Stack
				direction="row"
				align="center"
				gap="sm"
				className="jetpack-contact-form__conditional-logic-rule-row"
			>
				{ /* A fixed leading column so the rows stay aligned whether or not the tick is
				     there. The tick marks a condition the evaluator will actually act on. */ }
				<span
					className="jetpack-contact-form__conditional-logic-rule-status"
					aria-hidden={ ! isComplete }
					aria-label={ isComplete ? __( 'Condition is complete', 'jetpack-forms' ) : undefined }
					role={ isComplete ? 'img' : undefined }
				>
					{ isComplete && <Icon icon={ check } size={ 20 } /> }
				</span>

				<SelectControl
					label={ __( 'Field', 'jetpack-forms' ) }
					hideLabelFromVision
					value={ rule.field || '' }
					onChange={ handleFieldChange }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				>
					<option value="">{ __( 'Select a field…', 'jetpack-forms' ) }</option>
					{ Object.keys( grouped ).map( group => (
						<optgroup key={ group } label={ group }>
							{ grouped[ group ].map( field => (
								<option key={ field.clientId } value={ selectionValue( field ) }>
									{ optionLabel( field ) }
								</option>
							) ) }
						</optgroup>
					) ) }
				</SelectControl>

				<SelectControl
					label={ __( 'Operator', 'jetpack-forms' ) }
					hideLabelFromVision
					value={ rule.operator }
					options={ operators.map( operator => ( {
						value: operator,
						label: getOperatorLabel( operator ),
					} ) ) }
					onChange={ handleOperatorChange }
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize={ true }
				/>

				<RuleValueControl rule={ rule } subject={ subject } onChange={ handleValueChange } />

				<IconButton
					size="small"
					variant="minimal"
					tone="neutral"
					icon={ trash }
					onClick={ handleRemove }
					label={ sprintf(
						/* translators: %d: condition number, starting at 1 */
						__( 'Remove condition %d', 'jetpack-forms' ),
						index + 1
					) }
				/>
			</Stack>

			{ isUnfinished && (
				<Text variant="body-sm" className="jetpack-contact-form__conditional-logic-rule-unfinished">
					{ __( 'Give this condition a value, or it will be ignored.', 'jetpack-forms' ) }
				</Text>
			) }
		</Stack>
	);
};

/**
 * The Field Value control: a list of conditions comparing sibling fields.
 *
 * @param {object}   props            - Component props.
 * @param {Array}    props.rules      - The rules of the group being edited.
 * @param {Function} props.onChange   - Called with the group's next rules.
 * @param {Array}    props.fields     - Available subject fields.
 * @param {string}   props.ownFieldId - Id of the field the panel belongs to.
 * @return {object} The rendered control.
 */
const BLANK_RULE = {
	type: RULE_TYPE_FIELD_VALUE,
	field: '',
	operator: OPERATORS.IS,
	value: '',
};

const FieldValueControl = ( { rules: storedRules, onChange, fields, ownFieldId } ) => {
	const stored = useMemo(
		() => ( Array.isArray( storedRules ) ? storedRules : [] ),
		[ storedRules ]
	);

	// An empty builder shows one condition ready to fill in, rather than asking the author to
	// press Add before anything appears. It is not written to the block until they choose a
	// field, so opening the dialog does not mark the post as changed.
	const rules = useMemo( () => ( stored.length ? stored : [ BLANK_RULE ] ), [ stored ] );

	const updateRule = useCallback(
		( index, patch ) => {
			// The first edit to the waiting row is what commits it.
			if ( ! stored.length ) {
				onChange( [ { ...BLANK_RULE, ...patch } ] );
				return;
			}

			onChange( stored.map( ( rule, i ) => ( i === index ? { ...rule, ...patch } : rule ) ) );
		},
		[ onChange, stored ]
	);

	const removeRule = useCallback(
		index => {
			onChange( stored.filter( ( _, i ) => i !== index ) );
		},
		[ onChange, stored ]
	);

	// A new condition starts without a subject rather than guessing the first field: choosing
	// one may have to assign that field an id, which should follow a deliberate pick and not
	// happen as a side effect of clicking "Add condition".
	//
	// The rule records its own type, so a future condition kind is another type in this same
	// list rather than a reshape of what is stored.
	const addRule = useCallback( () => {
		onChange( [ ...stored, { ...BLANK_RULE } ] );
	}, [ onChange, stored ] );

	// A condition that names no subject, or gives no value where one is needed, is skipped by
	// both evaluators. Rather than let an author stack up rules that quietly do nothing, the
	// next one waits until this one says something.
	const findSubject = rule => fields.find( field => field.id && field.id === rule.field );
	const canAddCondition = areRulesComplete( rules, findSubject );

	if ( ! fields.length ) {
		return (
			<Notice status="warning" isDismissible={ false }>
				{ __( 'Add another field to this form to use as a condition.', 'jetpack-forms' ) }
			</Notice>
		);
	}

	return (
		<Stack direction="column" gap="md" className="jetpack-contact-form__conditional-logic-control">
			{ rules.map( ( rule, index ) => (
				<RuleRow
					key={ index }
					rule={ rule }
					index={ index }
					fields={ fields }
					ownFieldId={ ownFieldId }
					onChange={ updateRule }
					onRemove={ removeRule }
				/>
			) ) }

			{ /* The single entry point for adding conditions. When further condition types
			     land (query string, user role, date and time) this becomes the menu that
			     offers the choice, so it stays the panel's one primary action. */ }
			<Stack direction="column" gap="xs">
				<Button
					variant="outline"
					tone="neutral"
					icon={ plus }
					onClick={ addRule }
					disabled={ ! canAddCondition }
					className="jetpack-contact-form__conditional-logic-add"
				>
					{ __( 'Add condition', 'jetpack-forms' ) }
				</Button>

				{ ! canAddCondition && (
					<Text variant="body-sm" className="jetpack-contact-form__conditional-logic-add-hint">
						{ __( 'Finish the condition above before adding another.', 'jetpack-forms' ) }
					</Text>
				) }
			</Stack>
		</Stack>
	);
};

export default FieldValueControl;
