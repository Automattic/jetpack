<?php
/**
 * Mock Tus client for testing the VideoPress Uploader without network access.
 *
 * @package automattic/jetpack-videopress
 */

namespace Automattic\Jetpack\VideoPress;

/**
 * Records the metadata attached by the Uploader and skips the real upload.
 */
class Mock_Tus_Client {

	/**
	 * The metadata attached to the upload, keyed by metadata name.
	 *
	 * @var array
	 */
	public $metadata = array();

	/**
	 * Records the file, mirroring Tus_Client::file().
	 *
	 * @param string      $file File path.
	 * @param string|null $name File name.
	 * @return Mock_Tus_Client
	 */
	public function file( $file, $name = null ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return $this;
	}

	/**
	 * Records a metadata value, mirroring Tus_Client::add_metadata().
	 *
	 * @param string $key   The metadata name.
	 * @param string $value The metadata value.
	 * @return Mock_Tus_Client
	 */
	public function add_metadata( $key, $value ) {
		$this->metadata[ $key ] = $value;
		return $this;
	}

	/**
	 * Pretends to upload, returning a partial byte count so the Uploader reports "uploading".
	 *
	 * @param int $bytes The chunk size.
	 * @return int
	 */
	public function upload( $bytes = -1 ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		return 0;
	}
}
