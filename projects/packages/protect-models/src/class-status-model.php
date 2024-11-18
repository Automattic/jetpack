<?php
/**
 * Model class for Protect status report data.
 *
 * @package automattic/jetpack-protect-models
 */

namespace Automattic\Jetpack\Protect_Models;

/**
 * Model class for the Protect status report data.
 */
class Status_Model {
	/**
	 * Data source.
	 *
	 * @var string protect_report|scan_api
	 */
	public $data_source;

	/**
	 * The date and time when the status was generated.
	 *
	 * @var string
	 */
	public $last_checked;

	/**
	 * The current report status.
	 *
	 * @var string in_progress|scheduled|idle|scanning|provisioning|unavailable
	 */
	public $status;

	/**
	 * The current reported security threats.
	 *
	 * @since 0.4.0
	 *
	 * @var array<Threat_Model>
	 */
	public $threats = array();

	/**
	 * List of fixable threat IDs.
	 *
	 * @var string[]
	 */
	public $fixable_threat_ids = array();

	/**
	 * Whether the site includes items that have not been checked.
	 *
	 * @var boolean
	 */
	public $has_unchecked_items;

	/**
	 * The estimated percentage of the current scan.
	 *
	 * @var int
	 */
	public $current_progress;

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
	 * The number of threats.
	 *
	 * @deprecated 0.4.0 This property is deprecated. Count Status_Model::$threats instead.
	 *
	 * @var int
	 */
	public $num_threats;

	/**
	 * The number of plugin threats.
	 *
	 * @deprecated 0.4.0 This property is deprecated. Filter and count Status_Model::$threats instead.
	 *
	 * @var int
	 */
	public $num_plugins_threats;

	/**
	 * The number of theme threats.
	 *
	 * @deprecated 0.4.0 This property is deprecated. Filter and count Status_Model::$threats instead.
	 *
	 * @var int
	 */
	public $num_themes_threats;

	/**
	 * WordPress core status.
	 *
	 * @deprecated 0.4.0 This property is deprecated. Filter and use Status_Model::$threats instead.
	 *
	 * @var object
	 */
	public $core;

	/**
	 * Status themes.
	 *
	 * @deprecated 0.4.0 This property is deprecated. Filter and use Status_Model::$threats instead.
	 *
	 * @var array<Extension_Model>
	 */
	public $themes = array();

	/**
	 * Status plugins.
	 *
	 * @deprecated 0.4.0 This property is deprecated. Filter and use Status_Model::$threats instead.
	 *
	 * @var array<Extension_Model>
	 */
	public $plugins = array();

	/**
	 * File threats.
	 *
	 * @deprecated 0.4.0 This property is deprecated. Filter and use Status_Model::$threats instead.
	 *
	 * @var array<Extension_Model>
	 */
	public $files = array();

	/**
	 * Database threats.
	 *
	 * @deprecated 0.4.0 This property is deprecated. Filter and use Status_Model::$threats instead.
	 *
	 * @var array<Extension_Model>
	 */
	public $database = array();

	/**
	 * Status constructor.
	 *
	 * @param array $status The status data to load into the class instance.
	 */
	public function __construct( $status = array() ) {
		// set status defaults
		// @phan-suppress-next-line PhanDeprecatedProperty -- Maintaining backwards compatibility.
		$this->core = new \stdClass();

		foreach ( $status as $property => $value ) {
			if ( property_exists( $this, $property ) ) {
				$this->$property = $value;
			}
		}
	}
}
