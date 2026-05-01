<?php
/**
 * Search product filter — clear-button render.
 *
 * Standalone "Clear filters" button. Functionally a thin wrapper around the
 * shared store's `actions.clearFilters` (which already resets both
 * `activeFilters` and `priceRange` in one shot), exposed as its own block so
 * authors who don't insert the `jetpack/active-filters` block — or who want
 * a clear-all affordance in a different layout slot — still have one.
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

// Mirror `state.hasAnyActiveFilters` on the server so the button paints
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

$initial_hidden_attr = $hide_when_inactive && ! $has_any_active ? 'hidden' : '';
$bind_hidden_attr    = $hide_when_inactive
	? 'data-wp-bind--hidden="!state.hasAnyActiveFilters"'
	: '';
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-product-filter-clear-button' ) ) ); ?>
	data-wp-interactive="jetpack-search"
	<?php echo wp_kses_data( $bind_hidden_attr ); ?>
	<?php echo esc_attr( $initial_hidden_attr ); ?>
>
	<button
		type="button"
		class="wp-element-button jetpack-search-product-filter-clear-button__button"
		data-wp-on--click="actions.clearFilters"
	>
		<?php echo esc_html( $label ); ?>
	</button>
</div>
