<?php
/**
 * Utilities for the rating block.
 *
 * @package Jetpack
 */

if ( ! function_exists( 'jetpack_rating_meta_get_symbol_low_fidelity' ) ) {
	/**
	 * Returns the low fidelity symbol for the block.
	 *
	 * @param array $attributes Array containing the business hours block attributes.
	 * @return string
	 */
	function jetpack_rating_meta_get_symbol_low_fidelity( $attributes ) {
		switch ( $attributes['ratingStyle'] ) {
			case 'priciness':
				return '💲';
			case 'spiciness':
				return '🌶️';
			default:
				return '⭐';
		}
	}
}

if ( ! function_exists( 'jetpack_rating_priciness_get_symbol_high_fidelity' ) ) {
	/**
	 * Return the high fidelity symbol for the block.
	 *
	 * @param string $classname_whole Name of the whole symbol class.
	 * @param string $classname_half Name of the half symbol class.
	 * @param string $color Color of the block.
	 *
	 * @return string
	 */
	function jetpack_rating_priciness_get_symbol_high_fidelity( $classname_whole, $classname_half, $color ) {
		return <<<ELO
<span>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<path class="{$classname_whole}" fill="{$color}" stroke="{$color}"
		d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
</svg>
</span>
<span>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<path class="{$classname_half}" fill="{$color}" stroke="{$color}"
		d="M11.8 10.9c-2.27-.59-3-1.2-3-2.15 0-1.09 1.01-1.85 2.7-1.85 1.78 0 2.44.85 2.5 2.1h2.21c-.07-1.72-1.12-3.3-3.21-3.81V3h-3v2.16c-1.94.42-3.5 1.68-3.5 3.61 0 2.31 1.91 3.46 4.7 4.13 2.5.6 3 1.48 3 2.41 0 .69-.49 1.79-2.7 1.79-2.06 0-2.87-.92-2.98-2.1h-2.2c.12 2.19 1.76 3.42 3.68 3.83V21h3v-2.15c1.95-.37 3.5-1.5 3.5-3.55 0-2.84-2.43-3.81-4.7-4.4z" />
</svg>
</span>
ELO;
	}
}

if ( ! function_exists( 'jetpack_rating_spiciness_get_symbol_high_fidelity' ) ) {
	/**
	 * Return the high fidelity symbol for the block.
	 *
	 * @param string $classname_whole Name of the whole symbol class.
	 * @param string $classname_half Name of the half symbol class.
	 * @param string $color Color of the block.
	 *
	 * @return string
	 */
	function jetpack_rating_spiciness_get_symbol_high_fidelity( $classname_whole, $classname_half, $color ) {
		return <<<ELO
<span>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<path class="{$classname_whole}" fill="{$color}" stroke="{$color}"
		d="M13.8 9l1.2-.8c.6.3 1.1 1 1.1 1.8v11.8s-8-1.8-8-10.8v-1c0-.7.4-1.4 1-1.7l1.3.7L12 8l1.8 1zM10 2c1.5 0 2.8 1.1 3 2.6 1 .3 1.8 1 2.2 2l-1.5.9-1.8-1-1.6 1-1.5-.8c.4-1 1.2-1.7 2.2-2-.2-.4-.6-.7-1-.7V2z" />
</svg>
</span>
<span>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<path class="{$classname_half}" fill="{$color}" stroke="{$color}"
		d="M13.8 9l1.2-.8c.6.3 1.1 1 1.1 1.8v11.8s-8-1.8-8-10.8v-1c0-.7.4-1.4 1-1.7l1.3.7L12 8l1.8 1zM10 2c1.5 0 2.8 1.1 3 2.6 1 .3 1.8 1 2.2 2l-1.5.9-1.8-1-1.6 1-1.5-.8c.4-1 1.2-1.7 2.2-2-.2-.4-.6-.7-1-.7V2z" />
</svg>
</span>
ELO;
	}
}

if ( ! function_exists( 'jetpack_rating_star_get_symbol_high_fidelity' ) ) {
	/**
	 * Return the high fidelity symbol for the block.
	 *
	 * @param string $classname_whole Name of the whole symbol class.
	 * @param string $classname_half Name of the half symbol class.
	 * @param string $color Color of the block.
	 *
	 * @return string
	 */
	function jetpack_rating_star_get_symbol_high_fidelity( $classname_whole, $classname_half, $color ) {
		return <<<ELO
<span>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<path class="{$classname_whole}" fill="{$color}" stroke="{$color}" d="M12,17.3l6.2,3.7l-1.6-7L22,9.2l-7.2-0.6L12,2L9.2,8.6L2,9.2L7.5,14l-1.6,7L12,17.3z" />
</svg>
</span>
<span>
<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24">
	<path class="{$classname_half}" fill="{$color}" stroke="{$color}" d="M12,17.3l6.2,3.7l-1.6-7L22,9.2l-7.2-0.6L12,2L9.2,8.6L2,9.2L7.5,14l-1.6,7L12,17.3z" />
</svg>
</span>
ELO;
	}
}

if ( ! function_exists( 'jetpack_rating_meta_get_symbol_high_fidelity' ) ) {
	/**
	 * Returns the high fidelity symbol for the block.
	 *
	 * @param array   $attributes Array containing the business hours block attributes.
	 * @param integer $pos Value to render whole and half symbols.
	 * @return string
	 */
	function jetpack_rating_meta_get_symbol_high_fidelity( $attributes, $pos ) {
		$classname_whole = ( $attributes['rating'] >= ( $pos - 0.5 ) ) ? '' : 'is-rating-unfilled';
		$classname_half  = ( $attributes['rating'] >= $pos ) ? '' : 'is-rating-unfilled';
		$color           = empty( $attributes['color'] ) ? 'currentColor' : esc_attr( $attributes['color'] );

		switch ( $attributes['ratingStyle'] ) {
			case 'priciness':
				return jetpack_rating_priciness_get_symbol_high_fidelity( $classname_whole, $classname_half, $color );
			case 'spiciness':
				return jetpack_rating_spiciness_get_symbol_high_fidelity( $classname_whole, $classname_half, $color );
			default:
				return jetpack_rating_star_get_symbol_high_fidelity( $classname_whole, $classname_half, $color );
		}
	}
}

if ( ! function_exists( 'jetpack_rating_meta_get_symbols' ) ) {
	/**
	 * Returns the symbol for the block.
	 *
	 * @param array $attributes Array containing the business hours block attributes.
	 *
	 * @return string
	 */
	function jetpack_rating_meta_get_symbols( $attributes ) {
		// Output SVGs for high fidelity contexts, then color them according to rating.
		// These are hidden by default, then unhid when CSS loads.
		$symbols_hifi = array();
		for ( $pos = 1; $pos <= $attributes['maxRating']; $pos++ ) {
			$symbols_hifi[] = '<span style="display: none;">' . jetpack_rating_meta_get_symbol_high_fidelity( $attributes, $pos ) . '</span>';
		}

		// Output fallback symbols for low fidelity contexts, like AMP,
		// where CSS is not loaded so the high-fidelity symbols won't be rendered.
		$symbols_lofi = '';
		for ( $i = 0; $i < $attributes['rating']; $i++ ) {
			$symbols_lofi .= jetpack_rating_meta_get_symbol_low_fidelity( $attributes );
		}

		return '<p>' . $symbols_lofi . '</p>' . implode( $symbols_hifi );
	}
}

if ( ! function_exists( 'jetpack_rating_meta_render_block' ) ) {
	/**
	 * Dynamic rendering of the block.
	 *
	 * @param array $attributes Array containing the business hours block attributes.
	 *
	 * @return string
	 */
	function jetpack_rating_meta_render_block( $attributes ) {
		$classname = empty( $attributes['className'] ) ? '' : ' ' . $attributes['className'];
		return sprintf(
			'<div class="%1$s" style="text-align:%3$s">%2$s</div>',
			esc_attr( 'wp-block-jetpack-rating-' . $attributes['ratingStyle'] . $classname ),
			jetpack_rating_meta_get_symbols( $attributes ),
			( isset( $attributes['align'] ) ) ? esc_attr( $attributes['align'] ) : ''
		);
	}
}
