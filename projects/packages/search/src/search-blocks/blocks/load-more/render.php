<?php
/**
 * Load More block render.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

$button_label = (string) ( $attributes['buttonLabel'] ?? '' );
if ( '' === $button_label ) {
	$button_label = __( 'Load more results', 'jetpack-search-pkg' );
}
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="!state.showLoadMore"
>
	<button
		class="jetpack-search-load-more__button"
		data-wp-on--click="actions.loadMore"
		data-wp-bind--hidden="state.isLoadingMore"
	>
		<?php echo esc_html( $button_label ); ?>
	</button>
	<span
		class="jetpack-search-load-more__spinner"
		data-wp-bind--hidden="!state.isLoadingMore"
	>
		<?php esc_html_e( 'Loading…', 'jetpack-search-pkg' ); ?>
	</span>
</div>
