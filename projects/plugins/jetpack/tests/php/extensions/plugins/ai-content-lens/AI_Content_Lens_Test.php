<?php
/**
 * AI Content Lens (excerpt generator) extension tests.
 *
 * Locks down the registration gates: connection, the jetpack_ai_enabled master
 * filter (historically missing here), and the writing toggle from the AI
 * settings page.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\Content_Lens;

require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/ai-content-lens/ai-content-lens.php';

/**
 * AI Content Lens extension tests.
 */
class AI_Content_Lens_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();
		$this->reset_availability();
		$this->simulate_connected_owner();
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		delete_option( 'jetpack_ai_writing_assistant_enabled' );
		delete_option( 'jetpack_ai_enabled' );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		parent::tear_down();
	}

	/**
	 * Reset Jetpack Gutenberg extension availability.
	 */
	private function reset_availability() {
		$reflection = new ReflectionClass( 'Jetpack_Gutenberg' );
		$property   = $reflection->getProperty( 'availability' );
		@$property->setAccessible( true ); // @codingStandardsIgnoreLine — needed for PHP < 8.1, suppressed for PHP 8.5+ deprecation.
		$property->setValue( null, array() );
	}

	/**
	 * Simulate a connected Jetpack owner so the connection gate passes.
	 */
	private function simulate_connected_owner() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
	}

	/**
	 * Registered on a connected site with default settings.
	 */
	public function test_registers_when_connected_and_enabled() {
		Content_Lens\register_plugin();

		$this->assertTrue( \Jetpack_Gutenberg::is_available( Content_Lens\FEATURE_NAME ) );
	}

	/**
	 * The jetpack_ai_enabled master filter turns the extension off.
	 */
	public function test_not_registered_when_ai_disabled() {
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		Content_Lens\register_plugin();

		$this->assertFalse( \Jetpack_Gutenberg::is_available( Content_Lens\FEATURE_NAME ) );
	}

	/**
	 * The AI master switch option turns the extension off.
	 */
	public function test_not_registered_when_master_option_off() {
		update_option( 'jetpack_ai_enabled', 0 );

		Content_Lens\register_plugin();

		$this->assertFalse( \Jetpack_Gutenberg::is_available( Content_Lens\FEATURE_NAME ) );
	}

	/**
	 * The writing toggle from the AI settings page turns the extension off.
	 */
	public function test_not_registered_when_writing_toggle_off() {
		update_option( 'jetpack_ai_writing_assistant_enabled', 0 );

		Content_Lens\register_plugin();

		$this->assertFalse( \Jetpack_Gutenberg::is_available( Content_Lens\FEATURE_NAME ) );
	}
}
