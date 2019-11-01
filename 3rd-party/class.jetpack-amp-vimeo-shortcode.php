<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Makes the [vimeo] Jetpack shortcode AMP-compatible.
 *
 * @see https://github.com/ampproject/amp-wp/blob/ea9e6fb9d262e699ea64978794840ba9868715f6/includes/embeds/class-amp-vimeo-embed.php#L71
 */
class Jetpack_AMP_Vimeo_Shortcode {

	/**
	 * Add the shortcode filter.
	 */
	public static function init() {
		add_filter( 'do_shortcode_tag', array( 'Jetpack_AMP_Vimeo_Shortcode', 'filter_shortcode' ), 10, 3 );
	}

	/**
	 * Filters the Vimeo shortcode to be AMP-compatible.
	 *
	 * @param string $html The video player HTML.
	 * @param string $shortcode_tag The shortcode's tag (name).
	 * @param array  $attr The attributes of the shortcode.
	 * @return string The filtered HTML.
	 */
	public static function filter_shortcode( $html, $shortcode_tag, $attr ) {
		if ( ! Jetpack_AMP_Support::is_amp_request() || 'vimeo' !== $shortcode_tag ) {
			return $html;
		}

		$video_id = self::get_vimeo_id_from_attr( $attr );
		if ( empty( $video_id ) ) {
			return '';
		}

		$aspect_ratio   = 0.5625;
		$default_width  = 600;
		$default_height = 338;

		if ( ! empty( $GLOBALS['content_width'] ) ) {
			$width  = $GLOBALS['content_width'];
			$height = round( $GLOBALS['content_width'] * $aspect_ratio );
		} else {
			$width  = isset( $attr['width'] ) ? $attr['width'] : $default_width;
			$height = isset( $attr['height'] ) ? $attr['height'] : $default_height;
		}

		return self::render_vimeo( compact( 'video_id', 'width', 'height' ) );
	}

	/**
	 * Gets the Vimeo ID from the shortcode attributes.
	 *
	 * @param array $attr The shortcode attributes to get the ID from.
	 * @return string|null The ID, as a numeric string, or null.
	 */
	public static function get_vimeo_id_from_attr( $attr ) {
		// This would be '1234' in [vimeo 1234].
		$value_at_0_index = isset( $attr[0] ) ? $attr[0] : null;

		$id = null;
		if ( isset( $attr['id'] ) ) {
			$id = $attr['id'];
		} elseif ( isset( $attr['url'] ) ) {
			$id = self::get_vimeo_id_from_url( $attr['url'] );
		} elseif ( is_numeric( $value_at_0_index ) ) {
			$id = $value_at_0_index;
		} elseif ( $value_at_0_index ) {
			$id = self::get_vimeo_id_from_url( $value_at_0_index );
		} elseif ( function_exists( 'shortcode_new_to_old_params' ) ) {
			$id = shortcode_new_to_old_params( $attr );
		}

		return $id;
	}

	/**
	 * Determines the video ID from the URL.
	 *
	 * @param string $url URL.
	 * @return int|string The video ID, or an empty string if it's not found.
	 */
	public static function get_vimeo_id_from_url( $url ) {
		$host = wp_parse_url( $url, PHP_URL_HOST );
		$path = wp_parse_url( $url, PHP_URL_PATH );

		if (
			in_array( $host, [ 'vimeo.com', 'www.vimeo.com' ], true )
			&&
			preg_match( ':^/(\d+):', $path, $matches )
		) {
			// @todo This will not get the private key for unlisted videos (which look like https://vimeo.com/123456789/abcdef0123), but amp-vimeo doesn't support them currently anyway.
			return $matches[1];
		}

		return '';
	}

	/**
	 * Renders the Vimeo shortcode as AMP.
	 *
	 * @param array $args The arguments.
	 * @return string The rendered HTML.
	 */
	public static function render_vimeo( $args ) {
		$args = wp_parse_args(
			$args,
			array( 'video_id' => false )
		);

		if ( empty( $args['video_id'] ) ) {
			return Jetpack_AMP_Support::build_tag(
				'a',
				[
					'href'  => esc_url( $args['url'] ),
					'class' => 'amp-wp-embed-fallback',
				],
				esc_html( $args['url'] )
			);
		}

		return Jetpack_AMP_Support::build_tag(
			'amp-vimeo',
			array(
				'data-videoid' => $args['video_id'],
				'layout'       => 'responsive',
				'width'        => $args['width'],
				'height'       => $args['height'],
			)
		);
	}
}

add_action( 'init', array( 'Jetpack_AMP_Vimeo_Shortcode', 'init' ), 1 );
