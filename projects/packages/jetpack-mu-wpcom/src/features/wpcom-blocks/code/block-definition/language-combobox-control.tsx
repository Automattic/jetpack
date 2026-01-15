// eslint-disable-next-line import/no-unresolved -- This is a virtual module provided by a webpack plugin.
import { extensionToLang } from '@@codemirrorLanguageData@@';
import { ComboboxControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import * as React from 'react';
const { useMemo, useState } = React;

/**
 * Represents a language option for the code block language selector.
 */
export interface LanguageOption {
	readonly value: string;
	readonly label: string;
}

const plainLanguageName = __( 'Plain text', 'jetpack-mu-wpcom' ) as string;

const emptyLanguageOption: LanguageOption = {
	value: '',
	label: plainLanguageName,
};

/**
 * Modify language names for display.
 *
 * @param language - Original language name.
 * @return Display language name.
 */
function languageNameDisplay( language: string ): string {
	switch ( language ) {
		case 'Brainfuck':
			return 'Brainf***';
	}

	return language;
}

const selectLanguageOptions: ReadonlyArray< LanguageOption > = [];
{
	const langNames = new Set< string >();
	extensionToLang.forEach( ( [ , lang ] ) => {
		langNames.add( lang );
	} );
	const sortedLangNames = Array.of( ...langNames );
	sortedLangNames.sort( ( a, b ) => a.localeCompare( b ) );
	sortedLangNames.forEach( lang =>
		( selectLanguageOptions as LanguageOption[] ).push( {
			value: lang,
			label: languageNameDisplay( lang ),
		} )
	);
}

const selectPopularLanguageOptions: ReadonlyArray< LanguageOption > = [];
{
	const popularLanguages = new Set< string >( [
		'JavaScript',
		'HTML',
		'CSS',
		'SQL',
		'Python',
		'Java',
		'C++',
		'PHP',
		'TypeScript',
		'Bash',
	] );
	for ( const opt of selectLanguageOptions ) {
		if ( popularLanguages.has( opt.value ) ) {
			( selectPopularLanguageOptions as LanguageOption[] ).push( opt );
		}
	}
}

/**
 * Build a combined, de-duplicated option list for ComboboxControl.
 * Returns Plain text first, then popular languages, then all other languages.
 *
 * @return Combined option list.
 */
function buildComboboxOptions(): ReadonlyArray< LanguageOption > {
	const options: LanguageOption[] = [ emptyLanguageOption ];
	const addedValues = new Set< string >( [ '' ] );

	// Add popular languages first
	for ( const opt of selectPopularLanguageOptions ) {
		if ( ! addedValues.has( opt.value ) ) {
			options.push( opt );
			addedValues.add( opt.value );
		}
	}

	// Add all other languages
	for ( const opt of selectLanguageOptions ) {
		if ( ! addedValues.has( opt.value ) ) {
			options.push( opt );
			addedValues.add( opt.value );
		}
	}

	return options;
}

const comboboxLanguageOptions = buildComboboxOptions();

interface Props {
	/**
	 * The current language value.
	 */
	value: string;
	/**
	 * Callback when the language value changes.
	 */
	onChange: ( newLanguage: string | null | undefined ) => void;
}

/**
 * A searchable combobox control for selecting programming languages.
 * Manages its own filter state internally.
 *
 * @param props - Component props.
 * @return Language combobox control component.
 */
export function LanguageComboboxControl( props: Props ): React.JSX.Element {
	const { value, onChange } = props;

	// State for filter input value
	const [ filterValue, setFilterValue ] = useState< string >( '' );

	// Memoize filtered language options based on filter input
	const filteredLanguageOptions = useMemo( () => {
		if ( ! filterValue ) {
			return [ ...comboboxLanguageOptions ];
		}
		const lowerFilter = filterValue.toLowerCase();
		return comboboxLanguageOptions.filter( option =>
			option.label.toLowerCase().includes( lowerFilter )
		);
	}, [ filterValue ] );

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
