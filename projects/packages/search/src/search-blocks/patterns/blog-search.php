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
<div class="wp-block-column" style="flex-basis:260px">
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
