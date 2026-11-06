<?php
/**
 * Stands in for the photon-opencv extension, which the tests can't load.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Writes a small JPEG over whatever file it converts.
 */
class Photon_OpenCV {

	/**
	 * Reads nothing.
	 *
	 * @param string $filepath Path of the image.
	 */
	public function readimage( $filepath ) {} // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

	/**
	 * Ignores the format: the output is always a JPEG.
	 *
	 * @param string $format The output format.
	 */
	public function setimageformat( $format ) {} // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

	/**
	 * Writes the JPEG.
	 *
	 * @param string $output Path to write to.
	 */
	public function writeimage( $output ) {
		do_action( 'jetpack_test_photon_opencv_before_write', $output );
		imagejpeg( imagecreatetruecolor( 8, 8 ), $output );
	}
}
