<?php
/**
 * VideoPress dashboard rollout tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-videopress/wpcom-videopress.php';

/**
 * Tests for the VIDP-285 rollout, now at 100%.
 */
class Wpcom_Videopress_Test extends \WorDBless\BaseTestCase {
	/**
	 * The rollout is at 100%: init must not register any callback on the
	 * modernization filter, so every host — Simple included — keeps
	 * Admin_UI::is_modernized()'s default (enabled). This pins the absence
	 * of the old staged gate (Automatticians + the CFT blog sticker); a
	 * stray re-registration of a restricting callback shows up here.
	 */
	public function test_no_rollout_gate_registered() {
		\wpcom_videopress_init_admin_ui();

		$this->assertFalse( has_filter( 'rsm_jetpack_ui_modernization_videopress' ) );
		$this->assertFalse( function_exists( 'wpcom_videopress_modernized_dashboard_enabled' ) );
	}
}
