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
$variants = trim( $content );

// Inner blocks that aren't variants — hand-edited markup, or content saved
// before the container took variants — are treated as one unscoped variant
// rather than emitted bare, which would put them behind the region-level
// binding and show them on an error too. `allowedBlocks` keeps the editor from
// producing this, so it is a robustness floor, not a migration: a legacy
// per-condition scope is not recovered, only a defined condition.
// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $block is provided by WP at block render.
$inner_blocks = ( $block instanceof \WP_Block ) ? $block->parsed_block['innerBlocks'] ?? array() : array();
$has_variants = false;
foreach ( $inner_blocks as $inner_block ) {
	if ( 'jetpack-search/no-results-slot' === ( $inner_block['blockName'] ?? '' ) ) {
		$has_variants = true;
		break;
	}
}

// Without variants the container stands in for an unscoped one, so it seeds
// the same coverage and wraps whatever it holds in that condition's region.
$is_default = ! $has_variants;
if ( $is_default ) {
	No_Results::seed_coverage( 'any' );
}
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-no-results' ) ) ); ?>
	data-wp-interactive="jetpack-search"
	<?php
	// The container spans every condition its variants cover, so it binds to
	// the region-level getter and each variant hides itself. That leaves it
	// revealed with no visible child when the live condition is uncovered — an
	// author's background and padding would paint an empty band — so
	// `style.scss` collapses a container whose children are all hidden.
	?>
	data-wp-bind--hidden="!state.showEmptyStateRegion"
	hidden
>
	<?php
	if ( $is_default ) {
		$default_class = 'jetpack-search-no-results__variant';
		if ( '' === $variants ) {
			$default_class .= ' jetpack-search-no-results--default';
		}
		?>
		<div
			class="<?php echo esc_attr( $default_class ); ?>"
			data-wp-bind--hidden="!<?php echo esc_attr( No_Results::visibility_getter( 'any' ) ); ?>"
			<?php echo '' === $variants ? 'role="status"' : ''; ?>
			hidden
		>
			<?php
			if ( '' === $variants ) {
				No_Results::render_default_copy( 'any' );
			} else {
				// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
				echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
			}
			?>
		</div>
		<?php
	} else {
		// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
		echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
	}
	?>
</div>
