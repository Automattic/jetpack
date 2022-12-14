<?php
/**
 * Model class for threat data.
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

/**
 * Model class for threat data.
 */
class Threat_Model {

	/**
	 * Threat ID.
	 *
	 * @var null|string
	 */
	public $id;

	/**
	 * Threat Signature.
	 *
	 * @var null|string
	 */
	public $signature;

	/**
	 * Threat Title.
	 *
	 * @var null|string
	 */
	public $title;

	/**
	 * Threat Description.
	 *
	 * @var null|string
	 */
	public $description;

	/**
	 * The data the threat was first detected.
	 *
	 * @var null|string
	 */
	public $first_detected;

	/**
	 * The version the threat is fixed in.
	 *
	 * @var null|string
	 */
	public $fixed_in;

	/**
	 * The severity of the threat between 1-5.
	 *
	 * @var null|int
	 */
	public $severity;

	/**
	 * Information about the auto-fix available for this threat. False when not auto-fixable.
	 *
	 * @var null|bool|object
	 */
	public $fixable;

	/**
	 * The current status of the threat.
	 *
	 * @var null|string
	 */
	public $status;

	/**
	 * The filename of the threat.
	 *
	 * @var null|string
	 */
	public $filename;

	/**
	 * The context of the threat.
	 *
	 * @var null|object
	 */
	public $context;

	/**
	 * The source URL of the threat.
	 *
	 * @var null|string
	 */
	public $source;

	/**
	 * Threat Constructor
	 *
	 * @param array|object $threat Threat data to load into the class instance.
	 */
	public function __construct( $threat ) {
		if ( is_object( $threat ) ) {
			$threat = (array) $threat;
		}

		foreach ( $threat as $property => $value ) {
			if ( property_exists( $this, $property ) ) {
				$this->$property = $value;
			}
		}
	}

}
