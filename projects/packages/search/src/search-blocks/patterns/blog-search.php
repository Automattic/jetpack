<?php
/**
 * Blog Search Page block pattern.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

$content = Search_Blocks::pattern_content_from_template( 'jetpack-search-overlay.html' );
if ( '' === $content ) {
	return;
}

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
		'content'     => $content,
	)
);
