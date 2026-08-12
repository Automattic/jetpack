<?php
/**
 * No Results block render.
 *
 * Empty-state region for the search results, modelled on
 * `core/query-no-results`: the author fills it with any blocks they like and
 * this renderer emits them. Core decides visibility server-side by re-running
 * the query; the Search blocks fetch results client-side, so visibility is a
 * `data-wp-bind--hidden` binding on the store instead.
 *
 * A container of `no-results-slot` variants, one per condition. Left empty —
 * which is how the shipped templates carry it — it renders the same
 * filter-aware default pair `results-list` always emitted, so a stock install
 * reads exactly as before.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
$variants   = trim( $content );
$is_default = '' === $variants;

// An empty container stands in for an unscoped variant, so it seeds the same
// coverage. With variants present each one seeds its own.
if ( $is_default ) {
	Search_Blocks::seed_no_results_coverage( 'any' );
}
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-no-results' ) ) ); ?>
	data-wp-interactive="jetpack-search"
	<?php
	// The container spans every condition its variants cover, so it binds to
	// the region-level getter and each variant hides itself. A container whose
	// variants don't cover the live condition renders empty rather than hidden
	// — harmless, since block supports are opt-in and an unstyled empty div has
	// no size.
	?>
	data-wp-bind--hidden="!state.showEmptyStateRegion"
	hidden
>
	<?php
	if ( $is_default ) {
		?>
		<div
			class="jetpack-search-no-results__variant jetpack-search-no-results--default"
			data-wp-bind--hidden="!state.showNoResultsAny"
			role="status"
			hidden
		>
			<?php Search_Blocks::render_no_results_default_copy( 'any' ); ?>
		</div>
		<?php
	} else {
		// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
		echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
	}
	?>
</div>
