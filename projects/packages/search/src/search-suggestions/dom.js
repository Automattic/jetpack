export const TYPE_ORDER = [ 'query', 'taxonomy', 'post' ];

const DEFAULT_LABELS = {
	list: 'Search suggestions',
	query: 'Suggestions',
	taxonomy: 'Popular Filters',
	post: 'Articles',
};

/**
 * Group suggestion items by display type while preserving a flat keyboard index.
 *
 * @param {Array} suggestions - Suggestion items.
 * @return {Array} Grouped suggestion entries.
 */
export function groupSuggestions( suggestions ) {
	const groups = [];
	let flatIndex = 0;

	for ( const type of TYPE_ORDER ) {
		const items = ( suggestions ?? [] ).filter( item => item.type === type );
		if ( items.length === 0 ) {
			continue;
		}

		groups.push( {
			type,
			entries: items.map( item => ( { item, flatIndex: flatIndex++ } ) ),
		} );
	}

	return groups;
}

/**
 * Build a DOM listbox for autocomplete suggestions.
 *
 * @param {object}   args                - Render arguments.
 * @param {Array}    args.suggestions    - Suggestion items.
 * @param {number}   args.activeIndex    - Flat active item index.
 * @param {Function} args.onSelect       - Callback when a suggestion is selected.
 * @param {object}   [args.labels]       - Display labels.
 * @param {string}   [args.listId]       - Optional listbox id.
 * @param {string}   [args.optionIdBase] - Optional option id prefix.
 * @return {HTMLUListElement|null} Suggestion list, or null.
 */
export function renderSuggestionsList( {
	suggestions,
	activeIndex,
	onSelect,
	labels = {},
	listId = '',
	optionIdBase = '',
} ) {
	const mergedLabels = { ...DEFAULT_LABELS, ...labels };
	const groups = groupSuggestions( suggestions );

	if ( groups.length === 0 ) {
		return null;
	}

	const list = document.createElement( 'ul' );
	list.className = 'jetpack-instant-search__search-suggestions';
	list.setAttribute( 'role', 'listbox' );
	list.setAttribute( 'aria-label', mergedLabels.list );
	if ( listId ) {
		list.id = listId;
	}

	groups.forEach( ( group, groupIndex ) => {
		if ( groupIndex > 0 ) {
			const separator = document.createElement( 'li' );
			separator.className = 'jetpack-instant-search__search-suggestions-separator';
			separator.setAttribute( 'role', 'separator' );
			list.appendChild( separator );
		}

		const label = document.createElement( 'li' );
		label.className = 'jetpack-instant-search__search-suggestions-label';
		label.setAttribute( 'role', 'presentation' );
		label.textContent = mergedLabels[ group.type ] ?? group.type;
		list.appendChild( label );

		group.entries.forEach( ( { item, flatIndex } ) => {
			const option = document.createElement( 'li' );
			option.className =
				'jetpack-instant-search__search-suggestion' +
				' jetpack-instant-search__search-suggestion--' +
				item.type +
				( flatIndex === activeIndex ? ' is-active' : '' );
			option.setAttribute( 'role', 'option' );
			option.setAttribute( 'aria-selected', flatIndex === activeIndex ? 'true' : 'false' );
			option.tabIndex = -1;
			option.textContent = item.text;
			if ( optionIdBase ) {
				option.id = `${ optionIdBase }-${ flatIndex }`;
			}
			option.addEventListener( 'mousedown', event => event.preventDefault() );
			option.addEventListener( 'click', event => {
				event.preventDefault();
				event.stopPropagation();
				onSelect( item );
			} );
			option.addEventListener( 'keydown', event => {
				if ( event.key === 'Enter' ) {
					onSelect( item );
				}
			} );
			list.appendChild( option );
		} );
	} );

	return list;
}
