<?php
/**
 * Open Graph Tags
 *
 * Add Open Graph tags so that Facebook (and any other service that supports them)
 * can crawl the site better and we provide a better sharing experience.
 *
 * @link http://ogp.me/
 * @link http://developers.facebook.com/docs/opengraph/
 */
add_action( 'wp_head', 'jetpack_og_tags' );

function jetpack_og_tags() {
	/**
	 * Allow Jetpack to output Open Graph Meta Tags.
	 *
	 * @module sharedaddy, publicize
	 *
	 * @since 2.0.0
	 * @deprecated 2.0.3 Duplicative filter. Use `jetpack_enable_open_graph`.
	 *
	 * @param bool true Should Jetpack's Open Graph Meta Tags be enabled. Default to true.
	 */
	if ( false === apply_filters( 'jetpack_enable_opengraph', true ) ) {
		_deprecated_function( 'jetpack_enable_opengraph', '2.0.3', 'jetpack_enable_open_graph' );
		return;
	}

	// Disable the widont filter on WP.com to avoid stray &nbsps
	$disable_widont = remove_filter( 'the_title', 'widont' );

	$og_output = "\n<!-- Jetpack Open Graph Tags -->\n";
	$tags = array();

	/**
	 * Filter the minimum width of the images used in Jetpack Open Graph Meta Tags.
	 *
	 * @module sharedaddy, publicize
	 *
	 * @since 2.0.0
	 *
	 * @param int 200 Minimum image width used in Jetpack Open Graph Meta Tags.
	 */
	$image_width        = absint( apply_filters( 'jetpack_open_graph_image_width', 200 ) );
	/**
	 * Filter the minimum height of the images used in Jetpack Open Graph Meta Tags.
	 *
	 * @module sharedaddy, publicize
	 *
	 * @since 2.0.0
	 *
	 * @param int 200 Minimum image height used in Jetpack Open Graph Meta Tags.
	 */
	$image_height       = absint( apply_filters( 'jetpack_open_graph_image_height', 200 ) );
	$description_length = 197;

	if ( is_home() || is_front_page() ) {
		$site_type              = Jetpack_Options::get_option_and_ensure_autoload( 'open_graph_protocol_site_type', '' );
		$tags['og:type']        = ! empty( $site_type ) ? $site_type : 'website';
		$tags['og:title']       = get_bloginfo( 'name' );
		$tags['og:description'] = get_bloginfo( 'description' );

		$front_page_id = get_option( 'page_for_posts' );
		if ( 'page' == get_option( 'show_on_front' ) && $front_page_id && is_home() )
			$tags['og:url'] = get_permalink( $front_page_id );
		else
			$tags['og:url'] = home_url( '/' );

		// Associate a blog's root path with one or more Facebook accounts
		$facebook_admins = Jetpack_Options::get_option_and_ensure_autoload( 'facebook_admins', array() );
		if ( ! empty( $facebook_admins ) )
			$tags['fb:admins'] = $facebook_admins;

	} else if ( is_author() ) {
		$tags['og:type'] = 'profile';

		$author = get_queried_object();

		$tags['og:title']           = $author->display_name;
		if ( ! empty( $author->user_url ) ) {
			$tags['og:url']     = $author->user_url;
		} else {
			$tags['og:url']     = get_author_posts_url( $author->ID );
		}
		$tags['og:description']     = $author->description;
		$tags['profile:first_name'] = get_the_author_meta( 'first_name', $author->ID );
		$tags['profile:last_name']  = get_the_author_meta( 'last_name', $author->ID );

	} else if ( is_singular() ) {
		global $post;
		$data = $post; // so that we don't accidentally explode the global

		$tags['og:type'] = 'article';
		if ( empty( $data->post_title ) ) {
			$tags['og:title'] = ' ';
		} else {
			/** This filter is documented in core/src/wp-includes/post-template.php */
			$tags['og:title'] = wp_kses( apply_filters( 'the_title', $data->post_title, $data->ID ), array() );
		}

		$tags['og:url']         = get_permalink( $data->ID );
		if ( ! post_password_required() ) {
			if ( ! empty( $data->post_excerpt ) ) {
				$tags['og:description'] = preg_replace( '@https?://[\S]+@', '', strip_shortcodes( wp_kses( $data->post_excerpt, array() ) ) );
			} else {
				$exploded_content_on_more_tag = explode( '<!--more-->', $data->post_content );
				$tags['og:description'] = wp_trim_words( preg_replace( '@https?://[\S]+@', '', strip_shortcodes( wp_kses( $exploded_content_on_more_tag[0], array() ) ) ) );
			}
		}
		if ( empty( $tags['og:description'] ) ) {
				/**
				 * Filter the fallback `og:description` used when no excerpt information is provided.
				 *
				 * @module sharedaddy, publicize
				 *
				 * @since 3.9.0
				 *
				 * @param string $var  Fallback og:description. Default is translated `Visit the post for more'.
				 * @param object $data Post object for the current post.
				 */
			$tags['og:description'] = apply_filters( 'jetpack_open_graph_fallback_description', __( 'Visit the post for more.', 'jetpack' ), $data );
		} else {
			// Intentionally not using a filter to prevent pollution. @see https://github.com/Automattic/jetpack/pull/2899#issuecomment-151957382
			$tags['og:description'] = wp_kses( trim( convert_chars( wptexturize( $tags['og:description'] ) ) ), array() );
		}

		$tags['article:published_time'] = date( 'c', strtotime( $data->post_date_gmt ) );
		$tags['article:modified_time'] = date( 'c', strtotime( $data->post_modified_gmt ) );
		if ( post_type_supports( get_post_type( $data ), 'author' ) && isset( $data->post_author ) ) {
			$publicize_facebook_user = get_post_meta( $data->ID, '_publicize_facebook_user', true );
			if ( ! empty( $publicize_facebook_user ) ) {
				$tags['article:author'] = esc_url( $publicize_facebook_user );
			}
		}
	}

	/**
	 * Allow plugins to inject additional template-specific Open Graph tags.
	 *
	 * @module sharedaddy, publicize
	 *
	 * @since 3.0.0
	 *
	 * @param array $tags Array of Open Graph Meta tags.
	 * @param array $args Array of image size parameters.
	 */
	$tags = apply_filters( 'jetpack_open_graph_base_tags', $tags, compact( 'image_width', 'image_height' ) );

	// Re-enable widont if we had disabled it
	if ( $disable_widont )
		add_filter( 'the_title', 'widont' );

	/**
	 * Do not return any Open Graph Meta tags if we don't have any info about a post.
	 *
	 * @module sharedaddy, publicize
	 *
	 * @since 3.0.0
	 *
	 * @param bool true Do not return any Open Graph Meta tags if we don't have any info about a post.
	 */
	if ( empty( $tags ) && apply_filters( 'jetpack_open_graph_return_if_empty', true ) )
		return;

	$tags['og:site_name'] = get_bloginfo( 'name' );

	// Get image info and build tags
	if ( ! post_password_required() ) {
		$image_info       = jetpack_og_get_image( $image_width, $image_height );
		$tags['og:image'] = $image_info['src'];

		if ( ! empty( $image_info['width'] ) ) {
			$tags['og:image:width'] = $image_info['width'];
		}
		if ( ! empty( $image_info['height'] ) ) {
			$tags['og:image:height'] = $image_info['height'];
		}
	}

	// Facebook whines if you give it an empty title
	if ( empty( $tags['og:title'] ) )
		$tags['og:title'] = __( '(no title)', 'jetpack' );

	// Shorten the description if it's too long
	if ( isset( $tags['og:description'] ) ) {
		$tags['og:description'] = strlen( $tags['og:description'] ) > $description_length ? mb_substr( $tags['og:description'], 0, $description_length ) . '…' : $tags['og:description'];
	}

	// Try to add OG locale tag if the WP->FB data mapping exists
	if ( defined( 'JETPACK__GLOTPRESS_LOCALES_PATH' ) && file_exists( JETPACK__GLOTPRESS_LOCALES_PATH ) ) {
		require_once JETPACK__GLOTPRESS_LOCALES_PATH;
		$_locale = get_locale();

		// We have to account for w.org vs WP.com locale divergence
		if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
			$gp_locale = GP_Locales::by_field( 'slug', $_locale );
		} else {
			$gp_locale = GP_Locales::by_field( 'wp_locale', $_locale );
		}
	}

	if ( isset( $gp_locale->facebook_locale ) && ! empty( $gp_locale->facebook_locale ) ) {
		$tags['og:locale'] = $gp_locale->facebook_locale;
	}

	/**
	 * Allow the addition of additional Open Graph Meta tags, or modify the existing tags.
	 *
	 * @module sharedaddy, publicize
	 *
	 * @since 2.0.0
	 *
	 * @param array $tags Array of Open Graph Meta tags.
	 * @param array $args Array of image size parameters.
	 */
	$tags = apply_filters( 'jetpack_open_graph_tags', $tags, compact( 'image_width', 'image_height' ) );

	// secure_urls need to go right after each og:image to work properly so we will abstract them here
	$secure = $tags['og:image:secure_url'] = ( empty( $tags['og:image:secure_url'] ) ) ? '' : $tags['og:image:secure_url'];
	unset( $tags['og:image:secure_url'] );
	$secure_image_num = 0;

	foreach ( (array) $tags as $tag_property => $tag_content ) {
		// to accommodate multiple images
		$tag_content = (array) $tag_content;
		$tag_content = array_unique( $tag_content );

		foreach ( $tag_content as $tag_content_single ) {
			if ( empty( $tag_content_single ) )
				continue; // Don't ever output empty tags
			$og_tag = sprintf( '<meta property="%s" content="%s" />', esc_attr( $tag_property ), esc_attr( $tag_content_single ) );
			/**
			 * Filter the HTML Output of each Open Graph Meta tag.
			 *
			 * @module sharedaddy, publicize
			 *
			 * @since 2.0.0
			 *
			 * @param string $og_tag HTML HTML Output of each Open Graph Meta tag.
			 */
			$og_output .= apply_filters( 'jetpack_open_graph_output', $og_tag );
			$og_output .= "\n";

			if ( 'og:image' == $tag_property ) {
				if ( is_array( $secure ) && !empty( $secure[$secure_image_num] ) ) {
					$og_tag = sprintf( '<meta property="og:image:secure_url" content="%s" />', esc_url( $secure[ $secure_image_num ] ) );
					/** This filter is documented in functions.opengraph.php */
					$og_output .= apply_filters( 'jetpack_open_graph_output', $og_tag );
					$og_output .= "\n";
				} else if ( !is_array( $secure ) && !empty( $secure ) ) {
					$og_tag = sprintf( '<meta property="og:image:secure_url" content="%s" />', esc_url( $secure ) );
					/** This filter is documented in functions.opengraph.php */
					$og_output .= apply_filters( 'jetpack_open_graph_output', $og_tag );
					$og_output .= "\n";
				}
				$secure_image_num++;
			}
		}
	}
	echo $og_output;
}

function jetpack_og_get_image( $width = 200, $height = 200, $max_images = 4 ) { // Facebook requires thumbnails to be a minimum of 200x200
	$image = array();

	if ( is_singular() && ! is_home() ) {
		// Grab obvious image if post is an attachment page for an image
		if ( is_attachment( get_the_ID() ) && 'image' == substr( get_post_mime_type(), 0, 5 ) ) {
			$image['src'] = wp_get_attachment_url( get_the_ID() );
		}

		// Attempt to find something good for this post using our generalized PostImages code
		if ( empty( $image ) && class_exists( 'Jetpack_PostImages' ) ) {
			$post_images = Jetpack_PostImages::get_images( get_the_ID(), array( 'width' => $width, 'height' => $height ) );
			if ( $post_images && ! is_wp_error( $post_images ) ) {
				foreach ( (array) $post_images as $post_image ) {
					$image['src'] = $post_image['src'];
					if ( isset( $post_image['src_width'], $post_image['src_height'] ) ) {
						$image['width']  = $post_image['src_width'];
						$image['height'] = $post_image['src_height'];
					}
				}
			}
		}
	} else if ( is_author() ) {
		$author = get_queried_object();
		if ( function_exists( 'get_avatar_url' ) ) {
			// Prefer the core function get_avatar_url() if available, WP 4.2+
			$image['src'] = get_avatar_url( $author->user_email, array( 'size' => $width ) );
		}
		else {
			$has_filter = has_filter( 'pre_option_show_avatars', '__return_true' );
			if ( ! $has_filter ) {
				add_filter( 'pre_option_show_avatars', '__return_true' );
			}
			$avatar = get_avatar( $author->user_email, $width );
			if ( ! $has_filter ) {
				remove_filter( 'pre_option_show_avatars', '__return_true' );
			}

			if ( ! empty( $avatar ) && ! is_wp_error( $avatar ) ) {
				if ( preg_match( '/src=["\']([^"\']+)["\']/', $avatar, $matches ) );
					$image['src'] = wp_specialchars_decode( $matches[1], ENT_QUOTES );
			}
		}
	}

	// First fall back, blavatar
	if ( empty( $image ) && function_exists( 'blavatar_domain' ) ) {
		$blavatar_domain = blavatar_domain( site_url() );
		if ( blavatar_exists( $blavatar_domain ) ) {
			$image_url = blavatar_url( $blavatar_domain, 'img', $width, false, true );

			$img_width  = '';
			$img_height = '';
			$image_id = attachment_url_to_postid( $image_url );
			$image_size = wp_get_attachment_image_src( $image_id, $width >= 512
				? 'full'
				: array( $width, $width ) );
			if ( isset( $image_size[1], $image_size[2] ) ) {
				$img_width  = $image_size[1];
				$img_height = $image_size[2];
			}

			if (_jetpack_og_get_image_validate_size($img_width, $img_height, $width, $height)) {
				$image['src']    = $image_url;
				$image['width']  = $width;
				$image['height'] = $height;
			}
		}
	}

	// Second fall back, Site Logo
	if ( empty( $image ) && ( function_exists( 'jetpack_has_site_logo' ) && jetpack_has_site_logo() ) ) {
		$image_dimensions    = jetpack_get_site_logo_dimensions();
		if ( ! empty( $image_dimensions ) ) {
			$img_width = $image_dimensions['width'];
			$img_height = $image_dimensions['height'];
			if (_jetpack_og_get_image_validate_size($img_width, $img_height, $width, $height)) {
				$image['src']    = jetpack_get_site_logo( 'url' );
				$image['width']  = $width;
				$image['height'] = $height;
			}
		}
	}

	// Third fall back, Core Site Icon, if valid in size. Added in WP 4.3.
	if ( empty( $image ) && ( function_exists( 'has_site_icon') && has_site_icon() ) ) {
		$max_side = max( $width, $height );
		$image_url = get_site_icon_url( $max_side );

		$img_width  = '';
		$img_height = '';
		$image_id = attachment_url_to_postid( $image_url );
		$image_size = wp_get_attachment_image_src( $image_id, $max_side >= 512
			? 'full'
			: array( $max_side, $max_side ) );
		if ( isset( $image_size[1], $image_size[2] ) ) {
			$img_width  = $image_size[1];
			$img_height = $image_size[2];
		}

		if (_jetpack_og_get_image_validate_size($img_width, $img_height, $width, $height)) {
			$image['src']     = $image_url;
			$image['width']   = $width;
			$image['height']  = $height;
		}
	}

	// Finally fall back, blank image
	if ( empty( $image ) ) {
		/**
		 * Filter the default Open Graph Image tag, used when no Image can be found in a post.
		 *
		 * @since 3.0.0
		 *
		 * @param string $str Default Image URL.
		 */
		$image['src'] = apply_filters( 'jetpack_open_graph_image_default', 'https://s0.wp.com/i/blank.jpg' );
	}

	return $image;
}


/**
* Validate the width and height against required width and height
*
* @param $width      int  Width of the image
* @param $height     int  Height of the image
* @param $req_width  int  Required width to pass validation
* @param $req_height int  Required height to pass validation 
* @return bool - True if the image passed the required size validation
*/
function _jetpack_og_get_image_validate_size($width, $height, $req_width, $req_height) {
	if (!$width || !$height) {
		return false;
	}

	$valid_width = ( $width >= $req_width );
	$valid_height = ( $height >= $req_height );
	$is_image_acceptable = $valid_width && $valid_height;
	return $is_image_acceptable;
}

/**
* @param $email
* @param $width
* @return array|bool|mixed|string
*/
function jetpack_og_get_image_gravatar( $email, $width ) {
	$image = '';
	if ( function_exists( 'get_avatar_url' ) ) {
		$avatar = get_avatar_url( $email, $width );
		if ( ! empty( $avatar ) ) {
			if ( is_array( $avatar ) )
				$image = $avatar[0];
			else
				$image = $avatar;
		}
	} else {
		$has_filter = has_filter( 'pre_option_show_avatars', '__return_true' );
		if ( !$has_filter ) {
			add_filter( 'pre_option_show_avatars', '__return_true' );
		}
		$avatar = get_avatar( $email, $width );

		if ( !$has_filter ) {
			remove_filter( 'pre_option_show_avatars', '__return_true' );
		}

		if ( !empty( $avatar ) && !is_wp_error( $avatar ) ) {
			if ( preg_match( '/src=["\']([^"\']+)["\']/', $avatar, $matches ) )
				$image = wp_specialchars_decode($matches[1], ENT_QUOTES);
		}
	}

	return $image;
}
