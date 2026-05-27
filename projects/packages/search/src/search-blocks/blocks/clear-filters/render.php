<?php
/**
 * Clear filters block render.
 *
 * Standalone "Clear filters" button. Functionally a thin wrapper around the
 * shared store's `actions.clearFilters` (which already resets both
 * `activeFilters` and `priceRange` in one shot), exposed as its own block so
 * authors who don't insert the `jetpack-search/active-filters` block — or who
 * want a clear-all affordance in a different layout slot — still have one.
 *
 * Visibility defaults to "hidden when no facet is active": the button reveals
 * itself only once the user has selected a filter or price range, mirroring
 * the active-filters wrapper. Authors can pin the button visible with the
 * `hideWhenInactive` toggle so a stable button slot stays in place across
 * the empty/active states (clicks while inactive are no-ops).
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$attrs              = (array) $attributes;
$label              = sanitize_text_field( (string) ( $attrs['label'] ?? '' ) );
$hide_when_inactive = ! isset( $attrs['hideWhenInactive'] ) || (bool) $attrs['hideWhenInactive'];
if ( '' === $label ) {
	$label = __( 'Clear filters', 'jetpack-search-pkg' );
}

// The button below carries `wp-block-button__link` so it inherits the
// theme's full core/button look (border-radius, hover, etc.). That class is
// only styled when the core Button block's stylesheet is on the page —
// without a core/button on the page, the handle isn't auto-enqueued and the
// class is inert. Pull it in explicitly so this block stands alone.
wp_enqueue_style( 'wp-block-button' );

// Mirror `state.hasActiveFilters` on the server so the button paints
// pre-hidden on a fresh URL — otherwise a flash of the button appears
// before JS hydrates and applies the data-wp-bind--hidden binding.
$seeded_state   = function_exists( 'wp_interactivity_state' )
	? wp_interactivity_state( 'jetpack-search' )
	: array();
$seeded_active  = (array) ( $seeded_state['activeFilters'] ?? array() );
$seeded_price   = $seeded_state['priceRange'] ?? null;
$has_any_active = false;
foreach ( $seeded_active as $values ) {
	if ( is_array( $values ) && ! empty( $values ) ) {
		$has_any_active = true;
		break;
	}
}
if ( ! $has_any_active && is_array( $seeded_price ) ) {
	$has_any_active = ( $seeded_price['min'] ?? null ) !== null || ( $seeded_price['max'] ?? null ) !== null;
}

// Skip `data-wp-interactive` when an ancestor already owns the
// `jetpack-search` interactive scope (e.g. when nested in `filters-popover`).
// Same defensive pattern as `active-filters` / `filter-checkbox` — see
// SEARCH-266. Today `clear-filters` has no `data-wp-each` so the nested-scope
// double-materialization trigger doesn't apply, but skipping the redundant
// scope declaration keeps the door closed if a future change adds one. The
// `instanceof` check narrows `$block`'s type for static analysis.
$in_interactive_scope = isset( $block ) && $block instanceof \WP_Block
	&& ! empty( $block->context['jetpack-search/inInteractiveScope'] );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-clear-filters' ) ) ); ?>
	<?php echo $in_interactive_scope ? '' : 'data-wp-interactive="jetpack-search"'; ?>
	<?php
	if ( $hide_when_inactive ) :
		?>
		data-wp-bind--hidden="!state.hasActiveFilters"<?php endif; ?>
	<?php echo $hide_when_inactive && ! $has_any_active ? 'hidden' : ''; ?>
>
	<button
		type="button"
		class="jetpack-search-clear-filters__button wp-block-button__link wp-element-button"
		data-wp-on--click="actions.clearFilters"
	>
		<?php echo esc_html( $label ); ?>
	</button>
</div>
