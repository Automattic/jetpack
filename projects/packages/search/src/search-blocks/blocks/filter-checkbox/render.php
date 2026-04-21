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

$filter_key = Filter_Checkbox::derive_filter_key( (array) $attributes );
if ( '' === $filter_key ) {
	return;
}
$config = Filter_Checkbox::build_config( (array) $attributes, $filter_key );

// Register this filter's config into the shared store state. JS reads
// filterConfigs to build aggregation requests, ES filter clauses, and the
// active-filters pill list. wp_interactivity_state() deep-merges so each
// block adds its own key without clobbering others.
wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs' => array(
			$filter_key => $config,
		),
	)
);

// Render `hidden` on first paint when no aggregation buckets are available
// for this filter. The sidebar column lives *after* search-results in the
// default pattern, so search-results' SSR pre-fetch has already populated
// `state.aggregations` by the time this block renders. When SSR skipped
// (no query + no active filters), the state stays empty and we hide the
// block so its title doesn't occupy the top of the sidebar and misalign
// with the adjacent results column.
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
	<ul class="jetpack-search-filter__list">
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
</div>
