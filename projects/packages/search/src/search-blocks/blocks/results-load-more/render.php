<?php
/**
 * Load More block render.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// Trim before the empty check so a whitespace-only label (e.g. "   ")
// renders the translated default rather than a blank button — matches the
// "Leave empty to use the default" copy in the editor inspector.
$button_label = trim( (string) ( $attributes['buttonLabel'] ?? '' ) );
if ( '' === $button_label ) {
	$button_label = __( 'Load more results', 'jetpack-search-pkg' );
}

// The button below carries `wp-block-button__link` so it inherits the
// theme's full core/button look (border-radius, hover, etc.). That class is
// only styled when the core Button block's stylesheet is on the page —
// without a core/button on the page, the handle isn't auto-enqueued and the
// class is inert. Pull it in explicitly so this block stands alone.
wp_enqueue_style( 'wp-block-button' );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="!state.showLoadMore"
	hidden
>
	<button
		type="button"
		class="jetpack-search-load-more__button wp-block-button__link wp-element-button"
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
