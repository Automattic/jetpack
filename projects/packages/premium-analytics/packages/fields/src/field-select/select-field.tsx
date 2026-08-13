/**
 * WordPress dependencies
 */
import { SelectControl } from '@jetpack-premium-analytics/externals';
import { Spinner } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useElements from '../helpers/use-elements';
import type { DataFormControlProps, Option } from '@jetpack-premium-analytics/externals';

export function toSelectItems( elements: Option[] ) {
	return elements.map( element => ( {
		label: element.label,
		value: String( element.value ),
	} ) );
}

export function fromSelectValue( elements: Option[], value: string ) {
	const element = elements.find( candidate => String( candidate.value ) === value );
	return element ? element.value : value;
}

/**
 * Edit control for `type: 'text'` fields with `elements`.
 */
export default function SelectField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue } = field;
	const disabled = field.isDisabled( { item: data, field } );
	const value = String( getValue( { item: data } ) ?? '' );

	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );

	const items = useMemo( () => toSelectItems( elements ), [ elements ] );

	const selectedItem = useMemo(
		() => items.find( item => item.value === value ) ?? items[ 0 ] ?? null,
		[ items, value ]
	);

	const onValueChange = useCallback(
		( item: { value: string | null } | null ) => {
			if ( item?.value == null ) {
				return;
			}

			onChange( setValue( { item: data, value: fromSelectValue( elements, item.value ) } ) );
		},
		[ data, elements, onChange, setValue ]
	);

	if ( isLoading ) {
		return <Spinner />;
	}

	return (
		<SelectControl
			label={ label }
			description={ typeof description === 'string' ? description : undefined }
			hideLabelFromVision={ hideLabelFromVision }
			disabled={ disabled }
			items={ items }
			value={ selectedItem }
			onValueChange={ onValueChange }
			size="compact"
		/>
	);
}
