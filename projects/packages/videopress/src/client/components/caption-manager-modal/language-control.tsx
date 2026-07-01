/**
 * External dependencies
 */
import { ComboboxControl } from '@wordpress/components';
import { useMemo } from '@wordpress/element';
/**
 * Internal dependencies
 */
import { LANGUAGE_TAGS, getLanguageDisplayName } from '../../lib/video-tracks/language';
/**
 * Types
 */
import type { ReactElement } from 'react';

type LanguageControlProps = {
	label: string;
	value: string;
	onChange: ( tag: string, displayName: string ) => void;
	disabled?: boolean;
};

type LanguageOption = { value: string; label: string };

const toOption = ( tag: string ): LanguageOption => ( {
	value: tag,
	label: getLanguageDisplayName( tag ),
} );

/**
 * Searchable language picker that maps human-readable names to BCP-47 tags so
 * users don't have to know tags. ComboboxControl provides the search/filter;
 * selecting an option reports the canonical tag and its display name (used to
 * derive the track label).
 *
 * @param props          - Component props.
 * @param props.label    - Field label.
 * @param props.value    - Current BCP-47 tag.
 * @param props.onChange - Called with the selected tag and its display name.
 * @param props.disabled - Whether the control is disabled.
 * @return Language combobox control.
 */
export default function LanguageControl( {
	label,
	value,
	onChange,
	disabled,
}: LanguageControlProps ): ReactElement {
	const options = useMemo( () => {
		const tags = [ ...LANGUAGE_TAGS ];

		/*
		 * Keep the current value selectable even if it isn't in the curated list
		 * (e.g. an existing track in an uncommon language).
		 */
		if ( value && ! tags.includes( value ) ) {
			tags.push( value );
		}

		return tags.map( toOption ).sort( ( a, b ) => a.label.localeCompare( b.label ) );
	}, [ value ] );

	return (
		<ComboboxControl
			label={ label }
			value={ value }
			options={ options }
			onChange={ tag => {
				if ( tag ) {
					onChange( tag, getLanguageDisplayName( tag ) );
				}
			} }
			disabled={ disabled }
			allowReset={ false }
			__next40pxDefaultSize={ true }
			__nextHasNoMarginBottom={ true }
		/>
	);
}
