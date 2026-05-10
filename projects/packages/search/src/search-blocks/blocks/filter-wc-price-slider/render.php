<?php
/**
 * Search product filter — price slider render.
 *
 * Dual-thumb single-track slider mirroring WooCommerce Blocks, paired with a
 * `[min input] – [max input]` row below for direct keyboard entry. Two
 * overlaid `<input type="range">` elements share the track wrapper, with
 * `pointer-events` routed so the wrapper reads as a single bar with two
 * draggable handles. `--low` / `--high` CSS custom properties (set by
 * `callbacks.updatePriceSliderUi`) paint the colored "active range" between
 * the thumbs.
 *
 * Slider drag / commit split: `input` events update state for live visual
 * feedback without searching; `change` (fired on release) commits via
 * `actions.setPriceRange` — which itself searches when the bounds actually
 * changed, with a fallthrough `actions.search` for the no-op case where the
 * drag handler had pre-written the same value.
 *
 * Number inputs commit on `change` (blur or Enter) via
 * `actions.onPriceSliderNumberInputChange`, which writes to the same
 * `state.priceRange` slice — the watcher then syncs the range thumbs.
 * `data-wp-bind--value` keeps the inputs in lockstep with state in the
 * other direction (slider drag → state → input).
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
// Clamp author bounds to >= 0 — the JS `parseBound()` and store
// `setPriceRange()` both reject negative values, so a negative attr would
// produce a slider that visually allows a range it can never commit.
$min_attr    = isset( $attrs['min'] ) ? max( 0.0, (float) $attrs['min'] ) : 0.0;
$max_attr    = isset( $attrs['max'] ) ? max( 0.0, (float) $attrs['max'] ) : 1000.0;
$step        = isset( $attrs['step'] ) && (float) $attrs['step'] > 0 ? (float) $attrs['step'] : 1.0;
$auto_bounds = ! isset( $attrs['autoBounds'] ) || (bool) $attrs['autoBounds'];

if ( $auto_bounds ) {
	$extents = Wc_Block_Helpers::get_catalog_price_extents();
	if ( null !== $extents['min'] && null !== $extents['max'] ) {
		// Floor / ceil to whole numbers so labels read cleanly.
		$min_attr = floor( $extents['min'] );
		$max_attr = ceil( $extents['max'] );
	}
}

if ( '' === $label ) {
	$label = __( 'Price', 'jetpack-search-pkg' );
}

$currency     = Wc_Block_Helpers::get_currency_display( $symbol, $position );
$symbol_short = $currency['symbol'];
$position     = $currency['position'];

// Coerce inverted bounds (min > max) so the slider stays renderable.
if ( $min_attr > $max_attr ) {
	$tmp      = $min_attr;
	$min_attr = $max_attr;
	$max_attr = $tmp;
}

// Share currency + label with downstream blocks (e.g. active-filters chip)
// via the Interactivity store. Same shape the number-input price block writes.
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

$min_id       = wp_unique_id( 'jetpack-search-filter-wc-price-slider-min-' );
$max_id       = wp_unique_id( 'jetpack-search-filter-wc-price-slider-max-' );
$min_input_id = wp_unique_id( 'jetpack-search-filter-wc-price-slider-min-input-' );
$max_input_id = wp_unique_id( 'jetpack-search-filter-wc-price-slider-max-input-' );
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-filter-wc-price-slider' ) ) ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-watch="callbacks.updatePriceSliderUi"
>
	<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<div class="jetpack-search-filter-wc-price-slider__range">
		<div class="jetpack-search-filter-wc-price-slider__range-bar"></div>
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
			value="<?php echo esc_attr( (string) $min_attr ); ?>"
			data-wp-on--input="actions.onPriceSliderInput"
			data-wp-on--change="actions.onPriceSliderChange"
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
			value="<?php echo esc_attr( (string) $max_attr ); ?>"
			data-wp-on--input="actions.onPriceSliderInput"
			data-wp-on--change="actions.onPriceSliderChange"
		/>
	</div>
	<div class="jetpack-search-filter-wc-price-slider__inputs">
		<div class="jetpack-search-filter-wc-price-slider__field jetpack-search-filter-wc-price-slider__field--<?php echo esc_attr( $position ); ?>">
			<label class="screen-reader-text" for="<?php echo esc_attr( $min_input_id ); ?>">
				<?php esc_html_e( 'Minimum price', 'jetpack-search-pkg' ); ?>
			</label>
			<span class="jetpack-search-filter-wc-price-slider__symbol" aria-hidden="true">
				<?php echo esc_html( $symbol_short ); ?>
			</span>
			<input
				id="<?php echo esc_attr( $min_input_id ); ?>"
				class="jetpack-search-filter-wc-price-slider__number-input jetpack-search-filter-wc-price-slider__number-input--min"
				type="number"
				inputmode="decimal"
				min="0"
				step="any"
				placeholder="<?php esc_attr_e( 'Min', 'jetpack-search-pkg' ); ?>"
				data-wp-bind--value="state.priceRangeMinInputValue"
				data-wp-on--change="actions.onPriceSliderNumberInputChange"
				data-wp-on--keydown="actions.onPriceSliderNumberInputKeydown"
			/>
		</div>
		<span class="jetpack-search-filter-wc-price-slider__separator" aria-hidden="true">–</span>
		<div class="jetpack-search-filter-wc-price-slider__field jetpack-search-filter-wc-price-slider__field--<?php echo esc_attr( $position ); ?>">
			<label class="screen-reader-text" for="<?php echo esc_attr( $max_input_id ); ?>">
				<?php esc_html_e( 'Maximum price', 'jetpack-search-pkg' ); ?>
			</label>
			<span class="jetpack-search-filter-wc-price-slider__symbol" aria-hidden="true">
				<?php echo esc_html( $symbol_short ); ?>
			</span>
			<input
				id="<?php echo esc_attr( $max_input_id ); ?>"
				class="jetpack-search-filter-wc-price-slider__number-input jetpack-search-filter-wc-price-slider__number-input--max"
				type="number"
				inputmode="decimal"
				min="0"
				step="any"
				placeholder="<?php esc_attr_e( 'Max', 'jetpack-search-pkg' ); ?>"
				data-wp-bind--value="state.priceRangeMaxInputValue"
				data-wp-on--change="actions.onPriceSliderNumberInputChange"
				data-wp-on--keydown="actions.onPriceSliderNumberInputKeydown"
			/>
		</div>
	</div>
</div>
