<?php
/**
 * Immutable carrier for extracted provenance bytes.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Plugin\Image_Metadata;

/**
 * Holds raw chunks or segments extracted from a source image.
 */
final class Payload {

	/**
	 * Raw chunk or segment bytes.
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
	 * Get the raw chunks or segments.
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
