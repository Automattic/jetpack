import { ComboboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import * as React from 'react';
const { useMemo, useState } = React;

interface LanguageOption {
	readonly value: string;
	readonly label: string;
}

interface LanguageComboboxControlProps {
	/**
	 * The current language value.
	 */
	value: string;
	/**
	 * Callback when the language value changes.
	 */
	onChange: ( newLanguage: string | null | undefined ) => void;
	/**
	 * All available language options.
	 */
	options: ReadonlyArray< LanguageOption >;
}

/**
 * A searchable combobox control for selecting programming languages.
 * Manages its own filter state internally.
 *
 * @param props - Component props.
 * @return Language combobox control component.
 */
export function LanguageComboboxControl( props: LanguageComboboxControlProps ): React.JSX.Element {
	const { value, onChange, options } = props;

	// State for filter input value
	const [ filterValue, setFilterValue ] = useState< string >( '' );

	// Memoize filtered language options based on filter input
	const filteredLanguageOptions = useMemo( () => {
		if ( ! filterValue ) {
			return [ ...options ];
		}
		const lowerFilter = filterValue.toLowerCase();
		return options.filter( option => option.label.toLowerCase().includes( lowerFilter ) );
	}, [ filterValue, options ] );

	return (
		<ComboboxControl
			label={ __( 'Language', 'jetpack-mu-wpcom' ) }
			value={ value }
			onChange={ onChange }
			options={ filteredLanguageOptions }
			onFilterValueChange={ setFilterValue }
			__next40pxDefaultSize
			__nextHasNoMarginBottom
		/>
	);
}
