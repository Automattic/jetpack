import { __ } from '@wordpress/i18n';
import * as React from 'react';
import './search-suggestions.scss';

const GROUP_META = {
	query: { label: __( 'Suggestions', 'jetpack-search-pkg' ) },
	post: { label: __( 'Articles', 'jetpack-search-pkg' ) },
	taxonomy: { label: __( 'Popular Filters', 'jetpack-search-pkg' ) },
};

const TYPE_ORDER = [ 'query', 'taxonomy', 'post' ];

/**
 * Dropdown list of autocomplete suggestions, grouped by type.
 *
 * @param {object}   props             - Component props.
 * @param {Array}    props.suggestions - Array of SuggestionItem objects.
 * @param {number}   props.activeIndex - Flat index of the keyboard-highlighted item (-1 for none).
 * @param {Function} props.onSelect    - Called with the selected SuggestionItem.
 * @return {React.ReactElement|null} The rendered suggestions list or null.
 */
export default function SearchSuggestions( { suggestions, activeIndex, onSelect } ) {
	if ( ! suggestions || suggestions.length === 0 ) {
		return null;
	}

	// Group items while preserving a flat index for keyboard navigation.
	const groups = [];
	let flatIndex = 0;

	for ( const type of TYPE_ORDER ) {
		const items = suggestions
			.map( ( item, originalIndex ) => ( { item, originalIndex } ) )
			.filter( ( { item } ) => item.type === type );

		if ( items.length === 0 ) {
			continue;
		}

		groups.push( {
			type,
			label: GROUP_META[ type ]?.label ?? type,
			entries: items.map( ( { item } ) => ( { item, flatIndex: flatIndex++ } ) ),
		} );
	}

	if ( groups.length === 0 ) {
		return null;
	}

	return (
		<ul
			className="jetpack-instant-search__search-suggestions"
			role="listbox"
			aria-label={ __( 'Search suggestions', 'jetpack-search-pkg' ) }
		>
			{ groups.map( ( group, groupIndex ) => (
				<React.Fragment key={ group.type }>
					{ groupIndex > 0 && (
						<li className="jetpack-instant-search__search-suggestions-separator" role="separator" />
					) }
					<li className="jetpack-instant-search__search-suggestions-label" role="presentation">
						{ group.label }
					</li>
					{ group.entries.map( ( { item, flatIndex: idx } ) => (
						<li
							key={ idx }
							className={
								'jetpack-instant-search__search-suggestion' +
								' jetpack-instant-search__search-suggestion--' +
								item.type +
								( idx === activeIndex ? ' is-active' : '' )
							}
							role="option"
							aria-selected={ idx === activeIndex }
							tabIndex={ -1 }
							onMouseDown={ e => e.preventDefault() }
							onClick={ e => {
								e.preventDefault();
								e.stopPropagation();
								onSelect( item );
							} }
							onKeyDown={ e => e.key === 'Enter' && onSelect( item ) }
						>
							{ item.text }
						</li>
					) ) }
				</React.Fragment>
			) ) }
		</ul>
	);
}
