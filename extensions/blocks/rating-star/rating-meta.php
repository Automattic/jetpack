<?php
/**
 * Utilities for the rating block.
 *
 * @since 8.0.0
 *
 * @package Jetpack
 */

if ( ! function_exists( 'jetpack_rating_meta_get_symbol_low_fidelity' ) ) {
	/**
	 * Returns the low fidelity symbol for the block.
	 *
	 * @return string
	 */
	function jetpack_rating_meta_get_symbol_low_fidelity() {
		return '⭐';
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
	 * @param array   $attributes Array containing the block attributes.
	 * @param integer $pos Value to render whole and half symbols.
	 * @return string
	 */
	function jetpack_rating_meta_get_symbol_high_fidelity( $attributes, $pos ) {
		$classname_whole = ( $attributes['rating'] >= ( $pos - 0.5 ) ) ? '' : 'is-rating-unfilled';
		$classname_half  = ( $attributes['rating'] >= $pos ) ? '' : 'is-rating-unfilled';
		$color           = empty( $attributes['color'] ) ? 'currentColor' : esc_attr( $attributes['color'] );

		return jetpack_rating_star_get_symbol_high_fidelity( $classname_whole, $classname_half, $color );
	}
}

if ( ! function_exists( 'jetpack_rating_meta_get_symbols' ) ) {
	/**
	 * Returns the symbol for the block.
	 *
	 * @param array $attributes Array containing the block attributes.
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
			$symbols_lofi .= jetpack_rating_meta_get_symbol_low_fidelity();
		}

		return '<p>' . $symbols_lofi . '</p>' . implode( $symbols_hifi );
	}
}

if ( ! function_exists( 'jetpack_rating_meta_render_block' ) ) {
	/**
	 * Dynamic rendering of the block.
	 *
	 * @param array $attributes Array containing the block attributes.
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
