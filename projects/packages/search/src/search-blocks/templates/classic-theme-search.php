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

// Classic themes don't emit core's layout block-supports CSS for the
// `blockGap` attribute, so the 1.5rem gap declared on the bundled
// template's `wp-block-group` wrapper collapses to 0 — the search input
// runs straight into the results / filters row. Reapply it once, scoped
// to our `<main class="wp-block-group">` so it can't leak into theme
// content elsewhere. Falls back to the block-theme variable when a
// theme.json-shipping classic theme happens to define one.
?>
<style id="jetpack-search-classic-theme-layout">
main.wp-block-group .is-layout-flow > * + * {
	margin-block-start: var(--wp--style--block-gap, 1.5rem);
}
</style>
<?php

// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- do_blocks renders trusted bundled markup.
echo do_blocks( \Automattic\Jetpack\Search\Search_Blocks::get_classic_theme_search_body() );

get_footer();
