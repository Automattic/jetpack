<?php
/**
 * Model class for vulnerability data.
 *
 * @package automattic/jetpack-protect-models
 */

namespace Automattic\Jetpack\Protect_Models;

use Automattic\Jetpack\Redirect;

/**
 * Model class for vulnerability data.
 */
class Vulnerability_Model {
	/**
	 * Vulnerability ID.
	 *
	 * @var null|string
	 */
	public $id;

	/**
	 * Vulnerability Title.
	 *
	 * @var null|string
	 */
	public $title;

	/**
	 * Vulnerability Description.
	 *
	 * @var null|string
	 */
	public $description;

	/**
	 * The version the vulnerability is fixed in.
	 *
	 * @var null|string
	 */
	public $fixed_in;

	/**
	 * The version the vulnerability was introduced.
	 *
	 * @var null|string
	 */
	public $introduced_in;

	/**
	 * The type of vulnerability.
	 *
	 * @var null|string
	 */
	public $type;

	/**
	 * The source URL for the vulnerability.
	 *
	 * @var null|string
	 */
	public $source;

	/**
	 * Vulnerability Constructor
	 *
	 * @param array|object $vulnerability Vulnerability data to load into the class instance.
	 */
	public function __construct( $vulnerability ) {
		// Initialize the vulnerability data.
		foreach ( $vulnerability as $property => $value ) {
			if ( property_exists( $this, $property ) ) {
				$this->$property = $value;
			}
		}

		// Ensure the source URL is set.
		$this->get_source();
	}

	/**
	 * Get the source URL for the vulnerability.
	 *
	 * @return string
	 */
	public function get_source() {
		if ( empty( $this->source ) && $this->id ) {
			$this->source = Redirect::get_url( 'jetpack-protect-vul-info', array( 'path' => $this->id ) );
		}

		return $this->source;
	}
}
