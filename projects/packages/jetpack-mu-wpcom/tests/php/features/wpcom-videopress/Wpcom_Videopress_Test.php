<?php
/**
 * VideoPress dashboard rollout tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-videopress/wpcom-videopress.php';

/**
 * Tests that the generally available dashboard and editors have no cohort restrictions.
 */
class Wpcom_Videopress_Test extends \WorDBless\BaseTestCase {
	/**
	 * Undo the Simple simulation and the filter registration between tests.
	 */
	public function tear_down() {
		Constants::clear_constants();
		remove_all_filters( 'jetpack_videopress_chapters_editor' );
		remove_all_filters( 'jetpack_videopress_trim_cut' );
		wp_set_current_user( 0 );

		parent::tear_down();
	}

	/**
	 * Make Host::is_wpcom_simple() report true, the way it does on Simple.
	 */
	private function simulate_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
	}

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

	/**
	 * The chapters editor is generally available: init must not register any
	 * callback on its filter, so Simple keeps
	 * Admin_UI::is_chapters_editor_enabled()'s default (enabled) like every
	 * other host. This pins the absence of the old Automattician-only gate —
	 * a stray re-registration of a restricting callback would hide the feature
	 * from every non-Automattician on Simple, and shows up here.
	 *
	 * Simple is simulated because that is the only host the removed callback
	 * was ever registered on.
	 */
	public function test_no_chapters_editor_gate_registered() {
		$this->simulate_wpcom_simple();

		\wpcom_videopress_init_admin_ui();

		$this->assertFalse( has_filter( 'jetpack_videopress_chapters_editor' ) );
		$this->assertFalse( function_exists( 'wpcom_videopress_chapters_editor_enabled' ) );
	}

	/** Simple sites inherit the editor default without staff or sticker checks. */
	public function test_no_trim_cut_gate_registered() {
		$this->simulate_wpcom_simple();
		\wpcom_videopress_init_admin_ui();

		$this->assertFalse( has_filter( 'jetpack_videopress_trim_cut' ) );
		$this->assertFalse( function_exists( 'wpcom_videopress_trim_cut_enabled' ) );
	}
}
