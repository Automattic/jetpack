<?php
/**
 * Compact Search block pattern.
 *
 * Single-row toolbar (search input + filter popover + sort popover) over a
 * compact result list. Mirrors the WordPress Dataview list layout.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

register_block_pattern(
	'jetpack-search/compact-search',
	array(
		'title'       => __( 'Compact Search', 'jetpack-search-pkg' ),
		'description' => __( 'A compact Jetpack Search toolbar with inline filter and sort controls, plus a dense result list.', 'jetpack-search-pkg' ),
		'categories'  => array( 'jetpack-search' ),
		'keywords'    => array(
			__( 'search', 'jetpack-search-pkg' ),
			__( 'compact', 'jetpack-search-pkg' ),
			__( 'list', 'jetpack-search-pkg' ),
			__( 'jetpack search', 'jetpack-search-pkg' ),
		),
		'content'     => '<!-- wp:group {"style":{"spacing":{"blockGap":"1rem"}}} -->
<div class="wp-block-group">

<!-- wp:group {"className":"jetpack-search-compact-toolbar","layout":{"type":"flex","flexWrap":"nowrap"}} -->
<div class="wp-block-group jetpack-search-compact-toolbar">
<!-- wp:jetpack-search/search-input /-->
<!-- wp:jetpack-search/filters-popover -->
<!-- wp:jetpack-search/active-filters /-->
<!-- wp:jetpack-search/filter-checkbox {"filterType":"taxonomy","taxonomy":"category"} /-->
<!-- wp:jetpack-search/filter-checkbox {"filterType":"taxonomy","taxonomy":"post_tag"} /-->
<!-- wp:jetpack-search/filter-checkbox {"filterType":"post_type"} /-->
<!-- /wp:jetpack-search/filters-popover -->
<!-- wp:jetpack-search/results-sort {"displayAs":"popover"} /-->
</div>
<!-- /wp:group -->

<!-- wp:jetpack-search/search-results -->
<!-- wp:jetpack-search/results-count /-->
<!-- wp:jetpack-search/results-list {"layout":"compact"} /-->
<!-- wp:jetpack-search/results-load-more /-->
<!-- wp:jetpack-search/powered-by /-->
<!-- /wp:jetpack-search/search-results -->

</div>
<!-- /wp:group -->',
	)
);
