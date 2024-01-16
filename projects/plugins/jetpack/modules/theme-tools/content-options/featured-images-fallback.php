<?php
/**
 * Theme Tools: functions for Featured Images fallback.
 *
 * @package automattic/jetpack
 */

/**
 * Get one image from a specified post in the following order:
 * Featured Image then first image from the_content HTML
 * and filter the post_thumbnail_html
 *
 * @param string       $html              The HTML for the image markup.
 * @param int          $post_id           The post ID to check.
 * @param int          $post_thumbnail_id The ID of the featured image.
 * @param string       $size              The image size to return, defaults to 'post-thumbnail'.
 * @param string|array $attr              Optional. Query string or array of attributes.
 *
 * @return string      $html              Thumbnail image with markup.
 */
function jetpack_featured_images_fallback_get_image( $html, $post_id, $post_thumbnail_id, $size, $attr ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	$opts = jetpack_featured_images_get_settings();

	if ( ! empty( $html ) || (bool) 1 !== (bool) $opts['fallback-option'] ) {
		return trim( $html );
	}

	if ( jetpack_featured_images_should_load() ) {
		if (
			( true === $opts['archive'] && ( is_home() || is_archive() || is_search() ) && ! $opts['archive-option'] )
			|| ( true === $opts['post'] && is_single() && ! $opts['post-option'] )
			|| ! $opts['fallback-option']
		) {
			return trim( $html );
		}
	}

	if ( class_exists( 'Jetpack_PostImages' ) ) {
		global $_wp_additional_image_sizes;

		$args = array(
			'from_thumbnail'  => false,
			'from_slideshow'  => true,
			'from_gallery'    => true,
			'from_attachment' => false,
		);

		$image = Jetpack_PostImages::get_image( $post_id, $args );

		if ( ! empty( $image ) ) {
			$image['width']  = '';
			$image['height'] = '';
			$image['crop']   = '';

			if ( array_key_exists( $size, $_wp_additional_image_sizes ) ) {
				$image['width']  = $_wp_additional_image_sizes[ $size ]['width'];
				$image['height'] = $_wp_additional_image_sizes[ $size ]['height'];
				$image['crop']   = $_wp_additional_image_sizes[ $size ]['crop'];
			}

			// Force `crop` to be a simple boolean, to avoid dealing with WP crop positions.
			$image['crop'] = boolval( $image['crop'] );

			$image_sizes = '';

			$width  = isset( $image['width'] ) ? intval( $image['width'] ) : null;
			$height = isset( $image['height'] ) ? intval( $image['height'] ) : null;

			if ( ! empty( $image['src_width'] ) && ! empty( $image['src_height'] ) && ! empty( $image['width'] ) && ! empty( $image['height'] ) ) {
				$src_width  = intval( $image['src_width'] );
				$src_height = intval( $image['src_height'] );

				// If we're aware of the source dimensions, calculate the final image height and width.
				// This allows us to provide them as attributes in the `<img>` tag, to avoid layout shifts.
				// It also allows us to calculate a `srcset`.
				if ( $image['crop'] ) {
					// If we're cropping, the final dimensions are calculated independently of each other.
					$width  = min( $width, $src_width );
					$height = min( $height, $src_height );
				} else {
					// If we're not cropping, we need to preserve aspect ratio.
					$dims   = wp_constrain_dimensions( $src_width, $src_height, $width, $height );
					$width  = $dims[0];
					$height = $dims[1];
				}

				$image_src    = Jetpack_PostImages::fit_image_url( $image['src'], $width, $height );
				$image_srcset = Jetpack_PostImages::generate_cropped_srcset( $image, $width, $height, true );
				$image_sizes  = 'min(' . $width . 'px, 100vw)';
			} else {
				// If we're not aware of the source dimensions, leave the size calculations to the CDN, and
				// fall back to a simpler `<img>` tag without `width`/`height` or `srcset`.
				$image_src = Jetpack_PostImages::fit_image_url( $image['src'], $image['width'], $image['height'] );

				// Use the theme's crop setting rather than forcing to true.
				$image_src = add_query_arg( 'crop', $image['crop'], $image_src );

				$image_srcset = null;
				$image_sizes  = null;
			}

			$default_attr = array(
				'srcset'   => $image_srcset,
				'sizes'    => $image_sizes,
				'loading'  => is_singular() ? 'eager' : 'lazy',
				'decoding' => 'async',
				'title'    => wp_strip_all_tags( get_the_title() ),
				'alt'      => '',
				'class'    => "attachment-$size wp-post-image",
			);

			$image_attr = wp_parse_args( $attr, $default_attr );
			$hwstring   = image_hwstring( $width, $height );

			$html  = rtrim( "<img $hwstring" );
			$html .= ' src="' . esc_url( $image_src ) . '"';

			foreach ( $image_attr as $name => $value ) {
				if ( $value ) {
					$html .= " $name=" . '"' . esc_attr( $value ) . '"';
				}
			}

			$html .= ' />';

			return trim( $html );
		}
	}

	return trim( $html );
}
add_filter( 'post_thumbnail_html', 'jetpack_featured_images_fallback_get_image', 10, 5 );

/**
 * Get URL of one image from a specified post in the following order:
 * Featured Image then first image from the_content HTML
 *
 * @param int    $post_id           The post ID to check.
 * @param int    $post_thumbnail_id The ID of the featured image.
 * @param string $size              The image size to return, defaults to 'post-thumbnail'.
 *
 * @return string|null $image_src         The URL of the thumbnail image.
 */
function jetpack_featured_images_fallback_get_image_src( $post_id, $post_thumbnail_id, $size ) {
	$image_src = wp_get_attachment_image_src( $post_thumbnail_id, $size );
	$image_src = ( ! empty( $image_src[0] ) ) ? $image_src[0] : null;
	$opts      = jetpack_featured_images_get_settings();

	if ( ! empty( $image_src ) || (bool) 1 !== (bool) $opts['fallback-option'] ) {
		return esc_url( $image_src );
	}

	if ( jetpack_featured_images_should_load() ) {
		if ( ( true === $opts['archive'] && ( is_home() || is_archive() || is_search() ) && ! $opts['archive-option'] )
			|| ( true === $opts['post'] && is_single() && ! $opts['post-option'] ) ) {
				return esc_url( $image_src );
		}
	}

	if ( class_exists( 'Jetpack_PostImages' ) ) {
		global $_wp_additional_image_sizes;

		$args = array(
			'from_thumbnail'  => false,
			'from_slideshow'  => true,
			'from_gallery'    => true,
			'from_attachment' => false,
		);

		$image = Jetpack_PostImages::get_image( $post_id, $args );

		if ( ! empty( $image ) ) {
			$image['width']  = '';
			$image['height'] = '';
			$image['crop']   = '';

			if ( array_key_exists( $size, $_wp_additional_image_sizes ) ) {
				$image['width']  = $_wp_additional_image_sizes[ $size ]['width'];
				$image['height'] = $_wp_additional_image_sizes[ $size ]['height'];
				$image['crop']   = $_wp_additional_image_sizes[ $size ]['crop'];
			}

			$image_src = Jetpack_PostImages::fit_image_url( $image['src'], $image['width'], $image['height'] );

			// Use the theme's crop setting rather than forcing to true.
			$image_src = add_query_arg( 'crop', $image['crop'], $image_src );

			return esc_url( $image_src );
		}
	}

	return esc_url( $image_src );
}

/**
 * Check if post has an image attached, including a fallback.
 *
 * @param  int $post The post ID to check.
 *
 * @return bool
 */
function jetpack_has_featured_image( $post = null ) {
	return (bool) get_the_post_thumbnail( $post );
}

/**
 * Adds custom class to the array of post classes.
 *
 * @param array $classes Classes for the post element.
 * @param array $class   Optional. Comma separated list of additional classes.
 * @param array $post_id Unique The post ID to check.
 *
 * @return array $classes
 */
function jetpack_featured_images_post_class( $classes, $class, $post_id ) {
	$post_password_required = post_password_required( $post_id );
	$opts                   = jetpack_featured_images_get_settings();

	if ( jetpack_has_featured_image( $post_id ) && (bool) 1 === (bool) $opts['fallback-option'] && ! is_attachment() && ! $post_password_required && 'post' === get_post_type() ) {
		$classes[] = 'has-post-thumbnail';
	}

	return $classes;
}
add_filter( 'post_class', 'jetpack_featured_images_post_class', 10, 3 );
