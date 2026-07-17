<?php
/**
 * VideoPress dashboard rollout flag tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-videopress/wpcom-videopress.php';

/**
 * Tests for the VIDP-285 staged-rollout flag.
 */
class Wpcom_Videopress_Test extends \WorDBless\BaseTestCase {
	/**
	 * The rollout defaults to OFF: without the wpcom platform's sticker and
	 * a11n primitives (absent in this environment, function_exists-guarded in
	 * the callback), the modernized dashboard must not be enabled. This pins
	 * the fail-closed default — a Simple site outside the cohort gets no
	 * VideoPress menu at all rather than a dead dashboard.
	 */
	public function test_rollout_defaults_to_disabled() {
		$this->assertFalse( \wpcom_videopress_modernized_dashboard_enabled() );
	}

	/**
	 * Off-Simple, init must not register the rollout filter: self-hosted and
	 * Atomic keep Admin_UI::is_modernized()'s default (enabled), and the
	 * Host::is_wpcom_simple() guard is what protects them.
	 */
	public function test_rollout_filter_not_registered_off_simple() {
		\wpcom_videopress_init_admin_ui();

		$this->assertFalse(
			has_filter( 'rsm_jetpack_ui_modernization_videopress', 'wpcom_videopress_modernized_dashboard_enabled' )
		);
	}
}
