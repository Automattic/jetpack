<?php
/**
 * Results Count block render.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// The wrapper is intentionally rendered even when the count text is empty.
// The Blog Search Page pattern places results-count and sort-control in a
// flex group with `justifyContent: space-between`; removing the element
// from the flow when there are no results would collapse that layout,
// snapping the sort control to the left. An always-present (but text-empty)
// element keeps the two controls at the outer edges of the row.
//
// Loading affordance: a skeleton bar paints while a fetch is in flight,
// gated by `state.isLoading`. Replaces the previous "Searching…" text-swap
// (same DOM node going from a localized word to an empty string), which
// flickered visibly when the resolved count was zero. The text node is
// gated by `!state.isLoading` so the two states never co-exist on screen.
// `aria-busy` + `aria-live="polite"` give assistive tech a single
// non-flickering loading→content announcement instead of "Searching…"
// then a separate count.
?>
<p
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--aria-busy="state.isLoading"
	aria-live="polite"
><span
		class="jetpack-search-skeleton jetpack-search-skeleton--count"
		data-wp-bind--hidden="!state.isLoading"
		aria-hidden="true"
	></span><span
		data-wp-text="state.resultsCountText"
		data-wp-bind--hidden="state.isLoading"
	></span></p>
