<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName
/**
 * The Image Class.
 *
 * @package automattic/jetpack-image-cdn
 */

namespace Automattic\Jetpack\Image_CDN;

/**
 * Represents a resizable image, exposing properties necessary for properly generating srcset.
 */
class Image_CDN_Image {

	/**
	 * Attachment's Filename.
	 *
	 * @var string
	 */
	public $filename;

	/**
	 * Attachment's mime-type, WP_Error on failure when recalculating the dimensions.
	 *
	 * @var string|WP_Error
	 */
	private $mime_type;

	/**
	 * Image original width.
	 *
	 * @var int
	 */
	private $original_width;

	/**
	 * Image original height.
	 *
	 * @var int
	 */
	private $original_height;

	/**
	 * Current attachment's width.
	 *
	 * @var int
	 */
	private $width;

	/**
	 * Current attachment's height.
	 *
	 * @var int
	 */
	private $height;

	/**
	 * Whether the attachment has been resized yet, or not.
	 *
	 * @var bool
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
	 * @param array            $data                Array of attachment metadata, typically value of _wp_attachment_metadata postmeta.
	 * @param string|\WP_Error $mime_type Typically value returned from get_post_mime_type function.
	 */
	public function __construct( $data, $mime_type ) {
		$this->filename        = $data['file'];
		$this->original_width  = $data['width'];
		$this->original_height = $data['height'];
		$this->width           = $this->original_width;
		$this->height          = $this->original_height;
		$this->mime_type       = $mime_type;
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

		$this->is_resized = true;

		return true;
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
		return wp_basename( $this->get_raw_filename() );
	}

	/**
	 * Return the absolute filename. If the image has been resized, including
	 * the resizing params for Jetpack CDN.
	 *
	 * @return string Filename.
	 */
	public function get_raw_filename() {
		return $this->is_resized() ? $this->get_resized_filename() : $this->filename;
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
	 * @return string|\WP_Error Image's mime type or WP_Error if it was not determined.
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
			'resize' => implode(
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
	 * @param int        $max_width  Maximum width.
	 * @param int        $max_height Maximum height.
	 * @param bool|array $crop       Cropping parameters.
	 *
	 * @return array|\WP_Error Array of dimensions matching the parameters to imagecopyresampled. WP_Error on failure.
	 */
	protected function image_resize_dimensions( $max_width, $max_height, $crop ) {
		$dimensions = image_resize_dimensions( $this->original_width, $this->original_height, $max_width, $max_height, $crop );
		if ( ! $dimensions ) {
			return new \WP_Error( 'error_getting_dimensions', __( 'Could not calculate resized image dimensions', 'jetpack-image-cdn' ), $this->filename );
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
