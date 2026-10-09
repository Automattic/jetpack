import { CheckboxControl, RadioControl, SelectControl, ToggleControl } from '@wordpress/components';
import { useCallback, useMemo } from '@wordpress/element';
import { Stack } from '@wordpress/ui';
import type { Settings } from '../types';
import type { DeepPartial, NormalizedField } from '@wordpress/dataviews';
import type { JSX } from 'react';

export interface EditProps {
	data: Settings;
	field: NormalizedField< Settings >;
	onChange: ( value: DeepPartial< Settings > ) => void;
}

/**
 * The field's current value.
 *
 * @param data  - Settings.
 * @param field - Field.
 * @return Value.
 */
function valueOf( data: Settings, field: NormalizedField< Settings > ): unknown {
	return ( data as Record< string, unknown > )[ field.id ];
}

/**
 * Boolean setting as a toggle.
 *
 * @param props          - Edit props.
 * @param props.data     - Settings.
 * @param props.field    - Field.
 * @param props.onChange - Called with the edit.
 * @return Control.
 */
export function ToggleEdit( { data, field, onChange }: EditProps ): JSX.Element {
	const checked = Boolean( valueOf( data, field ) );
	const handleChange = useCallback(
		( next: boolean ) => onChange( { [ field.id ]: next } as DeepPartial< Settings > ),
		[ field.id, onChange ]
	);

	return (
		<ToggleControl
			__nextHasNoMarginBottom
			label={ field.label }
			help={ field.description }
			checked={ checked }
			onChange={ handleChange }
		/>
	);
}

/**
 * Boolean setting as a checkbox.
 *
 * @param props          - Edit props.
 * @param props.data     - Settings.
 * @param props.field    - Field.
 * @param props.onChange - Called with the edit.
 * @return Control.
 */
export function CheckboxEdit( { data, field, onChange }: EditProps ): JSX.Element {
	const checked = Boolean( valueOf( data, field ) );
	const handleChange = useCallback(
		( next: boolean ) => onChange( { [ field.id ]: next } as DeepPartial< Settings > ),
		[ field.id, onChange ]
	);

	return (
		<CheckboxControl
			__nextHasNoMarginBottom
			label={ field.label }
			help={ field.description }
			checked={ checked }
			onChange={ handleChange }
		/>
	);
}

/**
 * Setting with `elements`, as a select.
 *
 * @param props          - Edit props.
 * @param props.data     - Settings.
 * @param props.field    - Field.
 * @param props.onChange - Called with the edit.
 * @return Control.
 */
export function SelectEdit( { data, field, onChange }: EditProps ): JSX.Element {
	const handleChange = useCallback(
		( next: string ) => onChange( { [ field.id ]: next } as DeepPartial< Settings > ),
		[ field.id, onChange ]
	);

	return (
		<SelectControl
			__next40pxDefaultSize
			__nextHasNoMarginBottom
			label={ field.label }
			value={ String( valueOf( data, field ) ?? '' ) }
			options={ ( field.elements ?? [] ).map( ( { value, label } ) => ( {
				value: String( value ),
				label,
			} ) ) }
			onChange={ handleChange }
		/>
	);
}

/**
 * Boolean setting as two radios, as the PHP screen shows the sitewide defaults.
 *
 * @param onLabel  - Label for true.
 * @param offLabel - Label for false.
 * @return Edit component.
 */
export function booleanRadioEdit( onLabel: string, offLabel: string ) {
	return function BooleanRadioEdit( { data, field, onChange }: EditProps ): JSX.Element {
		const handleChange = useCallback(
			( next: string ) => onChange( { [ field.id ]: next === 'on' } as DeepPartial< Settings > ),
			[ field.id, onChange ]
		);

		return (
			<RadioControl
				label={ field.label }
				selected={ valueOf( data, field ) ? 'on' : 'off' }
				options={ [
					{ label: onLabel, value: 'on' },
					{ label: offLabel, value: 'off' },
				] }
				onChange={ handleChange }
			/>
		);
	};
}

/**
 * One checkbox of a group.
 *
 * @param props          - Props.
 * @param props.label    - Label.
 * @param props.value    - Value it adds or removes.
 * @param props.checked  - Whether it is selected.
 * @param props.onToggle - Called with the value and its new state.
 * @return Checkbox.
 */
function GroupCheckbox( {
	label,
	value,
	checked,
	onToggle,
}: {
	label: string;
	value: string;
	checked: boolean;
	onToggle: ( value: string, checked: boolean ) => void;
} ): JSX.Element {
	const handleChange = useCallback(
		( next: boolean ) => onToggle( value, next ),
		[ onToggle, value ]
	);

	return (
		<CheckboxControl
			__nextHasNoMarginBottom
			label={ label }
			checked={ checked }
			onChange={ handleChange }
		/>
	);
}

/**
 * String-list setting as one checkbox per element. Each change sends the whole list.
 *
 * @param props          - Edit props.
 * @param props.data     - Settings.
 * @param props.field    - Field.
 * @param props.onChange - Called with the edit.
 * @return Control.
 */
export function CheckboxGroupEdit( { data, field, onChange }: EditProps ): JSX.Element {
	const stored = valueOf( data, field ) as string[] | undefined;
	const selected = useMemo( () => stored ?? [], [ stored ] );
	const handleToggle = useCallback(
		( value: string, checked: boolean ) => {
			const next = checked
				? [ ...selected.filter( slug => slug !== value ), value ]
				: selected.filter( slug => slug !== value );
			onChange( { [ field.id ]: next } as DeepPartial< Settings > );
		},
		[ field.id, onChange, selected ]
	);

	return (
		<Stack render={ <fieldset /> } direction="column" gap="md">
			<legend className="screen-reader-text">{ field.label }</legend>
			{ ( field.elements ?? [] ).map( ( { value, label } ) => (
				<GroupCheckbox
					key={ String( value ) }
					label={ label }
					value={ String( value ) }
					checked={ selected.includes( String( value ) ) }
					onToggle={ handleToggle }
				/>
			) ) }
		</Stack>
	);
}
