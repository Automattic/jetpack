<?php
/**
 * No Results block render.
 *
 * WordPress passes $attributes, $content, $block to render.php at runtime.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

$message = (string) ( $attributes['message'] ?? '' );
if ( '' === $message ) {
	$message = __( 'No results found. Try a different search.', 'jetpack-search-pkg' );
}

$show_search_again_prompt = ! empty( $attributes['showSearchAgainPrompt'] );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="!state.showNoResults"
>
	<p><?php echo esc_html( $message ); ?></p>
	<?php if ( $show_search_again_prompt ) : ?>
		<p class="jetpack-search-no-results__search-again">
			<?php esc_html_e( 'Try a different search.', 'jetpack-search-pkg' ); ?>
		</p>
	<?php endif; ?>
</div>
