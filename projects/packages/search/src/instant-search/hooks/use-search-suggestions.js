import debounce from 'debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchSuggestions } from '../../search-blocks/store/suggestions-api';
import { SERVER_OBJECT_NAME } from '../lib/constants';

/**
 * Fetches search query suggestions from the WPCOM suggestions API.
 *
 * Reads the per-request config (apiNonce, homeUrl, isPrivateSite, isWpcom)
 * from the legacy server-seeded global. The actual fetch + URL building +
 * response normalization lives in the shared `suggestions-api` module so
 * the Interactivity-API search-input block can call the same code path.
 *
 * @param {object}  args         - Arguments.
 * @param {string}  args.query   - Current input value.
 * @param {string}  args.siteId  - The site ID used in the API URL.
 * @param {boolean} args.enabled - Whether suggestions are enabled.
 * @return {{ suggestions: import('../../search-blocks/store/suggestions-api').SuggestionItem[], isLoading: boolean }} Suggestions state.
 */
export default function useSearchSuggestions( { query, siteId, enabled } ) {
	const [ suggestions, setSuggestions ] = useState( [] );
	const [ isLoading, setIsLoading ] = useState( false );
	const abortRef = useRef( null );

	// `debounce(fn, 0)` defers to the next event loop tick rather than
	// coalescing keystrokes — the calling `SearchForm` component owns the
	// real (150 ms) debounce via its own blur timeout. Don't add a non-zero
	// delay here without also revisiting the form-side timing or both
	// debounces will compound.
	// eslint-disable-next-line react-hooks/exhaustive-deps
	const run = useCallback(
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
				const { apiNonce, homeUrl, isPrivateSite, isWpcom } = window[ SERVER_OBJECT_NAME ] ?? {};
				const results = await fetchSuggestions( {
					query: q,
					siteId: sId,
					isPrivateSite,
					isWpcom,
					homeUrl,
					nonce: apiNonce,
					signal: abortRef.current.signal,
				} );
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
		run( query, siteId );
	}, [ query, siteId, enabled, run ] );

	useEffect( () => {
		return () => {
			run.clear?.();
			if ( abortRef.current ) {
				abortRef.current.abort();
			}
		};
	}, [ run ] );

	return { suggestions, isLoading };
}
