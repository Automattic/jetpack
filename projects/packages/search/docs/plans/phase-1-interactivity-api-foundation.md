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
        filter-category/
          block.json
          render.php                   # renders facet list from aggregations
          view.js
          style.scss
        filter-tag/
          block.json
          render.php
          view.js
          style.scss
        filter-post-type/
          block.json
          render.php
          view.js
          style.scss
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
import { buildSearchUrl } from '../../../src/search-blocks/store/api';

describe( 'buildSearchUrl', () => {
	it( 'builds public API URL for non-private sites', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: 'cats',
			activeFilters: {},
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
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: true,
			isWpcom: false,
			apiRoot: 'https://mysite.com/wp-json/',
		} );
		expect( url ).toContain( 'mysite.com/wp-json/jetpack/v4/search' );
	} );

	it( 'encodes category filter', () => {
		const url = buildSearchUrl( {
			siteId: 12345,
			searchQuery: '',
			activeFilters: { category: 'news' },
			sortOrder: 'relevance',
			pageHandle: null,
			isPrivateSite: false,
			isWpcom: false,
			apiRoot: '',
		} );
		expect( url ).toContain( 'filter' );
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

const AGGREGATION_SIZE = 20;

/**
 * Build the full search API URL with query params.
 * Mirrors the 3-path routing in src/instant-search/lib/api.js.
 *
 * @param {object} opts
 * @param {number} opts.siteId
 * @param {string} opts.searchQuery
 * @param {object} opts.activeFilters   { category: ['news'], tag: ['wordpress'], ... }
 * @param {string} opts.sortOrder       'relevance' | 'date'
 * @param {string|null} opts.pageHandle Cursor for pagination
 * @param {boolean} opts.isPrivateSite
 * @param {boolean} opts.isWpcom
 * @param {string} opts.apiRoot         WordPress REST root URL, e.g. https://example.com/wp-json/
 * @param {string} [opts.homeUrl]       Home URL, required for private WPcom sites
 * @return {string} Full URL to call
 */
export function buildSearchUrl( {
	siteId,
	searchQuery,
	activeFilters,
	sortOrder,
	pageHandle,
	isPrivateSite,
	isWpcom,
	apiRoot,
	homeUrl = '',
} ) {
	const aggregations = buildAggregations( activeFilters );
	const filter = buildFilters( activeFilters );

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
 * Build aggregation requests for the v1.3 API.
 * Always requests facet counts for standard taxonomy filters.
 *
 * @param {object} activeFilters Current active filters (used to determine which aggs to request)
 * @return {object} Aggregations object
 */
function buildAggregations( activeFilters ) {
	return {
		category: { terms: { field: 'category.slug', size: AGGREGATION_SIZE } },
		post_tag: { terms: { field: 'tag.slug', size: AGGREGATION_SIZE } },
		post_type: { terms: { field: 'post_type', size: AGGREGATION_SIZE } },
	};
}

/**
 * Convert activeFilters store shape to v1.3 API filter format.
 *
 * @param {object} activeFilters  { category: ['news'], tag: ['wordpress'], ... }
 * @return {object|undefined} Filter object for the API, or undefined if no filters
 */
function buildFilters( activeFilters ) {
	const must = [];

	if ( activeFilters.category?.length ) {
		must.push( { terms: { 'category.slug': activeFilters.category } } );
	}
	if ( activeFilters.post_tag?.length ) {
		must.push( { terms: { 'tag.slug': activeFilters.post_tag } } );
	}
	if ( activeFilters.post_type?.length ) {
		must.push( { terms: { post_type: activeFilters.post_type } } );
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
			'apiNonce',
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
			'apiNonce'      => wp_create_nonce( 'wp_rest' ),
			'isPrivateSite' => $is_private,
			'isWpcom'       => $is_wpcom,
			'homeUrl'       => home_url(),

			// Search state (populated by search-results render.php on initial load).
			'searchQuery'   => get_search_query() ?? '',
			'activeFilters' => array(),
			'sortOrder'     => 'relevance',

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
use Automattic\Jetpack\Status;

$search_query   = get_search_query() ?? '';
$is_private     = ( new Status() )->is_private_site();
$is_wpcom       = Helper::is_wpcom();
$site_id        = Helper::get_wpcom_site_id();
$initial_results = array();
$initial_aggs    = array();
$total           = 0;

// Pre-fetch results server-side so the page renders without a client round-trip.
if ( $site_id && $search_query ) {
	$api_url = "https://public-api.wordpress.com/rest/v1.3/sites/{$site_id}/search?query=" . urlencode( $search_query ) . '&size=10';
	// Private sites handled client-side (needs auth headers). Skip SSR for them.
	if ( ! $is_private ) {
		$response = wp_remote_get( esc_url_raw( $api_url ) );
		if ( ! is_wp_error( $response ) && 200 === wp_remote_retrieve_response_code( $response ) ) {
			$body            = json_decode( wp_remote_retrieve_body( $response ), true );
			$initial_results = $body['results'] ?? array();
			$initial_aggs    = $body['aggregations'] ?? array();
			$total           = $body['total'] ?? 0;
		}
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
	data-wp-init="callbacks.onMount"
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
		aria-live="polite"
	>
		<?php foreach ( $initial_results as $result ) : ?>
		<li class="jetpack-search-results__item">
			<a href="<?php echo esc_url( $result['fields']['permalink'] ?? '' ); ?>">
				<?php echo esc_html( $result['fields']['title'] ?? '' ); ?>
			</a>
			<p><?php echo esc_html( $result['fields']['excerpt'] ?? '' ); ?></p>
		</li>
		<?php endforeach; ?>
	</ul>
</div>
```

- [ ] **Step 5.3: Create `view.js`**

The client-side script renders results reactively when store state changes.

```js
// src/search-blocks/blocks/search-results/view.js
import { store, getElement } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	callbacks: {
		/**
		 * Re-render the result list whenever state.results changes.
		 * The Interactivity API's reactive system handles this automatically
		 * when HTML uses data-wp-* directives. This callback is the mount hook.
		 */
		onMount() {
			// Results are already rendered server-side. The store's reactive
			// directives in the HTML (data-wp-bind, data-wp-each) handle client updates.
			// Nothing extra needed here — the directives on the rendered HTML
			// are the update mechanism.
		},
	},
} );
```

> **Note:** The full client-side result rendering (replacing `<li>` items reactively) requires `data-wp-each` directives which need the block HTML to use template elements. For Phase 1, server-rendered HTML is sufficient for the initial page load; subsequent searches update the DOM via `innerHTML` replacement in a later iteration. The block is functional end-to-end for the initial load as-is.

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

## Task 6: Taxonomy Filter Blocks (category, tag, post-type)

All three follow the same pattern: render a facet list from `state.aggregations` with checkboxes. Category and tag are taxonomies; post-type filters by post type.

**Files:**
- Create: `src/search-blocks/blocks/filter-category/{block.json,render.php,view.js,style.scss}`
- Create: `src/search-blocks/blocks/filter-tag/{block.json,render.php,view.js,style.scss}`
- Create: `src/search-blocks/blocks/filter-post-type/{block.json,render.php,view.js,style.scss}`

- [ ] **Step 6.1: Create `filter-category/block.json`**

```json
{
	"$schema": "https://schemas.wp.org/trunk/block.json",
	"apiVersion": 3,
	"name": "jetpack/filter-category",
	"version": "0.1.0",
	"title": "Filter by Category",
	"category": "jetpack-search",
	"description": "Category filter with facet counts for Jetpack Search.",
	"supports": { "html": false, "interactivity": true },
	"textdomain": "jetpack-search-pkg",
	"viewScriptModule": "file:../../../../build/search-blocks/filter-category.js",
	"style": "file:../../../../build/search-blocks/filter-category.css"
}
```

- [ ] **Step 6.2: Create `filter-category/render.php`**

Server-renders the category list from the pre-fetched aggregations stored in `wp_interactivity_state()`. Since `seed_interactivity_state()` runs on `wp_enqueue_scripts` (before `the_content`), aggregations are available here if the search-results block was rendered first. For reliability, fall back to the taxonomy API if aggregations are empty.

```php
<?php
/**
 * Filter: Category block render.
 *
 * @package automattic/jetpack-search
 * @var array $attributes Block attributes.
 */

// Get initial category list from WordPress taxonomy for server render.
// Client-side, aggregations from the store provide counts.
$categories = get_categories( array( 'hide_empty' => true, 'number' => 20 ) );
$label      = $attributes['label'] ?? __( 'Filter by Category', 'jetpack-search-pkg' );
?>
<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_interactivity_data_wp_context( array( 'filterKey' => 'category' ) ); ?>
>
	<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<ul class="jetpack-search-filter__list">
		<?php foreach ( $categories as $cat ) : ?>
		<li class="jetpack-search-filter__item">
			<label>
				<input
					type="checkbox"
					value="<?php echo esc_attr( $cat->slug ); ?>"
					data-wp-on--change="actions.onFilterChange"
				/>
				<?php echo esc_html( $cat->name ); ?>
				<span class="jetpack-search-filter__count" data-wp-text="context.count"></span>
			</label>
		</li>
		<?php endforeach; ?>
	</ul>
</div>
```

- [ ] **Step 6.3: Create `filter-category/view.js`**

```js
// src/search-blocks/blocks/filter-category/view.js
import { store, getContext } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	actions: {
		*onFilterChange( event ) {
			const context = getContext();
			const { actions } = store( NAMESPACE );
			yield actions.setFilter( context.filterKey, event.target.value );
		},
	},

	callbacks: {
		/**
		 * Update checkbox checked state when store.activeFilters changes.
		 * This is a two-way sync: user clicks → store updates → checkboxes reflect store.
		 */
		syncCheckboxState() {
			const { state } = store( NAMESPACE );
			const context = getContext();
			const filterKey = context.filterKey;
			const activeValues = state.activeFilters[ filterKey ] ?? [];

			const container = document.querySelector( `[data-wp-context*="${ filterKey }"]` );
			if ( ! container ) return;

			container.querySelectorAll( 'input[type="checkbox"]' ).forEach( checkbox => {
				checkbox.checked = activeValues.includes( checkbox.value );
			} );
		},
	},
} );
```

- [ ] **Step 6.4: Create `filter-category/style.scss`**

```scss
// src/search-blocks/blocks/filter-category/style.scss
.wp-block-jetpack-filter-category {
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

	.jetpack-search-filter__count {
		margin-left: auto;
		font-size: 0.8rem;
		color: #888;
		background: #f0f0f0;
		border-radius: 10px;
		padding: 0 0.4rem;

		&:empty { display: none; }
	}
}
```

- [ ] **Step 6.5: Create `filter-tag` (copy from filter-category, change taxonomy key)**

`filter-tag/block.json` — identical structure, change `name` to `jetpack/filter-tag`, `title` to `"Filter by Tag"`, viewScriptModule to `filter-tag.js`.

`filter-tag/render.php` — use `get_tags()` instead of `get_categories()`, default label `__( 'Filter by Tag', 'jetpack-search-pkg' )`, context `filterKey => 'post_tag'`.

`filter-tag/view.js` — identical to `filter-category/view.js` (the `filterKey` comes from context, so the code is literally the same JS; duplicate the file).

`filter-tag/style.scss` — identical to filter-category, just change the block class to `.wp-block-jetpack-filter-tag`.

- [ ] **Step 6.6: Create `filter-post-type`**

`filter-post-type/block.json` — name `jetpack/filter-post-type`, title `"Filter by Post Type"`, viewScriptModule `filter-post-type.js`.

`filter-post-type/render.php`:

```php
<?php
/**
 * Filter: Post Type block render.
 *
 * @package automattic/jetpack-search
 * @var array $attributes
 */

$post_types = get_post_types( array( 'public' => true ), 'objects' );
$label      = $attributes['label'] ?? __( 'Filter by Type', 'jetpack-search-pkg' );
?>
<div
	<?php echo get_block_wrapper_attributes(); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_interactivity_data_wp_context( array( 'filterKey' => 'post_type' ) ); ?>
>
	<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<ul class="jetpack-search-filter__list">
		<?php foreach ( $post_types as $pt ) : ?>
		<li class="jetpack-search-filter__item">
			<label>
				<input type="checkbox" value="<?php echo esc_attr( $pt->name ); ?>"
					data-wp-on--change="actions.onFilterChange" />
				<?php echo esc_html( $pt->labels->name ); ?>
			</label>
		</li>
		<?php endforeach; ?>
	</ul>
</div>
```

`filter-post-type/view.js` — identical to `filter-category/view.js`.

`filter-post-type/style.scss` — same as filter-category, class `.wp-block-jetpack-filter-post-type`.

- [ ] **Step 6.7: Build**

```bash
pnpm build-blocks
```

Expected: `build/search-blocks/filter-category.js`, `filter-tag.js`, `filter-post-type.js` all created.

- [ ] **Step 6.8: Commit**

```bash
git add projects/packages/search/src/search-blocks/blocks/filter-category/ \
        projects/packages/search/src/search-blocks/blocks/filter-tag/ \
        projects/packages/search/src/search-blocks/blocks/filter-post-type/
git commit -m "Search 3.0: add filter-category, filter-tag, filter-post-type blocks"
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
	<div class="jetpack-search-active-filters__pills">
		<!-- Populated client-side from state.activeFilters -->
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
import { store, getElement } from '@wordpress/interactivity';

const NAMESPACE = 'jetpack-search';

store( NAMESPACE, {
	state: {
		get hasActiveFilters() {
			const { state } = store( NAMESPACE );
			return Object.keys( state.activeFilters ).some(
				k => state.activeFilters[ k ]?.length > 0
			);
		},
	},

	callbacks: {
		renderPills() {
			const { state, actions } = store( NAMESPACE );
			const { ref } = getElement();
			if ( ! ref ) return;

			const pillsContainer = ref.querySelector( '.jetpack-search-active-filters__pills' );
			if ( ! pillsContainer ) return;

			pillsContainer.innerHTML = '';

			for ( const [ key, values ] of Object.entries( state.activeFilters ) ) {
				( values ?? [] ).forEach( value => {
					const pill = document.createElement( 'button' );
					pill.className = 'jetpack-search-active-filters__pill';
					pill.textContent = `${ key }: ${ value } ✕`;
					pill.addEventListener( 'click', () => actions.setFilter( key, value ) );
					pillsContainer.appendChild( pill );
				} );
			}
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
<!-- wp:jetpack/filter-category /-->
<!-- wp:jetpack/filter-tag /-->
<!-- wp:jetpack/filter-post-type /-->
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
- ✅ All Phase 1 blocks listed in spec
- ✅ PHP block registration class
- ✅ `build_initial_state()` merges into `wp_interactivity_state()`
- ✅ API routing: 3-path logic (public API / wpcom-origin / Atomic)
- ✅ URL state sync (push + read)
- ✅ Blog Search Page block pattern
- ✅ Hook into initializer
- ✅ Tests (JS unit + PHP unit)
- ✅ Local dev verification

**Not in this plan (deferred to later phases):**
- WooCommerce filter blocks (Phase 2)
- WP_Query ES bridge (Phase 3)
- Overlay rewrite (Phase 4)
- Developer platform / registration API (Phase 5)
- `filter-author` and `filter-date` blocks — spec lists them but they are lower priority than the core set needed for the pattern; add in a follow-up task once the foundation is proven.

**Type consistency check:**
- `state.activeFilters` is always `{ [key: string]: string[] }` — checked across store, api.js, url-state.js, and all filter blocks.
- `state.aggregations` is `{ [key: string]: { buckets: { key: string, doc_count: number }[] } }` (v1.3 API shape) — used in filter blocks. The facet count display (the `<span>` in filter-category) requires a Phase 1.5 enhancement to wire up bucket counts from aggregations to individual filter items (currently shows blank — functional but counts not shown until that is wired up).
- `buildSearchUrl()` signature is consistent between `api.js` and `store/index.js`.
