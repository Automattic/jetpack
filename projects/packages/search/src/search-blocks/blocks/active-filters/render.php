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

// First-paint FOUC guard: emit `hidden` on the wrapper when the seeded state
// has no active filters, so the "Active filters:" heading doesn't briefly
// render before hydration and push siblings ~30px down — `data-wp-bind--hidden`
// keeps the attribute reactive afterwards. Reads activeFilters AND priceRange
// so a price-only deep link doesn't keep the wrapper hidden after hydration
// sees a half-open range come through the URL.
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

// Skip `data-wp-interactive` when an ancestor already owns the
// `jetpack-search` interactive scope (signalled by the
// `jetpack-search/inInteractiveScope` block context from
// `jetpack-search/filters-popover`). Nesting two same-namespace interactive
// scopes makes the Interactivity runtime re-run its `data-wp-each` pass
// against the inner scope and materializes the pill template twice — the
// SEARCH-266 trigger. Inheriting the parent's scope keeps every directive
// resolving against a single store hydration. The `instanceof` check
// narrows `$block`'s type for static analysis — WP guarantees it's set
// to a `WP_Block` instance when render.php is included from `WP_Block::render()`.
$in_interactive_scope = isset( $block ) && $block instanceof \WP_Block
	&& ! empty( $block->context['jetpack-search/inInteractiveScope'] );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes() ); ?>
	<?php echo $in_interactive_scope ? '' : 'data-wp-interactive="jetpack-search"'; ?>
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
					class="jetpack-search-active-filters__pill"
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
