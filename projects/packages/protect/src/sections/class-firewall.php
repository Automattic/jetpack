<?php
/**
 * Protect dashboard: the Firewall section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect\Sections;

use Automattic\Jetpack\Protect\Dashboard;
use Automattic\Jetpack\Protect\Dashboard_Section;
use Automattic\Jetpack\Waf\Waf_Blocklog_Manager;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * The firewall's on/off state and its all-time blocked request count.
 *
 * @since $$next-version$$
 */
class Firewall implements Dashboard_Section {

	/**
	 * The key the section's state is printed under.
	 *
	 * @return string
	 */
	public function get_key() {
		return 'firewall';
	}

	/**
	 * The firewall module's state, the all-time blocked request count and whether a Scan plan is active.
	 *
	 * @return array
	 */
	public function get_state() {
		$state = Dashboard::get_module_state( 'waf' );

		// The all-time counter persists while the firewall is off, so it is sent either way.
		$state['blockedCount'] = class_exists( Waf_Blocklog_Manager::class )
			? Waf_Blocklog_Manager::get_all_time_block_count()
			: null;
		$state['hasScan']      = Dashboard::has_scan_plan();

		return $state;
	}

	/**
	 * The firewall's settings are saved through existing endpoints, so there are no routes.
	 *
	 * @return void
	 */
	public function register_routes() {}
}
