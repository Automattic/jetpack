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

		// modify content
		add_action( 'wp_head', array( $this, 'setup_filters' ), 9999 ); // we don't really want to modify anything in <head> since it's mostly all metadata

		// js to do lazy loading
		add_action( 'init', array( $this, 'register_assets' ) );
		add_action( 'wp_enqueue_scripts', array( $this, 'enqueue_assets' ) );

		// Do not lazy load avatar in admin bar
		add_action( 'admin_bar_menu', array( $this, 'remove_filters' ), 0 );
	}

	public function setup_filters() {
		add_filter( 'the_content', array( $this, 'add_image_placeholders' ), 99 ); // run this later, so other content filters have run, including image_add_wh on WP.com
		add_filter( 'post_thumbnail_html', array( $this, 'add_image_placeholders' ), 11 );
		add_filter( 'get_avatar', array( $this, 'add_image_placeholders' ), 11 );
	}

	public function remove_filters() {
		remove_filter( 'the_content', array( $this, 'add_image_placeholders' ), 99 );
		remove_filter( 'post_thumbnail_html', array( $this, 'add_image_placeholders' ), 11 );
		remove_filter( 'get_avatar', array( $this, 'add_image_placeholders' ), 11 );
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

 	function process_image( $matches ) {
		$old_attributes_str = $matches[2];
		$old_attributes = wp_kses_hair( $old_attributes_str, wp_allowed_protocols() );

		if ( empty( $old_attributes['src'] ) ) {
			return $matches[0];
		}

		$image_src = $old_attributes['src']['value'];

		if ( isset( $old_attributes['srcset'] ) ) {
			$image_srcset = $old_attributes['srcset']['value'];
		} else {
			$image_srcset = '';
		}

		// Remove src, lazy-src, srcset and lazy-srcset since we manually add them
		$new_attributes = $old_attributes;
		unset( $new_attributes['src'], $new_attributes['srcset'], $new_attributes['data-lazy-src'], $new_attributes['data-lazy-srcset'] );

		$new_attributes_str = $this->build_attributes_string( $new_attributes );

		return sprintf(
			'<img data-lazy-src="%1$s" data-lazy-srcset="%2$s" %3$s><noscript>%4$s</noscript>',
			esc_url( $image_src ),
			esc_attr( $image_srcset ),
			$new_attributes_str,
			$matches[0]
		);
	}

	private function build_attributes_string( $attributes ) {
		$string = array();
		foreach ( $attributes as $name => $attribute ) {
			$value = $attribute['value'];
			if ( '' === $value ) {
				$string[] = sprintf( '%s', $name );
			} else {
				$string[] = sprintf( '%s="%s"', $name, esc_attr( $value ) );
			}
		}
		return implode( ' ', $string );
	}

	public function register_assets() {
		wp_register_script(
			'jetpack-lazy-images',
			plugins_url( 'modules/lazy-images/assets/lazy-images.js', JETPACK__PLUGIN_FILE ),
			array(),
			'1.5',
			true
		);
	}

	public function enqueue_assets() {
		wp_enqueue_script( 'jetpack-lazy-images' );
	}
}
