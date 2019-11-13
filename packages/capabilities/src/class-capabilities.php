<?php
/**
 * Top level object for registering and fetching named capabilities, e.g. 'jetpack.backups.restore'
 *
 * @package automattic/jetpack-capabilities
 */

namespace Automattic\Jetpack;

use \Automattic\Jetpack\Capabilities\Capability;

class Capabilities {
	private $capabilities;

	public function __construct() {
		$this->capabilities = [];
	}

	static function get( $name ) {
		return new Capability( $name, $this );
	}

	public function register( $capability ) {
		// TODO check for clashes?
		$this->capabilities[ $capability->name ] = $capability;
	}
}
