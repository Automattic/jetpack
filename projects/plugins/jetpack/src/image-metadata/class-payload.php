<?php
/**
 * Immutable carrier for extracted provenance bytes.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Holds the raw, verbatim chunk/segment byte strings extracted from one source
 * image, reused across all of that image's derivatives.
 */
final class Payload {

	/**
	 * Raw, verbatim chunk/segment byte strings.
	 *
	 * @var string[]
	 */
	private $segments;

	/**
	 * Constructor.
	 *
	 * @param string[] $segments Raw chunk/segment byte strings.
	 */
	public function __construct( array $segments ) {
		$this->segments = $segments;
	}

	/**
	 * Get the raw, verbatim chunk/segment byte strings.
	 *
	 * @return string[]
	 */
	public function get_segments() {
		return $this->segments;
	}

	/**
	 * Check whether there is nothing to transplant.
	 *
	 * @return bool True when there is nothing to transplant.
	 */
	public function is_empty() {
		return empty( $this->segments );
	}
}
