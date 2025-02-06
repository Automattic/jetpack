<?php
/**
 * Model class for extensions.
 *
 * @package automattic/jetpack-protect-models
 */

namespace Automattic\Jetpack\Protect_Models;

/**
 * Model class for extension data.
 */
class Extension_Model {

	/**
	 * The extension name.
	 *
	 * @var null|string
	 */
	public $name;

	/**
	 * The extension slug.
	 *
	 * @var null|string
	 */
	public $slug;

	/**
	 * The extension version.
	 *
	 * @var null|string
	 */
	public $version;

	/**
	 * A collection of threats related to this version of the extension.
	 *
	 * @deprecated 0.4.0 This property is deprecated. Use Threat_Model::$extension instead.
	 *
	 * @var array<Threat_Model>
	 */
	public $threats = array();

	/**
	 * Whether the extension has been checked for threats.
	 *
	 * @var null|bool
	 */
	public $checked;

	/**
	 * The type of extension ("plugins", "themes", or "core").
	 *
	 * @var null|string
	 */
	public $type;

	/**
	 * Extension Model Constructor
	 *
	 * @param array|object $extension Extension data to load into the model instance.
	 */
	public function __construct( $extension = array() ) {
		if ( is_object( $extension ) ) {
			$extension = (array) $extension;
		}

		foreach ( $extension as $property => $value ) {
			if ( property_exists( $this, $property ) ) {
				// use the property's setter method when possible
				if ( method_exists( $this, "set_$property" ) ) {
					$this->{ "set_$property" }( $value );
					continue;
				}

				// otherwise, map the value directly into the class property
				$this->$property = $value;
			}
		}
	}

	/**
	 * Set Threats
	 *
	 * @deprecated 0.4.0 This method is deprecated. Use Threat_Model::$extension instead.
	 *
	 * @param array<Threat_Model|array|object> $threats An array of threat data to add to the extension.
	 */
	public function set_threats( $threats ) {
		if ( ! is_array( $threats ) ) {
			// @phan-suppress-next-line PhanDeprecatedProperty -- Maintaining backwards compatibility.
			$this->threats = array();
			return;
		}

		// convert each provided threat item into an instance of Threat_Model
		$threats = array_map(
			function ( $threat ) {
				if ( is_a( $threat, 'Threat_Model' ) ) {
					return $threat;
				}

				if ( is_object( $threat ) ) {
					$threat = (array) $threat;
				}

				return new Threat_Model( $threat );
			},
			$threats
		);

		// @phan-suppress-next-line PhanDeprecatedProperty -- Maintaining backwards compatibility.
		$this->threats = $threats;
	}
}
