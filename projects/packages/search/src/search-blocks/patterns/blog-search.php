<?php
/**
 * Blog Search Page block pattern.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

register_block_pattern(
	'jetpack-search/blog-search-page',
	array(
		'title'       => __( 'Blog Search Page', 'jetpack-search-pkg' ),
		'description' => __( 'A full-page search layout with sidebar filters and a result list powered by Jetpack Search.', 'jetpack-search-pkg' ),
		'categories'  => array( 'jetpack-search' ),
		'keywords'    => array(
			__( 'search', 'jetpack-search-pkg' ),
			__( 'blog', 'jetpack-search-pkg' ),
			__( 'results', 'jetpack-search-pkg' ),
			__( 'jetpack search', 'jetpack-search-pkg' ),
		),
		'content'     => '<!-- wp:group {"style":{"spacing":{"blockGap":"1.5rem"}}} -->
<div class="wp-block-group">
<!-- wp:jetpack/search-input /-->

<!-- wp:columns {"style":{"spacing":{"blockGap":"2rem"}}} -->
<div class="wp-block-columns">

<!-- wp:column -->
<div class="wp-block-column">
<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group">
<!-- wp:jetpack/results-count /-->
<!-- wp:jetpack/sort-control /-->
</div>
<!-- /wp:group -->

<!-- wp:jetpack/search-results /-->
<!-- wp:jetpack/search-error /-->
<!-- wp:jetpack/no-results /-->
<!-- wp:jetpack/load-more /-->
</div>
<!-- /wp:column -->

<!-- wp:column {"width":"260px","style":{"border":{"left":{"color":"#e0e0e0","width":"1px"}},"spacing":{"padding":{"left":"2rem"}}}} -->
<div class="wp-block-column" style="border-left-color:#e0e0e0;border-left-width:1px;padding-left:2rem;flex-basis:260px">
<!-- wp:heading {"level":2,"style":{"typography":{"fontSize":"1.25rem"}}} -->
<h2 class="wp-block-heading" style="font-size:1.25rem">' . esc_html__( 'Filter options', 'jetpack-search-pkg' ) . '</h2>
<!-- /wp:heading -->
<!-- wp:jetpack/active-filters /-->
<!-- wp:jetpack/filter-checkbox {"filterType":"taxonomy","taxonomy":"category"} /-->
<!-- wp:jetpack/filter-checkbox {"filterType":"taxonomy","taxonomy":"post_tag"} /-->
<!-- wp:jetpack/filter-checkbox {"filterType":"post_type"} /-->
</div>
<!-- /wp:column -->

</div>
<!-- /wp:columns -->
</div>
<!-- /wp:group -->',
	)
);
