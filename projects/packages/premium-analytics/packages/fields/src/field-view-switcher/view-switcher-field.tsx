/**
 * External dependencies
 */
import { RadioGroupControl } from '@jetpack-premium-analytics/externals';
import { Spinner } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { fromSelectValue, toSelectItems } from '../field-select/select-field';
import { ToggleGroupField } from '../field-toggle-group';
import useElements from '../helpers/use-elements';
import type { DataFormControlProps } from '@jetpack-premium-analytics/externals';

// The options as a vertical radio list, for the folded "Widget controls" form.
function RadioListField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue } = field;
	const value = String( getValue( { item: data } ) ?? '' );

	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );
	const items = useMemo( () => toSelectItems( elements ), [ elements ] );

	const onValueChange = useCallback(
		( newValue: string ) =>
			onChange( setValue( { item: data, value: fromSelectValue( elements, newValue ) } ) ),
		[ data, elements, onChange, setValue ]
	);

	if ( isLoading ) {
		return <Spinner />;
	}

	return (
		<RadioGroupControl
			label={ label }
			description={ typeof description === 'string' ? description : undefined }
			hideLabelFromVision={ hideLabelFromVision }
			disabled={ field.isDisabled( { item: data, field } ) }
			items={ items }
			value={ items.some( item => item.value === value ) ? value : items[ 0 ]?.value }
			onValueChange={ onValueChange }
		/>
	);
}

/**
 * Segments inline in the widget header, a radio list in the folded "Widget controls" form.
 * The header hides field labels and the folded form shows them: the only placement signal a control gets.
 *
 * @param props - DataForm control props.
 * @return The control for the current placement.
 */
export default function ViewSwitcherField< Item >( props: DataFormControlProps< Item > ) {
	return props.hideLabelFromVision ? (
		<ToggleGroupField { ...props } />
	) : (
		<RadioListField { ...props } />
	);
}
