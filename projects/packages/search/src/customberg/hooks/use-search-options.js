import { useEntityProp } from '@wordpress/core-data';
import { PRODUCT_SORT_OPTIONS, RELEVANCE_SORT_KEY } from 'instant-search/lib/constants';
import { useMemo } from 'react';

/* eslint-disable react/jsx-no-bind */
const VALID_POST_TYPES = global.JetpackInstantSearchOptions.postTypes;

/**
 * Fetches values and setters for various search configuration values.
 *
 * @returns {object} values and setters
 */
export default function useSearchOptions() {
	const [ theme, setTheme ] = useEntityProp( 'root', 'site', 'jetpack_search_color_theme' );
	const [ resultFormat, setResultFormatRaw ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_result_format'
	);
	const [ sort, setSort ] = useEntityProp( 'root', 'site', 'jetpack_search_default_sort' );
	const [ trigger, setTrigger ] = useEntityProp( 'root', 'site', 'jetpack_search_overlay_trigger' );
	const [ color, setColor ] = useEntityProp( 'root', 'site', 'jetpack_search_highlight_color' );
	const [ sortEnabled, setSortEnabled ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_enable_sort'
	);
	const [ infiniteScroll, setInfiniteScroll ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_inf_scroll'
	);
	const [ filteringOpensOverlay, setFilteringOpensOverlay ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_filtering_opens_overlay'
	);
	const [ showLogo, setShowLogo ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_show_powered_by'
	);
	const [ postDate, setPostDate ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_show_post_date'
	);
	const [ excludedPostTypesCsv, setExcludedPostTypesCsv ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_excluded_post_types'
	);
	// Excluded Post Types is stored as a CSV string in site options. Convert into array of strings.
	// Caveat: csv can be an empty string, which can produce [ '' ] if only csv.split is used.
	const excludedPostTypes = useMemo(
		() => excludedPostTypesCsv?.split( ',' ).filter( type => type in VALID_POST_TYPES ),
		[ excludedPostTypesCsv ]
	);
	const setExcludedPostTypes = postTypesArr =>
		setExcludedPostTypesCsv( postTypesArr.filter( type => type in VALID_POST_TYPES ).join( ',' ) );

	// Add special handling for product -> non-product result format changes.
	const setResultFormat = format => {
		const previousFormat = resultFormat;
		setResultFormatRaw( format );

		// If switching from product to non-product and the default sort is product-specific,
		// reset to relevance sort.
		if ( previousFormat === 'product' && PRODUCT_SORT_OPTIONS.has( sort ) ) {
			setSort( RELEVANCE_SORT_KEY );
		}
	};

	return {
		color,
		excludedPostTypes,
		infiniteScroll,
		filteringOpensOverlay,
		resultFormat,
		setColor,
		setExcludedPostTypes,
		setInfiniteScroll,
		setFilteringOpensOverlay,
		setResultFormat,
		setShowLogo,
		setSort,
		setSortEnabled,
		setTheme,
		setTrigger,
		showLogo,
		sort,
		sortEnabled,
		theme,
		trigger,
		postDate,
		setPostDate,
	};
}
