/**
 * WordPress dependencies
 */
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	Spinner,
} from '@wordpress/components';
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useElements from '../helpers/use-elements';
import styles from './toggle-group-field.module.css';
import type { DataFormControlProps, Option } from '@jetpack-premium-analytics/externals';
import type { ReactElement } from 'react';

/**
 * An option rendered as an icon segment. `label` still names the option: it
 * becomes the segment's tooltip and its accessible name.
 */
type IconOption = Option & { icon: ReactElement };

/**
 * Whether the options render as icons, which they do only when every one of
 * them carries an icon: icon segments are square and text segments are as wide
 * as their label, so a mixed row would size its segments inconsistently.
 *
 * @param elements - The resolved options.
 * @return Whether every option carries an icon.
 */
export function hasIconOptions( elements: Option[] ): elements is IconOption[] {
	return (
		elements.length > 0 && elements.every( element => !! ( element as Partial< IconOption > ).icon )
	);
}

/**
 * Edit control for fields with `elements`, rendering the options as segments
 * of a single row rather than as a dropdown. Suited to a short, stable set of
 * mutually exclusive options; longer or open-ended ones belong in `SelectField`.
 */
export default function ToggleGroupField< Item >( {
	data,
	field,
	onChange,
	hideLabelFromVision,
}: DataFormControlProps< Item > ) {
	const { label, description, getValue, setValue } = field;
	const disabled = field.isDisabled( { item: data, field } );
	const value = getValue( { item: data } );

	const { elements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );

	const onValueChange = useCallback(
		( newValue: string | number | undefined ) => {
			if ( newValue === undefined ) {
				return;
			}

			onChange( setValue( { item: data, value: newValue } ) );
		},
		[ data, onChange, setValue ]
	);

	if ( isLoading ) {
		return <Spinner />;
	}

	if ( elements.length === 0 ) {
		return null;
	}

	const iconOptions = hasIconOptions( elements );

	return (
		<ToggleGroupControl
			className={ styles.control }
			label={ label }
			help={ description }
			hideLabelFromVision={ hideLabelFromVision }
			// Segments stretch only where the control owns a full form row and
			// reads as text. Icon segments are square, and inline in a widget
			// header the control sizes to its content.
			isBlock={ ! iconOptions && ! hideLabelFromVision }
			value={ value }
			onChange={ onValueChange }
		>
			{ iconOptions
				? elements.map( element => (
						<ToggleGroupControlOptionIcon
							key={ String( element.value ) }
							value={ element.value }
							icon={ element.icon }
							label={ element.label }
							disabled={ disabled }
						/>
				  ) )
				: elements.map( element => (
						<ToggleGroupControlOption
							key={ String( element.value ) }
							value={ element.value }
							label={ element.label }
							disabled={ disabled }
						/>
				  ) ) }
		</ToggleGroupControl>
	);
}
