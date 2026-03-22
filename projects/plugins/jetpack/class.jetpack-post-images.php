<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * Useful for finding an image to display alongside/in representation of a specific post.
 *
 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images instead.
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Post_Media\Images;

/**
 * Useful for finding an image to display alongside/in representation of a specific post.
 *
 * Includes a few different methods, all of which return a similar-format array containing
 * details of any images found. Everything can (should) be called statically, it's just a
 * function-bucket. You can also call Jetpack_PostImages::get_image() to cycle through all of the methods until
 * one of them finds something useful.
 *
 * This file is included verbatim in Jetpack
 *
 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images instead.
 *
 * @see Automattic\Jetpack\Post_Media\Images
 */
class Jetpack_PostImages {
	/**
	 * If a slideshow is embedded within a post, then parse out the images involved and return them
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::from_slideshow() instead.
	 *
	 * @param int $post_id Post ID.
	 * @param int $width Image width.
	 * @param int $height Image height.
	 * @return array Images.
	 */
	public static function from_slideshow( $post_id, $width = 200, $height = 200 ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::from_slideshow' );
		return Images::from_slideshow( $post_id, $width, $height );
	}

	/**
	 * Filtering out images with broken URL from galleries.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::filter_gallery_urls() instead.
	 *
	 * @param array $galleries Galleries.
	 * @return array $filtered_galleries
	 */
	public static function filter_gallery_urls( $galleries ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::filter_gallery_urls' );
		return Images::filter_gallery_urls( $galleries );
	}

	/**
	 * If a gallery is detected, then get all the images from it.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::from_gallery() instead.
	 *
	 * @param int $post_id Post ID.
	 * @param int $width Minimum image width to consider.
	 * @param int $height Minimum image height to consider.
	 * @return array Images.
	 */
	public static function from_gallery( $post_id, $width = 200, $height = 200 ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::from_gallery' );
		return Images::from_gallery( $post_id, $width, $height );
	}

	/**
	 * Get attachment images for a specified post and return them. Also make sure
	 * their dimensions are at or above a required minimum.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::from_attachment() instead.
	 *
	 * @param  int $post_id The post ID to check.
	 * @param  int $width Image width.
	 * @param  int $height Image height.
	 * @return array Containing details of the image, or empty array if none.
	 */
	public static function from_attachment( $post_id, $width = 200, $height = 200 ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::from_attachment' );
		return Images::from_attachment( $post_id, $width, $height );
	}

	/**
	 * Check if a Featured Image is set for this post, and return it in a similar
	 * format to the other images?_from_*() methods.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::from_thumbnail() instead.
	 *
	 * @param  int $post_id The post ID to check.
	 * @param  int $width Image width.
	 * @param  int $height Image height.
	 * @return array containing details of the Featured Image, or empty array if none.
	 */
	public static function from_thumbnail( $post_id, $width = 200, $height = 200 ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::from_thumbnail' );
		return Images::from_thumbnail( $post_id, $width, $height );
	}

	/**
	 * Get images from Gutenberg Image blocks.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::from_blocks() instead.
	 *
	 * @param mixed $html_or_id The HTML string to parse for images, or a post id.
	 * @param int   $width      Minimum Image width.
	 * @param int   $height     Minimum Image height.
	 */
	public static function from_blocks( $html_or_id, $width = 200, $height = 200 ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::from_blocks' );
		return Images::from_blocks( $html_or_id, $width, $height );
	}

	/**
	 * Very raw -- just parse the HTML and pull out any/all img tags and return their src
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::from_html() instead.
	 *
	 * @param mixed $html_or_id The HTML string to parse for images, or a post id.
	 * @param int   $width      Minimum Image width.
	 * @param int   $height     Minimum Image height.
	 *
	 * @return array containing images
	 */
	public static function from_html( $html_or_id, $width = 200, $height = 200 ) {
		return Images::from_html( $html_or_id, $width, $height );
	}

	/**
	 * Data from blavatar.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::from_blavatar() instead.
	 *
	 * @param    int $post_id The post ID to check.
	 * @param    int $size Size.
	 * @return array containing details of the image, or empty array if none.
	 */
	public static function from_blavatar( $post_id, $size = 96 ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::from_blavatar' );
		return Images::from_blavatar( $post_id, $size );
	}

	/**
	 * Gets a post image from the author avatar.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::from_gravatar() instead.
	 *
	 * @param int          $post_id The post ID to check.
	 * @param int          $size The size of the avatar to get.
	 * @param string|false $default The default image to use.
	 * @return array containing details of the image, or empty array if none.
	 */
	public static function from_gravatar( $post_id, $size = 96, $default = false ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::from_gravatar' );
		return Images::from_gravatar( $post_id, $size, $default );
	}

	/**
	 * Run through the different methods that we have available to try to find a single good
	 * display image for this post.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::get_image() instead.
	 *
	 * @param int   $post_id Post ID.
	 * @param array $args Other arguments (currently width and height required for images where possible to determine).
	 * @return array|null containing details of the best image to be used, or null if no image is found.
	 */
	public static function get_image( $post_id, $args = array() ) {
		return Images::get_image( $post_id, $args );
	}

	/**
	 * Get an array containing a collection of possible images for this post, stopping once we hit a method
	 * that returns something useful.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::get_images() instead.
	 *
	 * @param  int   $post_id Post ID.
	 * @param  array $args Optional args, see defaults list for details.
	 * @return array containing images that would be good for representing this post
	 */
	public static function get_images( $post_id, $args = array() ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::get_images' );
		return Images::get_images( $post_id, $args );
	}

	/**
	 * Takes an image and base pixel dimensions and returns a srcset for the
	 * resized and cropped images, based on a fixed set of multipliers.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::generate_cropped_srcset() instead.
	 *
	 * @param  array $image Array containing details of the image.
	 * @param  int   $base_width Base image width (i.e., the width at 1x).
	 * @param  int   $base_height Base image height (i.e., the height at 1x).
	 * @param  bool  $use_widths Whether to generate the srcset with widths instead of multipliers.
	 * @return string The srcset for the image.
	 */
	public static function generate_cropped_srcset( $image, $base_width, $base_height, $use_widths = false ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::generate_cropped_srcset' );
		return Images::generate_cropped_srcset( $image, $base_width, $base_height, $use_widths );
	}

	/**
	 * Takes an image URL and pixel dimensions then returns a URL for the
	 * resized and cropped image.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::fit_image_url() instead.
	 *
	 * @param  string $src Image URL.
	 * @param  int    $width Image width.
	 * @param  int    $height Image height.
	 * @return string Transformed image URL
	 */
	public static function fit_image_url( $src, $width, $height ) {
		return Images::fit_image_url( $src, $width, $height );
	}

	/**
	 * Get HTML from given post content.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::get_post_html() instead.
	 *
	 * @param mixed $html_or_id The HTML string to parse for images, or a post id.
	 *
	 * @return array $html_info {
	 * @type string $html     Post content.
	 * @type string $post_url Post URL.
	 * }
	 */
	public static function get_post_html( $html_or_id ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::get_post_html' );
		return Images::get_post_html( $html_or_id );
	}

	/**
	 * Get info about a WordPress attachment.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::get_attachment_data() instead.
	 *
	 * @param int    $attachment_id Attachment ID.
	 * @param string $post_url      URL of the post, if we have one.
	 * @param int    $width         Minimum Image width.
	 * @param int    $height        Minimum Image height.
	 * @return array|bool           Image data or false if unavailable.
	 */
	public static function get_attachment_data( $attachment_id, $post_url, $width, $height ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::get_attachment_data' );
		return Images::get_attachment_data( $attachment_id, $post_url, $width, $height );
	}

	/**
	 * Get the alt text for an image or other media from the Media Library.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::get_alt_text() instead.
	 *
	 * @param int $attachment_id The Post ID of the media.
	 * @return string The alt text value or an empty string.
	 */
	public static function get_alt_text( $attachment_id ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::get_alt_text' );
		return Images::get_alt_text( $attachment_id );
	}

	/**
	 * Determine the size to use with Photon for a thumbnail image.
	 * Images larger than the maximum thumbnail dimension in either dimension are resized to maintain aspect ratio.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::determine_thumbnail_size_for_photon() instead.
	 *
	 * @param int $width Original image width.
	 * @param int $height Original image height.
	 * @return array Array containing the width and height to use with Photon (null means auto).
	 */
	public static function determine_thumbnail_size_for_photon( $width, $height ) {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::determine_thumbnail_size_for_photon' );
		return Images::determine_thumbnail_size_for_photon( $width, $height );
	}

	/**
	 * Function to provide the maximum dimension for a thumbnail image.
	 * Filterable via the `jetpack_post_images_max_dimension` filter.
	 *
	 * @deprecated 15.7 Use Automattic\Jetpack\Post_Media\Images::get_max_thumbnail_dimension() instead.
	 *
	 * @return int The maximum dimension for a thumbnail image.
	 */
	public static function get_max_thumbnail_dimension() {
		_deprecated_function( __METHOD__, '15.7', 'Automattic\Jetpack\Post_Media\Images::get_max_thumbnail_dimension' );
		return Images::get_max_thumbnail_dimension();
	}
}
