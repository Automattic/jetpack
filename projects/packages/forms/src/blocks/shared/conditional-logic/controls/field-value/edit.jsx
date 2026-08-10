import { Notice, SelectControl, TextControl } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { closeSmall, plus } from '@wordpress/icons';
import { Button, IconButton, Stack, Text } from '@wordpress/ui';
import { useEnsureFieldId } from '../../hooks/use-subject-fields.js';
import {
	OPERATORS,
	getOperatorsForTypeKey,
	getValueInputForTypeKey,
	operatorNeedsValue,
} from '../../util/field-types.ts';
import { getOperatorLabel } from '../../util/operator-labels.ts';

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
		<div className="jetpack-contact-form__conditional-logic-rule">
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				gap="sm"
				className="jetpack-contact-form__conditional-logic-rule-header"
			>
				<Text variant="body-sm" className="jetpack-contact-form__conditional-logic-rule-title">
					{ sprintf(
						/* translators: %d: condition number, starting at 1 */
						__( 'Condition %d', 'jetpack-forms' ),
						index + 1
					) }
				</Text>
				<IconButton
					size="small"
					variant="minimal"
					tone="neutral"
					icon={ closeSmall }
					onClick={ handleRemove }
					label={ sprintf(
						/* translators: %d: condition number, starting at 1 */
						__( 'Remove condition %d', 'jetpack-forms' ),
						index + 1
					) }
				/>
			</Stack>

			{ missingSubject && (
				<Notice status="warning" isDismissible={ false }>
					{ __(
						'The referenced field no longer exists. Pick another field or remove this condition.',
						'jetpack-forms'
					) }
				</Notice>
			) }

			<Stack
				direction="column"
				gap="sm"
				className="jetpack-contact-form__conditional-logic-rule-body"
			>
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
			</Stack>
		</div>
	);
};

/**
 * The Field Value control: a list of conditions comparing sibling fields.
 *
 * @param {object}   props            - Component props.
 * @param {object}   props.value      - This control's stored config, `{ rules }`.
 * @param {Function} props.onChange   - Called with the control's next config.
 * @param {Array}    props.fields     - Available subject fields.
 * @param {string}   props.ownFieldId - Id of the field the panel belongs to.
 * @return {object} The rendered control.
 */
const FieldValueControl = ( { value, onChange, fields, ownFieldId } ) => {
	const rules = useMemo( () => ( Array.isArray( value?.rules ) ? value.rules : [] ), [ value ] );

	const updateRule = useCallback(
		( index, patch ) => {
			onChange( {
				...value,
				rules: rules.map( ( rule, i ) => ( i === index ? { ...rule, ...patch } : rule ) ),
			} );
		},
		[ onChange, rules, value ]
	);

	const removeRule = useCallback(
		index => {
			onChange( { ...value, rules: rules.filter( ( _, i ) => i !== index ) } );
		},
		[ onChange, rules, value ]
	);

	// A new condition starts without a subject rather than guessing the first field: choosing
	// one may have to assign that field an id, which should follow a deliberate pick and not
	// happen as a side effect of clicking "Add condition".
	const addRule = useCallback( () => {
		onChange( {
			...value,
			rules: [ ...rules, { field: '', operator: OPERATORS.IS, value: '' } ],
		} );
	}, [ onChange, rules, value ] );

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
			<Button
				variant="outline"
				tone="neutral"
				icon={ plus }
				onClick={ addRule }
				className="jetpack-contact-form__conditional-logic-add"
			>
				{ __( 'Add condition', 'jetpack-forms' ) }
			</Button>
		</Stack>
	);
};

export default FieldValueControl;
