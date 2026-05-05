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
// Short-circuit when the block has no valid filter key OR when the
// Interactivity API isn't available. Both wp_interactivity_state() (below)
// and wp_interactivity_data_wp_context() (in the template) were introduced
// in WP 6.5; calling either without the function would fatal.
if ( '' === $filter_key || ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config = Filter_Checkbox::build_config( (array) $attributes, $filter_key );

// Register this filter's config into the shared store state. JS reads
// filterConfigs to build aggregation requests, ES filter clauses, and the
// active-filters pill list. wp_interactivity_state() deep-merges so each
// block adds its own key without clobbering others. Availability guarded
// by the early return at the top of the file.
wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs' => array(
			$filter_key => $config,
		),
	)
);

// Render `hidden` on first paint when no aggregation buckets are available
// for this filter and no fetch is in flight. Seeded `state.aggregations` is
// empty before the first JS fetch — but on a deep-link load where a fetch
// IS coming, we keep the wrapper visible so it can host a skeleton list
// (otherwise the entire sidebar collapses to just the heading and pops in
// when results arrive). The `callbacks.syncFilterWrapperVisibility` watcher
// (see `store/index.js`) keeps `context.wrapperHidden` in sync after JS
// hydrates, so empty filter sections still hide once the first fetch
// resolves with no buckets.
$seeded_state = wp_interactivity_state( 'jetpack-search' );
// aggregations is seeded as stdClass when empty (so JS sees `{}` not `[]`);
// cast here so the nested subscript works in either shape.
$seeded_aggs        = (array) ( $seeded_state['aggregations'] ?? array() );
$seeded_filter_agg  = (array) ( $seeded_aggs[ $filter_key ] ?? array() );
$seeded_buckets     = $seeded_filter_agg['buckets'] ?? null;
$has_buckets        = is_array( $seeded_buckets ) && ! empty( $seeded_buckets );
$is_initial_loading = Search_Blocks::is_initial_loading();
$show_wrapper       = $has_buckets || $is_initial_loading;

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

$label = $config['label'];
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	<?php
	// Per-block visibility flag carried in the local context so the wrapper's
	// `data-wp-bind--hidden` resolves against a single seeded value (data-wp-bind
	// only evaluates direct property paths). `wrapperHidden` is seeded to
	// `! $show_wrapper` so the SSR pass and PHP-time `hidden` agree, and the
	// `syncFilterWrapperVisibility` callback keeps it in sync once buckets
	// arrive — preserving the legacy "hide empty filter sections" UX without
	// fighting the IA SSR evaluator.
	echo wp_kses_data(
		wp_interactivity_data_wp_context(
			array(
				'filterKey'     => $filter_key,
				'wrapperHidden' => ! $show_wrapper,
			)
		)
	);
	?>
	data-wp-bind--hidden="context.wrapperHidden"
	data-wp-watch="callbacks.syncFilterWrapperVisibility"
	<?php echo $show_wrapper ? '' : 'hidden'; ?>
>
	<?php if ( '' !== $label ) : ?>
		<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
	<?php if ( $is_initial_loading ) : ?>
		<ul
			class="jetpack-search-filter__list jetpack-search-filter__list--skeleton"
			data-wp-bind--hidden="state.skeletonHidden"
			aria-hidden="true"
		>
			<?php for ( $i = 0; $i < 4; $i++ ) : ?>
				<li class="jetpack-search-filter__item jetpack-search-filter__item--skeleton">
					<span class="jetpack-search-skeleton jetpack-search-skeleton--filter-row"></span>
				</li>
			<?php endfor; ?>
		</ul>
	<?php endif; ?>
	<ul
		class="jetpack-search-filter__list"
		data-wp-bind--hidden="state.allBucketsSelected"
		<?php echo $all_selected_on_paint ? 'hidden' : ''; ?>
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
		<?php echo $all_selected_on_paint ? '' : 'hidden'; ?>
	>
		<?php esc_html_e( 'All filters applied', 'jetpack-search-pkg' ); ?>
	</p>
</div>
