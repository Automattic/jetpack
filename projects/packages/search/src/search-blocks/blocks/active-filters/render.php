<?php
/**
 * Active Filters block render — shows currently selected filter pills.
 *
 * WordPress passes $attributes at runtime; VariableAnalysis can't see that.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// Render `hidden` on first paint when no facet is active. JS unhides once
// `state.hasActiveFilters` flips — relying only on data-wp-bind--hidden
// leaves the "Active filters:" label visible on the server-rendered HTML
// until hydration, which pushes sibling filter blocks ~30px down and
// misaligns the sidebar with the adjacent results column. Reads activeFilters
// AND priceRange so a price-only deep link doesn't keep the wrapper hidden
// after hydration sees a half-open range come through the URL.
$seeded_state        = function_exists( 'wp_interactivity_state' )
	? wp_interactivity_state( 'jetpack-search' )
	: array();
$seeded_active       = $seeded_state['activeFilters'] ?? array();
$seeded_price_range  = $seeded_state['priceRange'] ?? null;
$has_active_on_paint = false;
foreach ( (array) $seeded_active as $values ) {
	if ( is_array( $values ) && ! empty( $values ) ) {
		$has_active_on_paint = true;
		break;
	}
}
if ( ! $has_active_on_paint && is_array( $seeded_price_range ) ) {
	$min = $seeded_price_range['min'] ?? null;
	$max = $seeded_price_range['max'] ?? null;
	if ( $min !== null || $max !== null ) {
		$has_active_on_paint = true;
	}
}
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-bind--hidden="!state.hasActiveFilters"
	<?php echo $has_active_on_paint ? '' : 'hidden'; ?>
>
	<span class="jetpack-search-active-filters__heading">
		<?php esc_html_e( 'Active filters:', 'jetpack-search-pkg' ); ?>
	</span>
	<ul class="jetpack-search-active-filters__pills">
		<template
			data-wp-each--pill="state.activePills"
			data-wp-each-key="context.pill.id"
		>
			<li>
				<button
					type="button"
					class="wp-element-button jetpack-search-active-filters__pill"
					data-wp-on--click="actions.onRemovePill"
					data-wp-bind--aria-label="context.pill.ariaLabel"
				>
					<span
						class="jetpack-search-active-filters__pill-label"
						data-wp-text="context.pill.label"
					></span>
					<span class="jetpack-search-active-filters__pill-remove" aria-hidden="true">×</span>
				</button>
			</li>
		</template>
	</ul>
</div>
