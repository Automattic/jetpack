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
 * Filter coverage today: taxonomy (product_cat, product_tag,
 * product_brand), attributes (pa_*), stock status
 * (filter_stock_status — scalar URL key, ES field
 * `meta._stock_status.value`), active-filter removable chips driven from
 * URL state, both display variants (checkbox-list and chips), and the
 * price slider via the actions.navigate override.
 *
 * Out of scope (TODOs): rating filter (needs a range aggregation on
 * `meta._wc_average_rating.double` plus star-bucket rendering, which
 * requires `buildAggregations` to learn about non-`terms` aggs); i18n —
 * stock-status labels are hardcoded English, follow-up should read them
 * off the existing server-rendered items or seed via
 * wp_interactivity_state.
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
		if ( cfg.filterType === 'taxonomy' && cfg.taxonomy ) {
			// Built-in product taxonomies → `taxonomy/<taxonomy>`.
			map[ `taxonomy/${ cfg.taxonomy }` ] = filterKey;
			// pa_* attribute taxonomies are also addressed as `attribute/<short>`.
			if ( cfg.taxonomy.startsWith( 'pa_' ) ) {
				map[ `attribute/${ cfg.taxonomy.slice( 3 ) }` ] = filterKey;
			}
		} else if ( cfg.filterType === 'wc_stock_status' ) {
			map.status = filterKey;
		}
	}
	return map;
}

/**
 * Friendly labels for known scalar filter slugs. WC server-renders these
 * with localized strings via `wc_get_product_stock_status_options()`,
 * but the bridge replaces the items list at innerHTML time and ES
 * buckets only carry the slug. Hardcoded English labels here mean
 * status options round-trip readably; a follow-up should read the
 * localized labels off the existing server-rendered DOM (or seed them
 * via wp_interactivity_state) so non-English sites get translated.
 */
const STOCK_STATUS_LABELS = {
	instock: 'In stock',
	outofstock: 'Out of stock',
	onbackorder: 'On backorder',
};

/**
 * Read URL params and produce the activeFilters shape that
 * `buildSearchUrl()` expects (keyed by filterConfig key, values as array).
 *
 * URL format is the same array-shape pattern used by the Jetpack Search
 * blocks (`?<filterKey>[]=value`), so a URL like
 * `?product_cat[]=shirts&product_cat[]=pants` is interchangeable across
 * any filter-checkbox block on the page (WC bridge or JP Search) that
 * registers `product_cat` as a filterKey.
 *
 * @param {URLSearchParams} searchParams  - Current URL search params.
 * @param {object}          filterConfigs - Map of registered filter configs.
 * @return {object} `{ [filterKey]: string[] }`
 */
function urlToActiveFilters( searchParams, filterConfigs ) {
	const active = {};
	for ( const [ key, config ] of Object.entries( filterConfigs ?? {} ) ) {
		// Scalar comma-joined first (e.g. WC's `?filter_stock_status=instock,outofstock`)
		// when the filterConfig opts into that URL shape.
		if ( config?.urlFormat === 'scalar' ) {
			const raw = searchParams.get( key );
			if ( raw ) {
				const values = String( raw )
					.split( ',' )
					.map( v => v.trim() )
					.filter( Boolean );
				if ( values.length > 0 ) {
					active[ key ] = Array.from( new Set( values ) );
					continue;
				}
			}
		}
		// Default: array-form `?<key>[]=value`.
		const values = searchParams
			.getAll( `${ key }[]` )
			.map( v => String( v ).trim() )
			.filter( Boolean );
		if ( values.length > 0 ) {
			active[ key ] = values;
		}
	}
	return active;
}

/**
 * Sort orders the WPCOM v1.3 search API accepts. Mirrors
 * `VALID_SORT_ORDERS` in search-blocks/store/url-state.js so the bridge
 * and JP Search blocks agree on the URL contract.
 */
const VALID_SORT_ORDERS = [ 'relevance', 'newest', 'oldest' ];
const DEFAULT_SORT_ORDER = 'relevance';

/**
 * Coerce a `min_price` / `max_price` URL value into a finite,
 * non-negative number. Returns null for missing, non-numeric, or
 * negative input so a garbage URL can't drive the API to zero results.
 *
 * @param {string|null} raw - Raw URL param value.
 * @return {number|null} Parsed bound or null.
 */
function parsePriceBound( raw ) {
	if ( raw === null || raw === undefined || raw === '' ) {
		return null;
	}
	const num = Number( raw );
	if ( ! Number.isFinite( num ) || num < 0 ) {
		return null;
	}
	return num;
}

/**
 * Read `min_price` / `max_price` off the URL into the `priceRange` shape
 * `buildSearchUrl()` expects. Either bound may be null. Returns null
 * when neither is present so the caller can pass through cleanly.
 *
 * @param {URLSearchParams} searchParams - URL search params.
 * @return {{min: number|null, max: number|null}|null} priceRange shape, or null if absent.
 */
function readPriceRangeFromUrl( searchParams ) {
	const min = parsePriceBound( searchParams.get( 'min_price' ) );
	const max = parsePriceBound( searchParams.get( 'max_price' ) );
	if ( min === null && max === null ) {
		return null;
	}
	return { min, max };
}

/**
 * Issue an aggregation request to the WPCOM v1.3 search API using the
 * same routing as the search-blocks store. Returns the parsed response
 * or null on failure.
 *
 * @param {object} args                 - Search arguments.
 * @param {string} [args.searchQuery]   - Empty string yields an unscoped baseline query.
 * @param {string} [args.sortOrder]     - One of VALID_SORT_ORDERS.
 * @param {object} [args.activeFilters] - Per-filterKey selected slugs.
 * @param {object} [args.priceRange]    - `{ min, max }` numeric range (either bound nullable).
 * @return {Promise<object|null>} Parsed v1.3 search response, or null on error.
 */
async function fetchSearch( {
	searchQuery = '',
	sortOrder = DEFAULT_SORT_ORDER,
	activeFilters = {},
	priceRange = null,
} = {} ) {
	if ( ! bridgeState?.siteId ) {
		return null;
	}
	const url = buildSearchUrl( {
		siteId: bridgeState.siteId,
		searchQuery,
		sortOrder,
		pageHandle: null,
		isPrivateSite: bridgeState.isPrivateSite,
		isWpcom: bridgeState.isWpcom,
		apiRoot: bridgeState.apiRoot,
		homeUrl: bridgeState.homeUrl,
		activeFilters,
		filterConfigs: bridgeState.filterConfigs,
		priceRange,
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
 * Aggregations scoped to the current URL state — counts here drive what's
 * displayed next to each option ("Red (12)").
 *
 * @param {URLSearchParams} searchParams - URL params to translate into filters.
 * @return {Promise<object|null>} Parsed v1.3 search response, or null on error.
 */
async function fetchScopedAggregations( searchParams ) {
	const rawOrderby = searchParams.get( 'orderby' );
	return fetchSearch( {
		searchQuery: searchParams.get( 's' ) ?? '',
		sortOrder: VALID_SORT_ORDERS.includes( rawOrderby ) ? rawOrderby : DEFAULT_SORT_ORDER,
		activeFilters: urlToActiveFilters( searchParams, bridgeState.filterConfigs ),
		priceRange: readPriceRangeFromUrl( searchParams ),
	} );
}

// Memoizes the baseline aggregations so the second filter click doesn't
// re-fetch the universe of options.
let unscopedAggregationsPromise = null;

/**
 * Aggregations against the entire indexed corpus — no `s`, no
 * activeFilters, no priceRange. Provides the *option list* for each
 * filter so options remain visible (with a 0 count) even when nothing in
 * the current search scope matches them. Cached for the page lifetime
 * since the baseline is invariant to filter clicks.
 *
 * @return {Promise<object|null>} Parsed v1.3 search response, or null on error.
 */
async function fetchUnscopedAggregations() {
	if ( ! unscopedAggregationsPromise ) {
		unscopedAggregationsPromise = fetchSearch( {} );
	}
	return unscopedAggregationsPromise;
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
 * Build a chip-variant button matching ProductFilterChips.php. Used when
 * a filter region renders with `wc-block-product-filter-chips__items`
 * (instead of the checkbox-list host) — the page editor lets each
 * filter inner block opt into either display style.
 *
 * @param {object} item      - Item shape produced by `bucketsToItems()`.
 * @param {string} filterKey - filterConfig key (e.g. `pa_color`).
 * @return {string} HTML for one chip button.
 */
function renderChipsItemHtml( item, filterKey ) {
	const itemId = `${ item.type }-${ item.value }`;

	return [
		`<button id="${ escAttr( itemId ) }"`,
		` class="wc-block-product-filter-chips__item${ item.selected ? ' is-selected' : '' }"`,
		' type="button" role="checkbox"',
		` aria-label="${ escAttr( item.ariaLabel ?? item.label ) }"`,
		` aria-checked="${ item.selected ? 'true' : 'false' }"`,
		` value="${ escAttr( item.value ) }"`,
		` data-jp-filter-key="${ escAttr( filterKey ) }"`,
		` data-jp-filter-value="${ escAttr( item.value ) }">`,
		'<span class="wc-block-product-filter-chips__label">',
		`<span class="wc-block-product-filter-chips__text">${ escText( item.label ) }</span>`,
		`<span class="wc-block-product-filter-chips__count">(${ item.count })</span>`,
		'</span>',
		'</button>',
	].join( '' );
}

/**
 * Find the items host inside a filter region — supports both display
 * variants WC offers: checkbox-list and chips.
 *
 * @param {Element} region - Filter region (the parent ProductFilter* inner block
 *                         element with the filterType context).
 * @return {{ host: Element, kind: 'chips'|'checkbox-list' }|null} Host details, or null if none found.
 */
function findItemHost( region ) {
	const cb = region.querySelector( '.wc-block-product-filter-checkbox-list__items' );
	if ( cb ) {
		return { host: cb, kind: 'checkbox-list' };
	}
	const chips = region.querySelector( '.wc-block-product-filter-chips__items' );
	if ( chips ) {
		return { host: chips, kind: 'chips' };
	}
	return null;
}

/**
 * Build a `{ [filterKey]: { [slug]: label } }` map for resolving each
 * active-filter chip's display name. Pulled from the unscoped baseline
 * because that's the only response guaranteed to contain a bucket for
 * every selected slug — the scoped response would omit a slug whose
 * intersection with the current filter set is empty.
 *
 * @param {object} unscoped - Unscoped aggregation response, keyed by filterConfig key.
 * @return {object} `{ [filterKey]: { [slug]: label } }`
 */
function buildSlugLabelMap( unscoped ) {
	const out = {};
	if ( ! unscoped || ! bridgeState?.filterConfigs ) {
		return out;
	}
	for ( const [ filterKey, agg ] of Object.entries( unscoped ) ) {
		const config = bridgeState.filterConfigs[ filterKey ];
		if ( ! config ) {
			continue;
		}
		const { bucketFormat } = resolveFilterFields( config );
		const slugMap = {};

		// For wc_stock_status, every supported slug should always render
		// even when the unscoped baseline returns no bucket for it (e.g.
		// brand-new sites with no out-of-stock products). Pre-seeding
		// from the hardcoded label map guarantees the user sees the full
		// set of options.
		if ( config.filterType === 'wc_stock_status' ) {
			Object.assign( slugMap, STOCK_STATUS_LABELS );
		}

		for ( const bucket of agg?.buckets ?? [] ) {
			const rawKey = String( bucket.key ?? '' );
			if ( bucketFormat === 'slash' && rawKey.includes( '/' ) ) {
				const idx = rawKey.indexOf( '/' );
				slugMap[ rawKey.slice( 0, idx ) ] = rawKey.slice( idx + 1 ) || rawKey.slice( 0, idx );
			} else if ( config.filterType === 'wc_stock_status' && STOCK_STATUS_LABELS[ rawKey ] ) {
				// Keep the friendly label rather than falling back to the slug.
				slugMap[ rawKey ] = STOCK_STATUS_LABELS[ rawKey ];
			} else {
				slugMap[ rawKey ] = rawKey;
			}
		}
		out[ filterKey ] = slugMap;
	}
	return out;
}

/**
 * Build a `{ [filterKey]: activeLabelTemplate }` map by reading every
 * filter region's `data-wp-context.activeLabelTemplate`. Each WC filter
 * inner block declares its own template (e.g. `"Category: {{label}}"`)
 * so chips read right ("Category: Accessories" rather than just
 * "accessories"). Templates with no `{{label}}` placeholder fall back
 * to the term's display name.
 *
 * @return {object} `{ [filterKey]: string }`
 */
function buildLabelTemplateMap() {
	const wcTypeMap = buildWcFilterTypeMap();
	const out = {};
	document.querySelectorAll( '[data-wp-context*="activeLabelTemplate"]' ).forEach( el => {
		try {
			const ctx = JSON.parse( el.getAttribute( 'data-wp-context' ) );
			const filterKey = wcTypeMap[ ctx?.filterType ];
			if ( filterKey && ctx.activeLabelTemplate && ! out[ filterKey ] ) {
				out[ filterKey ] = ctx.activeLabelTemplate;
			}
		} catch {
			// ignore malformed context
		}
	} );
	return out;
}

/**
 * Render one removable chip's `<li>`. Mirrors the markup in
 * ProductFilterRemovableChips.php's PHP-rendered fallback (the
 * `data-wp-each-child` branch — the `<template data-wp-each>` next to
 * it is for runtime hydration which we don't get on injected nodes).
 * Click handling uses `data-jp-*` attributes wired up by
 * `wireChipListeners`.
 *
 * @param {object} chip             - Chip data.
 * @param {string} chip.filterKey   - filterConfig key.
 * @param {string} chip.value       - Slug being toggled off.
 * @param {string} chip.activeLabel - Display label (e.g. "Category: Accessories").
 * @return {string} HTML for one chip row.
 */
function renderChipHtml( chip ) {
	const removeLabel = `Remove filter: ${ chip.activeLabel }`;
	return [
		'<li class="wc-block-product-filter-removable-chips__item">',
		`<span class="wc-block-product-filter-removable-chips__label">${ escText(
			chip.activeLabel
		) }</span>`,
		`<button type="button" class="wc-block-product-filter-removable-chips__remove" aria-label="${ escAttr(
			removeLabel
		) }"`,
		` data-jp-filter-key="${ escAttr( chip.filterKey ) }"`,
		` data-jp-filter-value="${ escAttr( chip.value ) }">`,
		'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="25" height="25" class="wc-block-product-filter-removable-chips__remove-icon" aria-hidden="true" focusable="false">',
		'<path d="M12 13.06l3.712 3.713 1.061-1.06L13.061 12l3.712-3.712-1.06-1.06L12 10.938 8.288 7.227l-1.061 1.06L10.939 12l-3.712 3.712 1.06 1.061L12 13.061z"></path>',
		'</svg>',
		`<span class="screen-reader-text">${ escText( removeLabel ) }</span>`,
		'</button>',
		'</li>',
	].join( '' );
}

/**
 * Replace removable chips in the active-filter region with chips
 * derived from the URL state. Single delegated click listener on the
 * host handles toggle-off via `toggleFilterAndNavigate`. Toggles the
 * `wc-block-product-filter--hidden` class on the parent active-filter
 * region so the wrapper itself disappears when there are no chips
 * (mirrors what WC's `data-wp-class--hidden` directive does, which we
 * can't rely on for injected nodes).
 *
 * @param {URLSearchParams} searchParams - Current URL params.
 * @param {object}          slugLabels   - `{ [filterKey]: { [slug]: label } }` from baseline.
 * @param {object}          templates    - `{ [filterKey]: activeLabelTemplate }` from filter regions.
 */
function applyChipsToActiveFilterBlock( searchParams, slugLabels, templates ) {
	const chipHost = document.querySelector( '.wc-block-product-filter-removable-chips__items' );
	if ( ! chipHost ) {
		return;
	}

	const activeFilters = urlToActiveFilters( searchParams, bridgeState.filterConfigs );
	const chips = [];
	for ( const [ filterKey, slugs ] of Object.entries( activeFilters ) ) {
		const template = templates[ filterKey ];
		for ( const slug of slugs ) {
			const label = slugLabels[ filterKey ]?.[ slug ] ?? slug;
			const activeLabel = template ? template.replace( '{{label}}', label ) : label;
			chips.push( { filterKey, value: slug, activeLabel } );
		}
	}

	// Remove only existing rendered <li>s; preserve the sibling <template>
	// element WC uses for its own hydration path.
	chipHost
		.querySelectorAll( 'li.wc-block-product-filter-removable-chips__item' )
		.forEach( li => li.remove() );
	if ( chips.length > 0 ) {
		chipHost.insertAdjacentHTML( 'beforeend', chips.map( renderChipHtml ).join( '' ) );
	}
	wireChipListeners( chipHost );

	const region = chipHost.closest( '.wp-block-woocommerce-product-filter-active' );
	if ( region ) {
		region.classList.toggle( 'wc-block-product-filter--hidden', chips.length === 0 );
	}
}

/**
 * Wire a single delegated click handler on the chip-host UL. Handles
 * the "remove this filter" click on each chip's button.
 *
 * @param {Element} host - The chips `<ul>` host.
 */
function wireChipListeners( host ) {
	if ( host.dataset.jpListenerBound === '1' ) {
		return;
	}
	host.dataset.jpListenerBound = '1';
	host.addEventListener( 'click', event => {
		const button = event.target.closest( '.wc-block-product-filter-removable-chips__remove' );
		if ( ! button ) {
			return;
		}
		const filterKey = button.getAttribute( 'data-jp-filter-key' );
		const filterValue = button.getAttribute( 'data-jp-filter-value' );
		if ( filterKey && filterValue ) {
			event.preventDefault();
			toggleFilterAndNavigate( filterKey, filterValue );
		}
	} );
}

/**
 * Walk every filter region on the page that exposes a `filterType` we
 * recognize (taxonomy/* or attribute/*). For each, locate the
 * `…__items` host inside the region's checkbox-list shell and replace
 * its contents with freshly-rendered items.
 *
 * The option list comes from `unscoped` (every taxonomy term that
 * exists in the index) so users always see the full set of choices —
 * "Red (0)" is more useful than a missing row when no current-scope
 * product matches Red. The displayed count comes from `scoped`, the
 * aggregation under the active search/filter/price state.
 *
 * @param {object}          scoped       - Aggregations under the current scope (drives counts).
 * @param {object}          unscoped     - Aggregations against the entire index (drives the option list).
 * @param {URLSearchParams} searchParams - URL params used to compute selected state.
 */
function applyToFilterBlocks( scoped, unscoped, searchParams ) {
	if ( ! bridgeState?.filterConfigs ) {
		return;
	}
	const baseline = unscoped ?? scoped;
	if ( ! baseline ) {
		return;
	}

	const wcTypeMap = buildWcFilterTypeMap();
	const activeFilters = urlToActiveFilters( searchParams, bridgeState.filterConfigs );
	const slugLabels = buildSlugLabelMap( baseline );
	const labelTemplates = buildLabelTemplateMap();

	applyChipsToActiveFilterBlock( searchParams, slugLabels, labelTemplates );

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

		const found = findItemHost( region );
		if ( ! found ) {
			return;
		}
		const { host: itemHost, kind: hostKind } = found;
		const config = bridgeState.filterConfigs[ filterKey ];
		const selectedSlugs = new Set( activeFilters[ filterKey ] ?? [] );
		const scopedCounts = bucketsToCountMap( scoped?.[ filterKey ]?.buckets ?? [], config );

		let items;
		if ( config.filterType === 'wc_stock_status' ) {
			// Always render the standard 3 stock-status options in
			// conventional order, regardless of which buckets came back
			// from ES — a brand-new site with zero out-of-stock products
			// should still surface "Out of stock (0)" so the option
			// remains discoverable.
			items = [ 'instock', 'outofstock', 'onbackorder' ].map( slug => ( {
				value: slug,
				type: wcFilterType,
				label: STOCK_STATUS_LABELS[ slug ],
				count: scopedCounts[ slug ] ?? 0,
				selected: selectedSlugs.has( slug ),
				ariaLabel: STOCK_STATUS_LABELS[ slug ],
			} ) );
		} else {
			const universeBuckets = baseline[ filterKey ]?.buckets;
			if ( ! Array.isArray( universeBuckets ) ) {
				return;
			}
			items = bucketsToItems( universeBuckets, config, wcFilterType, selectedSlugs ).map(
				item => ( {
					...item,
					count: scopedCounts[ item.value ] ?? 0,
				} )
			);
		}

		const renderer = hostKind === 'chips' ? renderChipsItemHtml : renderItemHtml;
		itemHost.innerHTML = items.map( item => renderer( item, filterKey ) ).join( '' );
		wireItemListeners( itemHost, hostKind );
	} );
}

/**
 * Build a `{ slug → count }` map from one filterKey's bucket array,
 * normalizing the bucket key (which may be `slug/Display Name` or just
 * `slug`) to the underlying slug.
 *
 * @param {Array}  buckets      - ES bucket array.
 * @param {object} filterConfig - filterConfig the buckets belong to.
 * @return {object} `{ [slug]: count }`
 */
function bucketsToCountMap( buckets, filterConfig ) {
	const out = {};
	if ( ! Array.isArray( buckets ) ) {
		return out;
	}
	const { bucketFormat } = resolveFilterFields( filterConfig );
	for ( const bucket of buckets ) {
		const rawKey = String( bucket.key ?? '' );
		const slug =
			bucketFormat === 'slash' && rawKey.includes( '/' ) ? rawKey.split( '/' )[ 0 ] : rawKey;
		out[ slug ] = Number( bucket.doc_count ) || 0;
	}
	return out;
}

/**
 * Attach a native delegated listener to the items host. Checkbox-list
 * variant listens for `change` on inputs; chips variant listens for
 * `click` on buttons. Single bound listener per host survives item
 * re-renders since we `innerHTML` into the host without replacing it.
 *
 * @param {Element} host     - The `…__items` div whose items to wire.
 * @param {string}  hostKind - `'checkbox-list'` or `'chips'`.
 */
function wireItemListeners( host, hostKind ) {
	if ( host.dataset.jpListenerBound === '1' ) {
		return;
	}
	host.dataset.jpListenerBound = '1';

	if ( hostKind === 'chips' ) {
		host.addEventListener( 'click', event => {
			const button = event.target.closest( 'button[data-jp-filter-key]' );
			if ( ! button ) {
				return;
			}
			event.preventDefault();
			const filterKey = button.getAttribute( 'data-jp-filter-key' );
			const filterValue = button.getAttribute( 'data-jp-filter-value' );
			if ( filterKey && filterValue ) {
				toggleFilterAndNavigate( filterKey, filterValue );
			}
		} );
		return;
	}

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
 *
 * URL format follows the Jetpack Search blocks' array-shape pattern
 * (`?<filterKey>[]=value`) — see src/search-blocks/store/url-state.js —
 * so deep links round-trip cleanly between WC's filter UI and any
 * JP Search filter-checkbox blocks that share filterKey naming.
 *
 * @param {string} filterKey   - filterConfig key (e.g. `product_cat`).
 * @param {string} filterValue - Slug being toggled.
 */
async function toggleFilterAndNavigate( filterKey, filterValue ) {
	const url = new URL( window.location.href );
	const config = bridgeState?.filterConfigs?.[ filterKey ];
	const isScalar = config?.urlFormat === 'scalar';

	if ( isScalar ) {
		// Scalar comma-joined URL key (e.g. `?filter_stock_status=instock,outofstock`).
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
	} else {
		const arrayParam = `${ filterKey }[]`;
		const current = url.searchParams.getAll( arrayParam );
		const idx = current.indexOf( filterValue );
		if ( idx === -1 ) {
			current.push( filterValue );
		} else {
			current.splice( idx, 1 );
		}
		url.searchParams.delete( arrayParam );
		for ( const value of current ) {
			url.searchParams.append( arrayParam, value );
		}
	}

	window.history.pushState( {}, '', url.href );
	/*
	 * Dispatch popstate so the `jetpack-search` store's `handlePopState`
	 * listener (search-blocks/store/index.js) re-runs the search and the
	 * result list reflects the new filter state. Our own popstate listener
	 * also fires and rebuilds the filter UI from fresh aggregations.
	 */
	window.dispatchEvent( new PopStateEvent( 'popstate' ) );
}

/*
 * WC's server-rendered controls (Product Filter Price slider, plus the
 * Status and Rating checkbox-lists when those have items) wire change
 * handlers via `data-wp-on--*` directives that the Interactivity runtime
 * hydrates on initial page load. They mutate `context.activeFilters` and
 * call `actions.navigate`. Bridge owns the taxonomy/attribute URL state
 * via `?<key>[]=` array params, but defers price / stock / rating params
 * to whatever WC's `state.params` getter produces (since those use
 * scalar URL keys and live entirely in WC's store).
 *
 * Replacing `actions.navigate` here lets us interpose on those flows:
 * read just the WC-owned scalar params off `state.params`, merge them
 * into the URL while preserving our array-format filter state, then
 * pushState + dispatch popstate so the bridge's hydrate listener and
 * the jetpack-search store's `handlePopState` both refresh.
 */
const WC_NAMESPACE = 'woocommerce/product-filters';
const WC_OWNED_PARAM_KEYS = [ 'min_price', 'max_price', 'rating_filter', 'filter_stock_status' ];

/*
 * Closure access to WC's store. The action generator uses this to read
 * `wcState.params` rather than `this?.state?.params`; calling the
 * getter via the closure keeps it inside the same Interactivity scope
 * that actions are dispatched under, which is what its internal
 * getContext() call relies on.
 */
const { state: wcState } = store( WC_NAMESPACE, {} );

store( WC_NAMESPACE, {
	actions: {
		// eslint-disable-next-line require-yield -- generator solely for Interactivity scope; no async work to yield on.
		*navigate() {
			const url = new URL( window.location.href );
			const params = wcState.params ?? {};
			let changed = false;

			// Mirror what WC's own navigate does: take every key it
			// derives from context.activeFilters and write it onto the
			// URL. WC's state.params getter already produces the right
			// URL contract for price (min_price / max_price), status
			// (filter_stock_status), rating (rating_filter), and
			// attributes — we just push the result without the HTML
			// round-trip.
			for ( const key in params ) {
				const value = params[ key ];
				if ( value === undefined || value === null || value === '' ) {
					continue;
				}
				const stringified = String( value );
				if ( url.searchParams.get( key ) !== stringified ) {
					url.searchParams.set( key, stringified );
					changed = true;
				}
			}

			// Drop any of the WC-owned scalar keys that have disappeared
			// from state.params (user cleared a filter). The bridge owns
			// taxonomy / attribute URL state in array form, so don't
			// touch those — `categories=...` etc. aren't in our owned
			// list.
			for ( const key of WC_OWNED_PARAM_KEYS ) {
				if ( ! ( key in params ) && url.searchParams.has( key ) ) {
					url.searchParams.delete( key );
					changed = true;
				}
			}

			if ( ! changed ) {
				return;
			}

			window.history.pushState( {}, '', url.href );
			window.dispatchEvent( new PopStateEvent( 'popstate' ) );
		},
	},
} );

// Initial hydration on every page load. Also fires on `popstate`
// (browser back/forward, plus the synthetic dispatch from
// `toggleFilterAndNavigate` after a filter click).
if ( typeof window !== 'undefined' ) {
	const hydrate = async () => {
		const params = new URL( window.location.href ).searchParams;
		const [ scoped, unscoped ] = await Promise.all( [
			fetchScopedAggregations( params ),
			fetchUnscopedAggregations(),
		] );
		applyToFilterBlocks( scoped?.aggregations, unscoped?.aggregations, params );
	};
	/*
	 * Defer the first hydrate via `requestAnimationFrame`. Module scripts
	 * are deferred by default and typically execute before the
	 * Interactivity runtime walks the DOM and binds `wp_interactivity_state`
	 * seeds onto the store proxies — running hydrate() synchronously at
	 * top-level reads `bridgeState.siteId` as undefined and short-circuits
	 * the entire fetch path with no error. One animation frame is enough
	 * for Interactivity to finish its initial walk; the popstate listener
	 * picks up everything after that.
	 */
	const scheduleHydrate = () => requestAnimationFrame( () => hydrate() );
	if ( document.readyState === 'loading' ) {
		document.addEventListener( 'DOMContentLoaded', scheduleHydrate, { once: true } );
	} else {
		scheduleHydrate();
	}
	window.addEventListener( 'popstate', hydrate );
}
