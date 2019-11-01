<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Makes certain Jetpack shortcodes AMP-compatible.
 *
 * @see https://github.com/ampproject/amp-wp/blob/ea9e6fb9d262e699ea64978794840ba9868715f6/includes/embeds/class-amp-vimeo-embed.php#L71
 */
class Jetpack_AMP_Shortcodes {

	/**
	 * Apply custom AMP changes onthe frontend.
	 */
	public static function init() {
		// Filter [vimeo] shortcode markup.
		add_filter( 'do_shortcode_tag', array( 'Jetpack_AMP_Shortcodes', 'filter_vimeo_shortcode' ), 10, 3 );
	}

	/**
	 * Filters the Vimeo shortcode to be AMP-compatible.
	 *
	 * @param string $html The video player HTML.
	 * @param string $shortcode_tag The shortcode's tag (name).
	 * @param array  $attr The attributes of the shortcode.
	 * @return string The filtered HTML.
	 */
	public static function filter_vimeo_shortcode( $html, $shortcode_tag, $attr ) {
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
		if ( isset( $attr['id'] ) ) {
			return $attr['id'];
		} elseif ( isset( $attr['url'] ) ) {
			return self::get_vimeo_id_from_url( $attr['url'] );
		} elseif ( isset( $attr[0] ) ) {
			return self::get_vimeo_id_from_url( $attr[0] );
		} elseif ( function_exists( 'shortcode_new_to_old_params' ) ) {
			return shortcode_new_to_old_params( $attr );
		}
	}

	/**
	 * Determines the video ID from the URL.
	 *
	 * @param string $url URL.
	 * @return string The video ID, or an empty string if it's not found.
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
			return self::build_tag(
				'a',
				[
					'href'  => esc_url( $args['url'] ),
					'class' => 'amp-wp-embed-fallback',
				],
				esc_html( $args['url'] )
			);
		}

		return self::build_tag(
			'amp-vimeo',
			array(
				'data-videoid' => $args['video_id'],
				'layout'       => 'responsive',
				'width'        => $args['width'],
				'height'       => $args['height'],
			)
		);
	}

	/**
	 * Generates HTML markup for the given tag, attributes and content.
	 *
	 * @param string $tag_name   Tag name.
	 * @param array  $attributes Associative array of $attribute => $value pairs.
	 * @param string $content    Inner content for the generated node.
	 * @return string HTML markup.
	 */
	public static function build_tag( $tag_name, $attributes = [], $content = '' ) {
		$attr_string = self::build_attributes_string( $attributes );
		return sprintf( '<%1$s %2$s>%3$s</%1$s>', sanitize_key( $tag_name ), $attr_string, $content );
	}

	/**
	 * Generates a string of HTML attributes.
	 *
	 * @param array $attributes An associative array of $attribute => $value pairs.
	 * @return string The HTML attributes.
	 */
	public static function build_attributes_string( $attributes ) {
		$string = [];
		foreach ( $attributes as $name => $value ) {
			if ( '' === $value ) {
				$string[] = sprintf( '%s', sanitize_key( $name ) );
			} else {
				$string[] = sprintf( '%s="%s"', sanitize_key( $name ), esc_attr( $value ) );
			}
		}

		return implode( ' ', $string );
	}
}

add_action( 'init', array( 'Jetpack_AMP_Shortcodes', 'init' ), 1 );
