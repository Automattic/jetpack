<?php
/**
 * Search Error block render.
 *
 * WordPress passes $attributes, $content, $block to render.php at runtime.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// `trim()` so a whitespace-only attribute (e.g. an author saved spaces)
// still falls back to the default copy instead of rendering a blank alert.
$message = trim( (string) ( $attributes['message'] ?? '' ) );
if ( '' === $message ) {
	$message = __( 'Something went wrong. Please try again.', 'jetpack-search-pkg' );
}
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="!state.showError"
	role="alert"
>
	<p><?php echo esc_html( $message ); ?></p>
</div>
