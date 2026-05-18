/**
 * Attempts to extract a taxonomy name and term slug from a WordPress archive URL.
 * Works for default permalink structures (/category/slug/, /tag/slug/, ?tag=slug).
 *
 * @param {string} url - Archive URL.
 * @return {{taxonomy: string, slug: string}|null} Parsed result or null.
 */
export function parseTaxonomyFromUrl( url ) {
	try {
		const base = typeof window !== 'undefined' ? window.location.origin : 'https://example.com';
		const u = new URL( url, base );
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
			const taxonomyBase = parts[ parts.length - 2 ];
			const slug = parts[ parts.length - 1 ];
			if ( taxonomyBase === 'category' ) {
				return { taxonomy: 'category', slug };
			}
			if ( taxonomyBase === 'tag' ) {
				return { taxonomy: 'post_tag', slug };
			}
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
export async function fetchSuggestionsFromApi( q, sId, options = {}, signal = undefined ) {
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
						const parsedTaxonomy = parseTaxonomyFromUrl( itemUrl );
						const taxonomy = item.taxonomy ?? parsedTaxonomy?.taxonomy ?? null;
						const slug = item.slug ?? parsedTaxonomy?.slug ?? null;
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
