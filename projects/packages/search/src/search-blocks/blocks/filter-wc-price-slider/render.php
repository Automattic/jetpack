<?php
/**
 * Search product filter — price slider render.
 *
 * Single shared track with two thumbs (lower thumb = min, upper thumb = max)
 * — the dual-thumb pattern WooCommerce Blocks ships. Two `<input type="range">`
 * elements overlay each other on the same wrapper: CSS sets
 * `pointer-events: none` on the inputs and re-enables it only on the thumb
 * pseudo-elements, so the wrapper reads as one bar with two draggable handles.
 * A `linear-gradient` driven by `--low` / `--high` CSS custom properties (set
 * reactively by `callbacks.updatePriceSliderRangeFill` when state.priceRange
 * changes) paints the colored "active range" between the thumbs.
 *
 * Peer of the number-input price block: different control surface, identical
 * data plane — same `setPriceRange` action, same `min_price` / `max_price`
 * URL contract, same `priceCurrencySymbol` / `priceLabel` seed shape so a
 * downstream consumer (e.g. the active-filters chip block) reads the seed
 * regardless of which price block the author dropped on the page.
 *
 * Author bounds the slider via `min` / `max` / `step` block attrs; sizing the
 * slider from a live aggregation is deferred to a follow-up.
 *
 * First-paint values are seeded from `state.priceRange` (which the PHP
 * state-builder parses from the URL) so a deep link like
 * `/?s=&min_price=25&max_price=80` shows the thumbs in the right places —
 * and the colored fill in the right span — before JS hydrates.
 *
 * Drag / commit split mirrors WC's: `input` events update state for live
 * visual feedback (track fill follows the thumb) without triggering a search;
 * `change` (which native range inputs fire on release) commits via
 * `actions.search` to update the URL and refetch results.
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
$min_attr    = isset( $attrs['min'] ) ? (float) $attrs['min'] : 0.0;
$max_attr    = isset( $attrs['max'] ) ? (float) $attrs['max'] : 1000.0;
$step        = isset( $attrs['step'] ) && (float) $attrs['step'] > 0 ? (float) $attrs['step'] : 1.0;
$auto_bounds = ! isset( $attrs['autoBounds'] ) || (bool) $attrs['autoBounds'];

// Auto-bound the slider to the store's actual price extents when WooCommerce
// is active and the author hasn't opted out. We pull min/max directly from
// `wp_postmeta._price` rather than going through a search-API aggregation
// because WPCOM v1.3's whitelist excludes `range`/`stats` aggs (see the comments
// in `store/api.js` for the rating filter's histogram workaround). A 5-minute
// transient absorbs the cost of the SQL across page loads — this is a per-page
// "what's the store's price range?" lookup, not a per-search filter clause.
if ( $auto_bounds && function_exists( 'wc_get_product' ) ) {
	$cached_range = function_exists( 'get_transient' ) ? get_transient( 'jetpack_search_wc_price_extents' ) : false;
	if ( false === $cached_range ) {
		global $wpdb;
		$cached_range = array(
			'min' => null,
			'max' => null,
		);
		if ( isset( $wpdb ) ) {
			// `_price` is the canonical WC postmeta key — it's the computed
			// price WC uses for both filtering and sorting. Cast to DECIMAL so
			// MIN/MAX compare numerically (the underlying meta_value column is
			// LONGTEXT). Empty / non-numeric rows are filtered out so a "Call
			// for price" product doesn't poison the bounds. Caching is handled
			// by the surrounding transient — the phpcs caching warning fires
			// because the call site doesn't use wp_cache_*, but the transient
			// already provides the same effect across page loads.
			$row = $wpdb->get_row( // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery,WordPress.DB.DirectDatabaseQuery.NoCaching
				"SELECT
					MIN(CAST(meta_value AS DECIMAL(20,6))) AS min_price,
					MAX(CAST(meta_value AS DECIMAL(20,6))) AS max_price
				FROM {$wpdb->postmeta}
				WHERE meta_key = '_price'
					AND meta_value <> ''
					AND meta_value REGEXP '^[0-9]+(\\\\.[0-9]+)?$'"
			);
			if ( $row && null !== $row->min_price && null !== $row->max_price ) {
				$cached_range = array(
					'min' => (float) $row->min_price,
					'max' => (float) $row->max_price,
				);
			}
		}
		if ( function_exists( 'set_transient' ) ) {
			set_transient( 'jetpack_search_wc_price_extents', $cached_range, 5 * MINUTE_IN_SECONDS );
		}
	}
	if ( is_array( $cached_range ) && null !== ( $cached_range['min'] ?? null ) && null !== ( $cached_range['max'] ?? null ) ) {
		// Floor the floor and ceiling the ceiling so the slider snaps to whole
		// numbers — `$24.95` becomes a `24` floor / `95` ceiling, which reads
		// cleaner in the value labels and avoids fractional thumb positions.
		$min_attr = (float) floor( (float) $cached_range['min'] );
		$max_attr = (float) ceil( (float) $cached_range['max'] );
	}
}

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
	? (float) $seeded_price['min']
	: $min_attr;
$seeded_max   = is_array( $seeded_price ) && null !== ( $seeded_price['max'] ?? null )
	? (float) $seeded_price['max']
	: $max_attr;

// First-paint --low / --high so the colored active-range fill renders before
// JS hydrates. Guard against zero span (author misconfigured min === max).
$span     = $max_attr - $min_attr;
$low_pct  = $span > 0 ? max( 0.0, min( 100.0, ( ( $seeded_min - $min_attr ) / $span ) * 100.0 ) ) : 0.0;
$high_pct = $span > 0 ? max( 0.0, min( 100.0, ( ( $seeded_max - $min_attr ) / $span ) * 100.0 ) ) : 100.0;

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

// Slider value labels render as integers — author-set step controls precision
// of the underlying input value, but the visible label rounds to a whole
// number so a 4-pixel drag doesn't churn "$24.96 / $25.04 / $25.12".
$seeded_min_label = (string) ( (int) round( $seeded_min ) );
$seeded_max_label = (string) ( (int) round( $seeded_max ) );

// Format --low / --high without trailing zeros so the inline style stays tidy.
$fmt_pct = static function ( $value ) {
	$out = number_format( $value, 4, '.', '' );
	$out = rtrim( $out, '0' );
	return rtrim( $out, '.' );
};

$track_style = sprintf(
	'--low:%s%%;--high:%s%%',
	$fmt_pct( $low_pct ),
	$fmt_pct( $high_pct )
);

// Per-slider range bounds threaded into the Interactivity context so the
// `updatePriceSliderRangeFill` callback can compute --low/--high without
// reading them off the input DOM nodes (cleaner; survives state-only updates
// where the inputs haven't yet been touched). JSON-encode for inline output.
$context_payload = wp_json_encode(
	array(
		'sliderMin' => $min_attr,
		'sliderMax' => $max_attr,
	),
	JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_HEX_TAG | JSON_HEX_AMP | JSON_HEX_QUOT | JSON_HEX_APOS
);
?>
<div
	<?php echo wp_kses_data( get_block_wrapper_attributes( array( 'class' => 'jetpack-search-filter-wc-price-slider' ) ) ); ?>
	data-wp-interactive="jetpack-search"
	data-wp-context="<?php echo esc_attr( (string) $context_payload ); ?>"
	data-wp-watch="callbacks.updatePriceSliderUi"
>
	<h3 class="jetpack-search-filter__title"><?php echo esc_html( $label ); ?></h3>
	<div class="jetpack-search-filter-wc-price-slider__content">
		<div class="jetpack-search-filter-wc-price-slider__left">
			<span class="jetpack-search-filter-wc-price-slider__value jetpack-search-filter-wc-price-slider__value--min"><?php echo $format_value( $seeded_min_label ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $format_value escapes both pieces. ?></span>
		</div>
		<div
			class="jetpack-search-filter-wc-price-slider__range"
			style="<?php echo esc_attr( $track_style ); ?>"
		>
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
				value="<?php echo esc_attr( (string) $seeded_min ); ?>"
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
				value="<?php echo esc_attr( (string) $seeded_max ); ?>"
				data-wp-on--input="actions.onPriceSliderInput"
				data-wp-on--change="actions.onPriceSliderChange"
			/>
		</div>
		<div class="jetpack-search-filter-wc-price-slider__right">
			<span class="jetpack-search-filter-wc-price-slider__value jetpack-search-filter-wc-price-slider__value--max"><?php echo $format_value( $seeded_max_label ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- $format_value escapes both pieces. ?></span>
		</div>
	</div>
</div>
