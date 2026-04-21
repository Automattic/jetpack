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
		'description' => __( 'A full-page search layout with a result list powered by Jetpack Search.', 'jetpack-search-pkg' ),
		'categories'  => array( 'jetpack-search' ),
		'content'     => '<!-- wp:group {"style":{"spacing":{"blockGap":"1.5rem"}}} -->
<div class="wp-block-group">
<!-- wp:jetpack/search-input /-->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group">
<!-- wp:jetpack/results-count /-->
<!-- wp:jetpack/sort-control /-->
</div>
<!-- /wp:group -->

<!-- wp:jetpack/search-results /-->
<!-- wp:jetpack/no-results /-->
<!-- wp:jetpack/load-more /-->
</div>
<!-- /wp:group -->',
	)
);
