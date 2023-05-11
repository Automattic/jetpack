import { useEntityProp } from '@wordpress/core-data';
import { useMemo } from 'react';

/**
 * Fetches values and setters for various search configuration values.
 *
 * @returns {object} values and setters
 */
export default function useSearchOptions() {
	const [ theme, setTheme ] = useEntityProp( 'root', 'site', 'jetpack_search_color_theme' );
	const [ resultFormat, setResultFormat ] = useEntityProp(
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
	// Caveat: csv can be an empty string, which can produces [ '' ] if only csv.split is used.
	const excludedPostTypes = useMemo(
		() => excludedPostTypesCsv?.split( ',' ).filter( type => type?.length > 0 ),
		[ excludedPostTypesCsv ]
	);
	const setExcludedPostTypes = postTypesArr => setExcludedPostTypesCsv( postTypesArr.join( ',' ) );

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
