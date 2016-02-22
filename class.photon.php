<?php

class Jetpack_Photon {
	/**
	 * Class variables
	 */
	// Oh look, a singleton
	private static $__instance = null;

	// Allowed extensions must match http://code.trac.wordpress.org/browser/photon/index.php#L31
	protected static $extensions = array(
		'gif',
		'jpg',
		'jpeg',
		'png'
	);

	// Don't access this directly. Instead, use self::image_sizes() so it's actually populated with something.
	protected static $image_sizes = null;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_Photon' ) ) {
			self::$__instance = new Jetpack_Photon;
			self::$__instance->setup();
		}

		return self::$__instance;
	}

	/**
	 * Silence is golden.
	 */
	private function __construct() {}

	/**
	 * Register actions and filters, but only if basic Photon functions are available.
	 * The basic functions are found in ./functions.photon.php.
	 *
	 * @uses add_action, add_filter
	 * @return null
	 */
	private function setup() {
		// Display warning if site is private
		add_action( 'jetpack_activate_module_photon', array( $this, 'action_jetpack_activate_module_photon' ) );

		if ( ! function_exists( 'jetpack_photon_url' ) )
			return;

		// Images in post content and galleries
		add_filter( 'the_content', array( __CLASS__, 'filter_the_content' ), 999999 );
		add_filter( 'get_post_galleries', array( __CLASS__, 'filter_the_galleries' ), 999999 );

		// Core image retrieval
		add_filter( 'image_downsize', array( $this, 'filter_image_downsize' ), 10, 3 );

		// Responsive image srcset substitution
		add_filter( 'wp_calculate_image_srcset', array( $this, 'filter_srcset_array' ), 10, 4 );

		// Helpers for maniuplated images
		add_action( 'wp_enqueue_scripts', array( $this, 'action_wp_enqueue_scripts' ), 9 );
	}

	/**
	 * Check if site is private and warn user if it is
	 *
	 * @uses Jetpack::check_privacy
	 * @action jetpack_activate_module_photon
	 * @return null
	 */
	public function action_jetpack_activate_module_photon() {
		Jetpack::check_privacy( __FILE__ );
	}

	/**
	 ** IN-CONTENT IMAGE MANIPULATION FUNCTIONS
	 **/

	/**
	 * Match all images and any relevant <a> tags in a block of HTML.
	 *
	 * @param string $content Some HTML.
	 * @return array An array of $images matches, where $images[0] is
	 *         an array of full matches, and the link_url, img_tag,
	 *         and img_url keys are arrays of those matches.
	 */
	public static function parse_images_from_html( $content ) {
		$images = array();

		if ( preg_match_all( '#(?:<a[^>]+?href=["|\'](?P<link_url>[^\s]+?)["|\'][^>]*?>\s*)?(?P<img_tag><img[^>]*?\s+?src=["|\'](?P<img_url>[^\s]+?)["|\'].*?>){1}(?:\s*</a>)?#is', $content, $images ) ) {
			foreach ( $images as $key => $unused ) {
				// Simplify the output as much as possible, mostly for confirming test results.
				if ( is_numeric( $key ) && $key > 0 )
					unset( $images[$key] );
			}

			return $images;
		}

		return array();
	}

	/**
	 * Try to determine height and width from strings WP appends to resized image filenames.
	 *
	 * @param string $src The image URL.
	 * @return array An array consisting of width and height.
	 */
	public static function parse_dimensions_from_filename( $src ) {
		$width_height_string = array();

		if ( preg_match( '#-(\d+)x(\d+)\.(?:' . implode('|', self::$extensions ) . '){1}$#i', $src, $width_height_string ) ) {
			$width = (int) $width_height_string[1];
			$height = (int) $width_height_string[2];

			if ( $width && $height )
				return array( $width, $height );
		}

		return array( false, false );
	}

	/**
	 * Identify images in post content, and if images are local (uploaded to the current site), pass through Photon.
	 *
	 * @param string $content
	 * @uses self::validate_image_url, apply_filters, jetpack_photon_url, esc_url
	 * @filter the_content
	 * @return string
	 */
	public static function filter_the_content( $content ) {
		$images = Jetpack_Photon::parse_images_from_html( $content );

		if ( ! empty( $images ) ) {
			$content_width = Jetpack::get_content_width();

			$image_sizes = self::image_sizes();
			$upload_dir = wp_upload_dir();

			foreach ( $images[0] as $index => $tag ) {
				// Default to resize, though fit may be used in certain cases where a dimension cannot be ascertained
				$transform = 'resize';

				// Start with a clean attachment ID each time
				$attachment_id = false;

				// Flag if we need to munge a fullsize URL
				$fullsize_url = false;

				// Identify image source
				$src = $src_orig = $images['img_url'][ $index ];

				/**
				 * Allow specific images to be skipped by Photon.
				 *
				 * @module photon
				 *
				 * @since 2.0.3
				 *
				 * @param bool false Should Photon ignore this image. Default to false.
				 * @param string $src Image URL.
				 * @param string $tag Image Tag (Image HTML output).
				 */
				if ( apply_filters( 'jetpack_photon_skip_image', false, $src, $tag ) )
					continue;

				// Support Automattic's Lazy Load plugin
				// Can't modify $tag yet as we need unadulterated version later
				if ( preg_match( '#data-lazy-src=["|\'](.+?)["|\']#i', $images['img_tag'][ $index ], $lazy_load_src ) ) {
					$placeholder_src = $placeholder_src_orig = $src;
					$src = $src_orig = $lazy_load_src[1];
				} elseif ( preg_match( '#data-lazy-original=["|\'](.+?)["|\']#i', $images['img_tag'][ $index ], $lazy_load_src ) ) {
					$placeholder_src = $placeholder_src_orig = $src;
					$src = $src_orig = $lazy_load_src[1];
				}

				// Check if image URL should be used with Photon
				if ( self::validate_image_url( $src ) ) {
					// Find the width and height attributes
					$width = $height = false;

					// First, check the image tag
					if ( preg_match( '#width=["|\']?([\d%]+)["|\']?#i', $images['img_tag'][ $index ], $width_string ) )
						$width = $width_string[1];

					if ( preg_match( '#height=["|\']?([\d%]+)["|\']?#i', $images['img_tag'][ $index ], $height_string ) )
						$height = $height_string[1];

					// Can't pass both a relative width and height, so unset the height in favor of not breaking the horizontal layout.
					if ( false !== strpos( $width, '%' ) && false !== strpos( $height, '%' ) )
						$width = $height = false;

					// Detect WP registered image size from HTML class
					if ( preg_match( '#class=["|\']?[^"\']*size-([^"\'\s]+)[^"\']*["|\']?#i', $images['img_tag'][ $index ], $size ) ) {
						$size = array_pop( $size );

						if ( false === $width && false === $height && 'full' != $size && array_key_exists( $size, $image_sizes ) ) {
							$width = (int) $image_sizes[ $size ]['width'];
							$height = (int) $image_sizes[ $size ]['height'];
							$transform = $image_sizes[ $size ]['crop'] ? 'resize' : 'fit';
						}
					} else {
						unset( $size );
					}

					// WP Attachment ID, if uploaded to this site
					if (
						preg_match( '#class=["|\']?[^"\']*wp-image-([\d]+)[^"\']*["|\']?#i', $images['img_tag'][ $index ], $attachment_id ) &&
						(
							0 === strpos( $src, $upload_dir['baseurl'] ) ||
							/**
							 * Filter whether an image using an attachment ID in its class has to be uploaded to the local site to go through Photon.
							 *
							 * @module photon
							 *
							 * @since 2.0.3
							 *
							 * @param bool false Was the image uploaded to the local site. Default to false.
							 * @param array $args {
							 * 	 Array of image details.
							 *
							 * 	 @type $src Image URL.
							 * 	 @type tag Image tag (Image HTML output).
							 * 	 @type $images Array of information about the image.
							 * 	 @type $index Image index.
							 * }
							 */
							apply_filters( 'jetpack_photon_image_is_local', false, compact( 'src', 'tag', 'images', 'index' ) )
						)
					) {
						$attachment_id = intval( array_pop( $attachment_id ) );

						if ( $attachment_id ) {
							$attachment = get_post( $attachment_id );

							// Basic check on returned post object
							if ( is_object( $attachment ) && ! is_wp_error( $attachment ) && 'attachment' == $attachment->post_type ) {
								$src_per_wp = wp_get_attachment_image_src( $attachment_id, isset( $size ) ? $size : 'full' );

								if ( self::validate_image_url( $src_per_wp[0] ) ) {
									$src = $src_per_wp[0];
									$fullsize_url = true;

									// Prevent image distortion if a detected dimension exceeds the image's natural dimensions
									if ( ( false !== $width && $width > $src_per_wp[1] ) || ( false !== $height && $height > $src_per_wp[2] ) ) {
										$width = false == $width ? false : min( $width, $src_per_wp[1] );
										$height = false == $height ? false : min( $height, $src_per_wp[2] );
									}

									// If no width and height are found, max out at source image's natural dimensions
									// Otherwise, respect registered image sizes' cropping setting
									if ( false == $width && false == $height ) {
										$width = $src_per_wp[1];
										$height = $src_per_wp[2];
										$transform = 'fit';
									} elseif ( isset( $size ) && array_key_exists( $size, $image_sizes ) && isset( $image_sizes[ $size ]['crop'] ) ) {
										$transform = (bool) $image_sizes[ $size ]['crop'] ? 'resize' : 'fit';
									}
								}
							} else {
								unset( $attachment_id );
								unset( $attachment );
							}
						}
					}

					// If image tag lacks width and height arguments, try to determine from strings WP appends to resized image filenames.
					if ( false === $width && false === $height ) {
						list( $width, $height ) = Jetpack_Photon::parse_dimensions_from_filename( $src );
					}

					// If width is available, constrain to $content_width
					if ( false !== $width && false === strpos( $width, '%' ) && is_numeric( $content_width ) ) {
						if ( $width > $content_width && false !== $height && false === strpos( $height, '%' ) ) {
							$height = round( ( $content_width * $height ) / $width );
							$width = $content_width;
						} elseif ( $width > $content_width ) {
							$width = $content_width;
						}
					}

					// Set a width if none is found and $content_width is available
					// If width is set in this manner and height is available, use `fit` instead of `resize` to prevent skewing
					if ( false === $width && is_numeric( $content_width ) ) {
						$width = (int) $content_width;

						if ( false !== $height )
							$transform = 'fit';
					}

					// Detect if image source is for a custom-cropped thumbnail and prevent further URL manipulation.
					if ( ! $fullsize_url && preg_match_all( '#-e[a-z0-9]+(-\d+x\d+)?\.(' . implode('|', self::$extensions ) . '){1}$#i', basename( $src ), $filename ) )
						$fullsize_url = true;

					// Build URL, first maybe removing WP's resized string so we pass the original image to Photon
					if ( ! $fullsize_url ) {
						$src = self::strip_image_dimensions_maybe( $src );
					}

					// Build array of Photon args and expose to filter before passing to Photon URL function
					$args = array();

					if ( false !== $width && false !== $height && false === strpos( $width, '%' ) && false === strpos( $height, '%' ) )
						$args[ $transform ] = $width . ',' . $height;
					elseif ( false !== $width )
						$args['w'] = $width;
					elseif ( false !== $height )
						$args['h'] = $height;

					/**
					 * Filter the array of Photon arguments added to an image when it goes through Photon.
					 * By default, only includes width and height values.
					 * @see https://developer.wordpress.com/docs/photon/api/
					 *
					 * @module photon
					 *
					 * @since 2.0.0
					 *
					 * @param array $args Array of Photon Arguments.
					 * @param array $args {
					 * 	 Array of image details.
					 *
					 * 	 @type $tag Image tag (Image HTML output).
					 * 	 @type $src Image URL.
					 * 	 @type $src_orig Original Image URL.
					 * 	 @type $width Image width.
					 * 	 @type $height Image height.
					 * }
					 */
					$args = apply_filters( 'jetpack_photon_post_image_args', $args, compact( 'tag', 'src', 'src_orig', 'width', 'height' ) );

					$photon_url = jetpack_photon_url( $src, $args );

					// Modify image tag if Photon function provides a URL
					// Ensure changes are only applied to the current image by copying and modifying the matched tag, then replacing the entire tag with our modified version.
					if ( $src != $photon_url ) {
						$new_tag = $tag;

						// If present, replace the link href with a Photoned URL for the full-size image.
						if ( ! empty( $images['link_url'][ $index ] ) && self::validate_image_url( $images['link_url'][ $index ] ) )
							$new_tag = preg_replace( '#(href=["|\'])' . $images['link_url'][ $index ] . '(["|\'])#i', '\1' . jetpack_photon_url( $images['link_url'][ $index ] ) . '\2', $new_tag, 1 );

						// Supplant the original source value with our Photon URL
						$photon_url = esc_url( $photon_url );
						$new_tag = str_replace( $src_orig, $photon_url, $new_tag );

						// If Lazy Load is in use, pass placeholder image through Photon
						if ( isset( $placeholder_src ) && self::validate_image_url( $placeholder_src ) ) {
							$placeholder_src = jetpack_photon_url( $placeholder_src );

							if ( $placeholder_src != $placeholder_src_orig )
								$new_tag = str_replace( $placeholder_src_orig, esc_url( $placeholder_src ), $new_tag );

							unset( $placeholder_src );
						}

						// Remove the width and height arguments from the tag to prevent distortion
						$new_tag = preg_replace( '#(?<=\s)(width|height)=["|\']?[\d%]+["|\']?\s?#i', '', $new_tag );

						// Tag an image for dimension checking
						$new_tag = preg_replace( '#(\s?/)?>(\s*</a>)?$#i', ' data-recalc-dims="1"\1>\2', $new_tag );

						// Replace original tag with modified version
						$content = str_replace( $tag, $new_tag, $content );
					}
				} elseif ( preg_match( '#^http(s)?://i[\d]{1}.wp.com#', $src ) && ! empty( $images['link_url'][ $index ] ) && self::validate_image_url( $images['link_url'][ $index ] ) ) {
					$new_tag = preg_replace( '#(href=["|\'])' . $images['link_url'][ $index ] . '(["|\'])#i', '\1' . jetpack_photon_url( $images['link_url'][ $index ] ) . '\2', $tag, 1 );

					$content = str_replace( $tag, $new_tag, $content );
				}
			}
		}

		return $content;
	}

	public static function filter_the_galleries( $galleries ) {
		if ( empty( $galleries ) || ! is_array( $galleries ) ) {
			return $galleries;
		}

		// Pass by reference, so we can modify them in place.
		foreach ( $galleries as &$this_gallery ) {
			if ( is_string( $this_gallery ) ) {
				$this_gallery = self::filter_the_content( $this_gallery );
		// LEAVING COMMENTED OUT as for the moment it doesn't seem
		// necessary and I'm not sure how it would propagate through.
		//	} elseif ( is_array( $this_gallery )
		//	           && ! empty( $this_gallery['src'] )
		//	           && ! empty( $this_gallery['type'] )
		//	           && in_array( $this_gallery['type'], array( 'rectangle', 'square', 'circle' ) ) ) {
		//		$this_gallery['src'] = array_map( 'jetpack_photon_url', $this_gallery['src'] );
			}
		}
		unset( $this_gallery ); // break the reference.

		return $galleries;
	}

	/**
	 ** CORE IMAGE RETRIEVAL
	 **/

	/**
	 * Filter post thumbnail image retrieval, passing images through Photon
	 *
	 * @param string|bool $image
	 * @param int $attachment_id
	 * @param string|array $size
	 * @uses is_admin, apply_filters, wp_get_attachment_url, self::validate_image_url, this::image_sizes, jetpack_photon_url
	 * @filter image_downsize
	 * @return string|bool
	 */
	public function filter_image_downsize( $image, $attachment_id, $size ) {
		// Don't foul up the admin side of things, and provide plugins a way of preventing Photon from being applied to images.
		if (
			is_admin() ||
			/**
			 * Provide plugins a way of preventing Photon from being applied to images retrieved from WordPress Core.
			 *
			 * @module photon
			 *
			 * @since 2.0.0
			 *
			 * @param bool false Stop Photon from being applied to the image. Default to false.
			 * @param array $args {
			 * 	 Array of image details.
			 *
			 * 	 @type $image Image URL.
			 * 	 @type $attachment_id Attachment ID of the image.
			 * 	 @type $size Image size. Can be a string (name of the image size, e.g. full) or an integer.
			 * }
			 */
			apply_filters( 'jetpack_photon_override_image_downsize', false, compact( 'image', 'attachment_id', 'size' ) )
		)
			return $image;

		// Get the image URL and proceed with Photon-ification if successful
		$image_url = wp_get_attachment_url( $attachment_id );

		// Set this to true later when we know we have size meta.
		$has_size_meta = false;

		if ( $image_url ) {
			// Check if image URL should be used with Photon
			if ( ! self::validate_image_url( $image_url ) )
				return $image;

			$intermediate = true; // For the fourth array item returned by the image_downsize filter.

			// If an image is requested with a size known to WordPress, use that size's settings with Photon
			if ( ( is_string( $size ) || is_int( $size ) ) && array_key_exists( $size, self::image_sizes() ) ) {
				$image_args = self::image_sizes();
				$image_args = $image_args[ $size ];

				$photon_args = array();

				$image_meta = image_get_intermediate_size( $attachment_id, $size );

				// 'full' is a special case: We need consistent data regardless of the requested size.
				if ( 'full' == $size ) {
					$image_meta = wp_get_attachment_metadata( $attachment_id );
					$intermediate = false;
				} elseif ( ! $image_meta ) {
					// If we still don't have any image meta at this point, it's probably from a custom thumbnail size
					// for an image that was uploaded before the custom image was added to the theme.  Try to determine the size manually.
					$image_meta = wp_get_attachment_metadata( $attachment_id );

					if ( isset( $image_meta['width'], $image_meta['height'] ) ) {
						$image_resized = image_resize_dimensions( $image_meta['width'], $image_meta['height'], $image_args['width'], $image_args['height'], $image_args['crop'] );
						if ( $image_resized ) { // This could be false when the requested image size is larger than the full-size image.
							$image_meta['width'] = $image_resized[6];
							$image_meta['height'] = $image_resized[7];
						}
					}
				}

				if ( isset( $image_meta['width'], $image_meta['height'] ) ) {
					$image_args['width']  = $image_meta['width'];
					$image_args['height'] = $image_meta['height'];

					list( $image_args['width'], $image_args['height'] ) = image_constrain_size_for_editor( $image_args['width'], $image_args['height'], $size, 'display' );
					$has_size_meta = true;
				}

				// Expose determined arguments to a filter before passing to Photon
				$transform = $image_args['crop'] ? 'resize' : 'fit';

				// Check specified image dimensions and account for possible zero values; photon fails to resize if a dimension is zero.
				if ( 0 == $image_args['width'] || 0 == $image_args['height'] ) {
					if ( 0 == $image_args['width'] && 0 < $image_args['height'] ) {
						$photon_args['h'] = $image_args['height'];
					} elseif ( 0 == $image_args['height'] && 0 < $image_args['width'] ) {
						$photon_args['w'] = $image_args['width'];
					}
				} else {
					if ( ( 'resize' === $transform ) && $image_meta = wp_get_attachment_metadata( $attachment_id ) ) {
						if ( isset( $image_meta['width'], $image_meta['height'] ) ) {
							// Lets make sure that we don't upscale images since wp never upscales them as well
							$smaller_width  = ( ( $image_meta['width']  < $image_args['width']  ) ? $image_meta['width']  : $image_args['width']  );
							$smaller_height = ( ( $image_meta['height'] < $image_args['height'] ) ? $image_meta['height'] : $image_args['height'] );

							$photon_args[ $transform ] = $smaller_width . ',' . $smaller_height;
						}
					} else {
						$photon_args[ $transform ] = $image_args['width'] . ',' . $image_args['height'];
					}

				}


				/**
				 * Filter the Photon Arguments added to an image when going through Photon, when that image size is a string.
				 * Image size will be a string (e.g. "full", "medium") when it is known to WordPress.
				 *
				 * @module photon
				 *
				 * @since 2.0.0
				 *
				 * @param array $photon_args Array of Photon arguments.
				 * @param array $args {
				 * 	 Array of image details.
				 *
				 * 	 @type $image_args Array of Image arguments (width, height, crop).
				 * 	 @type $image_url Image URL.
				 * 	 @type $attachment_id Attachment ID of the image.
				 * 	 @type $size Image size. Can be a string (name of the image size, e.g. full) or an integer.
				 * 	 @type $transform Value can be resize or fit.
				 *                    @see https://developer.wordpress.com/docs/photon/api
				 * }
				 */
				$photon_args = apply_filters( 'jetpack_photon_image_downsize_string', $photon_args, compact( 'image_args', 'image_url', 'attachment_id', 'size', 'transform' ) );

				// Generate Photon URL
				$image = array(
					jetpack_photon_url( $image_url, $photon_args ),
					$has_size_meta ? $image_args['width'] : false,
					$has_size_meta ? $image_args['height'] : false,
					$intermediate
				);
			} elseif ( is_array( $size ) ) {
				// Pull width and height values from the provided array, if possible
				$width = isset( $size[0] ) ? (int) $size[0] : false;
				$height = isset( $size[1] ) ? (int) $size[1] : false;

				// Don't bother if necessary parameters aren't passed.
				if ( ! $width || ! $height ) {
					return $image;
				}

				$image_meta = wp_get_attachment_metadata( $attachment_id );
				if ( isset( $image_meta['width'], $image_meta['height'] ) ) {
					$image_resized = image_resize_dimensions( $image_meta['width'], $image_meta['height'], $width, $height );

					if ( $image_resized ) { // This could be false when the requested image size is larger than the full-size image.
						$width = $image_resized[6];
						$height = $image_resized[7];
					} else {
						$width = $image_meta['width'];
						$height = $image_meta['height'];
					}

					$has_size_meta = true;
				}

				list( $width, $height ) = image_constrain_size_for_editor( $width, $height, $size );

				// Expose arguments to a filter before passing to Photon
				$photon_args = array(
					'fit' => $width . ',' . $height
				);

				/**
				 * Filter the Photon Arguments added to an image when going through Photon,
				 * when the image size is an array of height and width values.
				 *
				 * @module photon
				 *
				 * @since 2.0.0
				 *
				 * @param array $photon_args Array of Photon arguments.
				 * @param array $args {
				 * 	 Array of image details.
				 *
				 * 	 @type $width Image width.
				 * 	 @type height Image height.
				 * 	 @type $image_url Image URL.
				 * 	 @type $attachment_id Attachment ID of the image.
				 * }
				 */
				$photon_args = apply_filters( 'jetpack_photon_image_downsize_array', $photon_args, compact( 'width', 'height', 'image_url', 'attachment_id' ) );

				// Generate Photon URL
				$image = array(
					jetpack_photon_url( $image_url, $photon_args ),
					$has_size_meta ? $width : false,
					$has_size_meta ? $height : false,
					$intermediate
				);
			}
		}

		return $image;
	}

	/**
	 * Filters an array of image `srcset` values, replacing each URL with its Photon equivalent.
	 *
	 * @since 3.8.0
	 * @param array $sources An array of image urls and widths.
	 * @uses self::validate_image_url, jetpack_photon_url
	 * @return array An array of Photon image urls and widths.
	 */
	public function filter_srcset_array( $sources, $size_array, $image_src, $image_meta ) {
		$upload_dir = wp_upload_dir();

		foreach ( $sources as $i => $source ) {
			if ( ! self::validate_image_url( $source['url'] ) ) {
				continue;
			}

			$url = $source['url'];
			list( $width, $height ) = Jetpack_Photon::parse_dimensions_from_filename( $url );

			// It's quicker to get the full size with the data we have already, if available
			if ( isset( $image_meta['file'] ) ) {
				$url = trailingslashit( $upload_dir['baseurl'] ) . $image_meta['file'];
			} else {
				$url = Jetpack_Photon::strip_image_dimensions_maybe( $url );
			}

			$args = array();
			if ( 'w' === $source['descriptor'] ) {
				if ( $height && ( $source['value'] == $width ) ) {
					$args['resize'] = $width . ',' . $height;
				} else {
					$args['w'] = $source['value'];
				}

			}

			$sources[ $i ]['url'] = jetpack_photon_url( $url, $args );
		}

		return $sources;
	}

	/**
	 ** GENERAL FUNCTIONS
	 **/

	/**
	 * Ensure image URL is valid for Photon.
	 * Though Photon functions address some of the URL issues, we should avoid unnecessary processing if we know early on that the image isn't supported.
	 *
	 * @param string $url
	 * @uses wp_parse_args
	 * @return bool
	 */
	protected static function validate_image_url( $url ) {
		$parsed_url = @parse_url( $url );

		if ( ! $parsed_url )
			return false;

		// Parse URL and ensure needed keys exist, since the array returned by `parse_url` only includes the URL components it finds.
		$url_info = wp_parse_args( $parsed_url, array(
			'scheme' => null,
			'host'   => null,
			'port'   => null,
			'path'   => null
		) );

		// Bail if scheme isn't http or port is set that isn't port 80
		if (
			( 'http' != $url_info['scheme'] || ! in_array( $url_info['port'], array( 80, null ) ) ) &&
			/**
			 * Allow Photon to fetch images that are served via HTTPS.
			 *
			 * @module photon
			 *
			 * @since 2.4.0
			 * @since 3.9.0 Default to false.
			 *
			 * @param bool $reject_https Should Photon ignore images using the HTTPS scheme. Default to false.
			 */
			apply_filters( 'jetpack_photon_reject_https', false )
		) {
			return false;
		}

		// Bail if no host is found
		if ( is_null( $url_info['host'] ) )
			return false;

		// Bail if the image alredy went through Photon
		if ( preg_match( '#^i[\d]{1}.wp.com$#i', $url_info['host'] ) )
			return false;

		// Bail if no path is found
		if ( is_null( $url_info['path'] ) )
			return false;

		// Ensure image extension is acceptable
		if ( ! in_array( strtolower( pathinfo( $url_info['path'], PATHINFO_EXTENSION ) ), self::$extensions ) )
			return false;

		// If we got this far, we should have an acceptable image URL
		// But let folks filter to decline if they prefer.
		/**
		 * Overwrite the results of the validation steps an image goes through before to be considered valid to be used by Photon.
		 *
		 * @module photon
		 *
		 * @since 3.0.0
		 *
		 * @param bool true Is the image URL valid and can it be used by Photon. Default to true.
		 * @param string $url Image URL.
		 * @param array $parsed_url Array of information about the image.
		 */
		return apply_filters( 'photon_validate_image_url', true, $url, $parsed_url );
	}

	/**
	 * Checks if the file exists before it passes the file to photon
	 *
	 * @param string $src The image URL
	 * @return string
	 **/
	protected static function strip_image_dimensions_maybe( $src ){
		$stripped_src = $src;

		// Build URL, first removing WP's resized string so we pass the original image to Photon
		if ( preg_match( '#(-\d+x\d+)\.(' . implode('|', self::$extensions ) . '){1}$#i', $src, $src_parts ) ) {
			$stripped_src = str_replace( $src_parts[1], '', $src );
			$upload_dir = wp_upload_dir();

			// Extracts the file path to the image minus the base url
			$file_path = substr( $stripped_src, strlen ( $upload_dir['baseurl'] ) );

			if( file_exists( $upload_dir["basedir"] . $file_path ) )
				$src = $stripped_src;
		}

		return $src;
	}

	/**
	 * Provide an array of available image sizes and corresponding dimensions.
	 * Similar to get_intermediate_image_sizes() except that it includes image sizes' dimensions, not just their names.
	 *
	 * @global $wp_additional_image_sizes
	 * @uses get_option
	 * @return array
	 */
	protected static function image_sizes() {
		if ( null == self::$image_sizes ) {
			global $_wp_additional_image_sizes;

			// Populate an array matching the data structure of $_wp_additional_image_sizes so we have a consistent structure for image sizes
			$images = array(
				'thumb'  => array(
					'width'  => intval( get_option( 'thumbnail_size_w' ) ),
					'height' => intval( get_option( 'thumbnail_size_h' ) ),
					'crop'   => (bool) get_option( 'thumbnail_crop' )
				),
				'medium' => array(
					'width'  => intval( get_option( 'medium_size_w' ) ),
					'height' => intval( get_option( 'medium_size_h' ) ),
					'crop'   => false
				),
				'large'  => array(
					'width'  => intval( get_option( 'large_size_w' ) ),
					'height' => intval( get_option( 'large_size_h' ) ),
					'crop'   => false
				),
				'full'   => array(
					'width'  => null,
					'height' => null,
					'crop'   => false
				)
			);

			// Compatibility mapping as found in wp-includes/media.php
			$images['thumbnail'] = $images['thumb'];

			// Update class variable, merging in $_wp_additional_image_sizes if any are set
			if ( is_array( $_wp_additional_image_sizes ) && ! empty( $_wp_additional_image_sizes ) )
				self::$image_sizes = array_merge( $images, $_wp_additional_image_sizes );
			else
				self::$image_sizes = $images;
		}

		return is_array( self::$image_sizes ) ? self::$image_sizes : array();
	}

	/**
	 * Pass og:image URLs through Photon
	 *
	 * @param array $tags
	 * @param array $parameters
	 * @uses jetpack_photon_url
	 * @return array
	 */
	function filter_open_graph_tags( $tags, $parameters ) {
		if ( empty( $tags['og:image'] ) ) {
			return $tags;
		}

		$photon_args = array(
			'fit' => sprintf( '%d,%d', 2 * $parameters['image_width'], 2 * $parameters['image_height'] ),
		);

		if ( is_array( $tags['og:image'] ) ) {
			$images = array();
			foreach ( $tags['og:image'] as $image ) {
				$images[] = jetpack_photon_url( $image, $photon_args );
			}
			$tags['og:image'] = $images;
		} else {
			$tags['og:image'] = jetpack_photon_url( $tags['og:image'], $photon_args );
		}

		return $tags;
	}

	/**
	 * Enqueue Photon helper script
	 *
	 * @uses wp_enqueue_script, plugins_url
	 * @action wp_enqueue_script
	 * @return null
	 */
	public function action_wp_enqueue_scripts() {
		wp_enqueue_script( 'jetpack-photon', plugins_url( 'modules/photon/photon.js', JETPACK__PLUGIN_FILE ), array( 'jquery' ), 20130122, true );
	}
}
