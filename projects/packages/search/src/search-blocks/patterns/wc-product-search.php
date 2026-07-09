<?php
/**
 * Product Search Page block pattern.
 *
 * WooCommerce-only: composes `filters-product` / `filter-wc-*` blocks, so the
 * `wc-` filename prefix keeps `register_patterns()` from loading it on non-Woo
 * sites. Content mirrors `templates/jetpack-search-overlay-product.html`.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

$content = Search_Blocks::pattern_content_from_template( 'jetpack-search-overlay-product.html' );
if ( '' === $content ) {
	return;
}

register_block_pattern(
	'jetpack-search/wc-product-search-page',
	array(
		'title'       => __( 'Product Search Page', 'jetpack-search-pkg' ),
		'description' => __( 'A full-page product search layout with sidebar filters and a product result grid powered by Jetpack Search.', 'jetpack-search-pkg' ),
		'categories'  => array( 'jetpack-search' ),
		'keywords'    => array(
			__( 'search', 'jetpack-search-pkg' ),
			__( 'product', 'jetpack-search-pkg' ),
			__( 'woocommerce', 'jetpack-search-pkg' ),
			__( 'jetpack search', 'jetpack-search-pkg' ),
		),
		'content'     => $content,
	)
);
