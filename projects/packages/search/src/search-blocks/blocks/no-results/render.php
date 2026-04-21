<?php
/**
 * No Results block render.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

$message = ( $attributes['message'] ?? '' )
	? (string) $attributes['message']
	: __( 'No results found. Try a different search.', 'jetpack-search-pkg' );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="state.results.length > 0 || state.isLoading"
>
	<p><?php echo esc_html( $message ); ?></p>
</div>
