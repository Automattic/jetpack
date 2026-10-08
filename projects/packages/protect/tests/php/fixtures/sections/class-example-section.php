<?php
/**
 * A section fixture for Dashboard::load_sections().
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect\Sections;

use Automattic\Jetpack\Protect\Dashboard_Section;

/**
 * A section with fixed state and no routes.
 */
class Example_Section implements Dashboard_Section {

	/**
	 * Section key.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'example';
	}

	/**
	 * Section state.
	 *
	 * @return array
	 */
	public function get_state() {
		return array( 'loaded' => true );
	}

	/**
	 * No routes.
	 *
	 * @return void
	 */
	public function register_routes() {}
}
