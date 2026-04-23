<?php
/**
 * Results Count block render.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// Trim so a whitespace-only attribute falls back to the translated default —
// mirrors the "Leave empty to use the default" copy in the editor inspector.
// Recognized placeholders: %1$d (first shown), %2$d (last shown), %3$d (total),
// %4$s (query). The JS formatter in store/index.js interpolates from live
// store state so the string updates as results load and the user paginates;
// unknown placeholders are left as-is so typos surface rather than silently
// vanish.
//
// A non-empty custom template overrides `strings.resultsCountTemplate` in the
// shared Interactivity state seeded by `Search_Blocks::build_initial_strings()`.
// The override is global per namespace (not keyed per-instance), so two
// results-count blocks with different templates on the same page collapse to
// a last-render-wins behavior — preferred over threading a per-instance
// context key through every template binding, since multi-instance use is
// rare in practice. Empty / whitespace / missing templates skip the call so
// the server-seeded default stays authoritative.
$template = trim( (string) ( $attributes['template'] ?? '' ) );
if ( '' !== $template && function_exists( 'wp_interactivity_state' ) ) {
	wp_interactivity_state(
		'jetpack-search',
		array( 'strings' => array( 'resultsCountTemplate' => $template ) )
	);
}

// Intentionally render the element even when the count text is empty. The
// Blog Search Page pattern places results-count and sort-control in a flex
// group with `justifyContent: space-between`; removing the element from the
// flow when there are no results would collapse that layout, snapping the
// sort control to the left. An always-present (but text-empty) paragraph
// keeps the two controls at the outer edges of the row.
?>
<p
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-text="state.resultsCountText"
></p>
