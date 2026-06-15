<?php
/**
 * Tests for the Publicize_Setup class.
 *
 * @package automattic/jetpack-publicize
 */

namespace Automattic\Jetpack\Publicize;

use WorDBless\BaseTestCase;

/**
 * Tests for Publicize_Setup loading behaviour.
 */
class Publicize_Setup_Test extends BaseTestCase {

	/**
	 * Reset the hooks the Social UI registers so each test sees a clean slate.
	 *
	 * `Publicize_Assets::configure()` registers both of these; their presence is
	 * a reliable proxy for "the Social UI was loaded".
	 */
	public function set_up() {
		parent::set_up();
		remove_all_filters( 'jetpack_admin_js_script_data' );
		remove_all_actions( 'enqueue_block_editor_assets' );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_active_modules' );
		parent::tear_down();
	}

	/**
	 * Force the Publicize module to be reported as active.
	 *
	 * @return array
	 */
	public function mock_publicize_being_active() {
		return array( 'publicize' );
	}

	/**
	 * When Social is unavailable (module inactive and no standalone plugin),
	 * pre_initialization() must not register any Social UI - no script data
	 * filter and no block editor asset enqueue.
	 */
	public function test_pre_initialization_loads_nothing_when_social_unavailable() {
		$this->assertFalse( Publicize_Utils::is_social_ui_available() );

		Publicize_Setup::pre_initialization();

		$this->assertFalse(
			has_filter( 'jetpack_admin_js_script_data' ),
			'Script data filter should not be registered when Social is unavailable.'
		);
		$this->assertFalse(
			has_action( 'enqueue_block_editor_assets' ),
			'Block editor assets should not be enqueued when Social is unavailable.'
		);
	}

	/**
	 * When the Publicize module is active, pre_initialization() registers the
	 * Social UI (script data + block editor assets).
	 */
	public function test_pre_initialization_loads_social_ui_when_module_active() {
		add_filter( 'jetpack_active_modules', array( $this, 'mock_publicize_being_active' ) );

		$this->assertTrue( Publicize_Utils::is_social_ui_available() );

		Publicize_Setup::pre_initialization();

		$this->assertNotFalse(
			has_filter( 'jetpack_admin_js_script_data' ),
			'Script data filter should be registered when the module is active.'
		);
		$this->assertNotFalse(
			has_action( 'enqueue_block_editor_assets' ),
			'Block editor assets should be enqueued when the module is active.'
		);
	}
}
