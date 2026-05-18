import { fetchSuggestionsFromApi } from './api';
import { renderSuggestionsList } from './dom';

let instanceCount = 0;

/**
 * Enhance a search input with an autocomplete suggestions list.
 *
 * @param {object}           args               - Enhancement arguments.
 * @param {HTMLInputElement} args.input         - Input to enhance.
 * @param {HTMLElement}      args.container     - Element that should contain the suggestions list.
 * @param {string|number}    args.siteId        - WPCOM site ID.
 * @param {object}           args.apiOptions    - Server options for the suggestions API.
 * @param {object}           [args.labels]      - Display labels.
 * @param {Function}         args.onQuerySelect - Callback for query suggestions.
 * @param {Function}         args.onNavigate    - Callback for URL-backed suggestions.
 * @param {Function}         [args.onSubmit]    - Callback for Enter with no active suggestion.
 * @param {Function}         [args.isEnabled]   - Dynamic enabled predicate.
 * @param {number}           [args.minLength]   - Minimum query length.
 * @return {Function} Cleanup callback.
 */
export function enhanceSearchInput( {
	input,
	container,
	siteId,
	apiOptions,
	labels = {},
	onQuerySelect,
	onNavigate,
	onSubmit = null,
	isEnabled = () => true,
	minLength = 1,
} ) {
	if ( ! input || ! container || ! siteId ) {
		return () => {};
	}

	const idBase = `jetpack-search-suggestions-${ ++instanceCount }`;
	let suggestions = [];
	let activeIndex = -1;
	let showSuggestions = false;
	let listElement = null;
	let abortController = null;
	let requestToken = 0;
	let blurTimer = null;

	input.setAttribute( 'autocomplete', 'off' );
	input.setAttribute( 'aria-autocomplete', 'list' );
	input.setAttribute( 'aria-expanded', 'false' );

	const removeList = () => {
		if ( listElement ) {
			listElement.remove();
			listElement = null;
		}
		input.setAttribute( 'aria-expanded', 'false' );
		input.removeAttribute( 'aria-controls' );
		input.removeAttribute( 'aria-activedescendant' );
	};

	const render = () => {
		removeList();

		if ( ! showSuggestions || suggestions.length === 0 ) {
			return;
		}

		listElement = renderSuggestionsList( {
			suggestions,
			activeIndex,
			onSelect: handleSelect,
			labels,
			listId: idBase,
			optionIdBase: `${ idBase }-option`,
		} );

		if ( ! listElement ) {
			return;
		}

		container.appendChild( listElement );
		input.setAttribute( 'aria-expanded', 'true' );
		input.setAttribute( 'aria-controls', idBase );

		if ( activeIndex >= 0 ) {
			input.setAttribute( 'aria-activedescendant', `${ idBase }-option-${ activeIndex }` );
		}
	};

	const clearSuggestions = () => {
		suggestions = [];
		activeIndex = -1;
		showSuggestions = false;
		render();
	};

	const abortCurrentRequest = () => {
		if ( abortController ) {
			abortController.abort();
			abortController = null;
		}
	};

	const fetchSuggestions = async query => {
		const token = ++requestToken;
		abortCurrentRequest();

		if ( ! isEnabled() || ! query || query.length < minLength ) {
			clearSuggestions();
			return;
		}

		abortController = new AbortController();

		try {
			const nextSuggestions = await fetchSuggestionsFromApi(
				query,
				siteId,
				apiOptions,
				abortController.signal
			);
			if ( token !== requestToken ) {
				return;
			}
			suggestions = nextSuggestions;
			activeIndex = -1;
			showSuggestions = query.length >= minLength;
			render();
		} catch ( error ) {
			if ( error.name !== 'AbortError' && token === requestToken ) {
				clearSuggestions();
			}
		}
	};

	/**
	 * Select a suggestion and route it to the proper callback.
	 *
	 * @param {import('./api').SuggestionItem} item - Selected suggestion item.
	 */
	function handleSelect( item ) {
		clearSuggestions();
		if ( ( item.type === 'post' || item.type === 'taxonomy' ) && item.url ) {
			onNavigate( item );
			return;
		}
		input.value = item.text;
		onQuerySelect( item );
	}

	const handleInput = event => {
		const value = event.target.value ?? '';
		showSuggestions = value.length >= minLength;
		activeIndex = -1;
		fetchSuggestions( value );
	};

	const handleKeyDown = event => {
		if ( ! isEnabled() ) {
			return;
		}

		switch ( event.key ) {
			case 'ArrowDown':
				event.preventDefault();
				showSuggestions = true;
				activeIndex =
					suggestions.length > 0 ? Math.min( activeIndex + 1, suggestions.length - 1 ) : -1;
				render();
				if ( suggestions.length === 0 ) {
					fetchSuggestions( input.value ?? '' );
				}
				break;
			case 'ArrowUp':
				if ( ! showSuggestions ) {
					return;
				}
				event.preventDefault();
				activeIndex = activeIndex > 0 ? activeIndex - 1 : -1;
				render();
				break;
			case 'Enter':
				if ( showSuggestions && activeIndex >= 0 && activeIndex < suggestions.length ) {
					event.preventDefault();
					handleSelect( suggestions[ activeIndex ] );
				} else {
					clearSuggestions();
					if ( onSubmit ) {
						event.preventDefault();
						onSubmit( input.value ?? '' );
					}
				}
				break;
			case 'Escape':
				clearSuggestions();
				break;
		}
	};

	const handleBlur = () => {
		blurTimer = setTimeout( clearSuggestions, 150 );
	};

	input.addEventListener( 'input', handleInput );
	input.addEventListener( 'keydown', handleKeyDown );
	input.addEventListener( 'blur', handleBlur );

	return () => {
		input.removeEventListener( 'input', handleInput );
		input.removeEventListener( 'keydown', handleKeyDown );
		input.removeEventListener( 'blur', handleBlur );
		clearTimeout( blurTimer );
		abortCurrentRequest();
		removeList();
	};
}
