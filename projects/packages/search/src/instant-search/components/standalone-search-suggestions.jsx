import * as React from 'react';
import { useCallback, useEffect, useState } from 'react';
import useSearchSuggestions from '../hooks/use-search-suggestions';
import SearchSuggestions from './search-suggestions';
import './search-suggestions.scss';

/**
 * Attaches a suggestions dropdown to a native WordPress search input.
 * The native input is left in place; this component listens to its events
 * and renders a positioned dropdown beneath it.
 *
 * @param {object}      props        - Component props.
 * @param {HTMLElement} props.input  - The native <input> element to enhance.
 * @param {HTMLElement} props.form   - The native <form> element to submit for query types.
 * @param {string}      props.siteId - Site ID used for the suggestions API.
 * @return {React.ReactElement} Suggestion dropdown portal.
 */
export default function StandaloneSearchSuggestions( { input, form, siteId } ) {
	const [ query, setQuery ] = useState( input.value ?? '' );
	const [ showSuggestions, setShowSuggestions ] = useState( false );
	const [ activeIndex, setActiveIndex ] = useState( -1 );
	const enabled = !! siteId;

	const { suggestions } = useSearchSuggestions( { query, siteId, enabled } );
	const suggestionCount = suggestions.length;

	const handleSelect = useCallback(
		item => {
			setShowSuggestions( false );
			setActiveIndex( -1 );
			if ( item.type === 'post' || item.type === 'taxonomy' ) {
				window.location.href = item.url;
			} else {
				input.value = item.text;
				setQuery( item.text );
				form.submit();
			}
		},
		[ input, form ]
	);

	// Sync query state from native input events.
	useEffect( () => {
		const handleInput = e => {
			const value = e.target.value ?? '';
			setQuery( value );
			setShowSuggestions( value.length >= 1 );
			setActiveIndex( -1 );
		};
		const handleBlur = () => {
			setTimeout( () => {
				setShowSuggestions( false );
				setActiveIndex( -1 );
			}, 150 );
		};
		const handleKeyDown = e => {
			if ( ! showSuggestions && e.key !== 'ArrowDown' ) {
				return;
			}
			switch ( e.key ) {
				case 'ArrowDown':
					e.preventDefault();
					setShowSuggestions( true );
					setActiveIndex( i => ( i < suggestionCount - 1 ? i + 1 : i ) );
					break;
				case 'ArrowUp':
					e.preventDefault();
					setActiveIndex( i => ( i > 0 ? i - 1 : -1 ) );
					break;
				case 'Enter':
					if ( showSuggestions && activeIndex >= 0 && activeIndex < suggestionCount ) {
						e.preventDefault();
						handleSelect( suggestions[ activeIndex ] );
					}
					break;
				case 'Escape':
					setShowSuggestions( false );
					setActiveIndex( -1 );
					break;
			}
		};

		input.addEventListener( 'input', handleInput );
		input.addEventListener( 'blur', handleBlur );
		input.addEventListener( 'keydown', handleKeyDown );
		return () => {
			input.removeEventListener( 'input', handleInput );
			input.removeEventListener( 'blur', handleBlur );
			input.removeEventListener( 'keydown', handleKeyDown );
		};
	}, [ input, showSuggestions, activeIndex, suggestionCount, suggestions, handleSelect ] );

	if ( ! showSuggestions || suggestions.length === 0 ) {
		return null;
	}

	return (
		<SearchSuggestions
			suggestions={ suggestions }
			activeIndex={ activeIndex }
			onSelect={ handleSelect }
		/>
	);
}
