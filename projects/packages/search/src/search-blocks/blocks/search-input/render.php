<?php
/**
 * Search Input block render.
 *
 * WordPress passes $attributes, $content, $block to render.php at runtime;
 * VariableAnalysis can't see that, so the sniff is disabled here.
 *
 * @package automattic/jetpack-search
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

$placeholder   = $attributes['placeholder'] ?? __( 'Search…', 'jetpack-search-pkg' );
$initial_query = (string) get_search_query();
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_kses_data( wp_interactivity_data_wp_context( array( 'focused' => false ) ) ); ?>
>
	<input
		type="search"
		class="jetpack-search-input__field"
		placeholder="<?php echo esc_attr( $placeholder ); ?>"
		value="<?php echo esc_attr( $initial_query ); ?>"
		data-wp-bind--value="state.searchQuery"
		data-wp-on--input="actions.onSearchInput"
		data-wp-on--keydown="actions.onSearchKeydown"
		aria-label="<?php echo esc_attr__( 'Search', 'jetpack-search-pkg' ); ?>"
	/>
	<button
		class="jetpack-search-input__clear"
		data-wp-bind--hidden="!state.searchQuery"
		data-wp-on--click="actions.clearSearch"
		aria-label="<?php echo esc_attr__( 'Clear search', 'jetpack-search-pkg' ); ?>"
	>&#10005;</button>
</div>
