/**
 * Shared client for the WPCOM `/search-suggestions` endpoint.
 *
 * Two consumers depend on this contract: the React `useSearchSuggestions`
 * hook used by the instant-search overlay, and the Interactivity-API view
 * bundle for the `jetpack-search/search-input` block (no React on that side —
 * the generator action calls `fetchSuggestions` directly with its own
 * `AbortController`).
 *
 * Keeping URL construction, the fetch wiring, and the response-shape
 * normalization in one module means both surfaces stay in lock-step when
 * the API or auth path evolves. The module is pure — every config field
 * (siteId, isPrivateSite, isWpcom, homeUrl, nonce) is passed in, so it
 * has no implicit dependency on a window global.
 */

/**
 * Best-effort taxonomy/term recovery from a WordPress archive URL.
 *
 * The suggestions API normally returns `taxonomy` and `slug` directly, but
 * older response bodies omit them — in that case we fall back to parsing
 * the archive URL the API also returns. Three URL shapes are covered:
 * WPCOM `?taxonomy=…&term=…` (canonical), legacy `?tag=…` (defaults to the
 * built-in `post_tag` taxonomy), and pretty permalinks `/category/<slug>/`
 * and `/tag/<slug>/`.
 *
 * @param {string} url - Archive URL from a `taxonomy_suggestions[]` item.
 * @return {{taxonomy: string, slug: string}|null} Parsed pair, or null when the URL doesn't match any known shape.
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
		// Malformed URL — caller falls back to navigating to `item.url` as-is.
	}
	return null;
}

/**
 * Build the WPCOM `/search-suggestions` request URL.
 *
 * Private WPCOM sites talk to the local `wpcom-origin` proxy so cookies are
 * sent and the nonce check passes; public sites hit the public API directly.
 * The two URL shapes are otherwise identical, so the caller can swap freely
 * between them by flipping `isPrivateSite`.
 *
 * @param {object}  args               - Arguments.
 * @param {string}  args.siteId        - Numeric WPCOM site id (URL-encoded).
 * @param {string}  args.query         - Raw search query (URL-encoded).
 * @param {boolean} args.isPrivateSite - True when the site is private/atomic.
 * @param {boolean} args.isWpcom       - True when running on WPCOM infra.
 * @param {string}  args.homeUrl       - Site home URL (used for private proxy).
 * @param {number}  [args.size]        - Suggestions per group; defaults to 5.
 * @return {string} The fully-qualified request URL.
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
 * @property {'query'|'post'|'taxonomy'} type       - The kind of suggestion.
 * @property {string}                    text       - Display text.
 * @property {string}                    [url]      - Navigation URL (post and taxonomy types).
 * @property {string}                    [taxonomy] - Taxonomy name for taxonomy items (e.g. 'category', 'post_tag').
 * @property {string}                    [slug]     - Term slug for taxonomy items.
 */

/**
 * Normalize one API response array into a flat list of `SuggestionItem`s.
 *
 * Items without display text are dropped. `post` / `taxonomy` items without
 * a `url` are dropped too, since both rely on `url` to navigate or to recover
 * taxonomy/slug pairs. `query` items can't be dropped on a missing url because
 * they don't carry one in the first place — they just fill the input.
 *
 * @param {Array<object>}             items - Raw API items.
 * @param {'query'|'post'|'taxonomy'} type  - Discriminator for the group.
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
 * Fetch and normalize suggestions for a single query.
 *
 * Returns an empty array on any non-OK HTTP status — suggestions are a
 * non-critical surface, so 4xx/5xx silently degrades to "no suggestions"
 * rather than throwing into the caller. Aborts are propagated to the caller
 * via the original `AbortError`, which both consumers swallow.
 *
 * @param {object}      args               - Arguments.
 * @param {string}      args.query         - Search query.
 * @param {string}      args.siteId        - WPCOM site id.
 * @param {boolean}     args.isPrivateSite - True for private/atomic sites.
 * @param {boolean}     args.isWpcom       - True when running on WPCOM infra.
 * @param {string}      args.homeUrl       - Site home URL.
 * @param {string}      [args.nonce]       - REST nonce; sent as `X-WP-Nonce` on private sites.
 * @param {AbortSignal} [args.signal]      - Abort signal for caller-driven cancellation.
 * @param {number}      [args.size]        - Suggestions per group.
 * @return {Promise<SuggestionItem[]>} Resolved suggestions, ordered query → taxonomy → post.
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
