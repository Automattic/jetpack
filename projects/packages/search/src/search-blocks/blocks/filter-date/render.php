<?php
/**
 * Filter-date block render.
 *
 * Mirrors filter-checkbox/render.php so the seeded filterConfig entry and the
 * shell markup behave the same — the difference is only in the aggregation
 * shape (date_histogram instead of terms) and bucket key parsing, both of
 * which live in the JS view bundle. Aggregations are populated client-side
 * after hydration, so the wrapper renders `hidden` on first paint and the
 * `data-wp-bind--hidden` directives take over once JS attaches.
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
$filter_key = Filter_Date::derive_filter_key( (array) $attributes );
// Short-circuit when the block's `field` attribute is unrecognized OR when the
// Interactivity API isn't available. `wp_interactivity_state()` (below) and
// `wp_interactivity_data_wp_context()` (in the template) were both introduced
// in WP 6.5; calling either without the function would fatal.
if ( '' === $filter_key || ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config = Filter_Date::build_config( (array) $attributes, $filter_key );

// Register this filter's config into the shared store state. JS reads
// filterConfigs to build aggregation requests, ES filter clauses, and the
// active-filters pill list. wp_interactivity_state() deep-merges so each
// block adds its own key without clobbering others. Availability guarded by
// the early return at the top of the file.
wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs' => array(
			$filter_key => $config,
		),
	)
);

$label = $config['label'];
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_kses_data( wp_interactivity_data_wp_context( array( 'filterKey' => $filter_key ) ) ); ?>
	data-wp-bind--hidden="!state.hasFilterBuckets"
	hidden
>
	<?php if ( '' !== $label ) : ?>
		<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
	<ul
		class="jetpack-search-filter__list"
		data-wp-bind--hidden="state.allBucketsSelected"
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
		hidden
	>
		<?php esc_html_e( 'All filters applied', 'jetpack-search-pkg' ); ?>
	</p>
</div>
