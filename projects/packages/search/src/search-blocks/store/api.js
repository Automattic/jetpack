import { flatten } from 'q-flat';
import { encode } from 'qss';

/**
 * Build the full search API URL with query params.
 * Mirrors the 3-path routing in src/instant-search/lib/api.js.
 *
 * @param {object}      opts               - Options.
 * @param {number}      opts.siteId        - Site ID.
 * @param {string}      opts.searchQuery   - Search query string.
 * @param {object}      opts.activeFilters - Map of filterKey → string[].
 * @param {object}      opts.filterConfigs - Map of filterKey → FilterConfig.
 * @param {string}      opts.sortOrder     - 'relevance' | 'date'.
 * @param {string|null} opts.pageHandle    - Cursor for pagination.
 * @param {boolean}     opts.isPrivateSite - Whether the site is private.
 * @param {boolean}     opts.isWpcom       - Whether the site runs on WordPress.com.
 * @param {string}      opts.apiRoot       - WordPress REST API root URL.
 * @param {string}      [opts.homeUrl]     - Home URL; required for private WPcom sites.
 * @return {string} Full URL to call.
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
 * { filterKey, esField, aggType: 'terms'|'filters', curatedValues, showCount, maxItems }.
 * PHP sets esField and aggType; JS never hardcodes field names.
 *
 * @param {object} filterConfigs - Map of filterKey → FilterConfig.
 * @return {object} Aggregations object for the v1.3 API.
 */
export function buildAggregations( filterConfigs ) {
	const aggregations = {};

	for ( const [ filterKey, config ] of Object.entries( filterConfigs ?? {} ) ) {
		if ( ! config.showCount ) {
			continue;
		}

		if ( config.aggType === 'filters' && config.curatedValues?.length ) {
			// Curated: ES "filters" aggregation returns one count per specified value.
			const filters = {};
			config.curatedValues.forEach( value => {
				filters[ value ] = { term: { [ config.esField ]: value } };
			} );
			aggregations[ filterKey ] = { filters: { filters } };
		} else {
			// Dynamic: ES "terms" aggregation returns top-N values + counts.
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
 * @param {object} activeFilters - Map of filterKey → string[].
 * @param {object} filterConfigs - Map of filterKey → FilterConfig.
 * @return {object|undefined} ES bool.must filter, or undefined if nothing is active.
 */
export function buildFilters( activeFilters, filterConfigs ) {
	const must = [];

	for ( const [ filterKey, values ] of Object.entries( activeFilters ?? {} ) ) {
		if ( ! values?.length ) {
			continue;
		}

		const config = filterConfigs?.[ filterKey ];
		if ( ! config?.esField ) {
			continue;
		}

		must.push( { terms: { [ config.esField ]: values } } );
	}

	return must.length ? { bool: { must } } : undefined;
}
