<?php

/**
 * Manages compatibility with the amp-wp plugin
 *
 * @see https://github.com/Automattic/amp-wp
 */
class Jetpack_AMP_Support {
	// static $modules_to_disable = array( 'likes', 'comment-likes', 'related-posts', 'carousel', 'photon', 'lazy-images', 'notes' );

	static function init() {
		if ( ! self::is_amp_request() ) {
			return;
		}

		// carousel
		add_filter( 'jp_carousel_maybe_disable', '__return_true' );

		// sharing
		add_filter( 'sharing_enqueue_scripts', '__return_false' );
		add_filter( 'jetpack_sharing_counts', '__return_false' );
		add_filter( 'sharing_js', '__return_false' );
		add_filter( 'jetpack_sharing_display_markup', array( 'Jetpack_AMP_Support', 'render_sharing_html' ), 10, 2 );

		// disable imploding CSS
		add_filter( 'jetpack_implode_frontend_css', array( 'Jetpack_AMP_Support', 'should_implode_css' ) );

		// DONE
		// disable likes
		// disable comment likes
		// disable related posts
		// disable carousel
		// disable photon
		// disable notifications
		// disable devicepx
		// modify social sharing
		// disable milestone widget
		// force using separate stylesheets to avoid unnecessary tree shaking

		// TODO
		// import functions from jetpack-helper.php in amp-wp


	}

	static function init_filter_jetpack_modules() {
		if ( ! self::is_amp_request() ) {
			return;
		}

		// widgets
		add_filter( 'jetpack_widgets_to_include', array( 'Jetpack_AMP_Support', 'filter_available_widgets' ) );
	}

	static function is_amp_request() {
		// can't use is_amp_endpoint() since it's not ready early enough in init.
		// is_amp_endpoint() implementation calls is_feed, which bails with a notice if plugins_loaded isn't finished
		// "Conditional query tags do not work before the query is run"
		return ! is_admin() // this is necessary so that modules can still be enabled/disabled/configured as per normal via Jetpack admin
			&&
				function_exists( 'amp_is_canonical' ) // this is really just testing if the plugin exists
			&&
				( amp_is_canonical() || isset( $_GET[ amp_get_slug() ] ) );
	}

	static function filter_available_widgets( $widgets ) {
		if ( self::is_amp_request() ) {
			$widgets = array_filter( $widgets, array( 'Jetpack_AMP_Support', 'is_supported_widget' ) );
		}

		return $widgets;
	}

	static function is_supported_widget( $widget_path ) {
		return substr($widget_path, -14) !== '/milestone.php';
	}

	static function should_implode_css( $implode ) {
		if ( self::is_amp_request() ) {
			return false;
		}

		return $implode;
	}

	static function render_sharing_html( $markup, $sharing_enabled ) {
		remove_action( 'wp_footer', 'sharing_add_footer' );
		if ( empty( $sharing_enabled ) ) {
			return $markup;
		}
		$supported_services = array(
			'facebook'      => array(
				/** This filter is documented in modules/sharedaddy/sharing-sources.php */
				'data-param-app_id' => apply_filters( 'jetpack_sharing_facebook_app_id', '249643311490' ),
			),
			'twitter'       => array(),
			'pinterest'     => array(),
			'whatsapp'      => array(),
			'google-plus-1' => array(
				'type' => 'gplus',
			),
			'tumblr'        => array(),
			'linkedin'      => array(),
		);
		$sharing_links = array();
		foreach ( $sharing_enabled['visible'] as $id => $service ) {
			if ( ! isset( $supported_services[ $id ] ) ) {
				$sharing_links[] = "<!-- not supported: $id -->";
				continue;
			}
			$args = array_merge(
				array(
					'type' => $id,
				),
				$supported_services[ $id ]
			);
			$sharing_link = '<amp-social-share';
			foreach ( $args as $key => $value ) {
				$sharing_link .= sprintf( ' %s="%s"', sanitize_key( $key ), esc_attr( $value ) );
			}
			$sharing_link .= '></amp-social-share>';
			$sharing_links[] = $sharing_link;
		}
		return preg_replace( '#(?<=<div class="sd-content">).+?(?=</div>)#s', implode( '', $sharing_links ), $markup );
	}
}

add_action( 'init', array( 'Jetpack_AMP_Support', 'init' ), 1 );

// this is necessary since for better or worse Jetpack modules are loaded during plugins_loaded, which means we must
// take the opportunity to intercept initialisation before that point, either by adding explicit detection into the module,
// or preventing it from loading in the first place (better for performance)
add_action( 'plugins_loaded', array( 'Jetpack_AMP_Support', 'init_filter_jetpack_modules' ), 1 );