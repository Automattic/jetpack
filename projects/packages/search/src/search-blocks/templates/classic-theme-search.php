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

// Classic themes don't emit core's layout block-supports CSS, so two
// layout traits the bundled `jetpack-search.html` relies on collapse on
// classic themes:
//
// 1. The 1.5rem `blockGap` declared on the inner `wp-block-group`
// vanishes — search input runs straight into the results / filters row.
// 2. The `alignwide` class on the inner group has no effect — content
// hugs the viewport edges and stretches edge-to-edge on wide screens
// because `template_include` bypasses the theme's own content wrapper.
//
// Reapply both once, scoped to our `<main class="wp-block-group">` so the
// rules can't leak into theme content elsewhere. CSS-variable fallbacks
// honor a theme.json-shipping classic theme's tokens when present.
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
echo do_blocks( \Automattic\Jetpack\Search\Search_Blocks::get_classic_theme_search_body() );

get_footer();
