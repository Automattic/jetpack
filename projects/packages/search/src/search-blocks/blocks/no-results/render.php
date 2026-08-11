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
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$filter_state = ( (array) $attributes )['filterState'] ?? 'any';
if ( ! in_array( $filter_state, array( 'any', 'unfiltered', 'filtered' ), true ) ) {
	$filter_state = 'any';
}

// Presence of this block anywhere on the page retires the legacy message
// region `results-list` renders from its `noResultsMessage` attributes.
// Seeded state is serialized once at footer time, so this suppresses the
// legacy region regardless of which block rendered first.
if ( function_exists( 'wp_interactivity_state' ) ) {
	wp_interactivity_state( 'jetpack-search', array( 'hasNoResultsBlock' => true ) );
}

$visibility_getters = array(
	'any'        => 'state.showNoResults',
	'unfiltered' => 'state.showNoResultsUnfiltered',
	'filtered'   => 'state.showNoResultsFiltered',
);

// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
$authored_content = trim( $content );
$wrapper_class    = 'jetpack-search-no-results';
if ( '' === $authored_content ) {
	$wrapper_class .= ' jetpack-search-no-results--default';
}
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => $wrapper_class ) ) ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="!<?php echo esc_attr( $visibility_getters[ $filter_state ] ); ?>"
	role="status"
	hidden
>
	<?php
	if ( '' !== $authored_content ) {
		// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
		echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
	} elseif ( 'filtered' === $filter_state ) {
		?>
		<p><?php esc_html_e( 'No results match these filters. Try clearing some, or searching for something else.', 'jetpack-search-pkg' ); ?></p>
		<?php
	} elseif ( 'unfiltered' === $filter_state ) {
		?>
		<p><?php esc_html_e( 'No results found. Try a different search.', 'jetpack-search-pkg' ); ?></p>
		<?php
	} else {
		// An empty block left at the default `any` covers both cases, so it
		// falls back to the same filter-aware pair `results-list` has always
		// rendered. Neither `<p>` carries an initial `hidden` — the wrapper's
		// covers the SSR path and the Interactivity runtime resolves the inner
		// binds atomically on reveal; adding one here makes the other flash.
		?>
		<p data-wp-bind--hidden="state.hasActiveFilters"><?php esc_html_e( 'No results found. Try a different search.', 'jetpack-search-pkg' ); ?></p>
		<p data-wp-bind--hidden="!state.hasActiveFilters"><?php esc_html_e( 'No results match these filters. Try clearing some, or searching for something else.', 'jetpack-search-pkg' ); ?></p>
		<?php
	}
	?>
</div>
