<?php
/**
 * Search Input block render.
 *
 * WordPress passes $attributes, $content, $block to render.php at runtime;
 * VariableAnalysis can't see that, so the sniff is disabled here.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

$placeholder   = $attributes['placeholder'] ?? __( 'Search…', 'jetpack-search-pkg' );
$initial_query = (string) get_search_query();
$input_id      = wp_unique_id( 'jetpack-search-input-' );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
>
	<label class="jetpack-search-input__label screen-reader-text" for="<?php echo esc_attr( $input_id ); ?>">
		<?php esc_html_e( 'Search', 'jetpack-search-pkg' ); ?>
	</label>
	<div class="jetpack-search-input__inside-wrapper">
		<svg class="jetpack-search-input__icon" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
			<path d="M13 5c-3.3 0-6 2.7-6 6 0 1.4.5 2.7 1.3 3.7l-3.8 3.8 1.1 1.1 3.8-3.8c1 .8 2.3 1.3 3.7 1.3 3.3 0 6-2.7 6-6s-2.7-6-6-6zm0 10.5c-2.5 0-4.5-2-4.5-4.5s2-4.5 4.5-4.5 4.5 2 4.5 4.5-2 4.5-4.5 4.5z" />
		</svg>
		<input
			id="<?php echo esc_attr( $input_id ); ?>"
			type="search"
			class="jetpack-search-input__field"
			placeholder="<?php echo esc_attr( $placeholder ); ?>"
			value="<?php echo esc_attr( $initial_query ); ?>"
			data-wp-bind--value="state.searchQuery"
			data-wp-on--input="actions.onSearchInput"
			data-wp-on--keydown="actions.onSearchKeydown"
		/>
		<button
			type="button"
			class="jetpack-search-input__clear"
			data-wp-bind--hidden="!state.searchQuery"
			data-wp-on--click="actions.clearSearch"
			aria-label="<?php echo esc_attr__( 'Clear search', 'jetpack-search-pkg' ); ?>"
		>&#10005;</button>
	</div>
</div>
