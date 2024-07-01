<?php
/**
 * Model class for Protect history report data.
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

/**
 * Model class for the Protect history report data.
 */
class History_Model {
	/**
	 * The number of all previously active threats.
	 *
	 * @var int
	 */
	public $num_threats = 0;

	/**
	 * The number of fixed threats.
	 *
	 * @var int
	 */
	public $num_fixed_threats = 0;

	/**
	 * The number of ignored threats.
	 *
	 * @var int
	 */
	public $num_ignored_threats = 0;

	/**
	 * All previously active threats, sorted by most recent.
	 *
	 * @var array<Extension_Model>
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
