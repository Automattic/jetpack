<?php
/**
 * Module Name: Photon
 * Module Description: Give your site a boost by loading images from the WordPress.com content delivery network.
 * Sort Order: 15
 * First Introduced: 2.0
 */

class Jetpack_Photon {
	/**
	 * Class variables
	 */
	// Oh look, a singleton
	private static $__instance = null;

	// Allowed extensions must match http://code.trac.wordpress.org/browser/photon/index.php#L31
	protected $extensions = array(
		'gif',
		'jpg',
		'jpeg',
		'png'
	);

	// Don't access this directly. Instead, use this::image_sizes() so it's actually populated with something.
	protected static $image_sizes = null;

	/**
	 * Singleton implementation
	 *
	 * @return object
	 */
	public static function instance() {
		if ( ! is_a( self::$__instance, 'Jetpack_Photon' ) )
			self::$__instance = new Jetpack_Photon;

		return self::$__instance;
	}

	/**
	 * Register actions and filters, but only if basic Photon functions are available.
	 * The basic functions are found in ./functions.photon.php.
	 *
	 * @uses add_action, add_filter
	 * @return null
	 */
	private function __construct() {
		// Display warning if site is private
		add_action( 'jetpack_activate_module_photon', array( $this, 'action_jetpack_activate_module_photon' ) );

		if ( ! function_exists( 'jetpack_photon_url' ) )
			return;

		// Images in post content
		add_filter( 'the_content', array( $this, 'filter_the_content' ), 999999 );

		// Featured images aka post thumbnails
		add_action( 'begin_fetch_post_thumbnail_html', array( $this, 'action_begin_fetch_post_thumbnail_html' ) );
		add_action( 'end_fetch_post_thumbnail_html', array( $this, 'action_end_fetch_post_thumbnail_html' ) );

		// og:image URL
		add_filter( 'jetpack_open_graph_tags', array( $this, 'filter_open_graph_tags' ), 10, 2 );
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
	 * Identify images in post content, and if images are local (uploaded to the current site), pass through Photon.
	 *
	 * @param string $content
	 * @uses this::validate_image_url, apply_filters, jetpack_photon_url, esc_url
	 * @filter the_content
	 * @return string
	 */
	public function filter_the_content( $content ) {
		if ( false != preg_match_all( '#(<a.+?href=["|\'](.+?)["|\'].+?>\s*)?(<img.+?src=["|\'](.+?)["|\'].+?/?>){1}(\s*</a>)?#i', $content, $images ) ) {
			global $content_width;

			foreach ( $images[0] as $index => $tag ) {
				// Default to resize, though fit may be used in certain cases where a dimension cannot be ascertained
				$transform = 'resize';

				// Identify image source
				$src = $src_orig = $images[4][ $index ];

				// Support Automattic's Lazy Load plugin
				// Can't modify $tag yet as we need unadulterated version later
				if ( false != preg_match( '#data-lazy-src=["|\'](.+?)["|\']#i', $images[3][ $index ], $lazy_load_src ) ) {
					$placeholder_src = $placeholder_src_orig = $src;
					$src = $src_orig = $lazy_load_src[1];
				}

				// Check if image URL should be used with Photon
				if ( ! $this->validate_image_url( $src ) )
					continue;

				// Find the width and height attributes
				$width = $height = false;

				// First, check the image tag
				if ( preg_match( '#width=["|\']?(\d+)["|\']?#i', $images[3][ $index ], $width_string ) )
					$width = (int) $width_string[1];

				if ( preg_match( '#height=["|\']?(\d+)["|\']?#i', $images[3][ $index ], $height_string ) )
					$height = (int) $height_string[1];

				// If image tag lacks width and height arguments, try to determine from strings WP appends to resized image filenames.
				if ( false === $width && false === $height && false != preg_match( '#(-\d+x\d+)\.(' . implode('|', $this->extensions ) . '){1}$#i', $src, $width_height_string ) ) {
					$width = (int) $width_height_string[1];
					$height = (int) $width_height_string[2];
				}

				// If width is available, constrain to $content_width
				if ( false !== $width && is_numeric( $content_width ) ) {
					if ( $width > $content_width && false !== $height ) {
						$height = round( ( $content_width * $height ) / $width );
						$width = $content_width;
					}
					elseif ( $width > $content_width ) {
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

				// Build URL, first removing WP's resized string so we pass the original image to Photon
				if ( false != preg_match( '#(-\d+x\d+)\.(' . implode('|', $this->extensions ) . '){1}$#i', $src, $src_parts ) )
					$src = str_replace( $src_parts[1], '', $src );

				// Build array of Photon args and expose to filter before passing to Photon URL function
				$args = array();

				if ( false !== $width && false !== $height )
					$args[ $transform ] = $width . ',' . $height;
				elseif ( false !== $width )
					$args['w'] = $width;
				elseif ( false !== $height )
					$args['h'] = $height;

				$args = apply_filters( 'jetpack_photon_post_image_args', $args, compact( 'tag', 'src', 'src_orig', 'width', 'height' ) );

				$photon_url = jetpack_photon_url( $src, $args );

				// Modify image tag if Photon function provides a URL
				// Ensure changes are only applied to the current image by copying and modifying the matched tag, then replacing the entire tag with our modified version.
				if ( $src != $photon_url ) {
					$new_tag = $tag;

					// Supplant the original source value with our Photon URL
					$photon_url = esc_url( $photon_url );
					$new_tag = str_replace( $src_orig, $photon_url, $new_tag );

					// If Lazy Load is in use, pass placeholder image through Photon
					if ( isset( $placeholder_src ) && $this->validate_image_url( $placeholder_src ) ) {
						$placeholder_src = jetpack_photon_url( $placeholder_src );

						if ( $placeholder_src != $placeholder_src_orig )
							$new_tag = str_replace( $placeholder_src_orig, esc_url( $placeholder_src ), $new_tag );

						unset( $placeholder_src );
					}

					// Remove the width and height arguments from the tag to prevent distortion
					$new_tag = preg_replace( '#(width|height)=["|\']?(\d+)["|\']?\s{1}#i', '', $new_tag );

					// If image is linked to an image (presumably itself, but who knows), pass link href to Photon sans arguments
					if ( ! empty( $images[2][ $index ] ) && false !== strpos( $new_tag, $images[2][ $index ] ) && $this->validate_image_url( $images[2][ $index ] ) )
						$new_tag = str_replace( $images[2][ $index ], jetpack_photon_url( $images[2][ $index ] ), $new_tag );

					$content = str_replace( $tag, $new_tag, $content );
				}

			}
		}

		return $content;
	}

	/**
	 ** POST THUMBNAIL FUNCTIONS
	 **/

	/**
	 * Apply Photon to WP image retrieval functions for post thumbnails
	 *
	 * @uses add_filter
	 * @action begin_fetch_post_thumbnail_html
	 * @return null
	 */
	public function action_begin_fetch_post_thumbnail_html() {
		add_filter( 'image_downsize', array( $this, 'filter_image_downsize' ), 10, 3 );
	}

	/**
	 * Remove Photon from WP image functions when post thumbnail processing is finished
	 *
	 * @uses remove_filter
	 * @action end_fetch_post_thumbnail_html
	 * @return null
	 */
	public function action_end_fetch_post_thumbnail_html() {
		remove_filter( 'image_downsize', array( $this, 'filter_image_downsize' ), 10, 3 );
	}

	/**
	 * Filter post thumbnail image retrieval, passing images through Photon
	 *
	 * @param string|bool $image
	 * @param int $attachment_id
	 * @param string|array $size
	 * @uses is_admin, apply_filters, wp_get_attachment_url, this::validate_image_url, this::image_sizes, jetpack_photon_url
	 * @filter image_downsize
	 * @return string|bool
	 */
	public function filter_image_downsize( $image, $attachment_id, $size ) {
		// Don't foul up the admin side of things, and provide plugins a way of preventing Photon from being applied to images.
		if ( is_admin() && apply_filters( 'jetpack_photon_override_image_downsize', true, compact( 'image', 'attachment_id', 'size' ) ) )
			return $image;

		// Get the image URL and proceed with Photon-ification if successful
		$image_url = wp_get_attachment_url( $attachment_id );

		if ( $image_url ) {
			// Check if image URL should be used with Photon
			if ( ! $this->validate_image_url( $image_url ) )
				return $image;

			// If an image is requested with a size known to WordPress, use that size's settings with Photon
			if ( ( is_string( $size ) || is_int( $size ) ) && array_key_exists( $size, $this->image_sizes() ) ) {
				$image_args = $this->image_sizes();
				$image_args = $image_args[ $size ];

				// Expose arguments to a filter before passing to Photon
				$photon_args = array();

				if ( $image_args['crop'] )
					$photon_args['resize'] = $image_args['width'] . ',' . $image_args['height'];
				else
					$photon_args['fit'] = $image_args['width'] . ',' . $image_args['height'];

				$photon_args = apply_filters( 'jetpack_photon_image_downsize_string', $photon_args, compact( 'image_args', 'image_url', 'attachment_id', 'size' ) );

				// Generate Photon URL
				$image = array(
					jetpack_photon_url( $image_url, $photon_args ),
					false,
					false
				);
			}
			elseif ( is_array( $size ) ) {
				// Pull width and height values from the provided array, if possible
				$width = isset( $size[0] ) ? (int) $size[0] : false;
				$height = isset( $size[1] ) ? (int) $size[1] : false;

				// Don't bother if necessary parameters aren't passed.
				if ( ! $width || ! $height )
					return $image;

				// Expose arguments to a filter before passing to Photon
				$photon_args = array(
					'fit' => $width . ',' . $height
				);

				$photon_args = apply_filters( 'jetpack_photon_image_downsize_array', $photon_args, compact( 'width', 'height', 'image_url', 'attachment_id' ) );

				// Generate Photon URL
				$image = array(
					jetpack_photon_url( $image_url, $photon_args ),
					false,
					false
				);
			}
		}

		return $image;
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
	protected function validate_image_url( $url ) {
		// Parse URL and ensure needed keys exist, since the array returned by `parse_url` only includes the URL components it finds.
		$url_info = wp_parse_args( parse_url( $url ), array(
			'scheme' => null,
			'host'   => null,
			'port'   => null,
			'path'   => null
		) );

		// Bail if scheme isn't http or port is set that isn't port 80
		if ( 'http' != $url_info['scheme'] || ! in_array( $url_info['port'], array( 80, null ) ) )
			return false;

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
		if ( ! in_array( strtolower( pathinfo( $url_info['path'], PATHINFO_EXTENSION ) ), $this->extensions ) )
			return false;

		// If we got this far, we should have an acceptable image URL
		return true;
	}

	/**
	 * Provide an array of available image sizes and corresponding dimensions.
	 * Similar to get_intermediate_image_sizes() except that it includes image sizes' dimensions, not just their names.
	 *
	 * @global $wp_additional_image_sizes
	 * @uses get_option
	 * @return array
	 */
	protected function image_sizes() {
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
}

Jetpack_Photon::instance();