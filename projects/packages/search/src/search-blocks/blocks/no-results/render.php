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

// Which empty states this block covers. `results-list`'s legacy message region
// stands down only for the cases actually covered, so a lone block scoped to
// one filter state doesn't leave the other state with no message at all.
// `wp_interactivity_state()` deep-merges and nothing ever seeds `false`, so two
// blocks compose into full coverage.
if ( function_exists( 'wp_interactivity_state' ) ) {
	$coverage = array();
	if ( 'filtered' !== $filter_state ) {
		$coverage['hasNoResultsUnfiltered'] = true;
	}
	if ( 'unfiltered' !== $filter_state ) {
		$coverage['hasNoResultsFiltered'] = true;
	}
	wp_interactivity_state( 'jetpack-search', $coverage );
}

$visibility_getters = array(
	'any'        => 'state.showNoResults',
	'unfiltered' => 'state.showNoResultsUnfiltered',
	'filtered'   => 'state.showNoResultsFiltered',
);

// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
$authored_content = trim( $content );
$is_default       = '' === $authored_content;
$wrapper_class    = 'jetpack-search-no-results';
if ( $is_default ) {
	$wrapper_class .= ' jetpack-search-no-results--default';
}
$defaults = Search_Blocks::no_results_default_messages();
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => $wrapper_class ) ) ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="!<?php echo esc_attr( $visibility_getters[ $filter_state ] ); ?>"
	<?php
	// Live region only around the plain fallback copy. Announcing an author's
	// whole composition — heading, image, button — verbatim on every empty
	// search is worse than not announcing it; `core/query-no-results` has no
	// live region at all for the same reason.
	echo $is_default ? 'role="status"' : '';
	?>
	hidden
>
	<?php
	if ( ! $is_default ) {
		// @phan-suppress-next-line PhanUndeclaredGlobalVariable -- $content is provided by WP at block render.
		echo $content; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Inner block HTML is already escaped by each child block's renderer.
	} elseif ( 'filtered' === $filter_state ) {
		?>
		<p><?php echo esc_html( $defaults['filtered'] ); ?></p>
		<?php
	} elseif ( 'unfiltered' === $filter_state ) {
		?>
		<p><?php echo esc_html( $defaults['unfiltered'] ); ?></p>
		<?php
	} else {
		// An empty block left at the default `any` covers both cases, so it
		// falls back to the same filter-aware pair `results-list` has always
		// rendered. Neither `<p>` carries an initial `hidden` — the wrapper's
		// covers the SSR path and the Interactivity runtime resolves the inner
		// binds atomically on reveal; adding one here makes the other flash.
		?>
		<p data-wp-bind--hidden="state.hasActiveFilters"><?php echo esc_html( $defaults['unfiltered'] ); ?></p>
		<p data-wp-bind--hidden="!state.hasActiveFilters"><?php echo esc_html( $defaults['filtered'] ); ?></p>
		<?php
	}
	?>
</div>
