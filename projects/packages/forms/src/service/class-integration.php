<?php
/**
 * Integration class for Jetpack Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

/**
 * Simple class representing a form integration.
 */
class Integration {

	/**
	 * The integration name/slug.
	 *
	 * @var string
	 */
	private $name;

	/**
	 * The integration configuration arguments.
	 *
	 * @var array
	 */
	private $args;

	/**
	 * Constructor.
	 *
	 * @param string $name The integration name/slug.
	 * @param array  $args The integration configuration arguments.
	 */
	public function __construct( $name, $args = array() ) {
		$this->name = $name;
		$this->args = $args;
	}

	/**
	 * Get the integration name/slug.
	 *
	 * @return string
	 */
	public function get_name() {
		return $this->name;
	}

	/**
	 * Get the integration configuration arguments.
	 *
	 * @return array
	 */
	public function get_args() {
		return $this->args;
	}

	/**
	 * Convert the integration to an array format.
	 *
	 * @return array
	 */
	public function to_array() {
		return $this->args;
	}
}
