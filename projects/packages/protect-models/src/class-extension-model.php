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
}
