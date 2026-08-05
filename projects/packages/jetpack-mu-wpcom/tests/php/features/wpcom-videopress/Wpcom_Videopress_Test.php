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
 * Tests for the VIDP-285 rollout and the chapters editor gate.
 */
class Wpcom_Videopress_Test extends \WorDBless\BaseTestCase {
	/**
	 * Undo the Simple simulation and the filter registration between tests.
	 */
	public function tear_down() {
		Constants::clear_constants();
		remove_all_filters( 'jetpack_videopress_chapters_editor' );
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
	 * On Simple the chapters editor gate must be registered, so the VideoPress
	 * package's default-false filter is answered by the Automattician check
	 * rather than left at its default.
	 */
	public function test_chapters_editor_gate_registered_on_simple() {
		$this->simulate_wpcom_simple();

		\wpcom_videopress_init_admin_ui();

		$this->assertNotFalse(
			has_filter( 'jetpack_videopress_chapters_editor', 'wpcom_videopress_chapters_editor_enabled' )
		);
	}

	/**
	 * Off-Simple, init must not register the chapters editor gate: self-hosted
	 * and Atomic keep Admin_UI::is_chapters_editor_enabled()'s default (off),
	 * and the Host::is_wpcom_simple() guard is what keeps this Simple-only.
	 */
	public function test_chapters_editor_gate_not_registered_off_simple() {
		\wpcom_videopress_init_admin_ui();

		$this->assertFalse( has_filter( 'jetpack_videopress_chapters_editor' ) );
	}

	/**
	 * The gate fails closed: without the wpcom platform's is_automattician()
	 * primitive (absent in this environment, function_exists-guarded in the
	 * callback), the chapters editor stays hidden.
	 */
	public function test_chapters_editor_gate_defaults_to_disabled() {
		$this->assertFalse( \wpcom_videopress_chapters_editor_enabled() );
	}
}
