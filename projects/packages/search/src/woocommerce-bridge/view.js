/**
 * WooCommerce Product Filters → Jetpack Search client-side bridge.
 *
 * Overrides the `woocommerce/product-filters` Interactivity store at
 * runtime so that filter clicks fetch aggregations from the WPCOM v1.3
 * search API instead of triggering a full HTML round-trip via
 * `@wordpress/interactivity-router`. Reuses `buildSearchUrl()` from the
 * existing search-blocks store, which already routes correctly across
 * three site shapes: public sites hit `public-api.wordpress.com/rest/v1.3`
 * unauthenticated, private Jetpack sites use `/wp-json/jetpack/v4/search`
 * with `X-WP-Nonce`, and private WPCOM sites use `/wp-json/wpcom-origin/v1.3/...`
 * with cookie auth.
 *
 * Runtime config (siteId, apiRoot, isPrivateSite, isWpcom, nonce, homeUrl,
 * filterConfigs) is seeded server-side via `wp_interactivity_state` under
 * the `jetpack-search-wc-bridge` namespace. See class-woocommerce-filters-bridge.php.
 *
 * Known limitation: WC's ProductFilterCheckboxList renders item counts as
 * static PHP-emitted text, with no `data-wp-text` binding. So mutating
 * the WC store's filterData.items[i].count would update state but not the
 * DOM. Until WC adds reactive bindings, the bridge updates count nodes
 * directly via DOM mutation. The state mutation is still issued so that
 * any future binding will pick it up automatically.
 */

import { store } from '@wordpress/interactivity';
import { buildSearchUrl, resolveFilterFields } from '../search-blocks/store/api';

const BRIDGE_NAMESPACE = 'jetpack-search-wc-bridge';
const WC_NAMESPACE = 'woocommerce/product-filters';

const { state: bridgeState } = store( BRIDGE_NAMESPACE, {} );

/**
 * Read WC-format URL params and produce the activeFilters shape that
 * `buildSearchUrl()` expects (keyed by filterConfig key, comma-joined
 * values split into an array).
 *
 * @param {URLSearchParams} searchParams  - Current URL search params.
 * @param {object}          filterConfigs - Map of registered filter configs.
 * @return {object} `{ [filterKey]: string[] }`
 */
function urlToActiveFilters( searchParams, filterConfigs ) {
	const active = {};
	for ( const key of Object.keys( filterConfigs ?? {} ) ) {
		const raw = searchParams.get( key );
		if ( raw ) {
			active[ key ] = raw
				.split( ',' )
				.map( s => s.trim() )
				.filter( Boolean );
		}
	}
	return active;
}

/**
 * Issue an aggregation request to the WPCOM v1.3 search API using the
 * same routing as the search-blocks store. Returns the parsed response or
 * null on failure (so callers can no-op cleanly).
 *
 * @param {URLSearchParams} searchParams - URL params to translate into filters.
 * @return {Promise<object|null>} Parsed v1.3 search response, or null on error.
 */
async function fetchAggregations( searchParams ) {
	if ( ! bridgeState?.siteId ) {
		return null;
	}

	const activeFilters = urlToActiveFilters( searchParams, bridgeState.filterConfigs );

	const url = buildSearchUrl( {
		siteId: bridgeState.siteId,
		searchQuery: '',
		sortOrder: 'relevance',
		pageHandle: null,
		isPrivateSite: bridgeState.isPrivateSite,
		isWpcom: bridgeState.isWpcom,
		apiRoot: bridgeState.apiRoot,
		homeUrl: bridgeState.homeUrl,
		activeFilters,
		filterConfigs: bridgeState.filterConfigs,
	} );

	try {
		const response = await fetch( url, {
			headers: bridgeState.isPrivateSite ? { 'X-WP-Nonce': bridgeState.nonce } : {},
			credentials: bridgeState.isPrivateSite ? 'include' : 'same-origin',
		} );
		if ( ! response.ok ) {
			return null;
		}
		return await response.json();
	} catch {
		return null;
	}
}

/**
 * Build a `{ slug → count }` map for one filterConfig from an ES bucket
 * array. Buckets come back keyed by either the slug alone or
 * `slug/Display Name` depending on the agg field — see
 * `resolveFilterFields()` in search-blocks/store/api.js.
 *
 * @param {Array}  buckets      - ES bucket array, each `{ key, doc_count }`.
 * @param {object} filterConfig - The filterConfig entry the buckets belong to.
 * @return {object} Map of bucket slug → count.
 */
function bucketsToCountMap( buckets, filterConfig ) {
	const map = {};
	if ( ! Array.isArray( buckets ) ) {
		return map;
	}
	const { bucketFormat } = resolveFilterFields( filterConfig );
	for ( const bucket of buckets ) {
		const key = bucketFormat === 'slash' ? String( bucket.key ).split( '/' )[ 0 ] : bucket.key;
		map[ key ] = Number( bucket.doc_count ) || 0;
	}
	return map;
}

/**
 * Update visible count nodes for each WC filter block on the page.
 *
 * This is a stop-gap until WC's `ProductFilterCheckboxList.php` binds the
 * count via `data-wp-text`. We locate each filter block by its inline
 * `data-wp-context` JSON (which carries `filterData.items` with slug +
 * count), match items against ES buckets, and rewrite the corresponding
 * count `<span>`. Items whose slug isn't returned by ES are zeroed.
 *
 * The matching contract (filterKey ←→ block) relies on `filterData`
 * carrying either a `filterKey` or a `taxonomy` field that we can resolve
 * back to one of our registered filterConfigs. That's the brittle part —
 * WC's exact field names for filterData should be confirmed in a follow-up
 * before this ships beyond a PoC.
 *
 * @param {object} aggregations - ES aggregation buckets keyed by filterConfig key.
 */
function applyAggregationsToDom( aggregations ) {
	if ( ! aggregations || ! bridgeState?.filterConfigs ) {
		return;
	}

	// Reverse map: taxonomy slug → filterConfig key.
	const taxonomyToFilterKey = {};
	for ( const [ key, config ] of Object.entries( bridgeState.filterConfigs ) ) {
		if ( config.taxonomy ) {
			taxonomyToFilterKey[ config.taxonomy ] = key;
		}
	}

	document.querySelectorAll( '[data-wp-context]' ).forEach( node => {
		let context;
		try {
			context = JSON.parse( node.getAttribute( 'data-wp-context' ) );
		} catch {
			return;
		}
		const filterData = context?.filterData;
		if ( ! filterData?.items || ! Array.isArray( filterData.items ) ) {
			return;
		}

		// WC's filterData.taxonomy is the canonical signal we register against;
		// fall back to filterData.filterKey if present.
		const filterKey = filterData.filterKey ?? taxonomyToFilterKey[ filterData.taxonomy ] ?? null;
		if ( ! filterKey ) {
			return;
		}
		const config = bridgeState.filterConfigs[ filterKey ];
		const buckets = aggregations[ filterKey ]?.buckets;
		if ( ! buckets ) {
			return;
		}

		const counts = bucketsToCountMap( buckets, config );

		// 1. Mutate the parsed context so any future data-wp-text binding
		//    on count gets fresh values.
		filterData.items = filterData.items.map( item => ( {
			...item,
			count: counts[ item.value ] ?? 0,
		} ) );
		try {
			node.setAttribute( 'data-wp-context', JSON.stringify( context ) );
		} catch {
			// Setting back is best-effort; failure shouldn't block the DOM
			// surgery below.
		}

		// 2. Rewrite the visible count nodes inline.
		const inputs = node.querySelectorAll( 'input[type="checkbox"][value]' );
		inputs.forEach( input => {
			const count = counts[ input.value ] ?? 0;
			const li = input.closest( 'li' );
			const countEl = li?.querySelector( '.wc-block-product-filter-checkbox-list__count' );
			if ( countEl ) {
				countEl.textContent = `(${ count })`;
			}
		} );
	} );
}

/**
 * Compose the new URL the user is navigating to, using WC's own state.params
 * getter. Mirrors `actions.navigate` in WC's frontend.ts so the URL format
 * stays identical to what WC writes today.
 *
 * @param {object} wcState - Snapshot of `state` inside woocommerce/product-filters.
 * @return {URL} New URL with WC-format filter params.
 */
function buildNextUrl( wcState ) {
	const url = new URL( window.location.href );
	// Drop existing filter-shaped params, preserve unrelated ones (utm_*, etc.).
	const known = new Set( Object.keys( bridgeState.filterConfigs ?? {} ) );
	known.add( 'min_price' );
	known.add( 'max_price' );
	known.add( 'rating_filter' );
	known.add( 'filter_stock_status' );
	for ( const key of Array.from( url.searchParams.keys() ) ) {
		if ( known.has( key ) || key.startsWith( 'query_type_' ) ) {
			url.searchParams.delete( key );
		}
	}
	for ( const [ key, value ] of Object.entries( wcState?.params ?? {} ) ) {
		if ( value !== '' && value !== null && value !== undefined ) {
			url.searchParams.set( key, value );
		}
	}
	return url;
}

// Override WC's `actions.navigate` so filter clicks no longer trigger a
// full HTML round-trip. Interactivity API merges store definitions
// last-write-wins on actions, so this replaces WC's implementation.
store( WC_NAMESPACE, {
	actions: {
		*navigate() {
			const wcState = this?.state ?? {};
			const url = buildNextUrl( wcState );

			window.history.pushState( {}, '', url.href );

			const data = yield fetchAggregations( url.searchParams );
			if ( data?.aggregations ) {
				applyAggregationsToDom( data.aggregations );
			}
		},
	},
} );

// Initial hydration: when the page is direct-loaded with filters in the
// URL (e.g. `/shop/?categories=foo`), WC's server render emits unfiltered
// counts. Re-fetch from ES on first paint to bring counts into agreement.
if ( typeof window !== 'undefined' ) {
	const hydrate = async () => {
		const data = await fetchAggregations( new URL( window.location.href ).searchParams );
		if ( data?.aggregations ) {
			applyAggregationsToDom( data.aggregations );
		}
	};
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', hydrate, { once: true } );
	} else {
		hydrate();
	}
}
