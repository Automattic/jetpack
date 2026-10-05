<?php
/**
 * Contract for one feature of the Protect dashboard, such as Scan or Monitor.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * A dashboard section: the state its UI starts from, and the REST routes it reads and writes.
 *
 * @since $$next-version$$
 */
interface Jetpack_Protect_Dashboard_Section {

	/**
	 * The key the section's state is printed under, matching the JS section's `key`.
	 *
	 * @return string
	 */
	public function get_key();

	/**
	 * The state the section's UI renders from on page load.
	 *
	 * @return array
	 */
	public function get_state();

	/**
	 * Register the section's REST routes. Runs on `rest_api_init`.
	 *
	 * @return void
	 */
	public function register_routes();
}
