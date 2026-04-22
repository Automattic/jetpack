<?php
/**
 * Filter-checkbox block render.
 *
 * WordPress passes $attributes, $content, $block at runtime; VariableAnalysis
 * can't see that, so the sniff is disabled here.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// Phan flags `(array) $attributes` as an undeclared global even under a
// namespace; subscripted access (e.g. `$attributes['key']`) isn't flagged.
// WordPress always passes an array for the block's $attributes argument, so
// the suppressions are safe.
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$filter_key = Filter_Checkbox::derive_filter_key( (array) $attributes );
if ( '' === $filter_key ) {
	return;
}
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config = Filter_Checkbox::build_config( (array) $attributes, $filter_key );

// Register this filter's config into the shared store state. JS reads
// filterConfigs to build aggregation requests, ES filter clauses, and the
// active-filters pill list. wp_interactivity_state() deep-merges so each
// block adds its own key without clobbering others. Guarded for WP versions
// that don't yet ship the Interactivity API.
if ( function_exists( 'wp_interactivity_state' ) ) {
	wp_interactivity_state(
		'jetpack-search',
		array(
			'filterConfigs' => array(
				$filter_key => $config,
			),
		)
	);
}

// Render `hidden` on first paint when no aggregation buckets are available
// for this filter. Seeded `state.aggregations` is empty before the first JS
// fetch, so on the server we default to hidden — otherwise an empty filter
// title would occupy the top of the sidebar during the load and misalign
// with the adjacent results column. JS unhides once buckets arrive.
$seeded_state = function_exists( 'wp_interactivity_state' )
	? wp_interactivity_state( 'jetpack-search' )
	: array();
// aggregations is seeded as stdClass when empty (so JS sees `{}` not `[]`);
// cast here so the nested subscript works in either shape.
$seeded_aggs         = (array) ( $seeded_state['aggregations'] ?? array() );
$seeded_filter_agg   = (array) ( $seeded_aggs[ $filter_key ] ?? array() );
$seeded_buckets      = $seeded_filter_agg['buckets'] ?? null;
$has_buckets         = is_array( $seeded_buckets ) && ! empty( $seeded_buckets );
$initial_hidden_attr = $has_buckets ? '' : ' hidden';

// First-paint "all selected" flag: mirrors the `allBucketsSelected` state
// getter so the list and the fallback message come out pre-hidden correctly
// and there's no flicker during hydration.
$seeded_selected       = (array) ( ( (array) ( $seeded_state['activeFilters'] ?? array() ) )[ $filter_key ] ?? array() );
$all_selected_on_paint = false;
if ( $has_buckets && ! empty( $seeded_selected ) ) {
	$all_selected_on_paint = true;
	foreach ( $seeded_buckets as $bucket ) {
		$raw_key   = (string) ( $bucket['key'] ?? '' );
		$slash_idx = strpos( $raw_key, '/' );
		$value     = false === $slash_idx ? $raw_key : substr( $raw_key, 0, $slash_idx );
		if ( ! in_array( $value, $seeded_selected, true ) ) {
			$all_selected_on_paint = false;
			break;
		}
	}
}
$list_hidden_attr        = $all_selected_on_paint ? ' hidden' : '';
$all_selected_hidden_att = $all_selected_on_paint ? '' : ' hidden';

$label = $config['label'];
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_kses_data( wp_interactivity_data_wp_context( array( 'filterKey' => $filter_key ) ) ); ?>
	data-wp-bind--hidden="!state.hasFilterBuckets"
	<?php echo esc_attr( $initial_hidden_attr ); ?>
>
	<?php if ( '' !== $label ) : ?>
		<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
	<ul
		class="jetpack-search-filter__list"
		data-wp-bind--hidden="state.allBucketsSelected"
		<?php echo esc_attr( $list_hidden_attr ); ?>
	>
		<template
			data-wp-each--item="state.filterItems"
			data-wp-each-key="context.item.value"
		>
			<li
				class="jetpack-search-filter__item"
			>
				<label>
					<input
						type="checkbox"
						data-wp-bind--value="context.item.value"
						data-wp-on--change="actions.onFilterChange"
					/>
					<span
						class="jetpack-search-filter__label"
						data-wp-text="context.item.label"
					></span>
					<span
						class="jetpack-search-filter__count"
						data-wp-bind--hidden="!context.item.showCount"
						data-wp-text="context.item.countLabel"
					></span>
				</label>
			</li>
		</template>
	</ul>
	<p
		class="jetpack-search-filter__all-selected"
		data-wp-bind--hidden="!state.allBucketsSelected"
		<?php echo esc_attr( $all_selected_hidden_att ); ?>
	>
		<?php esc_html_e( 'All filters applied', 'jetpack-search-pkg' ); ?>
	</p>
</div>
