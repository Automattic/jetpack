<?php
/**
 * The Image Class.
 *
 * @package Jetpack
 */

/**
 * Represents a resizable image, exposing properties necessary for properly generating srcset.
 */
class Jetpack_Photon_Image {

	/**
	 * @var string $filename Attachment's Filename.
	 */
	public $filename;

	/**
	 * @var string/WP_Erorr $mime_type Attachment's mime-type, WP_Error on failure when recalculating the dimensions.
	 */
	private $mime_type;

	/**
	 * @var int $original_width Image original width.
	 */
	private $original_width;

	/**
	 * @var int $original_width Image original height.
	 */
	private $original_height;

	/**
	 * @var int $width Current attachment's width.
	 */
	private $width;

	/**
	 * @var int $height Current attachment's height.
	 */
	private $height;

	/**
	 * @var bool $is_resized Whether the attachment has been resized yet, or not.
	 */
	private $is_resized = false;

	/**
	 * Constructs the image object.
	 *
	 * The $data array should provide at least
	 *  file   : string Image file path
	 *  width  : int    Image width
	 *  height : int    Image height
	 *
	 * @param array $data                 Array of attachment metadata, typically value of _wp_attachment_metadata postmeta
	 * @param string|\WP_Error $mime_type Typically value returned from get_post_mime_type function.
	 */
	public function __construct( $data, $mime_type ) {
		$this->filename = $data['file'];
		$this->width = $this->original_width = $data['width'];
		$this->height = $this->original_height = $data['height'];
		$this->mime_type = $mime_type;
	}

	/**
	 * Resizes the image to given size.
	 *
	 * @param array $size_data Array of width, height, and crop properties of a size.
	 *
	 * @return bool|\WP_Error True if resize was successful, WP_Error on failure.
	 */
	public function resize( $size_data ) {

		$dimensions = $this->image_resize_dimensions( $size_data['width'], $size_data['height'], $size_data['crop'] );

		if ( true === is_wp_error( $dimensions ) ) {
			return $dimensions; // Returns \WP_Error.
		}

		if ( true === is_wp_error( $this->mime_type ) ) {
			return $this->mime_type; // Returns \WP_Error.
		}

		$this->set_width_height( $dimensions );

		return $this->is_resized = true;
	}

	/**
	 * Generates size data for usage in $metadata['sizes'];.
	 *
	 * @param array $size_data Array of width, height, and crop properties of a size.
	 *
	 * @return array|\WP_Error An array containing file, width, height, and mime-type keys and it's values. WP_Error on failure.
	 */
	public function get_size( $size_data ) {

		$is_resized = $this->resize( $size_data );

		if ( true === is_wp_error( $is_resized ) ) {
			return $is_resized;
		}

		return array(
			'file'      => $this->get_filename(),
			'width'     => $this->get_width(),
			'height'    => $this->get_height(),
			'mime-type' => $this->get_mime_type(),
		);
	}

	/**
	 * Resets the image to it's original dimensions.
	 *
	 * @return bool True on successful reset to original dimensions.
	 */
	public function reset_to_original() {
		$this->width      = $this->original_width;
		$this->height     = $this->original_height;
		$this->is_resized = false;

		return true;
	}

	/**
	 * Return the basename filename. If the image has been resized, including
	 * the resizing params for Jetpack CDN.
	 *
	 * @return string Basename of the filename.
	 */
	public function get_filename() {

		if ( true === $this->is_resized() ) {
			$filename = $this->get_resized_filename();
		} else {
			$filename = $this->filename;
		}

		return wp_basename( $filename );
	}

	/**
	 * Returns current image width. Either original, or after resize.
	 *
	 * @return int
	 */
	public function get_width() {
		return (int) $this->width;
	}

	/**
	 * Returns current image height. Either original, or after resize.
	 *
	 * @return int
	 */
	public function get_height() {
		return (int) $this->height;
	}

	/**
	 * Returns image mime type.
	 *
	 * @return string|WP_Error Image's mime type or WP_Error if it was not determined.
	 */
	public function get_mime_type() {
		return $this->mime_type;
	}

	/**
	 * Checks the resize status of the image.
	 *
	 * @return bool If the image has been resized.
	 */
	public function is_resized() {
		return ( true === $this->is_resized );
	}

	/**
	 * Get filename with proper args for the Photon service.
	 *
	 * @return string Filename with query args for Photon service
	 */
	protected function get_resized_filename() {
		$query_args = array(
			'resize' => join(
				',',
				array(
					$this->get_width(),
					$this->get_height(),
				)
			),
		);

		return add_query_arg( $query_args, $this->filename );
	}

	/**
	 * Get resize dimensions used for the Jetpack CDN service.
	 *
	 * Converts the list of values returned from `image_resize_dimensions()` to
	 * associative array for the sake of more readable code no relying on index
	 * nor `list`.
	 *
	 * @param int $max_width
	 * @param int $max_height
	 * @param bool|array $crop
	 *
	 * @return array|\WP_Error Array of dimensions matching the parameters to imagecopyresampled. WP_Error on failure.
	 */
	protected function image_resize_dimensions( $max_width, $max_height, $crop ) {
		$dimensions = image_resize_dimensions( $this->original_width, $this->original_height, $max_width, $max_height, $crop );
		if ( ! $dimensions ) {
			return new WP_Error( 'error_getting_dimensions', __( 'Could not calculate resized image dimensions' ), $this->filename );
		}

		return array_combine(
			array(
				'dst_x',
				'dst_y',
				'src_x',
				'src_y',
				'dst_w',
				'dst_h',
				'src_w',
				'src_h',
			),
			$dimensions
		);
	}

	/**
	 * Sets proper width and height from dimensions.
	 *
	 * @param array $dimensions an array of image dimensions.
	 * @return void
	 */
	protected function set_width_height( $dimensions ) {
		$this->width  = (int) $dimensions['dst_w'];
		$this->height = (int) $dimensions['dst_h'];
	}

}
