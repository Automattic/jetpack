<?php
/**
 * Search product filter — price render.
 *
 * Two layouts behind one block, controlled by `showSlider`:
 *
 *  - **filter**  (`showSlider: false`, default): two number inputs (min, max)
 *    joined by an em-dash. Compact; what the "Filter by Price" inserter
 *    variation lands on.
 *  - **slider** (`showSlider: true`): a dual-thumb single-track slider on
 *    top, with the same number-input row below for direct keyboard entry.
 *    Mirrors WooCommerce Blocks' `product-filter-price-slider`. Slider track
 *    bounds default to the published catalog's `_price` extents (auto-bounds,
 *    transient-cached via {@see Wc_Block_Helpers::get_catalog_price_extents()}).
 *
 * Both layouts share the `priceRange` state slice — `setPriceRange` is the
 * single commit path, `min_price` / `max_price` URL params round-trip through
 * the same `RESERVED_QUERY_PARAMS` entries, and the active-filters chip reads
 * `priceCurrencySymbol` / `priceLabel` written here.
 *
 * Number-input commit (blur / Enter / native `change`) flows through
 * `actions.onPriceRangeInputChange`. Slider drag fires `input` (state-only,
 * no search) and `change` on release (`onPriceSliderChange`, commits via
 * `setPriceRange` with a fallthrough `search` for the drag-pre-wrote case).
 * The `updatePriceSliderUi` watcher (slider mode only) keeps the range thumbs
 * + `--low`/`--high` gradient + `aria-valuetext` in sync with state; the
 * number inputs sync automatically through `data-wp-bind--value`.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable

if ( ! function_exists( 'wp_interactivity_state' ) ) {
	return;
}

// @phan-suppress-next-line PhanUndeclaredGlobalVariable
$attrs       = (array) $attributes;
$label       = sanitize_text_field( (string) ( $attrs['label'] ?? '' ) );
$symbol      = sanitize_text_field( (string) ( $attrs['currencySymbol'] ?? '' ) );
$position    = sanitize_text_field( (string) ( $attrs['currencySymbolPosition'] ?? '' ) );
$show_slider = ! empty( $attrs['showSlider'] );

// Slider-only attributes — read regardless of `$show_slider` so phpcs sees
// them as touched, but only emitted when the slider section renders.
// Clamp author bounds to >= 0 — the JS `parseBound()` and `setPriceRange()`
// both reject negative values, so a negative attr would produce a slider
// that visually allows a range it can never commit.
$min_attr    = isset( $attrs['min'] ) ? max( 0.0, (float) $attrs['min'] ) : 0.0;
$max_attr    = isset( $attrs['max'] ) ? max( 0.0, (float) $attrs['max'] ) : 1000.0;
$step        = isset( $attrs['step'] ) && (float) $attrs['step'] > 0 ? (float) $attrs['step'] : 1.0;
$auto_bounds = ! isset( $attrs['autoBounds'] ) || (bool) $attrs['autoBounds'];

if ( $show_slider && $auto_bounds ) {
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
if ( $show_slider && $min_attr > $max_attr ) {
	$tmp      = $min_attr;
	$min_attr = $max_attr;
	$max_attr = $tmp;
}

$seeded_state = wp_interactivity_state( 'jetpack-search' );
$seeded_price = $seeded_state['priceRange'] ?? null;
$seeded_min   = is_array( $seeded_price ) && null !== ( $seeded_price['min'] ?? null )
	? (string) $seeded_price['min']
	: '';
$seeded_max   = is_array( $seeded_price ) && null !== ( $seeded_price['max'] ?? null )
	? (string) $seeded_price['max']
	: '';

// Share currency + label with downstream blocks (e.g. active-filters chip)
// via the Interactivity store. The chip block doesn't know about the price
// block at render time, so without this seed it would fall back to the
// generic default. wp_interactivity_state deep-merges, so writing here
// doesn't disturb other state branches.
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
// Slider thumb IDs only allocate when actually rendered — filter mode
// would otherwise waste two `wp_unique_id()` counter increments per render.
$slider_min_id   = $show_slider ? wp_unique_id( 'jetpack-search-filter-wc-price-slider-min-' ) : '';
$slider_max_id   = $show_slider ? wp_unique_id( 'jetpack-search-filter-wc-price-slider-max-' ) : '';
$wrapper_classes = 'jetpack-search-filter-wc-price' . ( $show_slider ? ' jetpack-search-filter-wc-price--with-slider' : '' );
$wrapper_attrs   = array(
	'class' => $wrapper_classes,
);
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( $wrapper_attrs ) ); ?>
	data-wp-interactive="jetpack-search"
	<?php if ( $show_slider ) : ?>
	data-wp-watch="callbacks.updatePriceSliderUi"
	<?php endif; ?>
>
	<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<?php if ( $show_slider ) : ?>
	<div class="jetpack-search-filter-wc-price__slider">
		<div class="jetpack-search-filter-wc-price__slider-bar"></div>
		<label class="screen-reader-text" for="<?php echo esc_attr( $slider_min_id ); ?>">
			<?php esc_html_e( 'Minimum price', 'jetpack-search-pkg' ); ?>
		</label>
		<input
			id="<?php echo esc_attr( $slider_min_id ); ?>"
			class="jetpack-search-filter-wc-price__slider-input jetpack-search-filter-wc-price__slider-input--min"
			type="range"
			min="<?php echo esc_attr( (string) $min_attr ); ?>"
			max="<?php echo esc_attr( (string) $max_attr ); ?>"
			step="<?php echo esc_attr( (string) $step ); ?>"
			value="<?php echo esc_attr( (string) $min_attr ); ?>"
			data-wp-on--input="actions.onPriceSliderInput"
			data-wp-on--change="actions.onPriceSliderChange"
		/>
		<label class="screen-reader-text" for="<?php echo esc_attr( $slider_max_id ); ?>">
			<?php esc_html_e( 'Maximum price', 'jetpack-search-pkg' ); ?>
		</label>
		<input
			id="<?php echo esc_attr( $slider_max_id ); ?>"
			class="jetpack-search-filter-wc-price__slider-input jetpack-search-filter-wc-price__slider-input--max"
			type="range"
			min="<?php echo esc_attr( (string) $min_attr ); ?>"
			max="<?php echo esc_attr( (string) $max_attr ); ?>"
			step="<?php echo esc_attr( (string) $step ); ?>"
			value="<?php echo esc_attr( (string) $max_attr ); ?>"
			data-wp-on--input="actions.onPriceSliderInput"
			data-wp-on--change="actions.onPriceSliderChange"
		/>
	</div>
	<?php endif; ?>
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
