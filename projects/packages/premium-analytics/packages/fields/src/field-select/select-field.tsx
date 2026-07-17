/**
 * WordPress dependencies
 */
import { Spinner } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { SelectControl } from '@wordpress/ui';
/**
 * Internal dependencies
 */
import useElements from '../helpers/use-elements';
import type { DataFormControlProps, Option } from '@wordpress/dataviews';

function toSelectItems( elements: Option[] ) {
	return elements.map( element => ( {
		label: element.label,
		value: String( element.value ),
	} ) );
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
	const value = getValue( { item: data } ) ?? '';

	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );

	const items = useMemo( () => toSelectItems( elements ), [ elements ] );

	const selectedItem = useMemo(
		() => items.find( item => item.value === String( value ) ) ?? items[ 0 ] ?? null,
		[ items, value ]
	);

	const onValueChange = useCallback(
		( item: { value: string | null } | null ) => {
			if ( item?.value == null ) {
				return;
			}

			onChange( setValue( { item: data, value: item.value } ) );
		},
		[ data, onChange, setValue ]
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
