<?php
/**
 * Classic-theme search results template for the Jetpack Search Embedded
 * experience.
 *
 * Wraps the bundled `jetpack-search.html` block markup in the active theme's
 * `get_header()` / `get_footer()` so the block-rendered results sit inside the
 * theme's chrome — the classic-theme counterpart to the FSE block template
 * fronted via `search_template_hierarchy` on block themes.
 *
 * Loaded via the `template_include` filter in
 * `Search_Blocks::route_classic_theme_search_template()`; reachable only on
 * `is_search()` with Embedded saved + classic theme.
 *
 * @package automattic/jetpack-search
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

get_header();

// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- bundled inline CSS, no untrusted input.
echo \Automattic\Jetpack\Search\Search_Blocks::get_classic_theme_layout_style();

// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- do_blocks renders trusted bundled markup.
echo do_blocks( \Automattic\Jetpack\Search\Search_Blocks::get_classic_theme_search_body() );

get_footer();
