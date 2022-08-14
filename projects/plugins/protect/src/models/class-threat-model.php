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
	 * @var string
	 */
	public $id;

	/**
	 * Threat Signature.
	 *
	 * @var string
	 */
	public $signature;

	/**
	 * Threat Title.
	 *
	 * @var string
	 */
	public $title;

	/**
	 * Threat Description.
	 *
	 * @var string
	 */
	public $description;

	/**
	 * The data the threat was first detected.
	 *
	 * @var string
	 */
	public $first_detected;

	/**
	 * The version the threat is fixed in.
	 *
	 * @var string
	 */
	public $fixed_in;

	/**
	 * The severity of the threat between 1-5.
	 *
	 * @var int
	 */
	public $severity;

	/**
	 * Whether the threat is fixable.
	 *
	 * @var bool
	 */
	public $fixable;

	/**
	 * Information about the auto-fix available for this threat.
	 *
	 * @var object
	 */
	public $fixer;

	/**
	 * The current status of the threat.
	 *
	 * @var string
	 */
	public $status;

	/**
	 * The filename of the threat.
	 *
	 * @var string
	 */
	public $filename;

	/**
	 * The context of the threat.
	 *
	 * @var object
	 */
	public $context;

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
