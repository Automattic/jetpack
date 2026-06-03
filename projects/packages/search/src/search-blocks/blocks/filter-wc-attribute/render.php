<?php
/**
 * Search product filter — WooCommerce attribute render.
 *
 * Renders one block instance per chosen attribute taxonomy (`pa_color`,
 * `pa_size`, …). The DOM shape and Interactivity bindings are deliberately
 * identical to `jetpack/filter-checkbox` so the shared `state.filterItems`
 * / `actions.onFilterChange` getters and the pre-hydration skeleton plumbing
 * (`pre_hydration_filter_view` / `emit_filter_wrapper_context`) drive both
 * blocks — we don't want two parallel implementations of the same checkbox
 * list when only the inserter / inspector contract differs.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$filter_key = Filter_Wc_Attribute::derive_filter_key( (array) $attributes );
// Bail when no attribute is chosen yet (the editor renders a Placeholder in
// that state) or when the Interactivity API isn't available — wp_interactivity
// helpers were introduced in WP 6.5.
if ( '' === $filter_key || ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$config = Filter_Wc_Attribute::build_config( (array) $attributes, $filter_key );

// Each instance contributes its own filterConfig entry. wp_interactivity_state
// deep-merges, so multiple attribute blocks (one per attribute) coexist.
wp_interactivity_state(
	'jetpack-search',
	array(
		'filterConfigs' => array(
			$filter_key => $config,
		),
	)
);

$view  = Search_Blocks::pre_hydration_filter_view( $filter_key );
$label = (string) $config['label'];

// Compute whether all seeded buckets are already selected on first paint so
// the UL can be hidden and the "All filters applied" note shown before JS
// hydration flips `state.allBucketsSelected`. Only meaningful when the seeded
// state carries real bucket data (not during initial loading, when there are
// none yet).
$all_selected_on_paint = false;
if ( $view['has_buckets'] ) {
	$seeded_state      = wp_interactivity_state( 'jetpack-search' );
	$seeded_aggs       = (array) ( $seeded_state['aggregations'] ?? array() );
	$seeded_filter_agg = (array) ( $seeded_aggs[ $filter_key ] ?? array() );
	$seeded_buckets    = (array) ( $seeded_filter_agg['buckets'] ?? array() );
	$seeded_selected   = (array) ( ( (array) ( $seeded_state['activeFilters'] ?? array() ) )[ $filter_key ] ?? array() );
	if ( ! empty( $seeded_selected ) ) {
		$all_selected_on_paint = true;
		foreach ( $seeded_buckets as $bucket ) {
			// Keep this `slug/Name` → `slug` extraction in lockstep with
			// bucketValue() in store/bucket-key.js. The JS getter that powers
			// hydration uses the same split; if either delimiter changes the
			// other has to follow.
			$raw_key   = (string) ( $bucket['key'] ?? '' );
			$slash_idx = strpos( $raw_key, '/' );
			$value     = false === $slash_idx ? $raw_key : substr( $raw_key, 0, $slash_idx );
			if ( ! in_array( $value, $seeded_selected, true ) ) {
				$all_selected_on_paint = false;
				break;
			}
		}
	}
}

$display_style = Search_Blocks::normalize_display_style( $attributes['displayStyle'] ?? null );
?>
<div
	<?php
	echo wp_kses_data(
		get_block_wrapper_attributes(
			array(
				'class'              => 'jetpack-search-filter-wc-attribute',
				'data-display-style' => $display_style,
			)
		)
	);
	?>
	data-wp-interactive="jetpack-search"
	<?php Search_Blocks::emit_filter_wrapper_context( $filter_key, $view['show_wrapper'] ); ?>
	data-wp-bind--hidden="context.wrapperHidden"
	data-wp-watch="callbacks.syncFilterWrapperVisibility"
	<?php echo $view['show_wrapper'] ? '' : 'hidden'; ?>
>
	<?php if ( '' !== $label ) : ?>
		<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php endif; ?>
	<?php require __DIR__ . '/../filter-skeleton-partial.php'; ?>
	<ul
		class="jetpack-search-filter__list"
		data-wp-bind--hidden="state.allBucketsSelected"
		<?php echo $all_selected_on_paint ? 'hidden' : ''; ?>
	>
		<template
			data-wp-each--item="state.filterItems"
			data-wp-each-key="context.item.value"
		>
			<li class="jetpack-search-filter__item">
				<label>
					<input
						type="checkbox"
						data-wp-bind--value="context.item.value"
						data-wp-bind--checked="context.item.checked"
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
