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
	 * The number of threats.
	 *
	 * @var int
	 */
	public $num_threats;

	/**
	 * The number of core threats.
	 *
	 * @var int
	 */
	public $num_core_threats;

	/**
	 * The number of plugin threats.
	 *
	 * @var int
	 */
	public $num_plugins_threats;

	/**
	 * The number of theme threats.
	 *
	 * @var int
	 */
	public $num_themes_threats;

	/**
	 * WordPress core.
	 *
	 * @var array<Extension_Model>
	 */
	public $core = array();

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
	 * File threats.
	 *
	 * @var array<Extension_Model>
	 */
	public $files = array();

	/**
	 * Database threats.
	 *
	 * @var array<Extension_Model>
	 */
	public $database = array();

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
