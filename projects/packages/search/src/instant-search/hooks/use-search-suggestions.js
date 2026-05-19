import debounce from 'debounce';
import { useCallback, useEffect, useRef, useState } from 'react';
import { SERVER_OBJECT_NAME } from '../lib/constants';

/**
 * Attempts to extract a taxonomy name and term slug from a WordPress archive URL.
 * Works for default permalink structures (/category/slug/, /tag/slug/, ?tag=slug).
 *
 * @param {string} url - Archive URL.
 * @return {{taxonomy: string, slug: string}|null} Parsed result or null.
 */
function parseTaxonomyFromUrl( url ) {
	try {
		const u = new URL( url );
		// WPCOM suggestions API format: ?taxonomy=category&term=slug
		const taxonomyParam = u.searchParams.get( 'taxonomy' );
		const termParam = u.searchParams.get( 'term' );
		if ( taxonomyParam && termParam ) {
			return { taxonomy: taxonomyParam, slug: termParam };
		}
		// Pretty permalink format: /tag/slug/ or /category/slug/
		const tagSlug = u.searchParams.get( 'tag' );
		if ( tagSlug ) {
			return { taxonomy: 'post_tag', slug: tagSlug };
		}
		const parts = u.pathname.replace( /\/$/, '' ).split( '/' ).filter( Boolean );
		if ( parts.length >= 2 ) {
			const base = parts[ parts.length - 2 ];
			const slug = parts[ parts.length - 1 ];
			if ( base === 'category' ) return { taxonomy: 'category', slug };
			if ( base === 'tag' ) return { taxonomy: 'post_tag', slug };
		}
	} catch {
		// ignore malformed URLs
	}
	return null;
}

/**
 * @typedef {object} SuggestionItem
 * @property {'query'|'post'|'taxonomy'} type       - The kind of suggestion.
 * @property {string}                    text       - Display text.
 * @property {string}                    [url]      - Navigation URL (post and taxonomy types).
 * @property {string}                    [taxonomy] - Taxonomy name for taxonomy items (e.g. 'category', 'post_tag').
 * @property {string}                    [slug]     - Term slug for taxonomy items.
 */

/**
 * Fetches all suggestion types from the WPCOM suggestions API in a single request.
 *
 * @param {string}      q       - Search query.
 * @param {string}      sId     - Site ID.
 * @param {object}      options - Server options (apiNonce, homeUrl, isPrivateSite, isWpcom).
 * @param {AbortSignal} signal  - Abort signal.
 * @return {Promise<SuggestionItem[]>} Resolved suggestion items.
 */
async function fetchSuggestionsFromApi( q, sId, options, signal ) {
	const { apiNonce, homeUrl, isPrivateSite, isWpcom } = options;
	const path = `/${ encodeURIComponent( sId ) }/search-suggestions?query=${ encodeURIComponent(
		q
	) }&size=5`;
	const url =
		isPrivateSite && isWpcom
			? `${ homeUrl }/wp-json/wpcom-origin/wpcom/v2/sites${ path }`
			: `https://public-api.wordpress.com/wpcom/v2/sites${ path }`;
	const fetchOptions = {
		signal,
		...( isPrivateSite && {
			headers: { 'X-WP-Nonce': apiNonce },
			credentials: 'include',
		} ),
	};
	const response = await fetch( url, fetchOptions );
	if ( ! response.ok ) {
		return [];
	}
	const data = await response.json();

	const toItems = ( items, type ) =>
		( items ?? [] )
			.map( item => {
				const text = item.text ?? '';
				if ( ! text ) {
					return null;
				}
				if ( type === 'post' || type === 'taxonomy' ) {
					const itemUrl = item.url ?? null;
					if ( ! itemUrl ) {
						return null;
					}
					if ( type === 'taxonomy' ) {
						const taxonomy = item.taxonomy ?? parseTaxonomyFromUrl( itemUrl )?.taxonomy ?? null;
						const slug = item.slug ?? parseTaxonomyFromUrl( itemUrl )?.slug ?? null;
						return { type, text, url: itemUrl, taxonomy, slug };
					}
					return { type, text, url: itemUrl };
				}
				return { type: 'query', text };
			} )
			.filter( Boolean );

	return [
		...toItems( data.query_suggestions, 'query' ),
		...toItems( data.taxonomy_suggestions, 'taxonomy' ),
		...toItems( data.title_suggestions, 'post' ),
	];
}

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
