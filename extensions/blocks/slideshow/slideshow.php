<?php
/**
 * Slideshow Block.
 *
 * @since 7.1.0
 *
 * @package Jetpack
 */

jetpack_register_block(
	'jetpack/slideshow',
	array(
		'render_callback' => 'jetpack_slideshow_block_load_assets',
	)
);

/**
 * Slideshow block registration/dependency declaration.
 *
 * @param array  $attr    Array containing the slideshow block attributes.
 * @param string $content String containing the slideshow block content.
 *
 * @return string
 */
function jetpack_slideshow_block_load_assets( $attr, $content ) {
	Jetpack_Gutenberg::load_assets_as_required( 'slideshow' );
	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		return jetpack_slideshow_block_render_amp( $attr );
	}
	return $content;
}

/**
 * Render slideshow block for AMP
 *
 * @param array $attr Array containing the slideshow block attributes.
 *
 * @return string
 */
function jetpack_slideshow_block_render_amp( $attr ) {
	static $wp_block_jetpack_slideshow_id = 0;
	$wp_block_jetpack_slideshow_id++;

	$ids      = empty( $attr['ids'] ) ? array() : $attr['ids'];
	$autoplay = empty( $attr['autoplay'] ) ? false : $attr['autoplay'];
	$classes  = array(
		'wp-block-jetpack-slideshow',
		'wp-amp-block',
		'align' . isset( $attr['align'] ) ? $attr['align'] : 'center',
		$autoplay ? 'wp-block-jetpack-slideshow__autoplay' : null,
		$autoplay ? 'wp-block-jetpack-slideshow__autoplay-playing' : null,
	);

	return sprintf(
		'<div class="%1$s" id="wp-block-jetpack-slideshow__%2$d"><div class="wp-block-jetpack-slideshow_container swiper-container">%3$s%4$s%5$s</div></div>',
		esc_attr( implode( $classes, ' ' ) ),
		absint( $wp_block_jetpack_slideshow_id ),
		jetpack_slideshow_block_amp_carousel( $attr, $wp_block_jetpack_slideshow_id ),
		$autoplay ? jetpack_slideshow_block_autoplay_ui( $wp_block_jetpack_slideshow_id ) : '',
		jetpack_slideshow_block_bullets( $ids, $wp_block_jetpack_slideshow_id )
	);
}

/**
 * Generate amp-carousel markup
 *
 * @param array $attr Array of block attributes.
 * @param int   $block_ordinal The ordinal number of the block, used in unique ID.
 *
 * @return string amp-carousel markup.
 */
function jetpack_slideshow_block_amp_carousel( $attr, $block_ordinal ) {
	$ids         = empty( $attr['ids'] ) ? array() : $attr['ids'];
	$first_image = wp_get_attachment_metadata( $ids[0] );
	$delay       = empty( $attr['delay'] ) ? 3 : absint( $attr['delay'] );
	$autoplay    = empty( $attr['autoplay'] ) ? false : $attr['autoplay'];
	return sprintf(
		'<amp-carousel width="%1$d" height="%2$d" layout="responsive" type="slides" data-next-button-aria-label="%3$s" data-prev-button-aria-label="%4$s" controls loop %5$s id="wp-block-jetpack-slideshow__amp-carousel__%6$s" on="slideChange:wp-block-jetpack-slideshow__amp-pagination__%6$s.toggle(index=event.index, value=true)">%7$s</amp-carousel>',
		esc_attr( $first_image['width'] ),
		esc_attr( $first_image['height'] ),
		esc_attr__( 'Next Slide', 'jetpack' ),
		esc_attr__( 'Previous Slide', 'jetpack' ),
		$autoplay ? 'autoplay delay=' . esc_attr( $delay * 1000 ) : '',
		absint( $block_ordinal ),
		implode( '', jetpack_slideshow_block_slides( $ids, $first_image['width'], $first_image['height'] ) )
	);
}

/**
 * Generate array of slides markup
 *
 * @param array $ids Array of image ids.
 * @param int   $width Width of the container.
 * @param int   $height Height of the container.
 *
 * @return array Array of slides markup.
 */
function jetpack_slideshow_block_slides( $ids = array(), $width = 400, $height = 300 ) {
	return array_map(
		function( $id ) use ( $width, $height ) {
			$caption    = wp_get_attachment_caption( $id );
			$figcaption = $caption ? sprintf(
				'<figcaption class="wp-block-jetpack-slideshow_caption gallery-caption">%s</figcaption>',
				wp_kses_post( $caption )
			) : '';
			$image      = wp_get_attachment_image(
				$id,
				array( $width, $height ),
				false,
				array(
					'class'      => 'wp-block-jetpack-slideshow_image',
					'object-fit' => 'contain',
				)
			);
			return sprintf(
				'<div class="wp-block-jetpack-slideshow_slide"><figure>%s%s</figure></div>',
				$image,
				$figcaption
			);
		},
		$ids
	);
}

/**
 * Generate array of bullets markup
 *
 * @param array $ids Array of image ids.
 * @param int   $block_ordinal The ordinal number of the block, used in unique ID.
 *
 * @return array Array of bullets markup.
 */
function jetpack_slideshow_block_bullets( $ids = array(), $block_ordinal = 0 ) {
	$buttons = array_map(
		function( $index ) {
			return sprintf(
				'<button option="%d" class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="%s %d" %s></button>',
				absint( $index ),
				esc_attr__( 'Go to slide', 'jetpack' ),
				absint( $index + 1 ),
				0 === $index ? 'selected' : ''
			);
		},
		array_keys( $ids )
	);

	return sprintf(
		'<amp-selector id="wp-block-jetpack-slideshow__amp-pagination__%1$d" class="wp-block-jetpack-slideshow_pagination swiper-pagination swiper-pagination-bullets amp-pagination" on="select:wp-block-jetpack-slideshow__amp-carousel__%1$d.goToSlide(index=event.targetOption)" layout="container">%2$s</amp-selector>',
		absint( $block_ordinal ),
		implode( '', $buttons )
	);
}

/**
 * Generate autoplay play/pause UI.
 *
 * @param int $block_ordinal The ordinal number of the block, used in unique ID.
 *
 * @return string Autoplay UI markup.
 */
function jetpack_slideshow_block_autoplay_ui( $block_ordinal = 0 ) {
	$block_id        = sprintf(
		'wp-block-jetpack-slideshow__%d',
		absint( $block_ordinal )
	);
	$amp_carousel_id = sprintf(
		'wp-block-jetpack-slideshow__amp-carousel__%d',
		absint( $block_ordinal )
	);
	$autoplay_pause  = sprintf(
		'<a aria-label="%s" class="wp-block-jetpack-slideshow_button-pause" role="button" on="tap:%s.toggleAutoplay(toggleOn=false),%s.toggleClass(class=wp-block-jetpack-slideshow__autoplay-playing,force=false)"></a>',
		esc_attr__( 'Pause Slideshow', 'jetpack' ),
		esc_attr( $amp_carousel_id ),
		esc_attr( $block_id )
	);
	$autoplay_play   = sprintf(
		'<a aria-label="%s" class="wp-block-jetpack-slideshow_button-play" role="button" on="tap:%s.toggleAutoplay(toggleOn=true),%s.toggleClass(class=wp-block-jetpack-slideshow__autoplay-playing,force=true)"></a>',
		esc_attr__( 'Play Slideshow', 'jetpack' ),
		esc_attr( $amp_carousel_id ),
		esc_attr( $block_id )
	);
	return $autoplay_pause . $autoplay_play;
}
