<?php
/**
 * Search Product Filters parent block render.
 *
 * Pure layout container: emits a wrapper around the inner blocks so the
 * product-filter children (status, rating, price, attribute, taxonomy) share
 * one column / spacing context. All search-side behavior lives in the
 * children — this block has no Interactivity bindings, no view module, and
 * no client-side state of its own.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
?>
<div <?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-product-filters' ) ) ); ?>>
	<?php
	// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
	echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
	?>
</div>
