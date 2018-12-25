<?php

/**
 * Useful for finding an image to display alongside/in representation of a specific post.
 *
 * Includes a few different methods, all of which return a similar-format array containing
 * details of any images found. Everything can (should) be called statically, it's just a
 * function-bucket. You can also call Jetpack_PostImages::get_image() to cycle through all of the methods until
 * one of them finds something useful.
 *
 * This file is included verbatim in Jetpack
 */
class Jetpack_PostImages {
	/**
	 * If a slideshow is embedded within a post, then parse out the images involved and return them
	 */
	static function from_slideshow( $post_id, $width = 200, $height = 200 ) {
		$images = array();

		$post = get_post( $post_id );

		if ( ! $post ) {
			return $images;
		}

		if ( ! empty( $post->post_password ) ) {
			return $images;
		}

		if ( false === has_shortcode( $post->post_content, 'slideshow' ) ) {
			return $images; // no slideshow - bail
		}

		$permalink = get_permalink( $post->ID );

		// Mechanic: Somebody set us up the bomb
		$old_post = $GLOBALS['post'];
		$GLOBALS['post'] = $post;
		$old_shortcodes = $GLOBALS['shortcode_tags'];
		$GLOBALS['shortcode_tags'] = array( 'slideshow' => $old_shortcodes['slideshow'] );

		// Find all the slideshows
		preg_match_all( '/' . get_shortcode_regex() . '/sx', $post->post_content, $slideshow_matches, PREG_SET_ORDER );

		ob_start(); // The slideshow shortcode handler calls wp_print_scripts and wp_print_styles... not too happy about that

		foreach ( $slideshow_matches as $slideshow_match ) {
			$slideshow = do_shortcode_tag( $slideshow_match );
			if ( false === $pos = stripos( $slideshow, 'jetpack-slideshow' ) ) // must be something wrong - or we changed the output format in which case none of the following will work
				continue;
			$start = strpos( $slideshow, '[', $pos );
			$end = strpos( $slideshow, ']', $start );
			$post_images = json_decode( wp_specialchars_decode( str_replace( "'", '"', substr( $slideshow, $start, $end - $start + 1 ) ), ENT_QUOTES ) ); // parse via JSON
			// If the JSON didn't decode don't try and act on it.
			if ( is_array( $post_images ) ) {
				foreach ( $post_images as $post_image ) {
					if ( !$post_image_id = absint( $post_image->id ) )
						continue;

					$meta = wp_get_attachment_metadata( $post_image_id );

					// Must be larger than 200x200 (or user-specified)
					if ( !isset( $meta['width'] ) || $meta['width'] < $width )
						continue;
					if ( !isset( $meta['height'] ) || $meta['height'] < $height )
						continue;

					$url = wp_get_attachment_url( $post_image_id );

					$images[] = array(
						'type'       => 'image',
						'from'       => 'slideshow',
						'src'        => $url,
						'src_width'  => $meta['width'],
						'src_height' => $meta['height'],
						'href'       => $permalink,
					);
				}
			}
		}
		ob_end_clean();

		// Operator: Main screen turn on
		$GLOBALS['shortcode_tags'] = $old_shortcodes;
		$GLOBALS['post'] = $old_post;

		return $images;
	}

	/**
	 * If a gallery is detected, then get all the images from it.
	 */
	static function from_gallery( $post_id ) {
		$images = array();

		$post = get_post( $post_id );

		if ( ! $post ) {
			return $images;
		}

		if ( ! empty( $post->post_password ) ) {
			return $images;
		}

		$permalink = get_permalink( $post->ID );

		/**
		 *  Juggle global post object because the gallery shortcode uses the
		 *  global object.
		 *
		 *  See core ticket:
		 *  https://core.trac.wordpress.org/ticket/39304
		 */
		if ( isset( $GLOBALS['post'] ) ) {
			$juggle_post = $GLOBALS['post'];
			$GLOBALS['post'] = $post;
			$galleries = get_post_galleries( $post->ID, false );
			$GLOBALS['post'] = $juggle_post;
		} else {
			$GLOBALS['post'] = $post;
			$galleries = get_post_galleries( $post->ID, false );
			unset( $GLOBALS['post'] );
		}

		foreach ( $galleries as $gallery ) {
			if ( isset( $gallery['type'] ) && 'slideshow' === $gallery['type'] && ! empty( $gallery['ids'] ) ) {
				$image_ids = explode( ',', $gallery['ids'] );
				$image_size = isset( $gallery['size'] ) ? $gallery['size'] : 'thumbnail';
				foreach ( $image_ids as $image_id ) {
					$image = wp_get_attachment_image_src( $image_id, $image_size );
					if ( ! empty( $image[0] ) ) {
						list( $raw_src ) = explode( '?', $image[0] ); // pull off any Query string (?w=250)
						$raw_src = wp_specialchars_decode( $raw_src ); // rawify it
						$raw_src = esc_url_raw( $raw_src ); // clean it
						$images[] = array(
							'type'  => 'image',
							'from'  => 'gallery',
							'src'   => $raw_src,
							'href'  => $permalink,
						);
					}
				}
			} elseif ( ! empty( $gallery['src'] ) ) {
				foreach ( $gallery['src'] as $src ) {
					list( $raw_src ) = explode( '?', $src ); // pull off any Query string (?w=250)
					$raw_src = wp_specialchars_decode( $raw_src ); // rawify it
					$raw_src = esc_url_raw( $raw_src ); // clean it
					$images[] = array(
						'type'  => 'image',
						'from'  => 'gallery',
						'src'   => $raw_src,
						'href'  => $permalink,
					);
				}
			}
		}

		return $images;
	}

	/**
	 * Get attachment images for a specified post and return them. Also make sure
	 * their dimensions are at or above a required minimum.
	 */
	static function from_attachment( $post_id, $width = 200, $height = 200 ) {
		$images = array();

		$post = get_post( $post_id );

		if ( ! empty( $post->post_password ) ) {
			return $images;
		}

		$post_images = get_posts( array(
			'post_parent' => $post_id,   // Must be children of post
			'numberposts' => 5,          // No more than 5
			'post_type' => 'attachment', // Must be attachments
			'post_mime_type' => 'image', // Must be images
			'suppress_filters' => false,
		) );

		if ( ! $post_images ) {
			return $images;
		}

		$permalink = get_permalink( $post_id );

		foreach ( $post_images as $post_image ) {
			$current_image = self::get_attachment_data( $post_image->ID, $permalink, $width, $height );
			if ( false !== $current_image ) {
				$images[] = $current_image;
			}
		}

		/*
		* We only want to pass back attached images that were actually inserted.
		* We can load up all the images found in the HTML source and then
		* compare URLs to see if an image is attached AND inserted.
		*/
		$html_images = self::from_html( $post_id );
		$inserted_images = array();

		foreach( $html_images as $html_image ) {
			$src = parse_url( $html_image['src'] );
			// strip off any query strings from src
			if( ! empty( $src['scheme'] ) && ! empty( $src['host'] ) ) {
				$inserted_images[] = $src['scheme'] . '://' . $src['host'] . $src['path'];
			} elseif( ! empty( $src['host'] ) ) {
				$inserted_images[] = set_url_scheme( 'http://' . $src['host'] . $src['path'] );
			} else {
				$inserted_images[] = site_url( '/' ) . $src['path'];
			}
		}
		foreach( $images as $i => $image ) {
			if ( !in_array( $image['src'], $inserted_images ) )
				unset( $images[$i] );
		}

		return $images;
	}

	/**
	 * Check if a Featured Image is set for this post, and return it in a similar
	 * format to the other images?_from_*() methods.
	 * @param  int $post_id The post ID to check
	 * @return Array containing details of the Featured Image, or empty array if none.
	 */
	static function from_thumbnail( $post_id, $width = 200, $height = 200 ) {
		$images = array();

		$post = get_post( $post_id );

		if ( ! empty( $post->post_password ) ) {
			return $images;
		}

		if ( ! function_exists( 'get_post_thumbnail_id' ) ) {
			return $images;
		}

		$thumb = get_post_thumbnail_id( $post_id );

		if ( $thumb ) {
			$meta = wp_get_attachment_metadata( $thumb );
			// Must be larger than requested minimums
			if ( !isset( $meta['width'] ) || $meta['width'] < $width )
				return $images;
			if ( !isset( $meta['height'] ) || $meta['height'] < $height )
				return $images;

			$too_big = ( ( ! empty( $meta['width'] ) && $meta['width'] > 1200 ) || ( ! empty( $meta['height'] ) && $meta['height'] > 1200 ) );

			if (
				$too_big &&
				(
					( method_exists( 'Jetpack', 'is_module_active' ) && Jetpack::is_module_active( 'photon' ) ) ||
					( defined( 'IS_WPCOM' ) && IS_WPCOM )
				)
			) {
				$img_src = wp_get_attachment_image_src( $thumb, array( 1200, 1200 ) );
			} else {
				$img_src = wp_get_attachment_image_src( $thumb, 'full' );
			}
			if ( ! is_array( $img_src ) ) {
				// If wp_get_attachment_image_src returns false but we know that there should be an image that could be used.
				// we try a bit harder and user the data that we have.
				$thumb_post_data = get_post( $thumb );
				$img_src = array( $thumb_post_data->guid, $meta['width'], $meta['height'] );
			}

			$url = $img_src[0];
			$images = array( array( // Other methods below all return an array of arrays
				'type'       => 'image',
				'from'       => 'thumbnail',
				'src'        => $url,
				'src_width'  => $img_src[1],
				'src_height' => $img_src[2],
				'href'       => get_permalink( $thumb ),
			) );

		}

		if ( empty( $images ) && ( defined( 'IS_WPCOM' ) && IS_WPCOM ) ) {
			$meta_thumbnail = get_post_meta( $post_id, '_jetpack_post_thumbnail', true );
			if ( ! empty( $meta_thumbnail ) ) {
				if ( ! isset( $meta_thumbnail['width'] ) || $meta_thumbnail['width'] < $width ) {
					return $images;
				}

				if ( ! isset( $meta_thumbnail['height'] ) || $meta_thumbnail['height'] < $height ) {
					return $images;
				}

				$images = array( array( // Other methods below all return an array of arrays
					'type'       => 'image',
					'from'       => 'thumbnail',
					'src'        => $meta_thumbnail['URL'],
					'src_width'  => $meta_thumbnail['width'],
					'src_height' => $meta_thumbnail['height'],
					'href'       => $meta_thumbnail['URL'],
				) );
			}
		}

		return $images;
	}

	/**
	 * Get images from Gutenberg Image blocks.
	 *
	 * @since 6.9.0
	 *
	 * @param mixed $html_or_id The HTML string to parse for images, or a post id.
	 * @param int   $width      Minimum Image width.
	 * @param int   $height     Minimum Image height.
	 */
	public static function from_blocks( $html_or_id, $width = 200, $height = 200 ) {
		$images = array();

		// Bail early if the site does not support the block editor.
		if ( ! function_exists( 'parse_blocks' ) ) {
			return $images;
		}

		$html_info = self::get_post_html( $html_or_id );

		if ( empty( $html_info['html'] ) ) {
			return $images;
		}

		// Look for block information in the HTML.
		$blocks = parse_blocks( $html_info['html'] );
		if ( empty( $blocks ) ) {
			return $images;
		}

		foreach ( $blocks as $block ) {
			/**
			 * Parse content from Core Image blocks.
			 * If it is an image block for an image hosted on our site, it will have an ID.
			 * If it does not have an ID, let `from_html` parse that content later,
			 * and extract an image if it has size parameters.
			 */
			if (
				'core/image' === $block['blockName']
				&& ! empty( $block['attrs']['id'] )
			) {
				$images[] = self::get_attachment_data( $block['attrs']['id'], $html_info['post_url'], $width, $height );
			}

			/**
			 * Parse content from Core Gallery blocks and Jetpack's Tiled Gallery blocks.
			 * Gallery blocks include the ID of each one of the images in the gallery.
			 */
			if (
				( 'core/gallery' === $block['blockName'] || 'jetpack/tiled-gallery' === $block['blockName'] )
				&& ! empty( $block['attrs']['ids'] )
			) {
				foreach ( $block['attrs']['ids'] as $img_id ) {
					$images[] = self::get_attachment_data( $img_id, $html_info['post_url'], $width, $height );
				}
			}
		}

		/**
		 * Returning a filtered array because get_attachment_data returns false
		 * for unsuccessful attempts.
		 */
		return array_filter( $images );
	}

	/**
	 * Very raw -- just parse the HTML and pull out any/all img tags and return their src
	 *
	 * @param mixed $html_or_id The HTML string to parse for images, or a post id.
	 * @param int   $width      Minimum Image width.
	 * @param int   $height     Minimum Image height.
	 *
	 * @uses DOMDocument
	 *
	 * @return Array containing images
	 */
	static function from_html( $html_or_id, $width = 200, $height = 200 ) {
		$images = array();

		$html_info = self::get_post_html( $html_or_id );

		if ( empty( $html_info['html'] ) ) {
			return $images;
		}

		// Do not go any further if DOMDocument is disabled on the server.
		if ( ! class_exists( 'DOMDocument' ) ) {
			return $images;
		}

		// Let's grab all image tags from the HTML.
		$dom_doc = new DOMDocument;

		// The @ is not enough to suppress errors when dealing with libxml,
		// we have to tell it directly how we want to handle errors.
		libxml_use_internal_errors( true );
		@$dom_doc->loadHTML( $html_info['html'] );
		libxml_use_internal_errors( false );

		$image_tags = $dom_doc->getElementsByTagName( 'img' );

		// For each image Tag, make sure it can be added to the $images array, and add it.
		foreach ( $image_tags as $image_tag ) {
			$img_src = $image_tag->getAttribute( 'src' );

			if ( empty( $img_src ) ) {
				continue;
			}

			// Do not grab smiley images that were automatically created by WP when entering text smilies.
			if ( stripos( $img_src, '/smilies/' ) ) {
				continue;
			}

			$meta = array(
				'width'  => (int) $image_tag->getAttribute( 'width' ),
				'height' => (int) $image_tag->getAttribute( 'height' ),
			);

			/**
			 * Filters the switch to ignore minimum image size requirements. Can be used
			 * to add custom logic to image dimensions, like only enforcing one of the dimensions,
			 * or disabling it entirely.
			 *
			 * @since 6.4.0
			 *
			 * @param bool $ignore Should the image dimensions be ignored?
			 * @param array $meta Array containing image dimensions parsed from the markup.
			 */
			$ignore_dimensions = apply_filters( 'jetpack_postimages_ignore_minimum_dimensions', false, $meta );

			// Must be larger than 200x200 (or user-specified).
			if (
				! $ignore_dimensions
				&& (
					empty( $meta['width'] )
					|| empty( $meta['height'] )
					|| $meta['width'] < $width
					|| $meta['height'] < $height
				)
			) {
				continue;
			}

			$images[] = array(
				'type'       => 'image',
				'from'       => 'html',
				'src'        => $img_src,
				'src_width'  => $meta['width'],
				'src_height' => $meta['height'],
				'href'       => $html_info['post_url'],
			);
		}
		return $images;
	}

	/**
	 * @param    int $post_id The post ID to check
	 * @param    int $size
	 * @return Array containing details of the image, or empty array if none.
	 */
	static function from_blavatar( $post_id, $size = 96 ) {

		$permalink = get_permalink( $post_id );

		if ( function_exists( 'blavatar_domain' ) && function_exists( 'blavatar_exists' ) && function_exists( 'blavatar_url' ) ) {
			$domain = blavatar_domain( $permalink );

			if ( ! blavatar_exists( $domain ) ) {
				return array();
			}

			$url = blavatar_url( $domain, 'img', $size );
		} elseif ( function_exists( 'has_site_icon' ) && has_site_icon() ) {
			$url = get_site_icon_url( $size );
		} else {
			return array();
		}

		return array( array(
			'type'       => 'image',
			'from'       => 'blavatar',
			'src'        => $url,
			'src_width'  => $size,
			'src_height' => $size,
			'href'       => $permalink,
		) );
	}

	/**
	 * Gets a post image from the author avatar.
	 *
	 * @param int    $post_id The post ID to check.
	 * @param int    $size The size of the avatar to get.
	 * @param string $default The default image to use.
	 * @return Array containing details of the image, or empty array if none.
	 */
	static function from_gravatar( $post_id, $size = 96, $default = false ) {
		$post = get_post( $post_id );
		$permalink = get_permalink( $post_id );

		if ( function_exists( 'wpcom_get_avatar_url' ) ) {
			$url = wpcom_get_avatar_url( $post->post_author, $size, $default, true );
			if ( $url && is_array( $url ) ) {
				$url = $url[0];
			}
		} else {
			$url = get_avatar_url( $post->post_author, array(
				'size' => $size,
				'default' => $default,
			) );
		}

		return array(
			array(
				'type'       => 'image',
				'from'       => 'gravatar',
				'src'        => $url,
				'src_width'  => $size,
				'src_height' => $size,
				'href'       => $permalink,
			),
		);
	}

	/**
	 * Run through the different methods that we have available to try to find a single good
	 * display image for this post.
	 * @param  int $post_id
	 * @param array $args Other arguments (currently width and height required for images where possible to determine)
	 * @return Array containing details of the best image to be used
	 */
	static function get_image( $post_id, $args = array() ) {
		$image = '';

		/**
		 * Fires before we find a single good image for a specific post.
		 *
		 * @since 2.2.0
		 *
		 * @param int $post_id Post ID.
		 */
		do_action( 'jetpack_postimages_pre_get_image', $post_id );
		$media = self::get_images( $post_id, $args );


		if ( is_array( $media ) ) {
			foreach ( $media as $item ) {
				if ( 'image' == $item['type'] ) {
					$image = $item;
					break;
				}
			}
		}

		/**
		 * Fires after we find a single good image for a specific post.
		 *
		 * @since 2.2.0
		 *
		 * @param int $post_id Post ID.
		 */
		do_action( 'jetpack_postimages_post_get_image', $post_id );

		return $image;
	}

	/**
	 * Get an array containing a collection of possible images for this post, stopping once we hit a method
	 * that returns something useful.
	 * @param  int $post_id
	 * @param  array  $args Optional args, see defaults list for details
	 * @return Array containing images that would be good for representing this post
	 */
	static function get_images( $post_id, $args = array() ) {
		// Figure out which image to attach to this post.
		$media = false;

		/**
		 * Filters the array of images that would be good for a specific post.
		 * This filter is applied before options ($args) filter the original array.
		 *
		 * @since 2.0.0
		 *
		 * @param array $media Array of images that would be good for a specific post.
		 * @param int $post_id Post ID.
		 * @param array $args Array of options to get images.
		 */
		$media = apply_filters( 'jetpack_images_pre_get_images', $media, $post_id, $args );
		if ( $media )
			return $media;

		$defaults = array(
			'width'               => 200, // Required minimum width (if possible to determine)
			'height'              => 200, // Required minimum height (if possible to determine)

			'fallback_to_avatars' => false, // Optionally include Blavatar and Gravatar (in that order) in the image stack
			'avatar_size'         => 96, // Used for both Grav and Blav
			'gravatar_default'    => false, // Default image to use if we end up with no Gravatar

			'from_thumbnail'      => true, // Use these flags to specify which methods to use to find an image
			'from_slideshow'      => true,
			'from_gallery'        => true,
			'from_attachment'     => true,
			'from_blocks'         => true,
			'from_html'           => true,

			'html_content'        => '' // HTML string to pass to from_html()
		);
		$args = wp_parse_args( $args, $defaults );

		$media = false;
		if ( $args['from_thumbnail'] )
			$media = self::from_thumbnail( $post_id, $args['width'], $args['height'] );
		if ( !$media && $args['from_slideshow'] )
			$media = self::from_slideshow( $post_id, $args['width'], $args['height'] );
		if ( !$media && $args['from_gallery'] )
			$media = self::from_gallery( $post_id );
		if ( !$media && $args['from_attachment'] )
			$media = self::from_attachment( $post_id, $args['width'], $args['height'] );
		if ( ! $media && $args['from_blocks'] ) {
			if ( empty( $args['html_content'] ) )
				$media = self::from_blocks( $post_id, $args['width'], $args['height'] ); // Use the post_id, which will load the content
			else
				$media = self::from_blocks( $args['html_content'], $args['width'], $args['height'] ); // If html_content is provided, use that
		}
		if ( !$media && $args['from_html'] ) {
			if ( empty( $args['html_content'] ) )
				$media = self::from_html( $post_id, $args['width'], $args['height'] ); // Use the post_id, which will load the content
			else
				$media = self::from_html( $args['html_content'], $args['width'], $args['height'] ); // If html_content is provided, use that
		}

		if ( !$media && $args['fallback_to_avatars'] ) {
			$media = self::from_blavatar( $post_id, $args['avatar_size'] );
			if ( !$media )
				$media = self::from_gravatar( $post_id, $args['avatar_size'], $args['gravatar_default'] );
		}

		/**
		 * Filters the array of images that would be good for a specific post.
		 * This filter is applied after options ($args) filter the original array.
		 *
		 * @since 2.0.0
		 *
		 * @param array $media Array of images that would be good for a specific post.
		 * @param int $post_id Post ID.
		 * @param array $args Array of options to get images.
		 */
		return apply_filters( 'jetpack_images_get_images', $media, $post_id, $args );
	}

	/**
	 * Takes an image URL and pixel dimensions then returns a URL for the
	 * resized and cropped image.
	 *
	 * @param  string $src
	 * @param  int    $dimension
	 * @return string            Transformed image URL
	 */
	static function fit_image_url( $src, $width, $height ) {
		$width = (int) $width;
		$height = (int) $height;

		if ( $width < 1 || $height < 1 ) {
			return $src;
		}

		// See if we should bypass WordPress.com SaaS resizing
		if ( has_filter( 'jetpack_images_fit_image_url_override' ) ) {
			/**
			 * Filters the image URL used after dimensions are set by Photon.
			 *
			 * @since 3.3.0
			 *
			 * @param string $src Image URL.
			 * @param int $width Image width.
			 * @param int $width Image height.
			 */
			return apply_filters( 'jetpack_images_fit_image_url_override', $src, $width, $height );
		}

		// If WPCOM hosted image use native transformations
		$img_host = parse_url( $src, PHP_URL_HOST );
		if ( '.files.wordpress.com' == substr( $img_host, -20 ) ) {
			return add_query_arg( array( 'w' => $width, 'h' => $height, 'crop' => 1 ), set_url_scheme( $src ) );
		}

		// Use Photon magic
		if( function_exists( 'jetpack_photon_url' ) ) {
			return jetpack_photon_url( $src, array( 'resize' => "$width,$height" ) );
		}

		// Arg... no way to resize image using WordPress.com infrastructure!
		return $src;
	}

	/**
	 * Get HTML from given post content.
	 *
	 * @since 6.9.0
	 *
	 * @param mixed $html_or_id The HTML string to parse for images, or a post id.
	 *
	 * @return array $html_info {
	 * @type string $html     Post content.
	 * @type string $post_url Post URL.
	 * }
	 */
	static function get_post_html( $html_or_id ) {
		if ( is_numeric( $html_or_id ) ) {
			$post = get_post( $html_or_id );

			if ( empty( $post ) || ! empty( $post->post_password ) ) {
				return '';
			}

			$html_info = array(
				'html'     => $post->post_content, // DO NOT apply the_content filters here, it will cause loops.
				'post_url' => get_permalink( $post->ID ),
			);
		} else {
			$html_info = array(
				'html'     => $html_or_id,
				'post_url' => '',
			);
		}
		return $html_info;
	}

	/**
	 * Get info about a WordPress attachment.
	 *
	 * @since 6.9.0
	 *
	 * @param int    $attachment_id Attachment ID.
	 * @param string $post_url      URL of the post, if we have one.
	 * @param int    $width         Minimum Image width.
	 * @param int    $height        Minimum Image height.
	 * @return array|bool           Image data or false if unavailable.
	 */
	public static function get_attachment_data( $attachment_id, $post_url = '', $width, $height ) {
		if ( empty( $attachment_id ) ) {
			return false;
		}

		$meta = wp_get_attachment_metadata( $attachment_id );

		// The image must be larger than 200x200.
		if ( ! isset( $meta['width'] ) || $meta['width'] < $width ) {
			return false;
		}
		if ( ! isset( $meta['height'] ) || $meta['height'] < $height ) {
			return false;
		}

		$url = wp_get_attachment_url( $attachment_id );

		return array(
			'type'       => 'image',
			'from'       => 'attachment',
			'src'        => $url,
			'src_width'  => $meta['width'],
			'src_height' => $meta['height'],
			'href'       => $post_url,
		);
	}
}
