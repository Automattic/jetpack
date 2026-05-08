<?php
/**
 * Search product filter — price render.
 *
 * Two number inputs (min, max) bound to the shared store's `priceRange`
 * slice. Unlike the other product filter blocks, this one doesn't
 * register a filterConfig — `priceRange` is its own state branch with a
 * dedicated `actions.setPriceRange` action and the `min_price` /
 * `max_price` URL params are already in `RESERVED_QUERY_PARAMS`.
 *
 * First-paint values are seeded from `state.priceRange` (which the PHP
 * state-builder parses from the URL) so a deep link like
 * `/?s=&min_price=10` shows "10" in the min input before JS hydrates.
 *
 * Currency-symbol display uses the block author's chosen symbol; the
 * stored value is the raw number so URL contracts and ES range clauses
 * stay locale-agnostic.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

if ( ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$attrs    = (array) $attributes;
$label    = sanitize_text_field( (string) ( $attrs['label'] ?? '' ) );
$symbol   = sanitize_text_field( (string) ( $attrs['currencySymbol'] ?? '' ) );
$position = sanitize_text_field( (string) ( $attrs['currencySymbolPosition'] ?? '' ) );

if ( '' === $label ) {
	$label = __( 'Price', 'jetpack-search-pkg' );
}

// Empty author values fall through to the active WooCommerce settings so a
// site running AUD gets `A$` adornments out-of-the-box. WC bridges via the
// public-facing helper / option, both safe to call when WC isn't loaded
// (the function_exists guard handles that). The `$` / `left` fallbacks
// keep the block usable on a plain WP install while the author wires WC up.
if ( '' === $symbol && function_exists( 'get_woocommerce_currency_symbol' ) ) {
	// @phan-suppress-next-line PhanUndeclaredFunction
	$wc_symbol = (string) get_woocommerce_currency_symbol();
	// WC returns symbols as HTML entities (e.g. `&#36;`, `&euro;`). Decode
	// once so the downstream `mb_substr` operates on a single character
	// instead of half an entity, and so `esc_html` at output produces a
	// single round-trip — not double-encoded text.
	$symbol = html_entity_decode( $wc_symbol, ENT_QUOTES | ENT_HTML5, 'UTF-8' );
}
if ( '' === $symbol ) {
	$symbol = '$';
}
if ( '' === $position ) {
	$wc_pos   = (string) get_option( 'woocommerce_currency_pos', 'left' );
	$position = ( 'right' === $wc_pos || 'right_space' === $wc_pos ) ? 'right' : 'left';
}
if ( ! in_array( $position, array( 'left', 'right' ), true ) ) {
	$position = 'left';
}

// Trim to two characters so an oversized symbol can't overflow the
// adornment slot in the input.
$symbol_short = function_exists( 'mb_substr' ) ? mb_substr( $symbol, 0, 2 ) : substr( $symbol, 0, 2 );

$seeded_state = wp_interactivity_state( 'jetpack-search' );
$seeded_price = $seeded_state['priceRange'] ?? null;
$seeded_min   = is_array( $seeded_price ) && null !== ( $seeded_price['min'] ?? null )
	? (string) $seeded_price['min']
	: '';
$seeded_max   = is_array( $seeded_price ) && null !== ( $seeded_price['max'] ?? null )
	? (string) $seeded_price['max']
	: '';

// Push the block author's chosen currency symbol and group label into the
// shared store so the active-filters block can render a price chip ("Price:
// $10 – $50") that uses the same adornment the user sees on the input. The
// chip block doesn't know about the price block at render time, so without
// this seed it would fall back to the generic default. wp_interactivity_state
// deep-merges, so writing here doesn't disturb other state branches.
wp_interactivity_state(
	'jetpack-search',
	array(
		'priceCurrencySymbol'         => $symbol_short,
		'priceCurrencySymbolPosition' => $position,
		'strings'                     => array(
			'priceLabel' => $label,
		),
	)
);

$min_id = wp_unique_id( 'jetpack-search-filter-wc-price-min-' );
$max_id = wp_unique_id( 'jetpack-search-filter-wc-price-max-' );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-filter-wc-price' ) ) ); ?>
	data-wp-interactive="jetpack-search"
>
	<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<div class="jetpack-search-filter-wc-price__inputs">
		<div class="jetpack-search-filter-wc-price__field jetpack-search-filter-wc-price__field--<?php echo esc_attr( $position ); ?>">
			<label class="screen-reader-text" for="<?php echo esc_attr( $min_id ); ?>">
				<?php esc_html_e( 'Minimum price', 'jetpack-search-pkg' ); ?>
			</label>
			<span class="jetpack-search-filter-wc-price__symbol" aria-hidden="true">
				<?php echo esc_html( $symbol_short ); ?>
			</span>
			<input
				id="<?php echo esc_attr( $min_id ); ?>"
				class="jetpack-search-filter-wc-price__input jetpack-search-filter-wc-price__input--min"
				type="number"
				inputmode="decimal"
				min="0"
				step="any"
				placeholder="<?php esc_attr_e( 'Min', 'jetpack-search-pkg' ); ?>"
				value="<?php echo esc_attr( $seeded_min ); ?>"
				data-wp-bind--value="state.priceRangeMinInputValue"
				data-wp-on--change="actions.onPriceRangeInputChange"
				data-wp-on--keydown="actions.onPriceRangeInputKeydown"
			/>
		</div>
		<span class="jetpack-search-filter-wc-price__separator" aria-hidden="true">–</span>
		<div class="jetpack-search-filter-wc-price__field jetpack-search-filter-wc-price__field--<?php echo esc_attr( $position ); ?>">
			<label class="screen-reader-text" for="<?php echo esc_attr( $max_id ); ?>">
				<?php esc_html_e( 'Maximum price', 'jetpack-search-pkg' ); ?>
			</label>
			<span class="jetpack-search-filter-wc-price__symbol" aria-hidden="true">
				<?php echo esc_html( $symbol_short ); ?>
			</span>
			<input
				id="<?php echo esc_attr( $max_id ); ?>"
				class="jetpack-search-filter-wc-price__input jetpack-search-filter-wc-price__input--max"
				type="number"
				inputmode="decimal"
				min="0"
				step="any"
				placeholder="<?php esc_attr_e( 'Max', 'jetpack-search-pkg' ); ?>"
				value="<?php echo esc_attr( $seeded_max ); ?>"
				data-wp-bind--value="state.priceRangeMaxInputValue"
				data-wp-on--change="actions.onPriceRangeInputChange"
				data-wp-on--keydown="actions.onPriceRangeInputKeydown"
			/>
		</div>
	</div>
</div>
