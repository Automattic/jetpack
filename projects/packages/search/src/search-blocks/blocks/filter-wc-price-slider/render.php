<?php
/**
 * Search product filter — price slider render.
 *
 * Two stacked `<input type="range">` thumbs (min, max) bound to the shared
 * store's `priceRange` slice. Peer of the number-input price block:
 * different control surface, identical data plane — same `setPriceRange`
 * action, same `min_price` / `max_price` URL contract, same
 * `priceCurrencySymbol` / `priceLabel` seed shape so a downstream consumer
 * (e.g. the active-filters chip block) can read the seed regardless of
 * which price block the author dropped on the page.
 *
 * Author bounds the slider via `min` / `max` / `step` block attrs; sizing
 * the slider from a live aggregation is deferred to a follow-up.
 *
 * First-paint values are seeded from `state.priceRange` (which the PHP
 * state-builder parses from the URL) so a deep link like
 * `/?s=&min_price=25&max_price=80` shows the thumbs in the right places
 * before JS hydrates.
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
$min_attr = isset( $attrs['min'] ) ? (float) $attrs['min'] : 0.0;
$max_attr = isset( $attrs['max'] ) ? (float) $attrs['max'] : 1000.0;
$step     = isset( $attrs['step'] ) && (float) $attrs['step'] > 0 ? (float) $attrs['step'] : 1.0;

if ( '' === $label ) {
	$label = __( 'Price', 'jetpack-search-pkg' );
}

// Empty author values fall through to the active WooCommerce settings so a
// site running AUD gets `A$` adornments out-of-the-box. WC bridges via the
// public-facing helper / option, both safe to call when WC isn't loaded
// (the function_exists guard handles that). The `$` / `left` fallbacks keep
// the block usable on a plain WP install while the author wires WC up.
if ( '' === $symbol && function_exists( 'get_woocommerce_currency_symbol' ) ) {
	// @phan-suppress-next-line PhanUndeclaredFunction
	$wc_symbol = (string) get_woocommerce_currency_symbol();
	// WC returns symbols as HTML entities (e.g. `&#36;`, `&euro;`). Decode once
	// so the downstream `mb_substr` operates on a single character instead of
	// half an entity, and so `esc_html` at output produces a single round-trip.
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

// Trim to two characters so an oversized symbol can't overflow the value
// adornment slot above the thumb.
$symbol_short = function_exists( 'mb_substr' ) ? mb_substr( $symbol, 0, 2 ) : substr( $symbol, 0, 2 );

// Inverted bounds (min > max) would render an unusable slider; coerce to a
// safe ascending pair rather than emitting broken markup.
if ( $min_attr > $max_attr ) {
	$tmp      = $min_attr;
	$min_attr = $max_attr;
	$max_attr = $tmp;
}

$seeded_state = wp_interactivity_state( 'jetpack-search' );
$seeded_price = $seeded_state['priceRange'] ?? null;
$seeded_min   = is_array( $seeded_price ) && null !== ( $seeded_price['min'] ?? null )
	? (string) $seeded_price['min']
	: (string) $min_attr;
$seeded_max   = is_array( $seeded_price ) && null !== ( $seeded_price['max'] ?? null )
	? (string) $seeded_price['max']
	: (string) $max_attr;

// Push the block author's chosen currency symbol and group label into the
// shared store. Same contract the number-input price block writes, so an
// active-filters chip rendered downstream sees the same shape regardless of
// which price block the author dropped on the page. wp_interactivity_state
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

$min_id = wp_unique_id( 'jetpack-search-filter-wc-price-slider-min-' );
$max_id = wp_unique_id( 'jetpack-search-filter-wc-price-slider-max-' );

$format_value = static function ( $value ) use ( $symbol_short, $position ) {
	return 'right' === $position
		? esc_html( $value ) . esc_html( $symbol_short )
		: esc_html( $symbol_short ) . esc_html( $value );
};
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-filter-wc-price-slider' ) ) ); ?>
	data-wp-interactive="jetpack-search"
>
	<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<div class="jetpack-search-filter-wc-price-slider__values" aria-hidden="true">
		<span class="jetpack-search-filter-wc-price-slider__value jetpack-search-filter-wc-price-slider__value--min">
			<?php echo $format_value( $seeded_min ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $format_value escapes both pieces. ?>
		</span>
		<span class="jetpack-search-filter-wc-price-slider__value jetpack-search-filter-wc-price-slider__value--max">
			<?php echo $format_value( $seeded_max ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $format_value escapes both pieces. ?>
		</span>
	</div>
	<div class="jetpack-search-filter-wc-price-slider__track">
		<label class="screen-reader-text" for="<?php echo esc_attr( $min_id ); ?>">
			<?php esc_html_e( 'Minimum price', 'jetpack-search-pkg' ); ?>
		</label>
		<input
			id="<?php echo esc_attr( $min_id ); ?>"
			class="jetpack-search-filter-wc-price-slider__input jetpack-search-filter-wc-price-slider__input--min"
			type="range"
			min="<?php echo esc_attr( (string) $min_attr ); ?>"
			max="<?php echo esc_attr( (string) $max_attr ); ?>"
			step="<?php echo esc_attr( (string) $step ); ?>"
			value="<?php echo esc_attr( $seeded_min ); ?>"
			data-wp-bind--value="state.priceSliderMinValue"
			data-wp-on--input="actions.onPriceSliderInput"
			data-wp-on--change="actions.onPriceSliderInput"
		/>
		<label class="screen-reader-text" for="<?php echo esc_attr( $max_id ); ?>">
			<?php esc_html_e( 'Maximum price', 'jetpack-search-pkg' ); ?>
		</label>
		<input
			id="<?php echo esc_attr( $max_id ); ?>"
			class="jetpack-search-filter-wc-price-slider__input jetpack-search-filter-wc-price-slider__input--max"
			type="range"
			min="<?php echo esc_attr( (string) $min_attr ); ?>"
			max="<?php echo esc_attr( (string) $max_attr ); ?>"
			step="<?php echo esc_attr( (string) $step ); ?>"
			value="<?php echo esc_attr( $seeded_max ); ?>"
			data-wp-bind--value="state.priceSliderMaxValue"
			data-wp-on--input="actions.onPriceSliderInput"
			data-wp-on--change="actions.onPriceSliderInput"
		/>
	</div>
</div>
