import * as React from 'react';
import { useCallback, useEffect, useRef, useState } from 'react';
import useSearchSuggestions from '../hooks/use-search-suggestions';
import SearchBox from './search-box';
import SearchSuggestions from './search-suggestions';

/**
 * Search form with optional autocomplete suggestions dropdown.
 *
 * @param {object}   props                    - Component props.
 * @param {string}   props.searchQuery        - Committed search query (from Redux).
 * @param {Function} props.onChangeSearch     - Callback to commit a new query.
 * @param {Function} props.onSelectFilter     - Optional callback to apply a taxonomy filter: (taxonomy, slug) => void.
 * @param {boolean}  props.isVisible          - Whether the overlay is visible.
 * @param {string}   props.className          - Optional CSS class for the form element.
 * @param {boolean}  props.suggestionsEnabled - When true, show autocomplete dropdown.
 * @param {string}   props.siteId             - Site ID used for the suggestions API.
 * @return {React.ReactElement} The search form.
 */
export default function SearchForm( {
	searchQuery,
	onChangeSearch,
	onSelectFilter = null,
	isVisible,
	className,
	suggestionsEnabled = false,
	siteId = null,
} ) {
	const searchInputRef = useRef( null );

	const [ localQuery, setLocalQuery ] = useState( searchQuery );
	const [ showSuggestions, setShowSuggestions ] = useState( false );
	const [ activeIndex, setActiveIndex ] = useState( -1 );

	useEffect( () => {
		setLocalQuery( searchQuery );
	}, [ searchQuery ] );

	const { suggestions } = useSearchSuggestions( {
		query: suggestionsEnabled ? localQuery : '',
		siteId,
		enabled: suggestionsEnabled,
	} );

	// Total number of selectable suggestion items (labels and separators excluded).
	const suggestionCount = suggestions.length;

	const onClear = useCallback( () => {
		if ( suggestionsEnabled ) {
			setLocalQuery( '' );
			setShowSuggestions( false );
			setActiveIndex( -1 );
		}
		onChangeSearch( '' );
	}, [ suggestionsEnabled, onChangeSearch ] );

	const handleChange = useCallback(
		event => {
			let value;
			try {
				value = event.currentTarget.value;
				if ( value === undefined || value === null ) {
					throw new Error( 'value inaccessible' );
				}
			} catch {
				value = searchInputRef.current?.value ?? '';
			}

			if ( suggestionsEnabled ) {
				setLocalQuery( value );
				setShowSuggestions( value.length >= 1 );
				setActiveIndex( -1 );
			} else {
				onChangeSearch( value );
			}
		},
		[ suggestionsEnabled, onChangeSearch ]
	);

	const handleSelectSuggestion = useCallback(
		item => {
			setShowSuggestions( false );
			setActiveIndex( -1 );
			if ( item.type === 'taxonomy' && onSelectFilter && item.taxonomy && item.slug ) {
				setLocalQuery( '' );
				onChangeSearch( '' );
				onSelectFilter( item.taxonomy, item.slug );
			} else if ( item.type === 'post' || item.type === 'taxonomy' ) {
				window.location.href = item.url;
			} else {
				setLocalQuery( item.text );
				onChangeSearch( item.text );
			}
		},
		[ onChangeSearch, onSelectFilter ]
	);

	const handleKeyDown = useCallback(
		event => {
			if ( ! suggestionsEnabled ) {
				return;
			}
			switch ( event.key ) {
				case 'ArrowDown':
					event.preventDefault();
					setShowSuggestions( true );
					setActiveIndex( i => ( i < suggestionCount - 1 ? i + 1 : i ) );
					break;
				case 'ArrowUp':
					event.preventDefault();
					setActiveIndex( i => ( i > 0 ? i - 1 : -1 ) );
					break;
				case 'Enter':
					if ( showSuggestions && activeIndex >= 0 && activeIndex < suggestionCount ) {
						event.preventDefault();
						handleSelectSuggestion( suggestions[ activeIndex ] );
					} else if ( showSuggestions ) {
						setShowSuggestions( false );
						onChangeSearch( localQuery );
					}
					break;
				case 'Escape':
					setShowSuggestions( false );
					setActiveIndex( -1 );
					break;
				default:
					break;
			}
		},
		[
			suggestionsEnabled,
			suggestions,
			suggestionCount,
			showSuggestions,
			activeIndex,
			localQuery,
			handleSelectSuggestion,
			onChangeSearch,
		]
	);

	const handleBlur = useCallback( () => {
		setTimeout( () => {
			setShowSuggestions( false );
			setActiveIndex( -1 );
		}, 150 );
	}, [] );

	const noop = event => event.preventDefault();
	const displayQuery = suggestionsEnabled ? localQuery : searchQuery;

	return (
		<form
			autoComplete="off"
			onSubmit={ noop }
			role="search"
			className={ className }
			style={ { position: 'relative' } }
		>
			<div className="jetpack-instant-search__search-form">
				<SearchBox
					ref={ searchInputRef }
					isVisible={ isVisible }
					onChange={ handleChange }
					onClear={ onClear }
					onKeyDown={ suggestionsEnabled ? handleKeyDown : undefined }
					onBlur={ suggestionsEnabled ? handleBlur : undefined }
					shouldRestoreFocus
					searchQuery={ displayQuery }
				/>
				{ suggestionsEnabled && showSuggestions && suggestions.length > 0 && (
					<SearchSuggestions
						suggestions={ suggestions }
						activeIndex={ activeIndex }
						onSelect={ handleSelectSuggestion }
					/>
				) }
			</div>
		</form>
	);
}
