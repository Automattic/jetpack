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
// per-condition scope is not recovered, only a defined condition. The document
// Code Editor bypasses `allowedBlocks`, so stray blocks can arrive alongside
// variants and not just instead of them.
// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $block is provided by WP at block render.
$inner_blocks = ( $block instanceof \WP_Block ) ? $block->parsed_block['innerBlocks'] ?? array() : array();
$has_variants = false;
$has_strays   = false;
foreach ( $inner_blocks as $inner_block ) {
	$inner_name = $inner_block['blockName'] ?? '';
	if ( 'jetpack-search/no-results-slot' === $inner_name ) {
		$has_variants = true;
	} elseif ( ! empty( $inner_name ) || '' !== trim( (string) ( $inner_block['innerHTML'] ?? '' ) ) ) {
		// `parse_blocks()` yields whitespace between blocks as nameless
		// entries; those aren't content and mustn't force the repair path.
		$has_strays = true;
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
			<?php echo wp_kses_data( No_Results::live_region_attribute( 'any' ) ); ?>
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
	} elseif ( ! $has_strays ) {
		// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
		echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
	} else {
		// Variants and stray blocks together. `$content` is one concatenated
		// string, so the strays can't be lifted out of it — re-render each
		// child in document order instead, gathering runs of strays into an
		// unscoped variant. Re-rendering re-seeds coverage, which is
		// idempotent.
		$stray_run = '';
		/**
		 * Emit a run of stray blocks inside an unscoped variant wrapper.
		 *
		 * @param string $html Rendered stray markup.
		 * @return void
		 */
		$flush_strays = static function ( $html ) {
			if ( '' === trim( $html ) ) {
				return;
			}
			No_Results::seed_coverage( 'any' );
			printf(
				'<div class="jetpack-search-no-results__variant" data-wp-bind--hidden="!%s" %s hidden>',
				esc_attr( No_Results::visibility_getter( 'any' ) ),
				wp_kses_data( No_Results::live_region_attribute( 'any' ) )
			);
			echo $html; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
			echo '</div>';
		};
		foreach ( $inner_blocks as $inner_block ) {
			if ( 'jetpack-search/no-results-slot' === ( $inner_block['blockName'] ?? '' ) ) {
				$flush_strays( $stray_run );
				$stray_run = '';
				echo render_block( $inner_block ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
				continue;
			}
			$stray_run .= render_block( $inner_block );
		}
		$flush_strays( $stray_run );
	}
	?>
</div>
