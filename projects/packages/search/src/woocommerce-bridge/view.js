/**
 * WooCommerce Product Filters → Jetpack Search client-side bridge.
 *
 * Drives WC's Product Filters blocks entirely from the front end. Server
 * renders empty filter shells (no product query exists on a non-product
 * page, so WC's FilterDataProvider produces zero items). This module then
 * fetches aggregations from the WPCOM v1.3 search API using the same
 * routing (`buildSearchUrl()`) the rest of the Jetpack Search blocks use —
 * public sites hit `public-api.wordpress.com` unauthenticated, private
 * Jetpack sites use `/wp-json/jetpack/v4/search` with `X-WP-Nonce`, private
 * WPCOM sites use `/wp-json/wpcom-origin/v1.3/...` with cookie auth.
 *
 * Buckets are projected into per-item DOM shape that matches the class
 * names emitted by ProductFilterCheckboxList.php — so existing WC styles
 * apply unchanged — and injected into the empty `…__items` host inside
 * each filter region. Click handling uses native event listeners rather
 * than WC's `data-wp-on--change` directive: the Interactivity API only
 * walks the DOM during initial page hydration and does not reprocess
 * dynamically inserted elements, so directives on injected nodes are
 * inert. The native listener toggles a slug under the filter key, pushes
 * the WC-format URL, re-fetches aggregations, and re-renders.
 *
 * Out of V2 scope: price (range slider), status (in-stock / out-of-stock),
 * rating filters. Those need range/term aggregations not exposed by the
 * standard WPCOM search API and are tracked as follow-ups.
 *
 * Runtime config (siteId, apiRoot, isPrivateSite, isWpcom, nonce, homeUrl,
 * filterConfigs) is seeded server-side via `wp_interactivity_state` under
 * the `jetpack-search-wc-bridge` namespace. See
 * class-woocommerce-filters-bridge.php.
 */

import { store } from '@wordpress/interactivity';
import { buildSearchUrl, resolveFilterFields } from '../search-blocks/store/api';

const BRIDGE_NAMESPACE = 'jetpack-search-wc-bridge';

const { state: bridgeState } = store( BRIDGE_NAMESPACE, {} );

/**
 * Reverse map: WC's `filterType` (e.g. `taxonomy/product_cat`,
 * `attribute/color`) → our seeded filterConfig key (e.g. `categories`,
 * `filter_color`). We resolve this at runtime so changes to WC's URL
 * format only require changes here, not server-side.
 *
 * @return {object} `{ [wcFilterType]: filterKey }`
 */
function buildWcFilterTypeMap() {
	const map = {};
	for ( const [ filterKey, cfg ] of Object.entries( bridgeState?.filterConfigs ?? {} ) ) {
		if ( cfg.filterType !== 'taxonomy' || ! cfg.taxonomy ) {
			continue;
		}
		// Built-in product taxonomies → `taxonomy/<taxonomy>`.
		map[ `taxonomy/${ cfg.taxonomy }` ] = filterKey;
		// pa_* attribute taxonomies are also addressed as `attribute/<short>`.
		if ( cfg.taxonomy.startsWith( 'pa_' ) ) {
			map[ `attribute/${ cfg.taxonomy.slice( 3 ) }` ] = filterKey;
		}
	}
	return map;
}

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
 * Project ES buckets into WC item shape. ES buckets keyed via the
 * `slug_slash_name` agg field carry both slug and display label; for
 * plain-keyed aggregations we fall back to the slug for the label.
 *
 * @param {Array}       buckets       - ES bucket array.
 * @param {object}      filterConfig  - filterConfig entry the buckets belong to.
 * @param {string}      wcFilterType  - WC's filterType (e.g. `taxonomy/product_cat`).
 * @param {Set<string>} selectedSlugs - Slugs currently selected from URL.
 * @return {Array<object>} Item objects ready to be embedded in `data-wp-context`.
 */
function bucketsToItems( buckets, filterConfig, wcFilterType, selectedSlugs ) {
	if ( ! Array.isArray( buckets ) ) {
		return [];
	}
	const { bucketFormat } = resolveFilterFields( filterConfig );
	return buckets
		.map( bucket => {
			const rawKey = String( bucket.key ?? '' );
			let value, label;
			if ( bucketFormat === 'slash' && rawKey.includes( '/' ) ) {
				const idx = rawKey.indexOf( '/' );
				value = rawKey.slice( 0, idx );
				label = rawKey.slice( idx + 1 ) || value;
			} else {
				value = rawKey;
				label = rawKey;
			}
			return {
				value,
				type: wcFilterType,
				label,
				count: Number( bucket.doc_count ) || 0,
				selected: selectedSlugs.has( value ),
				ariaLabel: label,
			};
		} )
		.filter( item => item.value !== '' );
}

/**
 * HTML attribute escaping. Conservative — covers the values we emit
 * (slugs, labels, JSON-encoded contexts) without depending on a runtime.
 *
 * @param {string|number} value - Raw value to embed in an attribute.
 * @return {string} Escaped value.
 */
function escAttr( value ) {
	return String( value )
		.replace( /&/g, '&amp;' )
		.replace( /"/g, '&quot;' )
		.replace( /'/g, '&#39;' )
		.replace( /</g, '&lt;' )
		.replace( />/g, '&gt;' );
}

/**
 * Body-text escaping for label spans.
 *
 * @param {string|number} value - Raw text to embed as element content.
 * @return {string} Escaped text.
 */
function escText( value ) {
	return String( value ).replace( /&/g, '&amp;' ).replace( /</g, '&lt;' ).replace( />/g, '&gt;' );
}

/**
 * Build the per-item `<div>` markup. Class names match
 * ProductFilterCheckboxList.php so existing WC styles apply unchanged.
 *
 * Click handling intentionally does NOT use WC's Interactivity directives
 * (`data-wp-on--change`, `data-wp-bind--checked`): the Interactivity API
 * walks the DOM once on initial page load and does not re-process
 * dynamically inserted nodes — directives on injected elements are inert.
 * Native event listeners are attached after injection by
 * `wireItemListeners()` instead. The `data-jp-filter-key` /
 * `data-jp-filter-value` attributes are the listener's identification
 * channel, kept distinct from the `data-wp-*` namespace.
 *
 * @param {object} item      - Item shape produced by `bucketsToItems()`.
 * @param {string} filterKey - filterConfig key (e.g. `categories`, `filter_color`).
 * @return {string} HTML for one filter row.
 */
function renderItemHtml( item, filterKey ) {
	const itemId = `${ item.type }-${ item.value }`;

	return [
		`<div class="wc-block-product-filter-checkbox-list__item">`,
		`<label class="wc-block-product-filter-checkbox-list__label" for="${ escAttr( itemId ) }">`,
		'<span class="wc-block-product-filter-checkbox-list__input-wrapper">',
		`<input id="${ escAttr(
			itemId
		) }" class="wc-block-product-filter-checkbox-list__input" type="checkbox"`,
		` aria-label="${ escAttr( item.ariaLabel ?? item.label ) }"`,
		` value="${ escAttr( item.value ) }"`,
		` data-jp-filter-key="${ escAttr( filterKey ) }"`,
		` data-jp-filter-value="${ escAttr( item.value ) }"`,
		item.selected ? ' checked' : '',
		'>',
		'<svg class="wc-block-product-filter-checkbox-list__mark" viewBox="0 0 10 8" fill="none" xmlns="http://www.w3.org/2000/svg">',
		'<path d="M9.25 1.19922L3.75 6.69922L1 3.94922" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>',
		'</svg>',
		'</span>',
		'<span class="wc-block-product-filter-checkbox-list__text-wrapper">',
		`<span class="wc-block-product-filter-checkbox-list__text">${ escText( item.label ) }</span>`,
		`<span class="wc-block-product-filter-checkbox-list__count">(${ item.count })</span>`,
		'</span>',
		'</label>',
		'</div>',
	].join( '' );
}

/**
 * Walk every filter region on the page that exposes a `filterType` we
 * recognize (taxonomy/* or attribute/*). For each, locate the
 * `…__items` host inside the region's checkbox-list shell and replace
 * its contents with freshly-rendered items derived from `aggregations`.
 *
 * @param {object}          aggregations - ES aggregations response, keyed by filterConfig key.
 * @param {URLSearchParams} searchParams - URL params used to compute selected state.
 */
function applyToFilterBlocks( aggregations, searchParams ) {
	if ( ! aggregations || ! bridgeState?.filterConfigs ) {
		return;
	}

	const wcTypeMap = buildWcFilterTypeMap();
	const activeFilters = urlToActiveFilters( searchParams, bridgeState.filterConfigs );

	const filterRegions = document.querySelectorAll(
		'[data-wp-interactive*="product-filters"][data-wp-context*="filterType"]'
	);

	filterRegions.forEach( region => {
		let wcFilterType;
		try {
			const ctx = JSON.parse( region.getAttribute( 'data-wp-context' ) );
			wcFilterType = ctx?.filterType;
		} catch {
			return;
		}
		if ( ! wcFilterType ) {
			return;
		}
		const filterKey = wcTypeMap[ wcFilterType ];
		if ( ! filterKey ) {
			// Unsupported in V2 (price, status, rating).
			return;
		}

		const buckets = aggregations[ filterKey ]?.buckets;
		if ( ! Array.isArray( buckets ) ) {
			return;
		}

		const itemHost = region.querySelector( '.wc-block-product-filter-checkbox-list__items' );
		if ( ! itemHost ) {
			return;
		}
		const config = bridgeState.filterConfigs[ filterKey ];
		const selectedSlugs = new Set( activeFilters[ filterKey ] ?? [] );
		const items = bucketsToItems( buckets, config, wcFilterType, selectedSlugs );
		itemHost.innerHTML = items.map( item => renderItemHtml( item, filterKey ) ).join( '' );
		wireItemListeners( itemHost );
	} );
}

/**
 * Attach native change listeners to every input under `host`. Single
 * delegated listener at the host level — survives item re-renders only
 * when the host element itself stays in place (which it does, since we
 * `innerHTML` into it rather than replacing it).
 *
 * @param {Element} host - The `…__items` div whose inputs to wire.
 */
function wireItemListeners( host ) {
	if ( host.dataset.jpListenerBound === '1' ) {
		return;
	}
	host.dataset.jpListenerBound = '1';
	host.addEventListener( 'change', event => {
		const input = event.target;
		if ( ! ( input instanceof HTMLInputElement ) ) {
			return;
		}
		const filterKey = input.getAttribute( 'data-jp-filter-key' );
		const filterValue = input.getAttribute( 'data-jp-filter-value' );
		if ( ! filterKey || ! filterValue ) {
			return;
		}
		toggleFilterAndNavigate( filterKey, filterValue );
	} );
}

/**
 * Mutate the URL to toggle one filter value, then push + fetch + render.
 * Mirrors what WC's `actions.toggleFilter` would do, but driven entirely
 * from native event listeners since Interactivity directives do not
 * hydrate on injected items.
 *
 * @param {string} filterKey   - filterConfig key (e.g. `categories`).
 * @param {string} filterValue - Slug being toggled.
 */
async function toggleFilterAndNavigate( filterKey, filterValue ) {
	const url = new URL( window.location.href );
	const current = ( url.searchParams.get( filterKey ) ?? '' )
		.split( ',' )
		.map( s => s.trim() )
		.filter( Boolean );
	const idx = current.indexOf( filterValue );
	if ( idx === -1 ) {
		current.push( filterValue );
	} else {
		current.splice( idx, 1 );
	}
	if ( current.length === 0 ) {
		url.searchParams.delete( filterKey );
	} else {
		url.searchParams.set( filterKey, current.join( ',' ) );
	}

	window.history.pushState( {}, '', url.href );
	const data = await fetchAggregations( url.searchParams );
	if ( data?.aggregations ) {
		applyToFilterBlocks( data.aggregations, url.searchParams );
	}
}

// Initial hydration on every page load. Browser back/forward also fires
// `popstate`, in which case we rerun without pushing a duplicate history
// entry.
if ( typeof window !== 'undefined' ) {
	const hydrate = async () => {
		const data = await fetchAggregations( new URL( window.location.href ).searchParams );
		if ( data?.aggregations ) {
			applyToFilterBlocks( data.aggregations, new URL( window.location.href ).searchParams );
		}
	};
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', hydrate, { once: true } );
	} else {
		hydrate();
	}
	window.addEventListener( 'popstate', hydrate );
}
