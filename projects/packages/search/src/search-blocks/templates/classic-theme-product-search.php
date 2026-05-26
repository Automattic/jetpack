<?php
/**
 * Classic-theme product-search results template for the Jetpack Search
 * Embedded experience — WooCommerce-product counterpart of
 * `classic-theme-search.php`.
 *
 * Wraps the bundled `jetpack-search-product-results.html` block markup in the
 * active theme's `get_header()` / `get_footer()` so the block-rendered
 * product results sit inside the theme's chrome — the classic-theme
 * counterpart to the FSE block template fronted via
 * `search_template_hierarchy` on block themes.
 *
 * Loaded via the `template_include` filter in
 * `Search_Blocks::route_classic_theme_search_template()`; reachable only on
 * `is_search()` with Embedded saved + classic theme + WooCommerce product
 * search + the `jetpack_search_override_woocommerce_search_template` option on.
 *
 * @package automattic/jetpack-search
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

// Classic themes don't emit core's layout block-supports CSS — see the
// matching note in `classic-theme-search.php` for why we reapply the inner
// `wp-block-group` layout here.
?>
<style id="jetpack-search-classic-theme-layout">
main.wp-block-group {
	max-width: var(--wp--style--global--wide-size, 1280px);
	margin-inline: auto;
	padding-inline: clamp(1rem, 4vw, 2rem);
}
main.wp-block-group .is-layout-flow > * + * {
	margin-block-start: var(--wp--style--block-gap, 1.5rem);
}
</style>
<?php

// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- do_blocks renders trusted bundled markup.
echo do_blocks( \Automattic\Jetpack\Search\Search_Blocks::get_classic_theme_product_search_body() );

get_footer();
