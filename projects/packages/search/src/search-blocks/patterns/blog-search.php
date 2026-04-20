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
		'description' => __( 'A full-page search layout with a result list powered by Jetpack Search.', 'jetpack-search-pkg' ),
		'categories'  => array( 'jetpack-search' ),
		'content'     => '<!-- wp:group {"style":{"spacing":{"blockGap":"1rem"}}} -->
<div class="wp-block-group">
<!-- wp:jetpack/search-input /-->
<!-- wp:jetpack/sort-control /-->
<!-- wp:jetpack/results-count /-->
<!-- wp:jetpack/search-results /-->
<!-- wp:jetpack/no-results /-->
<!-- wp:jetpack/load-more /-->
</div>
<!-- /wp:group -->',
	)
);
