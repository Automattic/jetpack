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
	$type = 'slideshow';
	Jetpack_Gutenberg::load_assets_as_required( $type );
	if ( class_exists( 'Jetpack_AMP_Support' ) && Jetpack_AMP_Support::is_amp_request() ) {
		$ids      = empty( $attr['ids'] ) ? array() : $attr['ids'];
		$autoplay = empty( $attr['autoplay'] ) ? false : $attr['autoplay'];
		$autoplay = false;
		$delay    = empty( $attr['delay'] ) ? 3 : intval( $attr['delay'] );
		$align    = isset( $attr['align'] ) ? $attr['align'] : 'center';
		$classes  = array(
			'wp-block-jetpack-' . $type,
			'wp-amp-block',
			'align' . $align,
		);
		$slides   = array_map(
			function( $id ) {
				$caption    = wp_get_attachment_caption( $id );
				$src        = wp_get_attachment_image_src( $id, 'full' );
				$figcaption = $caption ? sprintf(
					'<figcaption class="wp-block-jetpack-slideshow_caption gallery-caption">%s</figcaption>',
					$caption
				) : '';
				$amp_img    = sprintf(
					'<amp-img src="%s" width="%s" height="%s" alt="%s" class="wp-block-jetpack-slideshow_image" />',
					$src[0],
					$src[1],
					$src[2],
					$caption
				);
				return sprintf(
					'<div class="wp-block-jetpack-slideshow_slide"><figure>%s%s</figure></div>',
					$amp_img,
					$figcaption
				);
			},
			$ids
		);
		$carousel = sprintf(
			'<amp-carousel height="300" width="400" layout="responsive" type="slides" controls loop %s>%s</amp-carousel>',
			$autoplay ? 'autoplay delay=' . ( $delay * 1000 ) : '',
			implode( '', $slides )
		);

		return sprintf(
			'<div class="%s"><div class="wp-block-jetpack-slideshow_container swiper-container">%s</div></div>',
			implode( $classes, ' ' ),
			$carousel
		);
	}
	return $content;
}
