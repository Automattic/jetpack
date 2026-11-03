<?php
/**
 * A section fixture for Dashboard::load_sections().
 *
 * @package automattic/jetpack-monetize
 */

namespace Automattic\Jetpack\Monetize\Sections;

use Automattic\Jetpack\Monetize\Dashboard_Section;

/**
 * A section with filterable state and no routes.
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
	 * Section state; tests replace it through a filter.
	 *
	 * @return array
	 */
	public function get_state() {
		return apply_filters( 'jetpack_monetize_example_section_state', array( 'loaded' => true ) );
	}

	/**
	 * No routes.
	 *
	 * @return void
	 */
	public function register_routes() {}
}
