/**
 * Shared `/search-suggestions` client. Two consumers — the overlay's React
 * `useSearchSuggestions` hook and the `search-input` IA view bundle — share
 * URL construction, fetch wiring, and response normalization. Pure module
 * (every config field is passed in).
 */

/**
 * Recover `{ taxonomy, slug }` from an archive URL when the API response
 * omits them directly. Handles WPCOM `?taxonomy=…&term=…`, legacy `?tag=…`,
 * and pretty `/category/<slug>/` and `/tag/<slug>/` permalinks.
 *
 * @param {string} url - Archive URL.
 * @return {{taxonomy: string, slug: string}|null} Parsed pair, or null.
 */
export function parseTaxonomyFromUrl( url ) {
	try {
		const u = new URL( url );
		const taxonomyParam = u.searchParams.get( 'taxonomy' );
		const termParam = u.searchParams.get( 'term' );
		if ( taxonomyParam && termParam ) {
			return { taxonomy: taxonomyParam, slug: termParam };
		}
		const tagSlug = u.searchParams.get( 'tag' );
		if ( tagSlug ) {
			return { taxonomy: 'post_tag', slug: tagSlug };
		}
		const parts = u.pathname.replace( /\/$/, '' ).split( '/' ).filter( Boolean );
		if ( parts.length >= 2 ) {
			const base = parts[ parts.length - 2 ];
			const slug = parts[ parts.length - 1 ];
			if ( base === 'category' ) {
				return { taxonomy: 'category', slug };
			}
			if ( base === 'tag' ) {
				return { taxonomy: 'post_tag', slug };
			}
		}
	} catch {
		// Malformed URL — caller navigates to `item.url` as-is.
	}
	return null;
}

/**
 * Build the `/search-suggestions` URL. Private WPCOM sites hit the local
 * `wpcom-origin` proxy (cookies + nonce); public sites hit the public API.
 *
 * @param {object}  args               - Arguments.
 * @param {string}  args.siteId        - WPCOM site id.
 * @param {string}  args.query         - Search query.
 * @param {boolean} args.isPrivateSite - Private site flag.
 * @param {boolean} args.isWpcom       - WPCOM flag.
 * @param {string}  args.homeUrl       - Site home URL.
 * @param {number}  [args.size]        - Suggestions per group; default 5.
 * @return {string} Fully-qualified request URL.
 */
export function buildSuggestionsUrl( {
	siteId,
	query,
	isPrivateSite,
	isWpcom,
	homeUrl,
	size = 5,
} ) {
	const path = `/${ encodeURIComponent( siteId ) }/search-suggestions?query=${ encodeURIComponent(
		query
	) }&size=${ encodeURIComponent( size ) }`;
	if ( isPrivateSite && isWpcom ) {
		return `${ homeUrl }/wp-json/wpcom-origin/wpcom/v2/sites${ path }`;
	}
	return `https://public-api.wordpress.com/wpcom/v2/sites${ path }`;
}

/**
 * @typedef {object} SuggestionItem
 * @property {'query'|'post'|'taxonomy'} type       - Kind of suggestion.
 * @property {string}                    text       - Display text.
 * @property {string}                    [url]      - Navigation URL.
 * @property {string}                    [taxonomy] - Taxonomy name.
 * @property {string}                    [slug]     - Term slug.
 */

/**
 * Normalize one API response array. Drops items with no `text`; drops
 * `post`/`taxonomy` items with no `url` (they need it for navigation /
 * taxonomy recovery). `query` items don't carry a url.
 *
 * @param {Array<object>}             items - Raw API items.
 * @param {'query'|'post'|'taxonomy'} type  - Discriminator.
 * @return {SuggestionItem[]} Normalized items.
 */
function toItems( items, type ) {
	return ( items ?? [] )
		.map( item => {
			const text = item?.text ?? '';
			if ( ! text ) {
				return null;
			}
			if ( type === 'post' || type === 'taxonomy' ) {
				const itemUrl = item.url ?? null;
				if ( ! itemUrl ) {
					return null;
				}
				if ( type === 'taxonomy' ) {
					const fallback = parseTaxonomyFromUrl( itemUrl );
					return {
						type,
						text,
						url: itemUrl,
						taxonomy: item.taxonomy ?? fallback?.taxonomy ?? null,
						slug: item.slug ?? fallback?.slug ?? null,
					};
				}
				return { type, text, url: itemUrl };
			}
			return { type: 'query', text };
		} )
		.filter( Boolean );
}

/**
 * Fetch + normalize suggestions. Returns `[]` on non-OK HTTP (non-critical
 * surface, silent degrade). AbortError propagates — both consumers swallow it.
 *
 * @param {object}      args               - Arguments.
 * @param {string}      args.query         - Search query.
 * @param {string}      args.siteId        - WPCOM site id.
 * @param {boolean}     args.isPrivateSite - Private site flag.
 * @param {boolean}     args.isWpcom       - WPCOM flag.
 * @param {string}      args.homeUrl       - Site home URL.
 * @param {string}      [args.nonce]       - Sent as `X-WP-Nonce` on private sites.
 * @param {AbortSignal} [args.signal]      - Caller-driven cancellation.
 * @param {number}      [args.size]        - Suggestions per group.
 * @return {Promise<SuggestionItem[]>} Ordered query → taxonomy → post.
 */
export async function fetchSuggestions( {
	query,
	siteId,
	isPrivateSite,
	isWpcom,
	homeUrl,
	nonce,
	signal,
	size,
} ) {
	const url = buildSuggestionsUrl( { siteId, query, isPrivateSite, isWpcom, homeUrl, size } );
	const fetchOptions = {
		signal,
		...( isPrivateSite && {
			headers: { 'X-WP-Nonce': nonce ?? '' },
			credentials: 'include',
		} ),
	};
	const response = await fetch( url, fetchOptions );
	if ( ! response.ok ) {
		return [];
	}
	const data = await response.json();
	return [
		...toItems( data.query_suggestions, 'query' ),
		...toItems( data.taxonomy_suggestions, 'taxonomy' ),
		...toItems( data.title_suggestions, 'post' ),
	];
}
