/**
 * WordPress dependencies
 */
import { useEntityProp } from '@wordpress/core-data';

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
	const [ showLogo, setShowLogo ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_show_powered_by'
	);
	const [ excludedPostTypes, setExcludedPostTypes ] = useEntityProp(
		'root',
		'site',
		'jetpack_search_excluded_post_types'
	);
	return {
		color,
		excludedPostTypes,
		infiniteScroll,
		resultFormat,
		setColor,
		setExcludedPostTypes,
		setInfiniteScroll,
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
	};
}
