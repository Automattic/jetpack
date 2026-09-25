/**
 * External dependencies
 */
import { RadioControl } from '@wordpress/components';
import { useCallback } from '@wordpress/element';
/**
 * Internal dependencies
 */
import type { NewsletterSettings } from '../types';
import type { DataFormControlProps } from '@wordpress/dataviews';

/**
 * Generic `Edit` control for DataForm fields with `elements`, rendering
 * Core's public `RadioControl` instead of DataViews' bundled `Edit: 'radio'`
 * shorthand. The bundled control resolves the same `ValidatedToggleControl`
 * private API as `Edit: 'toggle'`, which breaks once Gutenberg stops
 * exposing it (see https://github.com/WordPress/gutenberg/pull/81492).
 *
 * @param {DataFormControlProps<NewsletterSettings>} props - DataForm edit control props.
 * @return {JSX.Element} The radio control.
 */
export function Radio( {
	field,
	onChange,
	data,
}: DataFormControlProps< NewsletterSettings > ): JSX.Element {
	const handleChange = useCallback(
		( value: string ) => {
			onChange( field.setValue( { item: data, value } ) );
		},
		[ onChange, field, data ]
	);

	return (
		<RadioControl
			label={ field.label }
			help={ field.description }
			selected={ String( field.getValue( { item: data } ) ) }
			options={ ( field.elements ?? [] ).map( ( { value, label } ) => ( {
				value: String( value ),
				label,
			} ) ) }
			onChange={ handleChange }
		/>
	);
}
