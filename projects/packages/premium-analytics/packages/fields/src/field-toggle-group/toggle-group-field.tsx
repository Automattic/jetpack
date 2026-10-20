/**
 * WordPress dependencies
 */
import { lookupWidgetIcon } from '@jetpack-premium-analytics/icons';
import {
	__experimentalToggleGroupControl as ToggleGroupControl,
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	__experimentalToggleGroupControlOptionIcon as ToggleGroupControlOptionIcon,
	Spinner,
} from '@wordpress/components';
import { isValidElement, useCallback, useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import useElements from '../helpers/use-elements';
import styles from './toggle-group-field.module.css';
import type { DataFormControlProps, Option } from '@jetpack-premium-analytics/externals';
import type { ReactElement } from 'react';

/**
 * An option rendered as an icon segment: the icon is an element, or a
 * `jpa/<name>` reference to the dashboard's collection. `label` still names
 * the option: it becomes the segment's tooltip and its accessible name.
 */
type IconOption = Option & { icon: ReactElement | string };

type ResolvedIconOption = Option & { icon: ReactElement };

/**
 * Resolves each option's icon reference into its element. A reference the
 * collection lacks drops the icon, so the row falls back to text segments
 * instead of showing a blank one.
 *
 * @param elements - The options as the widget declares them.
 * @return The options, with each resolvable icon reference replaced by its element.
 */
function resolveOptionIcons( elements: Option[] ): Option[] {
	return elements.map( element => {
		const { icon, ...option } = element as Partial< IconOption >;
		if ( typeof icon !== 'string' ) {
			return element;
		}

		const resolved = lookupWidgetIcon( icon );
		return resolved ? { ...option, icon: resolved } : option;
	} ) as Option[];
}

/**
 * Whether the options render as icons, which they do only when every one of
 * them carries an icon: icon segments are square and text segments are as wide
 * as their label, so a mixed row would size its segments inconsistently.
 *
 * @param elements - The resolved options.
 * @return Whether every option carries an icon.
 */
export function hasIconOptions( elements: Option[] ): elements is ResolvedIconOption[] {
	return (
		elements.length > 0 &&
		elements.every( element => isValidElement( ( element as Partial< IconOption > ).icon ) )
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

	const { elements: declaredElements, isLoading } = useElements( {
		elements: field.elements,
		getElements: field.getElements,
	} );
	const elements = useMemo( () => resolveOptionIcons( declaredElements ), [ declaredElements ] );

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
	// No matching option leaves every segment visually unpressed while the
	// consumer's default stands in — as in `SelectField`, nothing writes until picked.
	const selectedValue = elements.some( element => element.value === value )
		? value
		: elements[ 0 ].value;

	return (
		<ToggleGroupControl
			className={ styles.control }
			label={ label }
			help={ description }
			hideLabelFromVision={ hideLabelFromVision }
			// Full-row text segments stretch (isBlock); icon segments are square, and
			// an inline widget-header control sizes to its content instead.
			isBlock={ ! iconOptions && ! hideLabelFromVision }
			value={ selectedValue }
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
