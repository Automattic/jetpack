<?php
/**
 * Filter-date block render.
 *
 * WordPress passes $attributes, $content, $block at runtime — VariableAnalysis
 * can't see those, so the sniff is disabled below.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$filter_key = Filter_Date::derive_filter_key( (array) $attributes );
// wp_interactivity_state / wp_interactivity_data_wp_context need WP 6.5+.
if ( '' === $filter_key || ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}
// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config = Filter_Date::build_config( (array) $attributes, $filter_key );

wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs' => array(
			$filter_key => $config,
		),
	)
);

// Pre-hydration loading state — mirrors filter-checkbox/render.php. On a
// deep-link load `state.aggregations` is empty until the JS fetch resolves,
// so without this the date-filter wrapper would collapse to nothing and
// pop in once buckets arrive. `$show_wrapper` keeps it visible during the
// initial-loading window so the skeleton list inside has somewhere to
// render; `callbacks.syncFilterWrapperVisibility` (in the shared store)
// keeps `context.wrapperHidden` in sync after JS hydrates.
$seeded_state       = wp_interactivity_state( 'jetpack-search' );
$seeded_aggs        = (array) ( $seeded_state['aggregations'] ?? array() );
$seeded_filter_agg  = (array) ( $seeded_aggs[ $filter_key ] ?? array() );
$seeded_buckets     = $seeded_filter_agg['buckets'] ?? null;
$has_buckets        = is_array( $seeded_buckets ) && ! empty( $seeded_buckets );
$is_initial_loading = Search_Blocks::is_initial_loading();
$show_wrapper       = $has_buckets || $is_initial_loading;

$label = $config['label'];
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	<?php
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
