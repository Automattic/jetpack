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

	$block_id = sprintf(
		'wp-block-jetpack-slideshow__%s',
		intval( $wp_block_jetpack_slideshow_id )
	);

	$amp_carousel_id = sprintf(
		'wp-block-jetpack-slideshow__amp_carousel_%s',
		intval( $wp_block_jetpack_slideshow_id )
	);

	$ids      = empty( $attr['ids'] ) ? array() : $attr['ids'];
	$autoplay = empty( $attr['autoplay'] ) ? false : $attr['autoplay'];
	$delay    = empty( $attr['delay'] ) ? 3 : intval( $attr['delay'] );
	$align    = isset( $attr['align'] ) ? $attr['align'] : 'center';
	$classes  = array(
		'wp-block-jetpack-slideshow',
		'wp-amp-block',
		'align' . $align,
	);
	if ( $autoplay ) {
		$classes[] = 'wp-block-jetpack-slideshow__autoplay';
		$classes[] = 'wp-block-jetpack-slideshow__autoplay-playing';
	}
	$first_image = wp_get_attachment_metadata( $ids[0] );
	$width       = $first_image['width'];
	$height      = $first_image['height'];

	$slides     = array_map(
		function( $id ) use ( $width, $height ) {
			$caption    = wp_get_attachment_caption( $id );
			$figcaption = $caption ? sprintf(
				'<figcaption class="wp-block-jetpack-slideshow_caption gallery-caption">%s</figcaption>',
				wp_kses_post( $caption )
			) : '';
			$image      = wp_get_attachment_image(
				$id,
				[ $width, $height ],
				false,
				[
					'class'      => 'wp-block-jetpack-slideshow_image',
					'object-fit' => 'contain',
				]
			);
			return sprintf(
				'<div class="wp-block-jetpack-slideshow_slide" width="%s" height="%s"><figure>%s%s</figure></div>',
				esc_attr( $width ),
				esc_attr( $height ),
				$image,
				$figcaption
			);
		},
		$ids
	);
	$bullets    = array_map(
		function( $index ) use ( $amp_carousel_id ) {
			return sprintf(
				'<button class="swiper-pagination-bullet" tabindex="0" role="button" aria-label="Go to slide %s" on="tap:%s.goToSlide(index=%s)"></button>',
				( $index + 1 ),
				esc_attr( $amp_carousel_id ),
				$index
			);
		},
		array_keys( $ids )
	);
	$pagination = sprintf(
		'<div class="wp-block-jetpack-slideshow_pagination swiper-pagination swiper-pagination-bullets amp-pagination">%s</div>',
		implode( '', $bullets )
	);
	$carousel   = sprintf(
		'<amp-carousel height="%s" width="%s" layout="responsive" type="slides" data-next-button-aria-label="%s" data-prev-button-aria-label="%s" controls loop %s id="%s">%s</amp-carousel>',
		esc_attr( $height ),
		esc_attr( $width ),
		esc_attr__( 'Next Slide', 'jetpack' ),
		esc_attr__( 'Previous Slide', 'jetpack' ),
		$autoplay ? 'autoplay delay=' . esc_attr( $delay * 1000 ) : '',
		esc_attr( $amp_carousel_id ),
		implode( '', $slides )
	);

	$autoplay_pause = sprintf(
		'<a aria-label="%s" class="wp-block-jetpack-slideshow_button-pause" role="button" on="tap:%s.toggleAutoplay(toggleOn=false),%s.toggleClass(class=wp-block-jetpack-slideshow__autoplay-playing,force=false)"></a>',
		esc_attr__( 'Pause Slideshow', 'jetpack' ),
		esc_attr( $amp_carousel_id ),
		esc_attr( $block_id )
	);
	$autoplay_play  = sprintf(
		'<a aria-label="%s" class="wp-block-jetpack-slideshow_button-play" role="button" on="tap:%s.toggleAutoplay(toggleOn=true),%s.toggleClass(class=wp-block-jetpack-slideshow__autoplay-playing,force=true)"></a>',
		esc_attr__( 'Play Slideshow', 'jetpack' ),
		esc_attr( $amp_carousel_id ),
		esc_attr( $block_id )
	);

	return sprintf(
		'<div class="%s" id="%s"><div class="wp-block-jetpack-slideshow_container swiper-container">%s%s%s</div></div>',
		esc_attr( implode( $classes, ' ' ) ),
		esc_attr( $block_id ),
		$carousel,
		$autoplay ? $autoplay_pause . $autoplay_play : '',
		$pagination
	);
}
