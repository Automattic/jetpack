<?php
/**
 * Results Count block render.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
?>
<?php
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
