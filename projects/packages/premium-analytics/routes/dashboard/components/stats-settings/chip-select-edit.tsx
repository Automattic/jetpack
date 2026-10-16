import {
	SearchableChipSelectControl,
	type DataFormControlProps,
} from '@jetpack-premium-analytics/externals';
import { useCallback } from 'react';
import type { JSX } from 'react';

type ChipItem = { value: string; label: string };

/**
 * A DataForm `Edit` for an `array` field with `elements`: the field's elements as a searchable chip
 * select. DataForm's own `array` control still renders the legacy token field.
 *
 * @param props                     - DataForm control props.
 * @param props.data                - The item being edited.
 * @param props.field               - The field the control edits.
 * @param props.onChange            - Called with the edited part of the item.
 * @param props.hideLabelFromVision - Whether to hide the label visually.
 * @return The labelled chip select.
 */
export function ChipSelectEdit< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ): JSX.Element {
	const value: string[] = field.getValue( { item: data } ) ?? [];
	const known: ChipItem[] = ( field.elements ?? [] ).map( element => ( {
		value: String( element.value ),
		label: element.label,
	} ) );
	// A stored value with no element, such as a role from a deactivated plugin, stays as a chip so editing another one keeps it.
	const items = [
		...known,
		...value
			.filter( stored => ! known.some( item => item.value === stored ) )
			.map( stored => ( { value: stored, label: stored } ) ),
	];
	const selected = items.filter( item => value.includes( item.value ) );

	const onValueChange = useCallback(
		( next: ChipItem[] ) =>
			onChange( field.setValue( { item: data, value: next.map( item => item.value ) } ) ),
		[ data, field, onChange ]
	);

	return (
		<SearchableChipSelectControl
			label={ field.label }
			description={ typeof field.description === 'string' ? field.description : undefined }
			details={ typeof field.description === 'string' ? undefined : field.description }
			hideLabelFromVision={ hideLabelFromVision }
			items={ items }
			value={ selected }
			onValueChange={ onValueChange }
		/>
	);
}
