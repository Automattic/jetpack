<?php

class Jetpack_Lazy_Images {
	private static $__instance = null;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( is_null( self::$__instance ) ) {
			self::$__instance = new Jetpack_Lazy_Images();
		}

		return self::$__instance;
	}

	/**
	 * Registers actions
	 */
	private function __construct() {
		if ( is_admin() ) {
			return;
		}

		/**
		 * Whether the lazy-images module should load.
		 *
		 * This filter is not prefixed with jetpack_ to provide a smoother migration
		 * process from the WordPress Lazy Load plugin.
		 *
		 * @module lazy-images
		 *
		 * @since 5.6.0
		 *
		 * @param bool true Whether lazy image loading should occur.
		 */
		if ( ! apply_filters( 'lazyload_is_enabled', true ) ) {
			return;
		}

		add_action( 'wp_head', array( $this, 'setup_filters' ), 9999 ); // we don't really want to modify anything in <head> since it's mostly all metadata
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		// Do not lazy load avatar in admin bar
		add_action( 'admin_bar_menu', array( $this, 'remove_filters' ), 0 );
	}

	public function setup_filters() {
		add_filter( 'the_content', array( $this, 'add_image_placeholders' ), PHP_INT_MAX ); // run this later, so other content filters have run, including image_add_wh on WP.com
		add_filter( 'post_thumbnail_html', array( $this, 'add_image_placeholders' ), PHP_INT_MAX );
		add_filter( 'get_avatar', array( $this, 'add_image_placeholders' ), PHP_INT_MAX );
		add_filter( 'widget_text', array( $this, 'add_image_placeholders' ), PHP_INT_MAX );
		add_filter( 'get_image_tag', array( $this, 'add_image_placeholders' ), PHP_INT_MAX);
		add_filter( 'wp_get_attachment_image_attributes', array( __CLASS__, 'process_image_attributes' ), PHP_INT_MAX );
	}

	public function remove_filters() {
		remove_filter( 'the_content', array( $this, 'add_image_placeholders' ), PHP_INT_MAX );
		remove_filter( 'post_thumbnail_html', array( $this, 'add_image_placeholders' ), PHP_INT_MAX );
		remove_filter( 'get_avatar', array( $this, 'add_image_placeholders' ), PHP_INT_MAX );
		remove_filter( 'widget_text', array( $this, 'add_image_placeholders' ), PHP_INT_MAX );
		remove_filter( 'get_image_tag', array( $this, 'add_image_placeholders' ), PHP_INT_MAX);		
		remove_filter( 'wp_get_attachment_image_attributes', array( __CLASS__, 'process_image_attributes' ), PHP_INT_MAX );
	}

	public function add_image_placeholders( $content ) {
		// Don't lazyload for feeds, previews
		if ( is_feed() || is_preview() ) {
			return $content;
		}

		// Don't lazy-load if the content has already been run through previously
		if ( false !== strpos( $content, 'data-lazy-src' ) ) {
			return $content;
		}

		// Don't lazyload for amp-wp content
		if ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() ) {
			return $content;
		}

		// This is a pretty simple regex, but it works
		$content = preg_replace_callback( '#<(img)([^>]+?)(>(.*?)</\\1>|[\/]?>)#si', array( __CLASS__, 'process_image' ), $content );

		return $content;
	}

	/**
	 * Processes images in content by acting as the preg_replace_callback
	 *
	 * @since 5.6.0
	 *
	 * @param array $matches
	 *
	 * @return string The image with updated lazy attributes
	 */
	static function process_image( $matches ) {
		$old_attributes_str = $matches[2];
		$old_attributes_kses_hair = wp_kses_hair( $old_attributes_str, wp_allowed_protocols() );

		if ( empty( $old_attributes_kses_hair['src'] ) ) {
			return $matches[0];
		}

		$old_attributes = self::flatten_kses_hair_data( $old_attributes_kses_hair );
		$new_attributes = self::process_image_attributes( $old_attributes );
		$new_attributes_str = self::build_attributes_string( $new_attributes );

		return sprintf( '<img %1$s><noscript>%2$s</noscript>', $new_attributes_str, $matches[0] );
	}

	/**
	 * Given an array of image attributes, updates the `src`, `srcset`, and `sizes` attributes so
	 * that they load lazily.
	 *
	 * @since 5.7.0
	 *
	 * @param array $attributes
	 *
	 * @return array The updated image attributes array with lazy load attributes
	 */
	static function process_image_attributes( $attributes ) {
		if ( empty( $attributes['src'] ) ) {
			return $attributes;
		}

		// check for gazette featured images, which are incompatible
		if ( isset( $attributes['class'] ) && false !== strpos( $attributes['class'], 'gazette-featured-content-thumbnail' ) ) {
			return $attributes;
		}

		$old_attributes = $attributes;

		// Set placeholder and lazy-src
		$attributes['src'] = self::get_placeholder_image();
		$attributes['data-lazy-src'] = $old_attributes['src'];

		// Handle `srcset`
		if ( ! empty( $attributes['srcset'] ) ) {
			$attributes['data-lazy-srcset'] = $old_attributes['srcset'];
			unset( $attributes['srcset'] );
		}

		// Handle `sizes`
		if ( ! empty( $attributes['sizes'] ) ) {
			$attributes['data-lazy-sizes'] = $old_attributes['sizes'];
			unset( $attributes['sizes'] );
		}

		/**
		 * Allow plugins and themes to override the attributes on the image before the content is updated.
		 *
		 * One potential use of this filter is for themes that set `height:auto` on the `img` tag.
		 * With this filter, the theme could get the width and height attributes from the
		 * $attributes array and then add a style tag that sets those values as well, which could
		 * minimize reflow as images load.
		 *
		 * @module lazy-images
		 *
		 * @since 5.6.0
		 *
		 * @param array An array containing the attributes for the image, where the key is the attribute name
		 *              and the value is the attribute value.
		 */
		return apply_filters( 'jetpack_lazy_images_new_attributes', $attributes );
	}

	private static function get_placeholder_image() {
		/**
		 * Allows plugins and themes to modify the placeholder image.
		 *
		 * This filter is not prefixed with jetpack_ to provide a smoother migration
		 * process from the WordPress Lazy Load plugin.
		 *
		 * @module lazy-images
		 *
		 * @since 5.6.0
		 *
		 * @param string The URL to the placeholder image
		 */
		return apply_filters(
			'lazyload_images_placeholder_image',
			plugins_url( 'modules/lazy-images/images/1x1.trans.gif', JETPACK__PLUGIN_FILE )
		);
	}

	private static function flatten_kses_hair_data( $attributes ) {
		$flattened_attributes = array();
		foreach ( $attributes as $name => $attribute ) {
			$flattened_attributes[ $name ] = $attribute['value'];
		}
		return $flattened_attributes;
	}

	private static function build_attributes_string( $attributes ) {
		$string = array();
		foreach ( $attributes as $name => $value ) {
			if ( '' === $value ) {
				$string[] = sprintf( '%s', $name );
			} else {
				$string[] = sprintf( '%s="%s"', $name, esc_attr( $value ) );
			}
		}
		return implode( ' ', $string );
	}

	public function enqueue_assets() {
		wp_enqueue_script(
			'jetpack-lazy-images',
			Jetpack::get_file_url_for_environment(
				'_inc/build/lazy-images/js/lazy-images.min.js',
				'modules/lazy-images/js/lazy-images.js'
			),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);
	}
}
