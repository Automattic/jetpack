<?php

use Automattic\Jetpack\Assets;

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

		if ( Jetpack_AMP_Support::is_amp_request() ) {
			return;
		}

		add_action( 'wp_head', array( $this, 'setup_filters' ), 9999 ); // we don't really want to modify anything in <head> since it's mostly all metadata
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		// Do not lazy load avatar in admin bar
		add_action( 'admin_bar_menu', array( $this, 'remove_filters' ), 0 );

		add_filter( 'wp_kses_allowed_html', array( $this, 'allow_lazy_attributes' ) );
		add_action( 'wp_head', array( $this, 'add_nojs_fallback' ) );
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

	/**
	 * Ensure that our lazy image attributes are not filtered out of image tags.
	 *
	 * @param array $allowed_tags The allowed tags and their attributes.
	 * @return array
	 */
	public function allow_lazy_attributes( $allowed_tags ) {
		if ( ! isset( $allowed_tags['img'] ) ) {
			return $allowed_tags;
		}

		// But, if images are allowed, ensure that our attributes are allowed!
		$img_attributes = array_merge( $allowed_tags['img'], array(
			'data-lazy-src' => 1,
			'data-lazy-srcset' => 1,
			'data-lazy-sizes' => 1,
		) );

		$allowed_tags['img'] = $img_attributes;

		return $allowed_tags;
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

		// This is a pretty simple regex, but it works
		$content = preg_replace_callback( '#<(img)([^>]+?)(>(.*?)</\\1>|[\/]?>)#si', array( __CLASS__, 'process_image' ), $content );

		return $content;
	}

	/**
	 * Returns true when a given string of classes contains a class signifying lazy images
	 * should not process the image.
	 *
	 * @since 5.9.0
	 *
	 * @param string $classes A string of space-separated classes.
	 * @return bool
	 */
	public static function should_skip_image_with_blacklisted_class( $classes ) {
		$blacklisted_classes = array(
			'skip-lazy',
			'gazette-featured-content-thumbnail',
		);

		/**
		 * Allow plugins and themes to tell lazy images to skip an image with a given class.
		 *
		 * @module lazy-images
		 *
		 * @since 5.9.0
		 *
		 * @param array An array of strings where each string is a class.
		 */
		$blacklisted_classes = apply_filters( 'jetpack_lazy_images_blacklisted_classes', $blacklisted_classes );

		if ( ! is_array( $blacklisted_classes ) || empty( $blacklisted_classes ) ) {
			return false;
		}

		foreach ( $blacklisted_classes as $class ) {
			if ( false !== strpos( $classes, $class ) ) {
				return true;
			}
		}

		return false;
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
		$old_attributes_str       = $matches[2];
		$old_attributes_kses_hair = wp_kses_hair( $old_attributes_str, wp_allowed_protocols() );

		if ( empty( $old_attributes_kses_hair['src'] ) ) {
			return $matches[0];
		}

		$old_attributes = self::flatten_kses_hair_data( $old_attributes_kses_hair );

		// If we didn't add lazy attributes, just return the original image source.
		if ( ! empty( $old_attributes['class'] ) && false !== strpos( $old_attributes['class'], 'jetpack-lazy-image' ) ) {
			return $matches[0];
		}

		$new_attributes     = self::process_image_attributes( $old_attributes );
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

		if ( ! empty( $attributes['class'] ) && self::should_skip_image_with_blacklisted_class( $attributes['class'] ) ) {
			return $attributes;
		}

		if ( isset( $attributes['data-skip-lazy'] ) ) {
			return $attributes;
		}

		/**
		 * Allow plugins and themes to conditionally skip processing an image via its attributes.
		 *
		 * @module-lazy-images
		 *
		 * @deprecated 6.5.0 Use jetpack_lazy_images_skip_image_with_attributes instead.
		 *
		 * @since 5.9.0
		 *
		 * @param bool  Default to not skip processing the current image.
		 * @param array An array of attributes via wp_kses_hair() for the current image.
		 */
		if ( apply_filters( 'jetpack_lazy_images_skip_image_with_atttributes', false, $attributes ) ) {
			return $attributes;
		}

		/**
		 * Allow plugins and themes to conditionally skip processing an image via its attributes.
		 *
		 * @module-lazy-images
		 *
		 * @since 6.5.0 Filter name was updated from jetpack_lazy_images_skip_image_with_atttributes to correct typo.
		 * @since 5.9.0
		 *
		 * @param bool  Default to not skip processing the current image.
		 * @param array An array of attributes via wp_kses_hair() for the current image.
		 */
		if ( apply_filters( 'jetpack_lazy_images_skip_image_with_attributes', false, $attributes ) ) {
			return $attributes;
		}

		$old_attributes = $attributes;

		// Stash srcset and sizes in data attributes.
		foreach ( array( 'srcset', 'sizes' ) as $attribute ) {
			if ( isset( $old_attributes[ $attribute ] ) ) {
				$attributes[ "data-lazy-$attribute" ] = $old_attributes[ $attribute ];
				unset( $attributes[ $attribute ] );
			}
		}

		// We set this, adding the query arg so that it doesn't exactly equal the src attribute, so that photon JavaScript
		// will hold off on processing this image.
		$attributes['data-lazy-src'] = esc_url_raw( add_query_arg( 'is-pending-load', true, $attributes['src'] ) );

		$attributes['srcset'] = self::get_placeholder_image();
		$attributes['class']  = sprintf(
			'%s jetpack-lazy-image',
			empty( $old_attributes['class'] )
				? ''
				: $old_attributes['class']
		);

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

	/**
	 * Adds JavaScript to check if the current browser supports JavaScript as well as some styles to hide lazy
	 * images when the browser does not support JavaScript.
	 *
	 * @return void
	 */
	public function add_nojs_fallback() {
		?>
			<style type="text/css">
				/* If html does not have either class, do not show lazy loaded images. */
				html:not( .jetpack-lazy-images-js-enabled ):not( .js ) .jetpack-lazy-image {
					display: none;
				}
			</style>
			<script>
				document.documentElement.classList.add(
					'jetpack-lazy-images-js-enabled'
				);
			</script>
		<?php
	}

	/**
	 * Retrieves the placeholder image after running it through the lazyload_images_placeholder_image filter.
	 *
	 * @return string The placeholder image source.
	 */
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
		 * @since 6.5.0 Default image is now a base64 encoded transparent gif.
		 *
		 * @param string The URL to the placeholder image
		 */
		return apply_filters(
			'lazyload_images_placeholder_image',
			'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'
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
			Assets::get_file_url_for_environment(
				'_inc/build/lazy-images/js/lazy-images.min.js',
				'modules/lazy-images/js/lazy-images.js'
			),
			array( 'jquery' ),
			JETPACK__VERSION,
			true
		);
	}
}
