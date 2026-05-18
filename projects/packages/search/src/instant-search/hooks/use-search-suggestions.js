import debounce from 'debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSuggestionsFromApi } from '../../search-suggestions/api';
import { SERVER_OBJECT_NAME } from '../lib/constants';

/**
 * @typedef {object} SuggestionItem
 * @property {'query'|'post'|'taxonomy'} type       - The kind of suggestion.
 * @property {string}                    text       - Display text.
 * @property {string}                    [url]      - Navigation URL (post and taxonomy types).
 * @property {string}                    [taxonomy] - Taxonomy name for taxonomy items (e.g. 'category', 'post_tag').
 * @property {string}                    [slug]     - Term slug for taxonomy items.
 */

/**
 * Fetches search query suggestions from the WPCOM suggestions API.
 *
 * @param {object}  args         - Arguments.
 * @param {string}  args.query   - Current input value.
 * @param {string}  args.siteId  - The site ID used in the API URL.
 * @param {boolean} args.enabled - Whether suggestions are enabled.
 * @return {{ suggestions: SuggestionItem[], isLoading: boolean }} Suggestions state.
 */
export default function useSearchSuggestions( { query, siteId, enabled } ) {
	const [ suggestions, setSuggestions ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const abortRef = useRef( null );

	// eslint-disable-next-line react-hooks/exhaustive-deps
	const fetchSuggestions = useCallback(
		debounce( async ( q, sId ) => {
			if ( ! q || ! sId ) {
				setSuggestions( [] );
				return;
			}

			if ( abortRef.current ) {
				abortRef.current.abort();
			}
			abortRef.current = new AbortController();
			setIsLoading( true );

			try {
				const options = window[ SERVER_OBJECT_NAME ] ?? {};
				const results = await fetchSuggestionsFromApi( q, sId, options, abortRef.current.signal );
				setSuggestions( results );
			} catch ( err ) {
				if ( err.name !== 'AbortError' ) {
					setSuggestions( [] );
				}
			} finally {
				setIsLoading( false );
			}
		}, 0 ),
		[]
	);

	useEffect( () => {
		if ( ! enabled ) {
			setSuggestions( [] );
			return;
		}
		fetchSuggestions( query, siteId );
	}, [ query, siteId, enabled, fetchSuggestions ] );

	useEffect( () => {
		return () => {
			fetchSuggestions.clear?.();
			if ( abortRef.current ) {
				abortRef.current.abort();
			}
		};
	}, [ fetchSuggestions ] );

	return { suggestions, isLoading };
}
