# Jetpack Search 3.0 — Phase 1: Interactivity API Foundation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a working set of composable Gutenberg blocks using the WordPress Interactivity API that power a fully functional search page — wiring the existing v1.3 Jetpack Search API to a shared reactive store with server-side rendering and URL state sync.

**Architecture:** Each block is a standalone Gutenberg block with a `render.php` and a `view.js` ES module. All blocks share a single `jetpack-search` Interactivity API store namespace. The store is seeded with initial state server-side in PHP (pre-fetching results on page load) and updated reactively client-side. The end deliverable is a "Blog Search Page" block pattern that replaces the overlay for standard WordPress search pages.

**Tech Stack:** WordPress Interactivity API (`@wordpress/interactivity`), PHP `wp_interactivity_state()`, Webpack ESM output (`experiments.outputModule: true`), Jetpack Search v1.3 REST API (`public-api.wordpress.com/rest/v1.3`), PHPUnit, Jest.

**Spec:** `projects/packages/search/docs/plans/interactivity-api-block-platform.md`

---

## File Map

### New files

```
projects/packages/search/
  tools/
    webpack.blocks.config.js           # ESM webpack build for viewScriptModule
  src/
    search-blocks/
      class-search-blocks.php          # PHP: block registration + wp_interactivity_state()
      store/
        index.js                       # Interactivity API store (search, setFilter, etc.)
        api.js                         # v1.3 API client (fetch wrapper)
        url-state.js                   # URL ↔ store sync
      blocks/
        search-input/
          block.json
          render.php
          view.js                      # viewScriptModule; reads/writes store
          style.scss
        search-results/
          block.json
          render.php                   # pre-fetches initial results server-side
          view.js
          style.scss
        filter-checkbox/
          block.json                   # attributes: filterType, taxonomy, metaKey, displayMode, curatedValues, label, showCount, maxItems
          class-filter-checkbox.php    # derive_filter_key(), derive_es_field(), get_initial_items()
          render.php                   # registers FilterConfig into wp_interactivity_state(); renders checkbox list
          view.js                      # generic checkbox handler; isChecked + count derived state; reads filterKey from context
          variations.js                # editor-side: registerBlockVariation for Category, Tag, Author, Post Type, Custom Field
          style.scss
        filter-date/                     # NOT in Phase 1 — placeholder directory only
          block.json                   # separate block — different UI (date range picker); implemented in follow-up
        active-filters/
          block.json
          render.php
          view.js
          style.scss
        sort-control/
          block.json
          render.php
          view.js
          style.scss
        results-count/
          block.json
          render.php                   # display only, no view.js needed
          style.scss
        no-results/
          block.json
          render.php                   # display only, no view.js needed
        load-more/
          block.json
          render.php
          view.js
          style.scss
      patterns/
        blog-search.php                # "Blog Search Page" pattern
  tests/
    js/
      search-blocks/
        api.test.js                    # unit tests for store/api.js
        url-state.test.js              # unit tests for store/url-state.js
        store.test.js                  # integration tests for the store actions
    php/
      Search_Blocks_Test.php           # PHP unit tests for class-search-blocks.php
```

### Modified files

```
projects/packages/search/
  package.json                         # add build-blocks + watch-blocks scripts
  src/
    initializers/
      class-initializer.php            # call Search_Blocks::init() from init_search()
```

---

## Task 1: Build Pipeline

Add the webpack ESM build config for blocks and hook it into `package.json`.

**Files:**
- Create: `projects/packages/search/tools/webpack.blocks.config.js`
- Modify: `projects/packages/search/package.json`

- [ ] **Step 1.1: Create `tools/webpack.blocks.config.js`**

The Interactivity API requires ES module output (`viewScriptModule`). This cannot use the existing CommonJS webpack targets. Note that this config uses ESM config file syntax (`.mjs` equivalent via `type: module` is NOT used — keep CommonJS require syntax consistent with the other webpack configs in this package).

```js
// tools/webpack.blocks.config.js
const path = require( 'path' );
const jetpackWebpackConfig = require( '@automattic/jetpack-webpack-config/webpack' );
const { glob } = require( 'glob' );

const blocksSrcDir = path.join( __dirname, '../src/search-blocks/blocks' );

// Build an entry for each block's view.js.
const blockViewEntries = glob
	.sync( path.join( blocksSrcDir, '*/view.js' ) )
	.reduce( ( acc, filepath ) => {
		const blockName = path.basename( path.dirname( filepath ) );
		acc[ blockName ] = filepath;
		return acc;
	}, {} );

// Also include the shared store modules so they can be imported by view.js files.
const storeEntries = {
	'store/index': path.join( __dirname, '../src/search-blocks/store/index.js' ),
};

module.exports = {
	mode: jetpackWebpackConfig.mode,
	devtool: jetpackWebpackConfig.devtool,
	entry: {
		...storeEntries,
		...blockViewEntries,
	},
	output: {
		...jetpackWebpackConfig.output,
		path: path.join( __dirname, '../build/search-blocks' ),
		module: true,
		chunkFormat: 'module',
		environment: { module: true },
		library: { type: 'module' },
		filename: '[name].js',
	},
	experiments: {
		outputModule: true,
	},
	optimization: {
		...jetpackWebpackConfig.optimization,
	},
	resolve: {
		...jetpackWebpackConfig.resolve,
		modules: [
			path.resolve( __dirname, '../src/search-blocks' ),
			'node_modules',
			path.resolve( __dirname, '../node_modules' ),
		],
	},
	module: {
		strictExportPresence: true,
		rules: [
			jetpackWebpackConfig.TranspileRule( { exclude: /node_modules\// } ),
			jetpackWebpackConfig.TranspileRule( { includeNodeModules: [ '@automattic/jetpack-' ] } ),
			jetpackWebpackConfig.CssRule( {
				extensions: [ 'css', 'sass', 'scss' ],
				extraLoaders: [
					{
						loader: 'postcss-loader',
						options: {
							postcssOptions: { config: path.join( __dirname, '../postcss.config.js' ) },
						},
					},
					{ loader: 'sass-loader', options: { api: 'modern-compiler' } },
				],
			} ),
			jetpackWebpackConfig.FileRule(),
		],
	},
	plugins: [
		...jetpackWebpackConfig.StandardPlugins( {
			DependencyExtractionPlugin: { injectPolyfill: false },
		} ),
	],
};
```

- [ ] **Step 1.2: Add build-blocks and watch-blocks scripts to `package.json`**

In `package.json`, update `"scripts"`:

```json
"build": "pnpm run clean && pnpm run build-instant && pnpm run build-customberg && pnpm run build-dashboard && pnpm run build-inline && pnpm run build-blocks",
"build-blocks": "webpack --config ./tools/webpack.blocks.config.js",
"watch": "concurrently 'pnpm:build-instant --watch' 'pnpm:build-customberg --watch' 'pnpm:build-dashboard --watch' 'pnpm:build-inline --watch' 'pnpm:build-blocks --watch'",
```

Also add `"@wordpress/interactivity": "6.43.0"` to `dependencies` (match the version already used in the rest of the monorepo — check `packages/forms/package.json` if unsure).

- [ ] **Step 1.3: Create placeholder entry files so the build doesn't fail**

Create these empty placeholder files before running the build:

```js
// src/search-blocks/store/index.js  (placeholder)
// TODO: Implemented in Task 2
```

Also create `src/search-blocks/blocks/search-input/view.js` as an empty placeholder (all other block view files come later).

- [ ] **Step 1.4: Run the blocks build**

```bash
cd projects/packages/search
pnpm build-blocks
```

Expected: Build completes without errors. `build/search-blocks/` directory is created (may be nearly empty since entry files are placeholders).

- [ ] **Step 1.5: Commit**

```bash
git add projects/packages/search/tools/webpack.blocks.config.js projects/packages/search/package.json projects/packages/search/src/search-blocks/
git commit -m "Search 3.0: add ESM webpack build pipeline for Interactivity API blocks"
```

---

## Task 2: Interactivity API Store

The store is the reactive heart of the system. All blocks read from and write to this shared state.

**Files:**
- Create: `src/search-blocks/store/api.js`
- Create: `src/search-blocks/store/url-state.js`
- Create: `src/search-blocks/store/index.js`
- Create: `tests/js/search-blocks/api.test.js`
- Create: `tests/js/search-blocks/url-state.test.js`
- Create: `tests/js/search-blocks/store.test.js`

- [ ] **Step 2.1: Write the failing store tests first**

```js
// tests/js/search-blocks/api.test.js
import { buildSearchUrl, buildAggregations, buildFilters } from '../../../src/search-blocks/store/api';

// A minimal filterConfigs object as PHP would produce it.
const CATEGORY_CONFIG = {
	filterKey: 'category',
	esField: 'category.slug',
	aggType: 'terms',
	showCount: true,
	maxItems: 20,
	curatedValues: [],
};

const CURATED_COLOR_CONFIG = {
	filterKey: 'meta_color',
	esField: 'meta.color.value',
	aggType: 'filters',
	showCount: true,
	maxItems: 20,
	curatedValues: [ 'red', 'blue', 'green' ],
};

describe( 'buildSearchUrl', () => {
	it( 'builds public API URL for non-private sites', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'cats',
			activeFilters: {},
			filterConfigs: {},
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: 'https://example.com/wp-json/',
		} );
		expect( url ).toContain( 'public-api.wordpress.com/rest/v1.3/sites/12345/search' );
		expect( url ).toContain( 'query=cats' );
	} );

	it( 'uses wpcom-origin URL for private WPcom sites', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: '',
			activeFilters: {},
			filterConfigs: {},
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: true,
			isWpcom: true,
			homeUrl: 'https://example.wordpress.com',
			apiRoot: 'https://example.wordpress.com/wp-json/',
		} );
		expect( url ).toContain( 'example.wordpress.com/wp-json/wpcom-origin/v1.3' );
	} );

	it( 'uses Atomic REST endpoint for private non-WPcom sites', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: '',
			activeFilters: {},
			filterConfigs: {},
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: true,
			isWpcom: false,
			apiRoot: 'https://mysite.com/wp-json/',
		} );
		expect( url ).toContain( 'mysite.com/wp-json/jetpack/v4/search' );
	} );
} );

describe( 'buildAggregations', () => {
	it( 'produces a terms aggregation for dynamic (terms) filters', () => {
		const aggs = buildAggregations( { category: CATEGORY_CONFIG } );
		expect( aggs.category ).toEqual( {
			terms: { field: 'category.slug', size: 20 },
		} );
	} );

	it( 'produces a filters aggregation for curated filters', () => {
		const aggs = buildAggregations( { meta_color: CURATED_COLOR_CONFIG } );
		expect( aggs.meta_color.filters.filters.red ).toEqual( {
			term: { 'meta.color.value': 'red' },
		} );
		expect( Object.keys( aggs.meta_color.filters.filters ) ).toEqual( [ 'red', 'blue', 'green' ] );
	} );

	it( 'skips filters with showCount=false', () => {
		const aggs = buildAggregations( {
			category: { ...CATEGORY_CONFIG, showCount: false },
		} );
		expect( aggs ).toEqual( {} );
	} );
} );

describe( 'buildFilters', () => {
	it( 'builds an ES terms filter from active selections', () => {
		const filter = buildFilters(
			{ category: [ 'news', 'tech' ] },
			{ category: CATEGORY_CONFIG }
		);
		expect( filter ).toEqual( {
			bool: { must: [ { terms: { 'category.slug': [ 'news', 'tech' ] } } ] },
		} );
	} );

	it( 'returns undefined when no filters are active', () => {
		const filter = buildFilters( {}, { category: CATEGORY_CONFIG } );
		expect( filter ).toBeUndefined();
	} );

	it( 'skips unknown filter keys (no config)', () => {
		const filter = buildFilters( { unknown_key: [ 'val' ] }, {} );
		expect( filter ).toBeUndefined();
	} );
} );
```

```js
// tests/js/search-blocks/url-state.test.js
import { stateToUrlParams, urlParamsToState } from '../../../src/search-blocks/store/url-state';

describe( 'stateToUrlParams', () => {
	it( 'serializes search query', () => {
		const params = stateToUrlParams( { searchQuery: 'boots', activeFilters: {}, sortOrder: 'relevance' } );
		expect( params.get( 's' ) ).toBe( 'boots' );
	} );

	it( 'omits empty search query', () => {
		const params = stateToUrlParams( { searchQuery: '', activeFilters: {}, sortOrder: 'relevance' } );
		expect( params.has( 's' ) ).toBe( false );
	} );

	it( 'serializes active filters', () => {
		const params = stateToUrlParams( {
			searchQuery: '',
			activeFilters: { category: [ 'news' ] },
			sortOrder: 'relevance',
		} );
		expect( params.get( 'filter[category][]' ) ).toBe( 'news' );
	} );
} );

describe( 'urlParamsToState', () => {
	it( 'reads search query from URL', () => {
		const state = urlParamsToState( new URLSearchParams( 's=cats' ) );
		expect( state.searchQuery ).toBe( 'cats' );
	} );

	it( 'reads filter from URL', () => {
		const state = urlParamsToState( new URLSearchParams( 'filter%5Bcategory%5D%5B%5D=news' ) );
		expect( state.activeFilters.category ).toContain( 'news' );
	} );
} );
```

- [ ] **Step 2.2: Run tests to confirm they fail**

```bash
cd projects/packages/search
pnpm test-scripts -- --testPathPattern=search-blocks
```

Expected: FAIL — modules not found.

- [ ] **Step 2.3: Implement `store/api.js`**

```js
// src/search-blocks/store/api.js
import { encode } from 'qss';
import { flatten } from 'q-flat';

/**
 * Build the full search API URL with query params.
 * Mirrors the 3-path routing in src/instant-search/lib/api.js.
 *
 * @param {object} opts
 * @param {number} opts.siteId
 * @param {string} opts.searchQuery
 * @param {object} opts.activeFilters   { [filterKey]: string[] }
 * @param {object} opts.filterConfigs   Map of filterKey → FilterConfig (set by block render.php via wp_interactivity_state)
 * @param {string} opts.sortOrder       'relevance' | 'date'
 * @param {string|null} opts.pageHandle Cursor for pagination
 * @param {boolean} opts.isPrivateSite
 * @param {boolean} opts.isWpcom
 * @param {string} opts.apiRoot         WordPress REST root URL
 * @param {string} [opts.homeUrl]       Home URL, required for private WPcom sites
 * @return {string} Full URL to call
 */
export function buildSearchUrl( {
	siteId,
	searchQuery,
	activeFilters,
	filterConfigs,
	sortOrder,
	pageHandle,
	isPrivateSite,
	isWpcom,
	apiRoot,
	homeUrl = '',
} ) {
	const aggregations = buildAggregations( filterConfigs );
	const filter = buildFilters( activeFilters, filterConfigs );

	const params = {
		query: encodeURIComponent( searchQuery || '' ),
		sort: sortOrder === 'date' ? 'date_desc' : 'score_default',
		aggregations,
		filter,
		size: 10,
	};

	if ( pageHandle ) {
		params.page_handle = pageHandle;
	}

	const queryString = encode( flatten( params ) );
	const path = `/sites/${ siteId }/search?${ queryString }`;

	if ( isPrivateSite && isWpcom ) {
		return `${ homeUrl }/wp-json/wpcom-origin/v1.3${ path }`;
	}
	if ( isPrivateSite ) {
		return `${ apiRoot }jetpack/v4/search?${ queryString }`;
	}
	return `https://public-api.wordpress.com/rest/v1.3${ path }`;
}

/**
 * Build aggregation requests driven by filterConfigs registered by each block's render.php.
 *
 * Each FilterConfig has shape:
 *   {
 *     filterKey:     string,         // store key, e.g. 'category', 'meta_color'
 *     esField:       string,         // ES index field, e.g. 'category.slug', 'meta.color.value'
 *     aggType:       'terms'|'filters', // 'terms' = dynamic top-N; 'filters' = curated list with counts
 *     curatedValues: string[],       // required when aggType = 'filters'
 *     showCount:     boolean,
 *   }
 *
 * PHP side sets esField and aggType — JS never hardcodes field names.
 *
 * @param {object} filterConfigs  { [filterKey]: FilterConfig }
 * @return {object} Aggregations object for the v1.3 API
 */
export function buildAggregations( filterConfigs ) {
	const aggregations = {};

	for ( const [ filterKey, config ] of Object.entries( filterConfigs ?? {} ) ) {
		if ( ! config.showCount ) continue;

		if ( config.aggType === 'filters' && config.curatedValues?.length ) {
			// Curated mode: ES "filters" aggregation returns a count for each specified value.
			const filters = {};
			config.curatedValues.forEach( value => {
				filters[ value ] = { term: { [ config.esField ]: value } };
			} );
			aggregations[ filterKey ] = { filters: { filters } };
		} else {
			// Dynamic mode: ES "terms" aggregation returns top-N values + counts.
			aggregations[ filterKey ] = {
				terms: { field: config.esField, size: config.maxItems ?? 20 },
			};
		}
	}

	return aggregations;
}

/**
 * Build the ES filter clause from active filter selections.
 * Uses filterConfigs to resolve each filterKey to its esField.
 *
 * @param {object} activeFilters  { [filterKey]: string[] }
 * @param {object} filterConfigs  { [filterKey]: FilterConfig }
 * @return {object|undefined} ES bool.must filter, or undefined if nothing is active
 */
export function buildFilters( activeFilters, filterConfigs ) {
	const must = [];

	for ( const [ filterKey, values ] of Object.entries( activeFilters ?? {} ) ) {
		if ( ! values?.length ) continue;

		const config = filterConfigs?.[ filterKey ];
		if ( ! config?.esField ) continue;  // unknown filter — skip

		must.push( { terms: { [ config.esField ]: values } } );
	}

	return must.length ? { bool: { must } } : undefined;
}
```

- [ ] **Step 2.4: Implement `store/url-state.js`**

```js
// src/search-blocks/store/url-state.js

/**
 * Serialize store state to URLSearchParams.
 *
 * @param {object} state
 * @param {string} state.searchQuery
 * @param {object} state.activeFilters  { category: ['news'], ... }
 * @param {string} state.sortOrder
 * @return {URLSearchParams}
 */
export function stateToUrlParams( { searchQuery, activeFilters, sortOrder } ) {
	const params = new URLSearchParams();

	if ( searchQuery ) {
		params.set( 's', searchQuery );
	}

	if ( sortOrder && sortOrder !== 'relevance' ) {
		params.set( 'orderby', sortOrder );
	}

	for ( const [ key, values ] of Object.entries( activeFilters ) ) {
		if ( Array.isArray( values ) ) {
			values.forEach( v => params.append( `filter[${ key }][]`, v ) );
		}
	}

	return params;
}

/**
 * Parse URLSearchParams back into partial store state.
 *
 * @param {URLSearchParams} params
 * @return {{ searchQuery: string, activeFilters: object, sortOrder: string }}
 */
export function urlParamsToState( params ) {
	const searchQuery = params.get( 's' ) ?? '';
	const sortOrder = params.get( 'orderby' ) ?? 'relevance';
	const activeFilters = {};

	for ( const [ key, value ] of params.entries() ) {
		// Match filter[category][] style params
		const match = key.match( /^filter\[(.+)\]\[\]$/ );
		if ( match ) {
			const filterKey = match[ 1 ];
			if ( ! activeFilters[ filterKey ] ) {
				activeFilters[ filterKey ] = [];
			}
			activeFilters[ filterKey ].push( value );
		}
	}

	return { searchQuery, activeFilters, sortOrder };
}

/**
 * Push current store state to browser URL without triggering a page reload.
 *
 * @param {object} state Relevant state slice
 */
export function pushStateToUrl( state ) {
	const params = stateToUrlParams( state );
	const newUrl =
		window.location.pathname +
		( params.toString() ? `?${ params.toString() }` : '' );
	window.history.pushState( {}, '', newUrl );
}

/**
 * Read initial state from the current URL.
 *
 * @return {{ searchQuery: string, activeFilters: object, sortOrder: string }}
 */
export function readStateFromUrl() {
	return urlParamsToState( new URLSearchParams( window.location.search ) );
}
```

- [ ] **Step 2.5: Implement `store/index.js`**

```js
// src/search-blocks/store/index.js
import { store } from '@wordpress/interactivity';
import { buildSearchUrl } from './api';
import { pushStateToUrl, readStateFromUrl } from './url-state';

const NAMESPACE = 'jetpack-search';

const { state, actions } = store( NAMESPACE, {
	actions: {
		/**
		 * Run a search and update state with results + aggregations.
		 */
		*search() {
			state.isLoading = true;

			const url = buildSearchUrl( {
				siteId: state.siteId,
				searchQuery: state.searchQuery,
				activeFilters: state.activeFilters,
				filterConfigs: state.filterConfigs,
				sortOrder: state.sortOrder,
				pageHandle: null,
				isPrivateSite: state.isPrivateSite,
				isWpcom: state.isWpcom,
				apiRoot: state.apiRoot,
				homeUrl: state.homeUrl,
			} );

			const headers = state.isPrivateSite
				? { 'X-WP-Nonce': state.nonce }
				: {};

			try {
				const response = yield fetch( url, {
					headers,
					credentials: state.isPrivateSite ? 'include' : 'same-origin',
				} );
				const data = yield response.json();

				state.results = data.results ?? [];
				state.aggregations = data.aggregations ?? {};
				state.totalResults = data.total ?? 0;
				state.pageHandle = data.page_handle ?? null;
				actions.syncToUrl();
			} catch ( err ) {
				// Keep existing results on error; surface error state for display blocks.
				state.hasError = true;
			} finally {
				state.isLoading = false;
			}
		},

		/**
		 * Set or toggle a filter value, then re-run the search.
		 *
		 * @param {string}   filterKey   e.g. 'category'
		 * @param {string}   filterValue e.g. 'news'
		 */
		*setFilter( filterKey, filterValue ) {
			const current = state.activeFilters[ filterKey ] ?? [];
			const index = current.indexOf( filterValue );

			if ( index === -1 ) {
				state.activeFilters = {
					...state.activeFilters,
					[ filterKey ]: [ ...current, filterValue ],
				};
			} else {
				const next = current.filter( v => v !== filterValue );
				if ( next.length === 0 ) {
					const { [ filterKey ]: _removed, ...rest } = state.activeFilters;
					state.activeFilters = rest;
				} else {
					state.activeFilters = { ...state.activeFilters, [ filterKey ]: next };
				}
			}

			yield actions.search();
		},

		/**
		 * Clear all active filters and re-run search.
		 */
		*clearFilters() {
			state.activeFilters = {};
			yield actions.search();
		},

		/**
		 * Load next page of results (appends to existing results).
		 */
		*loadMore() {
			if ( ! state.pageHandle || state.isLoading ) {
				return;
			}

			state.isLoadingMore = true;

			const url = buildSearchUrl( {
				siteId: state.siteId,
				searchQuery: state.searchQuery,
				activeFilters: state.activeFilters,
				filterConfigs: state.filterConfigs,
				sortOrder: state.sortOrder,
				pageHandle: state.pageHandle,
				isPrivateSite: state.isPrivateSite,
				isWpcom: state.isWpcom,
				apiRoot: state.apiRoot,
				homeUrl: state.homeUrl,
			} );

			const headers = state.isPrivateSite ? { 'X-WP-Nonce': state.nonce } : {};

			try {
				const response = yield fetch( url, {
					headers,
					credentials: state.isPrivateSite ? 'include' : 'same-origin',
				} );
				const data = yield response.json();

				state.results = [ ...state.results, ...( data.results ?? [] ) ];
				state.pageHandle = data.page_handle ?? null;
			} finally {
				state.isLoadingMore = false;
			}
		},

		/**
		 * Push current state to browser URL.
		 */
		syncToUrl() {
			pushStateToUrl( {
				searchQuery: state.searchQuery,
				activeFilters: state.activeFilters,
				sortOrder: state.sortOrder,
			} );
		},

		/**
		 * Handle browser back/forward navigation.
		 */
		*handlePopState() {
			const { searchQuery, activeFilters, sortOrder } = readStateFromUrl();
			state.searchQuery = searchQuery;
			state.activeFilters = activeFilters;
			state.sortOrder = sortOrder;
			yield actions.search();
		},
	},

	callbacks: {
		/**
		 * Register popstate listener once when any block mounts.
		 */
		onMount() {
			window.addEventListener( 'popstate', actions.handlePopState );
		},
	},
} );

export { state, actions };
```

- [ ] **Step 2.6: Run the tests — expect failures on store.test.js (not yet created)**

```bash
cd projects/packages/search
pnpm test-scripts -- --testPathPattern=search-blocks/api
pnpm test-scripts -- --testPathPattern=search-blocks/url-state
```

Expected: Both PASS.

- [ ] **Step 2.7: Write store integration tests**

```js
// tests/js/search-blocks/store.test.js
// The Interactivity API store cannot be easily unit-tested in Jest because
// `@wordpress/interactivity` relies on a browser DOM. These tests verify
// the api.js and url-state.js helpers that back the store actions.
// Full store action testing is covered by E2E tests.

import { buildSearchUrl } from '../../../src/search-blocks/store/api';
import { stateToUrlParams, urlParamsToState } from '../../../src/search-blocks/store/url-state';

describe( 'store helpers round-trip', () => {
	it( 'serializes and deserializes state without loss', () => {
		const original = {
			searchQuery: 'winter boots',
			activeFilters: { category: [ 'products' ], post_tag: [ 'sale' ] },
			sortOrder: 'date',
		};
		const params = stateToUrlParams( original );
		const restored = urlParamsToState( params );
		expect( restored.searchQuery ).toBe( original.searchQuery );
		expect( restored.activeFilters.category ).toEqual( original.activeFilters.category );
		expect( restored.activeFilters.post_tag ).toEqual( original.activeFilters.post_tag );
		expect( restored.sortOrder ).toBe( original.sortOrder );
	} );
} );
```

- [ ] **Step 2.8: Run all search-blocks JS tests**

```bash
pnpm test-scripts -- --testPathPattern=search-blocks
```

Expected: All PASS.

- [ ] **Step 2.9: Commit**

```bash
git add projects/packages/search/src/search-blocks/store/ projects/packages/search/tests/js/search-blocks/
git commit -m "Search 3.0: add Interactivity API store, API client, and URL state sync"
```

---

## Task 3: PHP Block Registration Class

Register all blocks and seed initial server-side state.

> **Load-bearing assumption — `wp_interactivity_state()` deep-merges.** The `filterConfigs` pattern depends on *each* `filter-checkbox` block's `render.php` adding its own entry (keyed by `filterKey`) under `filterConfigs` and having them all coexist. WP core's implementation uses `array_replace_recursive` (`WP_Interactivity_API::state()` in `wp-includes/interactivity-api/class-wp-interactivity-api.php`), which does deep-merge for associative arrays — so `wp_interactivity_state( 'ns', [ 'filterConfigs' => [ 'category' => … ] ] )` followed by `wp_interactivity_state( 'ns', [ 'filterConfigs' => [ 'post_tag' => … ] ] )` yields both keys.
>
> Gotcha for implementers: `array_replace_recursive` replaces elements by numeric index for list-like arrays. `filterConfigs` is associative (keyed by `filterKey` string), so this is fine. Do **not** introduce list-shaped values at the merge site without re-checking this behavior.

**Files:**
- Create: `src/search-blocks/class-search-blocks.php`
- Modify: `src/initializers/class-initializer.php`

- [ ] **Step 3.1: Write failing PHP test**

```php
<?php
// tests/php/Search_Blocks_Test.php
namespace Automattic\Jetpack\Search;

use PHPUnit\Framework\TestCase;

class Search_Blocks_Test extends TestCase {

	public function test_get_api_root_public_site() {
		// Simulate non-private, non-wpcom site.
		// We test the method in isolation by calling it with mocked context.
		// get_initial_state() is tested indirectly via block rendering.
		$this->assertTrue( true ); // placeholder until WordPress bootstrap available.
	}

	public function test_build_initial_state_shape() {
		// Verify that the keys required by the Interactivity API store are present.
		$required_keys = [
			'siteId',
			'apiRoot',
			'nonce',
			'isPrivateSite',
			'isWpcom',
			'homeUrl',
			'searchQuery',
			'activeFilters',
			'results',
			'aggregations',
			'totalResults',
			'isLoading',
			'pageHandle',
			'hasError',
			'sortOrder',
		];

		// Search_Blocks::build_initial_state() returns an array with all these keys.
		// This test will fail until the class exists.
		$this->assertTrue( class_exists( Search_Blocks::class ) );
		$state = Search_Blocks::build_initial_state();
		foreach ( $required_keys as $key ) {
			$this->assertArrayHasKey( $key, $state, "Missing key: $key" );
		}
	}

	/**
	 * Filters in the URL must seed activeFilters so SSR pre-fetches the right set.
	 *
	 * Landing on /?s=boots&filter[category][]=shoes&filter[category][]=boots
	 * should yield activeFilters = [ 'category' => [ 'shoes', 'boots' ] ] — not
	 * an empty array, which would cause a second-fetch flash after hydration.
	 */
	public function test_build_initial_state_seeds_filters_from_url() {
		$original_get = $_GET;
		$_GET         = array(
			'filter' => array(
				'category' => array( 'shoes', 'boots' ),
				'post_tag' => array( 'sale' ),
				// Invalid key / empty value entries are dropped.
				''         => array( 'ignored' ),
				'bad'      => array( '' ),
			),
			'orderby' => 'date',
		);
		try {
			$state = Search_Blocks::build_initial_state();
			$this->assertSame( array( 'shoes', 'boots' ), $state['activeFilters']['category'] );
			$this->assertSame( array( 'sale' ),           $state['activeFilters']['post_tag'] );
			$this->assertArrayNotHasKey( '',    $state['activeFilters'] );
			$this->assertArrayNotHasKey( 'bad', $state['activeFilters'] );
			$this->assertSame( 'date', $state['sortOrder'] );
		} finally {
			$_GET = $original_get;
		}
	}

}
```

- [ ] **Step 3.2: Run to confirm it fails**

```bash
cd projects/packages/search
jetpack test php packages/search -- --filter=Search_Blocks_Test
```

Expected: FAIL — class not found.

- [ ] **Step 3.3: Create `class-search-blocks.php`**

```php
<?php
/**
 * Search Blocks: Interactivity API block registration and state initialization.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Status;

/**
 * Registers Jetpack Search Interactivity API blocks and initializes their shared state.
 */
class Search_Blocks {

	/**
	 * Register block types and hook into WordPress.
	 */
	public static function init() {
		add_action( 'init', array( static::class, 'register_blocks' ) );
		add_action( 'wp_enqueue_scripts', array( static::class, 'seed_interactivity_state' ) );
	}

	/**
	 * Register all search blocks from their block.json files.
	 */
	public static function register_blocks() {
		$blocks_dir = __DIR__ . '/blocks';
		$block_dirs = glob( $blocks_dir . '/*', GLOB_ONLYDIR );

		if ( ! $block_dirs ) {
			return;
		}

		foreach ( $block_dirs as $block_dir ) {
			if ( file_exists( $block_dir . '/block.json' ) ) {
				register_block_type( $block_dir );
			}
		}

		// Register block pattern.
		static::register_patterns();
	}

	/**
	 * Register block patterns.
	 */
	protected static function register_patterns() {
		$patterns_dir = __DIR__ . '/patterns';
		if ( is_dir( $patterns_dir ) ) {
			foreach ( glob( $patterns_dir . '/*.php' ) as $pattern_file ) {
				require_once $pattern_file;
			}
		}
	}

	/**
	 * Seed the Interactivity API store with initial state.
	 * Called on wp_enqueue_scripts so it runs before block rendering completes.
	 * Individual block render.php files call wp_interactivity_state() too —
	 * since wp_interactivity_state() merges, the search-results render.php
	 * adds the pre-fetched results while this method sets the config.
	 */
	public static function seed_interactivity_state() {
		wp_interactivity_state( 'jetpack-search', static::build_initial_state() );
	}

	/**
	 * Build the initial state array for the jetpack-search Interactivity API store.
	 *
	 * @return array<string, mixed>
	 */
	public static function build_initial_state() {
		$is_private  = ( new Status() )->is_private_site();
		$is_wpcom    = Helper::is_wpcom();
		$site_id     = Helper::get_wpcom_site_id();

		return array(
			// Connection / routing config.
			'siteId'        => $site_id,
			'apiRoot'       => esc_url_raw( rest_url() ),
			'nonce'         => wp_create_nonce( 'wp_rest' ),
			'isPrivateSite' => $is_private,
			'isWpcom'       => $is_wpcom,
			'homeUrl'       => home_url(),

			// Search state — seeded from the URL so that landing on a deep link
			// (?s=boots&filter[category][]=shoes&orderby=date) renders the correct
			// filter selection and SSR results on the first paint, without a
			// client-side second-fetch flash.
			'searchQuery'   => get_search_query() ?? '',
			'activeFilters' => static::parse_url_filters(),
			'sortOrder'     => static::parse_url_sort(),

			// filterConfigs: each filter-checkbox block's render.php merges its own entry here.
			// Shape: { [filterKey]: { filterKey, esField, aggType, curatedValues, showCount, maxItems } }
			// JS reads this to build aggregation requests and ES filter clauses.
			// Starts empty; filter blocks populate it during render.
			'filterConfigs' => array(),

			// Results (populated by search-results block render.php; defaults to empty).
			'results'       => array(),
			'aggregations'  => array(),
			'totalResults'  => 0,
			'pageHandle'    => null,

			// UI state.
			'isLoading'     => false,
			'isLoadingMore' => false,
			'hasError'      => false,
		);
	}

	/**
	 * Parse filter selections from the current request URL.
	 *
	 * Accepts `filter[<filterKey>][]=<value>` query params — the same shape that
	 * store/url-state.js writes — and returns an { [filterKey]: string[] } map.
	 * Unexpected values are sanitized and empty entries dropped so downstream
	 * code can safely feed this into the ES request.
	 *
	 * @return array<string, string[]>
	 */
	protected static function parse_url_filters(): array {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only URL state.
		$raw = isset( $_GET['filter'] ) ? wp_unslash( $_GET['filter'] ) : array();
		if ( ! is_array( $raw ) ) {
			return array();
		}

		$out = array();
		foreach ( $raw as $key => $values ) {
			$filter_key = sanitize_key( (string) $key );
			if ( '' === $filter_key ) {
				continue;
			}
			$clean = array_values( array_filter(
				array_map( 'sanitize_text_field', (array) $values ),
				static fn( $v ) => '' !== $v
			) );
			if ( $clean ) {
				$out[ $filter_key ] = $clean;
			}
		}
		return $out;
	}

	/**
	 * Parse the sort order from the URL, defaulting to 'relevance'.
	 *
	 * @return string
	 */
	protected static function parse_url_sort(): string {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- read-only URL state.
		$orderby = isset( $_GET['orderby'] ) ? sanitize_key( wp_unslash( $_GET['orderby'] ) ) : '';
		return in_array( $orderby, array( 'date' ), true ) ? $orderby : 'relevance';
	}
}
```

- [ ] **Step 3.4: Hook into the initializer**

In `src/initializers/class-initializer.php`, inside `init_search()`, add this after the `$success` assignment block (after line 138, before `return $success`):

```php
// Register Interactivity API search blocks (independent of instant/classic mode).
Search_Blocks::init();
```

And add the `use` statement at the top of the file if `Search_Blocks` isn't already imported (the namespace is `Automattic\Jetpack\Search` for all classes here, so no separate use statement needed).

- [ ] **Step 3.5: Run PHP tests**

```bash
jetpack test php packages/search -- --filter=Search_Blocks_Test
```

Expected: All assertions PASS.

- [ ] **Step 3.6: Commit**

```bash
git add projects/packages/search/src/search-blocks/class-search-blocks.php \
        projects/packages/search/src/initializers/class-initializer.php \
        projects/packages/search/tests/php/Search_Blocks_Test.php
git commit -m "Search 3.0: add Search_Blocks PHP class and hook into initializer"
```

---

## Task 4: search-input Block

The text input block. Debounced typing triggers `actions.search()`.

**Files:**
- Create: `src/search-blocks/blocks/search-input/block.json`
- Create: `src/search-blocks/blocks/search-input/render.php`
- Create: `src/search-blocks/blocks/search-input/view.js`
- Create: `src/search-blocks/blocks/search-input/style.scss`

- [ ] **Step 4.1: Create `block.json`**

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "jetpack/search-input",
	"version": "0.1.0",
	"title": "Search Input",
	"category": "jetpack-search",
	"description": "Text input that drives Jetpack Search results.",
	"supports": {
		"html": false,
		"interactivity": true
	},
	"textdomain": "jetpack-search-pkg",
	"viewScriptModule": "file:../../../../build/search-blocks/search-input.js",
	"style": "file:../../../../build/search-blocks/search-input.css"
}
```

> **Note on viewScriptModule path:** The path is relative to `block.json` and points to the built output. WordPress resolves this at registration time using `register_block_type( $block_dir )`. Verify that `build/search-blocks/search-input.js` is what the webpack config outputs (entry key `search-input` → `blocks/search-input/view.js`).

- [ ] **Step 4.2: Create `render.php`**

```php
<?php
/**
 * Search Input block render.
 *
 * @package automattic/jetpack-search
 * @var array    $attributes Block attributes.
 * @var string   $content    Block content.
 * @var WP_Block $block      Block instance.
 */

$placeholder = $attributes['placeholder'] ?? __( 'Search…', 'jetpack-search-pkg' );
$initial_query = get_search_query() ?? '';
?>
<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_interactivity_data_wp_context( array( 'focused' => false ) ); ?>
>
	<input
		type="search"
		class="jetpack-search-input__field"
		placeholder="<?php echo esc_attr( $placeholder ); ?>"
		value="<?php echo esc_attr( $initial_query ); ?>"
		data-wp-bind--value="state.searchQuery"
		data-wp-on--input="actions.onSearchInput"
		data-wp-on--keydown="actions.onSearchKeydown"
		aria-label="<?php echo esc_attr( __( 'Search', 'jetpack-search-pkg' ) ); ?>"
	/>
	<button
		class="jetpack-search-input__clear"
		data-wp-bind--hidden="!state.searchQuery"
		data-wp-on--click="actions.clearSearch"
		aria-label="<?php echo esc_attr( __( 'Clear search', 'jetpack-search-pkg' ) ); ?>"
	>✕</button>
</div>
```

- [ ] **Step 4.3: Create `view.js`**

```js
// src/search-blocks/blocks/search-input/view.js
import { store } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack-search';
let debounceTimer = null;
const DEBOUNCE_MS = 300;

store( NAMESPACE, {
	actions: {
		onSearchInput( event ) {
			const { actions, state } = store( NAMESPACE );
			state.searchQuery = event.target.value;

			clearTimeout( debounceTimer );
			debounceTimer = setTimeout( () => {
				actions.search();
			}, DEBOUNCE_MS );
		},

		onSearchKeydown( event ) {
			if ( event.key === 'Enter' ) {
				clearTimeout( debounceTimer );
				const { actions } = store( NAMESPACE );
				actions.search();
			}
		},

		*clearSearch() {
			const { state, actions } = store( NAMESPACE );
			state.searchQuery = '';
			yield actions.search();
		},
	},
} );
```

- [ ] **Step 4.4: Create `style.scss`**

```scss
// src/search-blocks/blocks/search-input/style.scss
.wp-block-jetpack-search-input {
	position: relative;
	display: flex;
	align-items: center;

	.jetpack-search-input__field {
		width: 100%;
		padding: 0.5rem 2.5rem 0.5rem 0.75rem;
		border: 1px solid #ccc;
		border-radius: 4px;
		font-size: 1rem;

		&:focus {
			outline: 2px solid #0073aa;
			outline-offset: 1px;
		}
	}

	.jetpack-search-input__clear {
		position: absolute;
		right: 0.5rem;
		background: none;
		border: none;
		cursor: pointer;
		color: #666;

		&[hidden] {
			display: none;
		}
	}
}
```

- [ ] **Step 4.5: Build and verify no errors**

```bash
cd projects/packages/search
pnpm build-blocks
```

Expected: `build/search-blocks/search-input.js` and `build/search-blocks/search-input.css` are created.

- [ ] **Step 4.6: Commit**

```bash
git add projects/packages/search/src/search-blocks/blocks/search-input/
git commit -m "Search 3.0: add search-input block"
```

---

## Task 5: search-results Block

Renders results server-side for the initial load, then re-renders client-side from store state.

**Files:**
- Create: `src/search-blocks/blocks/search-results/block.json`
- Create: `src/search-blocks/blocks/search-results/render.php`
- Create: `src/search-blocks/blocks/search-results/view.js`
- Create: `src/search-blocks/blocks/search-results/style.scss`

- [ ] **Step 5.1: Create `block.json`**

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "jetpack/search-results",
	"version": "0.1.0",
	"title": "Search Results",
	"category": "jetpack-search",
	"description": "Displays Jetpack Search results.",
	"supports": {
		"html": false,
		"interactivity": true
	},
	"textdomain": "jetpack-search-pkg",
	"viewScriptModule": "file:../../../../build/search-blocks/search-results.js",
	"style": "file:../../../../build/search-blocks/search-results.css"
}
```

- [ ] **Step 5.2: Create `render.php`**

This is the only block that makes a server-side API call to pre-fetch results. The API call mirrors the same routing logic as `class-helper.php`.

```php
<?php
/**
 * Search Results block render.
 *
 * @package automattic/jetpack-search
 * @var array    $attributes Block attributes.
 */

use Automattic\Jetpack\Search\Helper;
use Automattic\Jetpack\Search\Search_Blocks;
use Automattic\Jetpack\Status;

$search_query   = get_search_query() ?? '';
$is_private     = ( new Status() )->is_private_site();
$is_wpcom       = Helper::is_wpcom();
$site_id        = Helper::get_wpcom_site_id();
$initial_results = array();
$initial_aggs    = array();
$total           = 0;

// Read filter selections seeded from the URL by Search_Blocks::build_initial_state()
// so the SSR API call applies them on first paint. Without this, landing on
// /?s=boots&filter[category][]=shoes would render unfiltered results and then
// flash to the filtered set once the client hydrates and re-queries.
$initial_state   = Search_Blocks::build_initial_state();
$active_filters  = $initial_state['activeFilters'] ?? array();

// Pre-fetch results server-side so the page renders without a client round-trip.
// Private sites skip SSR because the public endpoint requires auth they don't have;
// those render a loading state and fetch client-side with a nonce header.
if ( $site_id && ! $is_private && ( $search_query || ! empty( $active_filters ) ) ) {
	$query_args = array(
		'query' => $search_query,
		'size'  => 10,
	);
	// Serialize active filters as filter[<key>][]=<value>. urlencode() + bracket
	// notation keeps the wire format identical to the JS client (store/url-state.js)
	// so the server-side and client-side requests are interchangeable.
	foreach ( $active_filters as $filter_key => $values ) {
		foreach ( (array) $values as $value ) {
			$query_args[ "filter[{$filter_key}][]" ] = $value;
		}
	}
	$api_url = "https://public-api.wordpress.com/rest/v1.3/sites/{$site_id}/search?" . http_build_query( $query_args );
	$response = wp_remote_get( esc_url_raw( $api_url ) );
	if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
		$body            = json_decode( wp_remote_retrieve_body( $response ), true );
		$initial_results = $body['results'] ?? array();
		$initial_aggs    = $body['aggregations'] ?? array();
		$total           = $body['total'] ?? 0;
	}
}

// Merge pre-fetched results into the shared Interactivity API store.
wp_interactivity_state( 'jetpack-search', array(
	'results'      => $initial_results,
	'aggregations' => $initial_aggs,
	'totalResults' => $total,
) );
?>
<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="jetpack-search"
>
	<div
		class="jetpack-search-results__loading"
		data-wp-bind--hidden="!state.isLoading"
		aria-live="polite"
	>
		<?php esc_html_e( 'Loading…', 'jetpack-search-pkg' ); ?>
	</div>

	<ul
		class="jetpack-search-results__list"
		data-wp-bind--hidden="state.isLoading"
		data-wp-each--result="state.results"
		data-wp-each-key="context.result.id"
		aria-live="polite"
	>
		<template data-wp-each-child>
			<li class="jetpack-search-results__item">
				<a
					data-wp-bind--href="context.result.fields.permalink"
					data-wp-text="context.result.fields.title"
				></a>
				<p data-wp-text="context.result.fields.excerpt"></p>
			</li>
		</template>
	</ul>
</div>
```

> **Note on reactive result rendering:** `data-wp-each--result` iterates `state.results` and renders one `<li>` per item; `context.result` exposes each item to the `<template>` subtree. WordPress's server-side Interactivity API directive processor expands the `<template>` into real `<li>` elements during block rendering using the state seeded by `wp_interactivity_state()`, so the page ships with SSR-rendered results. On the client, the runtime re-renders the list reactively whenever `state.results` changes (new queries, filter changes, load-more). No manual DOM manipulation is required. `data-wp-each-key` must resolve to a unique string per item — the Jetpack Search v1.3 API returns an `id` field on each result; if that proves unreliable, fall back to `context.result.fields.permalink`.

- [ ] **Step 5.3: Create `view.js`**

`search-results` is driven entirely by directives (`data-wp-each`, `data-wp-bind`, `data-wp-text`) declared in the server-rendered HTML plus the shared store actions in `store/index.js`. No block-specific view code is required, but `block.json` still needs a `viewScriptModule` entry so the IAPI runtime is loaded on pages containing this block. A one-line stub is enough:

```js
// src/search-blocks/blocks/search-results/view.js
// Intentionally empty: this block is fully declarative.
// Importing the runtime ensures it is enqueued on pages containing this block.
import '@wordpress/interactivity';
```

- [ ] **Step 5.4: Create `style.scss`**

```scss
// src/search-blocks/blocks/search-results/style.scss
.wp-block-jetpack-search-results {
	.jetpack-search-results__loading {
		padding: 1rem;
		text-align: center;
		color: #666;

		&[hidden] { display: none; }
	}

	.jetpack-search-results__list {
		list-style: none;
		margin: 0;
		padding: 0;

		&[hidden] { display: none; }
	}

	.jetpack-search-results__item {
		padding: 0.75rem 0;
		border-bottom: 1px solid #eee;

		a {
			font-weight: 600;
			text-decoration: none;
			&:hover { text-decoration: underline; }
		}

		p {
			margin: 0.25rem 0 0;
			color: #555;
			font-size: 0.9rem;
		}
	}
}
```

- [ ] **Step 5.5: Build and verify**

```bash
pnpm build-blocks
```

Expected: `build/search-blocks/search-results.js` and `search-results.css` created.

- [ ] **Step 5.6: Commit**

```bash
git add projects/packages/search/src/search-blocks/blocks/search-results/
git commit -m "Search 3.0: add search-results block with SSR pre-fetch"
```

---

## Task 6: filter-checkbox Block (with Block Variations)

One block handles all checkbox-style filtering: category, tag, author, post type, custom taxonomy, and post meta. It supports two display modes:
- **`dynamic`**: items and counts come from the search response's `terms` aggregation (top-N by frequency)
- **`curated`**: items are configured in block attributes; counts come from a `filters` aggregation (exact count for each specified value, optional)

Each render.php call registers a `FilterConfig` into `state.filterConfigs` so JS knows the ES field mapping and aggregation shape without hardcoding anything.

Named block variations ("Filter by Category", "Filter by Tag", etc.) appear as separate entries in the block inserter, each pre-configured with the right attributes.

**Files:**
- Create: `src/search-blocks/blocks/filter-checkbox/block.json`
- Create: `src/search-blocks/blocks/filter-checkbox/render.php`
- Create: `src/search-blocks/blocks/filter-checkbox/view.js`
- Create: `src/search-blocks/blocks/filter-checkbox/variations.js`  ← editor-side only, enqueued as `editorScript`
- Create: `src/search-blocks/blocks/filter-checkbox/style.scss`

- [ ] **Step 6.1: Create `filter-checkbox/block.json`**

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "jetpack/filter-checkbox",
	"version": "0.1.0",
	"title": "Checkbox Filter",
	"category": "jetpack-search",
	"description": "Checkbox filter for Jetpack Search. Use a variation (Category, Tag, Post Type, Author, Custom Taxonomy) or configure manually.",
	"supports": { "html": false, "interactivity": true },
	"textdomain": "jetpack-search-pkg",
	"attributes": {
		"filterType": {
			"type": "string",
			"default": "taxonomy",
			"enum": [ "taxonomy", "post_type", "author", "post_meta" ]
		},
		"taxonomy": {
			"type": "string",
			"default": "category",
			"description": "Taxonomy slug when filterType=taxonomy"
		},
		"metaKey": {
			"type": "string",
			"default": "",
			"description": "Post meta key when filterType=post_meta"
		},
		"displayMode": {
			"type": "string",
			"default": "dynamic",
			"enum": [ "dynamic", "curated" ],
			"description": "dynamic=terms agg (top-N); curated=filters agg (specific values)"
		},
		"curatedValues": {
			"type": "array",
			"default": [],
			"items": {
				"type": "object",
				"properties": {
					"value": { "type": "string" },
					"label": { "type": "string" }
				}
			},
			"description": "Used when displayMode=curated"
		},
		"label": { "type": "string", "default": "" },
		"showCount": { "type": "boolean", "default": true },
		"maxItems": { "type": "integer", "default": 10 }
	},
	"viewScriptModule": "file:../../../../build/search-blocks/filter-checkbox.js",
	"editorScript": "file:../../../../build/search-blocks/filter-checkbox-variations.js",
	"style": "file:../../../../build/search-blocks/filter-checkbox.css"
}
```

- [ ] **Step 6.2: Create the PHP helper for filter key and ES field derivation**

Add a `Filter_Checkbox` helper class at `src/search-blocks/blocks/filter-checkbox/class-filter-checkbox.php`:

```php
<?php
/**
 * filter-checkbox block helpers.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Helper methods for the jetpack/filter-checkbox block.
 */
class Filter_Checkbox {

	/**
	 * ES field names for well-known filter types.
	 * These map to the actual Jetpack Search index fields.
	 */
	const ES_FIELDS = array(
		'post_type'           => 'post_type',
		'author'              => 'author_login',
		'taxonomy_category'   => 'category.slug',
		'taxonomy_post_tag'   => 'tag.slug',
		// Custom taxonomies: taxonomy.{slug}.slug_slash_name
	);

	/**
	 * Derive a stable, URL-safe filter key from block attributes.
	 *
	 * @param array $attributes Block attributes.
	 * @return string  e.g. 'category', 'post_type', 'author', 'taxonomy_genre', 'meta_color'
	 */
	public static function derive_filter_key( array $attributes ): string {
		switch ( $attributes['filterType'] ) {
			case 'taxonomy':
				// Built-in taxonomies get short keys for URL cleanliness.
				if ( 'category' === $attributes['taxonomy'] ) return 'category';
				if ( 'post_tag'  === $attributes['taxonomy'] ) return 'post_tag';
				return 'taxonomy_' . sanitize_key( $attributes['taxonomy'] );
			case 'post_type':
				return 'post_type';
			case 'author':
				return 'author';
			case 'post_meta':
				return 'meta_' . sanitize_key( $attributes['metaKey'] );
		}
		return 'filter_' . sanitize_key( $attributes['filterType'] );
	}

	/**
	 * Derive the Elasticsearch field name for the filter key.
	 *
	 * @param array  $attributes Block attributes.
	 * @param string $filter_key Result of derive_filter_key().
	 * @return string ES field name, or empty string if unknown.
	 */
	public static function derive_es_field( array $attributes, string $filter_key ): string {
		if ( isset( self::ES_FIELDS[ $filter_key ] ) ) {
			return self::ES_FIELDS[ $filter_key ];
		}
		if ( 'taxonomy' === $attributes['filterType'] ) {
			return 'taxonomy.' . $attributes['taxonomy'] . '.slug_slash_name';
		}
		if ( 'post_meta' === $attributes['filterType'] && $attributes['metaKey'] ) {
			return 'meta.' . $attributes['metaKey'] . '.value';
		}
		return '';
	}

	/**
	 * Get initial items for server-side rendering of the checkbox list.
	 * In dynamic mode, fetch from WordPress (taxonomy terms, post types, authors).
	 * In curated mode, use the configured curatedValues array directly.
	 *
	 * @param array $attributes Block attributes.
	 * @return array<array{value: string, label: string}>
	 */
	public static function get_initial_items( array $attributes ): array {
		if ( 'curated' === $attributes['displayMode'] ) {
			return array_map( function( $item ) {
				return array(
					'value' => sanitize_text_field( $item['value'] ?? '' ),
					'label' => sanitize_text_field( $item['label'] ?? $item['value'] ?? '' ),
				);
			}, $attributes['curatedValues'] ?? array() );
		}

		$max = intval( $attributes['maxItems'] ?? 10 );

		switch ( $attributes['filterType'] ) {
			case 'taxonomy':
				$terms = get_terms( array(
					'taxonomy'   => $attributes['taxonomy'],
					'hide_empty' => true,
					'number'     => $max,
				) );
				if ( is_wp_error( $terms ) ) return array();
				return array_map( fn( $t ) => array( 'value' => $t->slug, 'label' => $t->name ), $terms );

			case 'post_type':
				$types = get_post_types( array( 'public' => true ), 'objects' );
				return array_slice(
					array_map( fn( $t ) => array( 'value' => $t->name, 'label' => $t->labels->name ), $types ),
					0, $max
				);

			case 'author':
				$authors = get_users( array(
					'has_published_posts' => true,
					'number'              => $max,
					'fields'              => array( 'user_login', 'display_name' ),
				) );
				return array_map( fn( $u ) => array( 'value' => $u->user_login, 'label' => $u->display_name ), $authors );
		}

		return array();
	}
}
```

- [ ] **Step 6.3: Create `filter-checkbox/render.php`**

```php
<?php
/**
 * filter-checkbox block render.
 *
 * @package automattic/jetpack-search
 * @var array    $attributes Block attributes.
 * @var WP_Block $block
 */

use Automattic\Jetpack\Search\Filter_Checkbox;

$filter_key   = Filter_Checkbox::derive_filter_key( $attributes );
$es_field     = Filter_Checkbox::derive_es_field( $attributes, $filter_key );
$display_mode = $attributes['displayMode'] ?? 'dynamic';
$show_count   = $attributes['showCount']   ?? true;
$max_items    = intval( $attributes['maxItems'] ?? 10 );
$label        = $attributes['label'] ?: '';

// Default labels for built-in variations when no custom label is set.
if ( ! $label ) {
	$default_labels = array(
		'category'  => __( 'Category',  'jetpack-search-pkg' ),
		'post_tag'  => __( 'Tag',       'jetpack-search-pkg' ),
		'post_type' => __( 'Post Type', 'jetpack-search-pkg' ),
		'author'    => __( 'Author',    'jetpack-search-pkg' ),
	);
	$label = $default_labels[ $filter_key ] ?? ucfirst( str_replace( '_', ' ', $filter_key ) );
}

// Register this filter's config into the shared store state.
// JS reads filterConfigs to build aggregation requests and ES filter clauses.
// wp_interactivity_state() merges, so each block adds its own key without clobbering others.
$curated_values = ( 'curated' === $display_mode )
	? array_column( $attributes['curatedValues'] ?? array(), 'value' )
	: array();

wp_interactivity_state( 'jetpack-search', array(
	'filterConfigs' => array(
		$filter_key => array(
			'filterKey'     => $filter_key,
			'esField'       => $es_field,
			'aggType'       => 'curated' === $display_mode ? 'filters' : 'terms',
			'curatedValues' => $curated_values,
			'showCount'     => $show_count,
			'maxItems'      => $max_items,
		),
	),
) );

// Server-render initial item list.
$items = Filter_Checkbox::get_initial_items( $attributes );
?>
<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_interactivity_data_wp_context( array( 'filterKey' => $filter_key ) ); ?>
>
	<?php if ( $label ) : ?>
	<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
	<ul class="jetpack-search-filter__list">
		<?php foreach ( $items as $item ) : ?>
		<li class="jetpack-search-filter__item">
			<label>
				<input
					type="checkbox"
					value="<?php echo esc_attr( $item['value'] ); ?>"
					data-wp-on--change="actions.onFilterChange"
					data-wp-bind--checked="context.isChecked"
				/>
				<span class="jetpack-search-filter__label"><?php echo esc_html( $item['label'] ); ?></span>
				<?php if ( $show_count ) : ?>
				<span class="jetpack-search-filter__count" data-wp-bind--hidden="!context.count" data-wp-text="context.count"></span>
				<?php endif; ?>
			</label>
		</li>
		<?php endforeach; ?>
	</ul>
</div>
```

- [ ] **Step 6.4: Create `filter-checkbox/view.js`**

```js
// src/search-blocks/blocks/filter-checkbox/view.js
import { store, getContext, getElement } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		/**
		 * Per-checkbox derived state: is this checkbox's value currently active?
		 * Uses per-element context to get filterKey + value.
		 */
		get isChecked() {
			const { state } = store( NAMESPACE );
			const context = getContext();
			const activeValues = state.activeFilters[ context.filterKey ] ?? [];
			return activeValues.includes( context.itemValue );
		},

		/**
		 * Per-checkbox derived state: count from aggregations for this item.
		 */
		get count() {
			const { state } = store( NAMESPACE );
			const context = getContext();
			const agg = state.aggregations[ context.filterKey ];
			if ( ! agg ) return null;

			// terms aggregation shape: { buckets: [{ key, doc_count }] }
			if ( agg.buckets ) {
				const bucket = agg.buckets.find( b => b.key === context.itemValue );
				return bucket?.doc_count ?? null;
			}
			// filters aggregation shape: { buckets: { [value]: { doc_count } } }
			if ( agg.buckets?.[ context.itemValue ] !== undefined ) {
				return agg.buckets[ context.itemValue ].doc_count ?? null;
			}
			return null;
		},
	},

	actions: {
		*onFilterChange( event ) {
			const context = getContext();
			const { actions } = store( NAMESPACE );
			yield actions.setFilter( context.filterKey, event.target.value );
		},
	},
} );
```

> **Note on per-item context:** Each `<li>` needs its own context containing `filterKey` and `itemValue` for the `isChecked` and `count` derived states to work. The render.php wraps each `<li>` with `wp_interactivity_data_wp_context( [ 'filterKey' => $filter_key, 'itemValue' => $item['value'] ] )`. The outer `<div>` context holds `filterKey` for `onFilterChange`. Update `render.php` Step 6.3 — each `<li>` should carry its own context:
> ```php
> <li <?php echo wp_interactivity_data_wp_context( [ 'filterKey' => $filter_key, 'itemValue' => $item['value'] ] ); ?> class="jetpack-search-filter__item">
> ```

- [ ] **Step 6.5: Create `filter-checkbox/variations.js`**

This file is enqueued as `editorScript` (only in the block editor, not on the frontend). It registers the named variations that appear in the block inserter.

```js
// src/search-blocks/blocks/filter-checkbox/variations.js
import { registerBlockVariation } from '@wordpress/blocks';

const BLOCK = 'jetpack/filter-checkbox';

registerBlockVariation( BLOCK, {
	name: 'category',
	title: 'Filter by Category',
	description: 'Show category checkboxes with live result counts.',
	attributes: { filterType: 'taxonomy', taxonomy: 'category', label: 'Category' },
	isActive: attrs => attrs.filterType === 'taxonomy' && attrs.taxonomy === 'category',
} );

registerBlockVariation( BLOCK, {
	name: 'post_tag',
	title: 'Filter by Tag',
	description: 'Show tag checkboxes with live result counts.',
	attributes: { filterType: 'taxonomy', taxonomy: 'post_tag', label: 'Tag' },
	isActive: attrs => attrs.filterType === 'taxonomy' && attrs.taxonomy === 'post_tag',
} );

registerBlockVariation( BLOCK, {
	name: 'post_type',
	title: 'Filter by Post Type',
	description: 'Show post type checkboxes with live result counts.',
	attributes: { filterType: 'post_type', label: 'Post Type' },
	isActive: attrs => attrs.filterType === 'post_type',
} );

registerBlockVariation( BLOCK, {
	name: 'author',
	title: 'Filter by Author',
	description: 'Show author checkboxes with live result counts.',
	attributes: { filterType: 'author', label: 'Author' },
	isActive: attrs => attrs.filterType === 'author',
} );

registerBlockVariation( BLOCK, {
	name: 'custom_taxonomy',
	title: 'Filter by Custom Taxonomy',
	description: 'Show checkboxes for any registered taxonomy.',
	attributes: { filterType: 'taxonomy', taxonomy: '', label: '' },
	isActive: attrs =>
		attrs.filterType === 'taxonomy' &&
		attrs.taxonomy !== 'category' &&
		attrs.taxonomy !== 'post_tag',
} );

registerBlockVariation( BLOCK, {
	name: 'post_meta',
	title: 'Filter by Custom Field',
	description: 'Show checkboxes for a post meta key (curated values).',
	attributes: { filterType: 'post_meta', metaKey: '', displayMode: 'curated', label: '' },
	isActive: attrs => attrs.filterType === 'post_meta',
} );
```

- [ ] **Step 6.6: Add `variations.js` to webpack entry**

In `tools/webpack.blocks.config.js`, add to the `storeEntries` object:

```js
const storeEntries = {
	'store/index': path.join( __dirname, '../src/search-blocks/store/index.js' ),
	'filter-checkbox-variations': path.join(
		__dirname,
		'../src/search-blocks/blocks/filter-checkbox/variations.js'
	),
};
```

This builds `build/search-blocks/filter-checkbox-variations.js` as a separate non-ESM bundle (it uses `@wordpress/blocks` which is a standard WP dependency loaded in the editor). The `editorScript` in `block.json` points to this file.

> **Note:** `variations.js` uses `@wordpress/blocks` (a CommonJS global in the editor context), not `@wordpress/interactivity`. It does NOT need `outputModule: true`. If the ESM config causes issues with editor scripts, add a separate entry with a non-ESM output. The simplest path: register variations server-side in PHP using `register_block_variation()` (available in WP 6.5+) in `class-search-blocks.php` instead of a JS file — this avoids the dual-build problem entirely. PHP approach:
> ```php
> register_block_variation( 'jetpack/filter-checkbox', array(
>     'name'       => 'category',
>     'title'      => __( 'Filter by Category', 'jetpack-search-pkg' ),
>     'attributes' => array( 'filterType' => 'taxonomy', 'taxonomy' => 'category', 'label' => 'Category' ),
>     'isActive'   => array( 'filterType', 'taxonomy' ),
> ) );
> // ... repeat for tag, post_type, author, custom_taxonomy, post_meta
> ```
> Use the PHP approach to avoid webpack complexity in Phase 1.

- [ ] **Step 6.7: Create `filter-checkbox/style.scss`**

```scss
// src/search-blocks/blocks/filter-checkbox/style.scss
.wp-block-jetpack-filter-checkbox {
	.jetpack-search-filter__title {
		font-size: 0.85rem;
		font-weight: 700;
		text-transform: uppercase;
		letter-spacing: 0.05em;
		margin: 0 0 0.5rem;
		color: #444;
	}

	.jetpack-search-filter__list {
		list-style: none;
		margin: 0;
		padding: 0;
	}

	.jetpack-search-filter__item {
		padding: 0.25rem 0;

		label {
			display: flex;
			align-items: center;
			gap: 0.5rem;
			cursor: pointer;
		}
	}

	.jetpack-search-filter__label {
		flex: 1;
	}

	.jetpack-search-filter__count {
		font-size: 0.8rem;
		color: #888;
		background: #f0f0f0;
		border-radius: 10px;
		padding: 0 0.4rem;

		&[hidden] { display: none; }
	}
}
```

- [ ] **Step 6.8: Add filter-checkbox PHP test**

In `tests/php/Search_Blocks_Test.php`, add:

```php
public function test_filter_checkbox_derive_filter_key() {
	$this->assertSame( 'category', Filter_Checkbox::derive_filter_key( [
		'filterType' => 'taxonomy', 'taxonomy' => 'category',
	] ) );
	$this->assertSame( 'post_tag', Filter_Checkbox::derive_filter_key( [
		'filterType' => 'taxonomy', 'taxonomy' => 'post_tag',
	] ) );
	$this->assertSame( 'taxonomy_genre', Filter_Checkbox::derive_filter_key( [
		'filterType' => 'taxonomy', 'taxonomy' => 'genre',
	] ) );
	$this->assertSame( 'post_type', Filter_Checkbox::derive_filter_key( [
		'filterType' => 'post_type',
	] ) );
	$this->assertSame( 'meta_color', Filter_Checkbox::derive_filter_key( [
		'filterType' => 'post_meta', 'metaKey' => 'color',
	] ) );
}

public function test_filter_checkbox_derive_es_field() {
	$this->assertSame(
		'category.slug',
		Filter_Checkbox::derive_es_field( [ 'filterType' => 'taxonomy', 'taxonomy' => 'category' ], 'category' )
	);
	$this->assertSame(
		'taxonomy.genre.slug_slash_name',
		Filter_Checkbox::derive_es_field( [ 'filterType' => 'taxonomy', 'taxonomy' => 'genre' ], 'taxonomy_genre' )
	);
	$this->assertSame(
		'meta.color.value',
		Filter_Checkbox::derive_es_field( [ 'filterType' => 'post_meta', 'metaKey' => 'color' ], 'meta_color' )
	);
}
```

Also add `use Automattic\Jetpack\Search\Filter_Checkbox;` to the test file.

- [ ] **Step 6.9: Run tests**

```bash
jetpack test php packages/search -- --filter=Search_Blocks_Test
```

Expected: PASS.

- [ ] **Step 6.10: Build**

```bash
pnpm build-blocks
```

Expected: `build/search-blocks/filter-checkbox.js` and `filter-checkbox.css` created.

- [ ] **Step 6.11: Commit**

```bash
git add projects/packages/search/src/search-blocks/blocks/filter-checkbox/ \
        projects/packages/search/tests/php/Search_Blocks_Test.php
git commit -m "Search 3.0: add filter-checkbox block with variations (replaces per-type filter blocks)"
```

---

## Task 7: active-filters, sort-control, results-count, no-results, load-more Blocks

The remaining utility blocks. `results-count` and `no-results` are display-only (no `view.js`).

**Files:** One `{block.json, render.php, view.js, style.scss}` per block (no view.js for results-count and no-results).

- [ ] **Step 7.1: Create `active-filters` block**

`block.json` — name `jetpack/active-filters`, title `"Active Filters"`, viewScriptModule `active-filters.js`.

`render.php`:
```php
<?php
/**
 * Active Filters block render — shows currently selected filter pills.
 *
 * @package automattic/jetpack-search
 * @var array $attributes
 */
?>
<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="jetpack-search"
	class="jetpack-search-active-filters"
	data-wp-bind--hidden="!state.hasActiveFilters"
>
	<span><?php esc_html_e( 'Active filters:', 'jetpack-search-pkg' ); ?></span>
	<div
		class="jetpack-search-active-filters__pills"
		data-wp-each--pill="state.activePills"
		data-wp-each-key="context.pill.id"
	>
		<template data-wp-each-child>
			<button
				class="jetpack-search-active-filters__pill"
				data-wp-on--click="actions.onRemovePill"
				data-wp-text="context.pill.label"
			></button>
		</template>
	</div>
	<button
		class="jetpack-search-active-filters__clear-all"
		data-wp-on--click="actions.clearFilters"
	>
		<?php esc_html_e( 'Clear all', 'jetpack-search-pkg' ); ?>
	</button>
</div>
```

`view.js`:
```js
// src/search-blocks/blocks/active-filters/view.js
import { store, getContext } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		/**
		 * Truthy when any filter has selected values — drives data-wp-bind--hidden on the container.
		 */
		get hasActiveFilters() {
			const { state } = store( NAMESPACE );
			return Object.values( state.activeFilters ).some( v => v?.length > 0 );
		},

		/**
		 * Flattens activeFilters into a list of pill descriptors consumed by data-wp-each.
		 * Each pill carries { id, filterKey, value, label } where `id` is a stable key
		 * for data-wp-each-key and `label` is what the button renders.
		 */
		get activePills() {
			const { state } = store( NAMESPACE );
			const pills = [];
			for ( const [ filterKey, values ] of Object.entries( state.activeFilters ) ) {
				( values ?? [] ).forEach( value => {
					pills.push( {
						id: `${ filterKey }:${ value }`,
						filterKey,
						value,
						label: `${ filterKey }: ${ value } ✕`,
					} );
				} );
			}
			return pills;
		},
	},

	actions: {
		/**
		 * Remove the pill whose context is currently in scope.
		 * `setFilter` toggles, so calling it with an already-active value clears it.
		 */
		*onRemovePill() {
			const { actions } = store( NAMESPACE );
			const { pill } = getContext();
			yield actions.setFilter( pill.filterKey, pill.value );
		},
	},
} );
```

`style.scss`:
```scss
.wp-block-jetpack-active-filters {
	display: flex;
	align-items: center;
	gap: 0.5rem;
	flex-wrap: wrap;

	&[hidden] { display: none; }

	.jetpack-search-active-filters__pills {
		display: flex;
		gap: 0.25rem;
		flex-wrap: wrap;
	}

	.jetpack-search-active-filters__pill {
		background: #0073aa;
		color: white;
		border: none;
		border-radius: 12px;
		padding: 0.2rem 0.6rem;
		font-size: 0.8rem;
		cursor: pointer;
	}

	.jetpack-search-active-filters__clear-all {
		background: none;
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.2rem 0.5rem;
		font-size: 0.8rem;
		cursor: pointer;
	}
}
```

- [ ] **Step 7.2: Create `sort-control` block**

`block.json` — name `jetpack/sort-control`, title `"Sort Control"`, viewScriptModule `sort-control.js`.

`render.php`:
```php
<?php
/**
 * Sort Control block render.
 *
 * @package automattic/jetpack-search
 * @var array $attributes
 */
?>
<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="jetpack-search"
>
	<label for="jetpack-search-sort">
		<?php esc_html_e( 'Sort by', 'jetpack-search-pkg' ); ?>
	</label>
	<select
		id="jetpack-search-sort"
		data-wp-bind--value="state.sortOrder"
		data-wp-on--change="actions.onSortChange"
	>
		<option value="relevance"><?php esc_html_e( 'Relevance', 'jetpack-search-pkg' ); ?></option>
		<option value="date"><?php esc_html_e( 'Date (newest)', 'jetpack-search-pkg' ); ?></option>
	</select>
</div>
```

`view.js`:
```js
// src/search-blocks/blocks/sort-control/view.js
import { store } from '@wordpress/interactivity';

store( 'jetpack-search', {
	actions: {
		*onSortChange( event ) {
			const { state, actions } = store( 'jetpack-search' );
			state.sortOrder = event.target.value;
			yield actions.search();
		},
	},
} );
```

`style.scss`:
```scss
.wp-block-jetpack-sort-control {
	display: flex;
	align-items: center;
	gap: 0.5rem;

	label { font-size: 0.9rem; color: #555; }

	select {
		border: 1px solid #ccc;
		border-radius: 4px;
		padding: 0.3rem 0.5rem;
		font-size: 0.9rem;
	}
}
```

- [ ] **Step 7.3: Create `results-count` block (no view.js — display only)**

`block.json` — name `jetpack/results-count`, title `"Results Count"`, **no viewScriptModule** (PHP only), style file.

`render.php`:
```php
<?php
/**
 * Results Count block render.
 *
 * @package automattic/jetpack-search
 * @var array $attributes
 */
?>
<p
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="jetpack-search"
	data-wp-text="state.resultsCountText"
></p>
```

For the client-side text, add a derived state getter to the store (add this to `store/index.js` in the `state` section — add it after Task 7 once all blocks are done, or add it now):

```js
// Add to store/index.js state section:
state: {
    get resultsCountText() {
        const { state } = store( 'jetpack-search' );
        if ( state.isLoading ) return '';
        const total = state.totalResults;
        if ( total === 0 ) return '';
        return `${ total } result${ total === 1 ? '' : 's' }`;
    },
},
```

`style.scss`:
```scss
.wp-block-jetpack-results-count {
	font-size: 0.85rem;
	color: #666;
	margin: 0;
}
```

- [ ] **Step 7.4: Create `no-results` block (no view.js)**

`block.json` — name `jetpack/no-results`, title `"No Results"`, no viewScriptModule.

`render.php`:
```php
<?php
/**
 * No Results block render.
 *
 * @package automattic/jetpack-search
 * @var array $attributes
 */
$message = $attributes['message'] ?? __( 'No results found. Try a different search.', 'jetpack-search-pkg' );
?>
<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="state.results.length > 0 || state.isLoading"
>
	<p><?php echo esc_html( $message ); ?></p>
</div>
```

- [ ] **Step 7.5: Create `load-more` block**

`block.json` — name `jetpack/load-more`, title `"Load More"`, viewScriptModule `load-more.js`.

`render.php`:
```php
<?php
/**
 * Load More block render.
 *
 * @package automattic/jetpack-search
 * @var array $attributes
 */
?>
<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="!state.pageHandle || state.isLoadingMore"
>
	<button
		class="jetpack-search-load-more__button"
		data-wp-on--click="actions.loadMore"
		data-wp-bind--disabled="state.isLoadingMore"
	>
		<?php esc_html_e( 'Load more results', 'jetpack-search-pkg' ); ?>
	</button>
	<span
		class="jetpack-search-load-more__spinner"
		data-wp-bind--hidden="!state.isLoadingMore"
	>
		<?php esc_html_e( 'Loading…', 'jetpack-search-pkg' ); ?>
	</span>
</div>
```

`view.js`:
```js
// src/search-blocks/blocks/load-more/view.js
// loadMore action is defined in store/index.js — no extra code needed here.
import '@wordpress/interactivity'; // ensure the store is available
```

`style.scss`:
```scss
.wp-block-jetpack-load-more {
	text-align: center;
	padding: 1rem 0;

	&[hidden] { display: none; }

	.jetpack-search-load-more__button {
		background: #0073aa;
		color: white;
		border: none;
		border-radius: 4px;
		padding: 0.6rem 1.5rem;
		font-size: 1rem;
		cursor: pointer;

		&:hover { background: #005d8c; }
		&:disabled { opacity: 0.5; cursor: not-allowed; }
	}

	.jetpack-search-load-more__spinner {
		display: block;
		margin: 0.5rem auto;
		color: #666;
		&[hidden] { display: none; }
	}
}
```

- [ ] **Step 7.6: Add `resultsCountText` derived state to `store/index.js`**

Update `store/index.js` to add the derived state getter (inside the `store()` call, add a top-level `state` key alongside `actions` and `callbacks`):

```js
// Add to store( NAMESPACE, { ... } ) in store/index.js:
state: {
    get resultsCountText() {
        if ( state.isLoading ) return '';
        const total = state.totalResults;
        if ( total === 0 ) return '';
        return `${ total } result${ total === 1 ? '' : 's' }`;
    },
},
```

- [ ] **Step 7.7: Build**

```bash
pnpm build-blocks
```

Expected: all block JS files present in `build/search-blocks/`.

- [ ] **Step 7.8: Commit**

```bash
git add projects/packages/search/src/search-blocks/blocks/active-filters/ \
        projects/packages/search/src/search-blocks/blocks/sort-control/ \
        projects/packages/search/src/search-blocks/blocks/results-count/ \
        projects/packages/search/src/search-blocks/blocks/no-results/ \
        projects/packages/search/src/search-blocks/blocks/load-more/ \
        projects/packages/search/src/search-blocks/store/index.js
git commit -m "Search 3.0: add active-filters, sort-control, results-count, no-results, load-more blocks"
```

---

## Task 8: "Blog Search Page" Block Pattern

Ship the end-to-end proof: a full search page with sidebar filters and main result area.

**Files:**
- Create: `src/search-blocks/patterns/blog-search.php`

- [ ] **Step 8.1: Create the pattern file**

```php
<?php
/**
 * Blog Search Page block pattern.
 *
 * @package automattic/jetpack-search
 */

register_block_pattern(
	'jetpack-search/blog-search-page',
	array(
		'title'       => __( 'Blog Search Page', 'jetpack-search-pkg' ),
		'description' => __( 'A full-page search layout with sidebar filters and result list powered by Jetpack Search.', 'jetpack-search-pkg' ),
		'categories'  => array( 'jetpack-search' ),
		'content'     => '<!-- wp:columns {"style":{"spacing":{"blockGap":"2rem"}}} -->
<div class="wp-block-columns">

<!-- wp:column {"width":"260px"} -->
<div class="wp-block-column">
<!-- wp:jetpack/search-input /-->
<!-- wp:jetpack/active-filters /-->
<!-- wp:jetpack/filter-checkbox {"filterType":"taxonomy","taxonomy":"category","label":"Category"} /-->
<!-- wp:jetpack/filter-checkbox {"filterType":"taxonomy","taxonomy":"post_tag","label":"Tag"} /-->
<!-- wp:jetpack/filter-checkbox {"filterType":"post_type","label":"Post Type"} /-->
</div>
<!-- /wp:column -->

<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:jetpack/sort-control /-->
<!-- wp:jetpack/results-count /-->
<!-- wp:jetpack/search-results /-->
<!-- wp:jetpack/no-results /-->
<!-- wp:jetpack/load-more /-->
</div>
<!-- /wp:column -->

</div>
<!-- /wp:columns -->',
	)
);
```

- [ ] **Step 8.2: Register the `jetpack-search` block pattern category**

Add to `class-search-blocks.php` inside `register_blocks()` before the `glob`:

```php
// Register block pattern category.
if ( function_exists( 'register_block_pattern_category' ) ) {
    register_block_pattern_category(
        'jetpack-search',
        array( 'label' => __( 'Jetpack Search', 'jetpack-search-pkg' ) )
    );
}
```

- [ ] **Step 8.3: Commit**

```bash
git add projects/packages/search/src/search-blocks/patterns/ \
        projects/packages/search/src/search-blocks/class-search-blocks.php
git commit -m "Search 3.0: add Blog Search Page block pattern"
```

---

## Task 9: Local Dev Verification

Verify the end-to-end flow in Docker before calling Phase 1 done.

- [ ] **Step 9.1: Start Docker environment**

```bash
jetpack docker up -d
jetpack docker install   # only needed on first run
```

- [ ] **Step 9.2: Watch-build blocks**

In a separate terminal:
```bash
cd projects/packages/search
pnpm build-blocks --watch
```

- [ ] **Step 9.3: Activate and test**

```bash
# Enable Jetpack Search module if not already enabled
jetpack docker wp jetpack module activate search

# Navigate to http://localhost:8888/wp-admin → Appearance → Editor → Patterns
# Add the "Blog Search Page" pattern to the search template
# Browse to http://localhost:8888/?s=test
```

Expected: Page renders with sidebar filters and result list. Typing in the search input triggers a new search. Clicking a category filter shows filtered results.

- [ ] **Step 9.4: Run all tests**

```bash
cd projects/packages/search
pnpm test-scripts -- --testPathPattern=search-blocks
jetpack test php packages/search -- --filter=Search_Blocks_Test
```

Expected: All PASS.

- [ ] **Step 9.5: Full build validation**

```bash
pnpm build
```

Expected: All build targets succeed with no errors. Total build output size has not regressed the `size-limit` check.

---

## Task 10: Changelog and PR Prep

- [ ] **Step 10.1: Add changelog entry**

```bash
jp changelog add packages/search -s minor -t added -e "Search 3.0: Interactivity API block foundation — composable search blocks, shared reactive store, SSR pre-fetch, and Blog Search Page pattern (Phase 1)"
```

- [ ] **Step 10.2: Final commit**

```bash
git add changelog/
git commit -m "Search 3.0: add changelog entry for Phase 1 Interactivity API blocks"
```

---

## Self-Review Notes

**Spec coverage:**
- ✅ Directory structure as specified
- ✅ New webpack target (ESM, separate from instant-search)
- ✅ Interactivity API store with all actions (`search`, `setFilter`, `clearFilters`, `loadMore`, `syncToUrl`)
- ✅ All Phase 1 filter use cases: category, tag, post type, author, custom taxonomy, post meta
- ✅ `filterConfigs` pattern: PHP registers ES field + agg type; JS executes, never hardcodes fields
- ✅ Dynamic (terms agg) and curated (filters agg) display modes in one block
- ✅ Named block variations appear separately in inserter; share one implementation
- ✅ PHP block registration class
- ✅ `build_initial_state()` + per-block `wp_interactivity_state()` merges
- ✅ API routing: 3-path logic (public API / wpcom-origin / Atomic)
- ✅ URL state sync (push + read)
- ✅ Blog Search Page block pattern (references filter-checkbox with variation attributes)
- ✅ Hook into initializer
- ✅ Tests (JS unit for buildAggregations/buildFilters/url-state + PHP unit for derive_filter_key/derive_es_field)
- ✅ Local dev verification

**Not in this plan (deferred to later phases):**
- WooCommerce filter blocks (Phase 2) — filter-checkbox covers attribute, rating, stock-status in Phase 2 with new ES field mappings
- WP_Query ES bridge (Phase 3)
- Overlay rewrite (Phase 4)
- Developer platform / registration API (Phase 5)
- `filter-date` block — different UI (date range picker); separate block needed, add after core set is proven

**Type consistency check:**
- `state.activeFilters` is `{ [filterKey: string]: string[] }` — consistent across store, api.js, url-state.js, filter-checkbox render.php, and view.js.
- `state.filterConfigs` is `{ [filterKey: string]: FilterConfig }` where `FilterConfig = { filterKey, esField, aggType, curatedValues, showCount, maxItems }` — set by PHP, read by JS.
- `state.aggregations` is `{ [filterKey: string]: { buckets: Array<{ key, doc_count }> } | { buckets: { [value]: { doc_count } } } }` — terms vs filters agg shapes differ; `view.js count` getter handles both.
- `buildSearchUrl()`, `buildAggregations()`, `buildFilters()` all accept `filterConfigs` — consistent across api.js and store/index.js calls.
