<?php

/**
 * Manages compatibility with the amp-wp plugin
 *
 * @see https://github.com/Automattic/amp-wp
 */
class Jetpack_AMP_Support {

	static function init() {

		// enable stats
		if ( Jetpack::is_module_active( 'stats' ) ) {
			add_action( 'amp_post_template_footer', array( 'Jetpack_AMP_Support', 'add_stats_pixel' ) );
		}

		// carousel
		add_filter( 'jp_carousel_maybe_disable', array( __CLASS__, 'is_amp_request' ) );

		// sharing
		add_filter( 'sharing_enqueue_scripts', array( __CLASS__, 'is_not_amp_request' ) );
		add_filter( 'jetpack_sharing_counts', array( __CLASS__, 'is_not_amp_request' ) );
		add_filter( 'sharing_js', array( __CLASS__, 'is_not_amp_request' ) );
		add_filter( 'jetpack_sharing_display_markup', array( 'Jetpack_AMP_Support', 'render_sharing_html' ), 10, 2 );

		// disable lazy images
		add_filter( 'lazyload_is_enabled', array( __CLASS__, 'is_not_amp_request' ) );

		// disable imploding CSS
		add_filter( 'jetpack_implode_frontend_css', array( __CLASS__, 'is_not_amp_request' ) );

		// enforce freedom mode for videopress
		add_filter( 'videopress_shortcode_options', array( 'Jetpack_AMP_Support', 'videopress_enable_freedom_mode' ) );

		// include Jetpack og tags when rendering native AMP head
		add_action( 'amp_post_template_head', array( 'Jetpack_AMP_Support', 'amp_post_jetpack_og_tags' ) );

		// Post rendering changes for legacy AMP
		add_action( 'pre_amp_render_post', array( 'Jetpack_AMP_Support', 'amp_disable_the_content_filters' ) );

		// Add post template metadata for legacy AMP
		add_filter( 'amp_post_template_metadata', array( 'Jetpack_AMP_Support', 'amp_post_template_metadata' ), 10, 2 );
	}

	static function admin_init() {
		// disable Likes metabox for post editor if AMP canonical disabled
		add_filter( 'post_flair_disable',  array( 'Jetpack_AMP_Support', 'is_amp_canonical' ), 99 );
	}

	static function is_amp_canonical() {
		return function_exists( 'amp_is_canonical' ) && amp_is_canonical();
	}

	static function is_amp_request() {
		$is_amp_request = ( function_exists( 'is_amp_endpoint' ) && is_amp_endpoint() );

		/**
		 * Returns true if the current request should return valid AMP content.
		 *
		 * @since 6.2.0
		 *
		 * @param boolean $is_amp_request Is this request supposed to return valid AMP content?
		 */
		return apply_filters( 'jetpack_is_amp_request', $is_amp_request );
	}

	/**
	 * Returns whether the request is not AMP.
	 *
	 * @see Jetpack_AMP_Support::is_amp_request()
	 * @return bool Whether not AMP.
	 */
	static function is_not_amp_request() {
		return ! self::is_amp_request();
	}

	static function amp_disable_the_content_filters() {
		if ( defined( 'WPCOM') && WPCOM ) {
			add_filter( 'videopress_show_2015_player', '__return_true' );
			add_filter( 'protected_embeds_use_form_post', '__return_false' );
			remove_filter( 'the_title', 'widont' );
		}

		remove_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'filter' ), 11 );
		remove_filter( 'pre_kses', array( 'Filter_Embedded_HTML_Objects', 'maybe_create_links' ), 100 );
	}

	/**
	 * Add Jetpack stats pixel.
	 *
	 * @since 6.2.1
	 */
	static function add_stats_pixel() {
		if ( ! has_action( 'wp_footer', 'stats_footer' ) ) {
			return;
		}
		stats_render_amp_footer( stats_build_view_data() );
	}

	/**
	 * Add publisher and image metadata to legacy AMP post.
	 *
	 * @since 6.2.0
	 *
	 * @param array   $metadata Metadata array.
	 * @param WP_Post $post     Post.
	 * @return array Modified metadata array.
	 */
	static function amp_post_template_metadata( $metadata, $post ) {
		if ( isset( $metadata['publisher'] ) && ! isset( $metadata['publisher']['logo'] ) ) {
			$metadata = self::add_site_icon_to_metadata( $metadata );
		}

		if ( ! isset( $metadata['image'] ) ) {
			$metadata = self::add_image_to_metadata( $metadata, $post );
		}

		return $metadata;
	}

	/**
	 * Add blavatar to legacy AMP post metadata.
	 *
	 * @since 6.2.0
	 *
	 * @param array $metadata Metadata.
	 * @return array Metadata.
	 */
	static function add_site_icon_to_metadata( $metadata ) {
		$size = 60;

		if ( function_exists( 'blavatar_domain' ) ) {
			$metadata['publisher']['logo'] = array(
				'@type'  => 'ImageObject',
				'url'    => blavatar_url( blavatar_domain( site_url() ), 'img', $size, self::staticize_subdomain( 'https://wordpress.com/i/favicons/apple-touch-icon-60x60.png' ) ),
				'width'  => $size,
				'height' => $size,
			);
		} else if ( $site_icon_url = Jetpack_Sync_Functions::site_icon_url( $size ) ) {
			$metadata['publisher']['logo'] = array(
				'@type'  => 'ImageObject',
				'url'    => $site_icon_url,
				'width'  => $size,
				'height' => $size,
			);
		}

		return $metadata;
	}

	/**
	 * Add image to legacy AMP post metadata.
	 *
	 * @since 6.2.0
	 *
	 * @param array   $metadata Metadata.
	 * @param WP_Post $post     Post.
	 * @return array Metadata.
	 */
	static function add_image_to_metadata( $metadata, $post ) {
		$image = Jetpack_PostImages::get_image( $post->ID, array(
			'fallback_to_avatars' => true,
			'avatar_size'         => 200,
			// AMP already attempts these.
			'from_thumbnail'      => false,
			'from_attachment'     => false,
		) );

		if ( empty( $image ) ) {
			return self::add_fallback_image_to_metadata( $metadata );
		}

		if ( ! isset( $image['src_width'] ) ) {
			$dimensions = self::extract_image_dimensions_from_getimagesize( array(
				$image['src'] => false,
			) );

			if ( false !== $dimensions[ $image['src'] ] ) {
				$image['src_width']  = $dimensions['width'];
				$image['src_height'] = $dimensions['height'];
			}
		}

		$metadata['image'] = array(
			'@type' => 'ImageObject',
			'url'   => $image['src'],
		);
		if ( isset( $image['src_width'] ) ) {
			$metadata['image']['width'] = $image['src_width'];
		}
		if ( isset( $image['src_width'] ) ) {
			$metadata['image']['height'] = $image['src_height'];
		}

		return $metadata;
	}

	/**
	 * Add fallback image to legacy AMP post metadata.
	 *
	 * @since 6.2.0
	 *
	 * @param array $metadata Metadata.
	 * @return array Metadata.
	 */
	static function add_fallback_image_to_metadata( $metadata ) {
		/** This filter is documented in functions.opengraph.php */
		$default_image = apply_filters( 'jetpack_open_graph_image_default', 'https://wordpress.com/i/blank.jpg' );

		$metadata['image'] = array(
			'@type'  => 'ImageObject',
			'url'    => self::staticize_subdomain( $default_image ),
			'width'  => 200,
			'height' => 200,
		);

		return $metadata;
	}

	static function staticize_subdomain( $domain ) {
		// deal with WPCOM vs Jetpack
		if ( function_exists( 'staticize_subdomain' ) ) {
			return staticize_subdomain( $domain );
		} else {
			return Jetpack::staticize_subdomain( $domain );
		}
	}

	/**
	 * Extract image dimensions via wpcom/imagesize, only on WPCOM
	 *
	 * @since 6.2.0
	 *
	 * @param array $dimensions Dimensions.
	 * @return array Dimensions.
	 */
	static function extract_image_dimensions_from_getimagesize( $dimensions ) {
		if ( ! ( defined('WPCOM') && WPCOM && function_exists( 'require_lib' ) ) ) {
			return $dimensions;
		}
		require_lib( 'wpcom/imagesize' );

		foreach ( $dimensions as $url => $value ) {
			if ( is_array( $value ) ) {
				continue;
			}
			$result = wpcom_getimagesize( $url );
			if ( is_array( $result ) ) {
				$dimensions[ $url ] = array(
					'width'  => $result[0],
					'height' => $result[1],
				);
			}
		}

		return $dimensions;
	}

	static function amp_post_jetpack_og_tags() {
		Jetpack::init()->check_open_graph();
		if ( function_exists( 'jetpack_og_tags' ) ) {
			jetpack_og_tags();
		}
	}

	static function videopress_enable_freedom_mode( $options ) {
		if ( self::is_amp_request() ) {
			$options['freedom'] = true;
		}
		return $options;
	}

	static function render_sharing_html( $markup, $sharing_enabled ) {
		if ( ! self::is_amp_request() ) {
			return $markup;
		}

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

add_action( 'admin_init', array( 'Jetpack_AMP_Support', 'admin_init' ), 1 );

