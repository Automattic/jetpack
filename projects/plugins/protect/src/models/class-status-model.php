<?php
/**
 * Model class for Protect status report data.
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

/**
 * Model class for the Protect status report data.
 */
class Status_Model {
	/**
	 * The date and time when the status was generated.
	 *
	 * @var string
	 */
	public $last_checked;

	/**
	 * The number of vulnerabilities.
	 *
	 * @var int
	 */
	public $num_vulnerabilities;

	/**
	 * The number of plugin vulnerabilities.
	 *
	 * @var int
	 */
	public $num_plugins_vulnerabilities;

	/**
	 * The number of theme vulnerabilities.
	 *
	 * @var int
	 */
	public $num_themes_vulnerabilities;

	/**
	 * The current report status.
	 *
	 * @var string
	 */
	public $status;

	/**
	 * WordPress core status.
	 *
	 * @var object
	 */
	public $core;

	/**
	 * Status themes.
	 *
	 * @var array<Extension_Model>
	 */
	public $themes = array();

	/**
	 * Status plugins.
	 *
	 * @var array<Extension_Model>
	 */
	public $plugins = array();

	/**
	 * Whether the site includes items that have not been checked.
	 *
	 * @var boolean
	 */
	public $has_unchecked_items;

	/**
	 * Whether there was an error loading the status.
	 *
	 * @var bool
	 */
	public $error = false;

	/**
	 * The error code thrown when loading the status.
	 *
	 * @var string
	 */
	public $error_code;

	/**
	 * The error message thrown when loading the status.
	 *
	 * @var string
	 */
	public $error_message;

	/**
	 * Status constructor.
	 *
	 * @param array $status The status data to load into the class instance.
	 */
	public function __construct( $status = array() ) {
		// set status defaults
		$this->core = new \stdClass();

		foreach ( $status as $property => $value ) {
			if ( property_exists( $this, $property ) ) {
				$this->$property = $value;
			}
		}
	}

}
