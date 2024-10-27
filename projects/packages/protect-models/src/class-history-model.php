<?php
/**
 * Model class for Protect history report data.
 *
 * @package automattic/jetpack-protect-models
 */

namespace Automattic\Jetpack\Protect_Models;

/**
 * Model class for the Protect history report data.
 */
class History_Model {
	/**
	 * The date and time when the history was generated.
	 *
	 * @var string
	 */
	public $last_checked;

	/**
	 * Database threats.
	 *
	 * @var array<Threat_Model>
	 */
	public $threats = array();

	/**
	 * Whether there was an error loading the history.
	 *
	 * @var bool
	 */
	public $error = false;

	/**
	 * The error code thrown when loading the history.
	 *
	 * @var string
	 */
	public $error_code;

	/**
	 * The error message thrown when loading the history.
	 *
	 * @var string
	 */
	public $error_message;

	/**
	 * Status constructor.
	 *
	 * @param array $history The history data to load into the class instance.
	 */
	public function __construct( $history = array() ) {
		foreach ( $history as $property => $value ) {
			if ( property_exists( $this, $property ) ) {
				$this->$property = $value;
			}
		}
	}
}
