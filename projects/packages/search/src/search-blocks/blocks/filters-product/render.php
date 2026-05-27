<?php
/**
 * Product Filters parent block render.
 *
 * Pure layout container: emits a wrapper around the inner blocks so the
 * product filter children (post-type scope, stock-status, rating, price,
 * attribute, …) share one column / spacing context. All search-side behavior
 * lives in the children — this block has no Interactivity bindings and no
 * client-side state of its own (the view module is a CSS-only entry point).
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable
?>
<div <?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-filters-product' ) ) ); ?>>
	<?php
	// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
	echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
	?>
	<p
		class="jetpack-search-filters-product__empty"
		data-wp-interactive="jetpack-search"
		data-wp-bind--hidden="!state.showFiltersEmpty"
		hidden
	><?php esc_html_e( 'No filters available', 'jetpack-search-pkg' ); ?></p>
</div>
