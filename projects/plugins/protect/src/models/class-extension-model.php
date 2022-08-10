<?php
/**
 * Model class for extensions.
 *
 * @package automattic/jetpack-protect-plugin
 */

namespace Automattic\Jetpack\Protect;

/**
 * Model class for extension data.
 */
class Extension_Model {

	/**
	 * The extension name.
	 *
	 * @var string
	 */
	public $name;

	/**
	 * The extension slug.
	 *
	 * @var string
	 */
	public $slug;

	/**
	 * The extension version.
	 *
	 * @var string
	 */
	public $version;

	/**
	 * A collection of vulnerabilities related to this version of the extension.
	 *
	 * @var array<Threat_Model>
	 */
	public $vulnerabilities = array();

	/**
	 * Whether the extension has been checked for vulnerabilities.
	 *
	 * @var bool
	 */
	public $checked;

	/**
	 * The type of extension ("plugins", "themes", or "core").
	 *
	 * @var string
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
	 * Set Vulnerabilities
	 *
	 * @param array<Threat_Model|array|object> $vulnerabilities An array of vulnerability data to add to the extension.
	 */
	private function set_vulnerabilities( $vulnerabilities ) {
		if ( ! is_array( $vulnerabilities ) ) {
			$this->vulnerabilities = array();
			return;
		}

		// convert each provided vulnerability item into an instance of Threat_Model
		$vulnerabilities = array_map(
			function ( $vulnerability ) {
				if ( is_a( $vulnerability, 'Threat_Model' ) ) {
					return $vulnerability;
				}

				if ( is_object( $vulnerability ) ) {
					$vulnerability = (array) $vulnerability;
				}

				return new Threat_Model( $vulnerability );
			},
			$vulnerabilities
		);

		$this->vulnerabilities = $vulnerabilities;
	}

}
