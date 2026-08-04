<?php
/**
 * AI Chat block tests.
 *
 * Locks down the registration gates: connection (or WordPress.com Simple) and
 * the jetpack_ai_enabled master filter, including the master option that backs
 * it.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Blocks;
use Automattic\Jetpack\Extensions\AIChat;

require_once JETPACK__PLUGIN_DIR . '/extensions/blocks/ai-chat/ai-chat.php';

/**
 * AI Chat block tests.
 */
class AI_Chat_Block_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const BLOCK_NAME = 'jetpack/ai-chat';

	/**
	 * The block registration present before the test, if any.
	 *
	 * @var WP_Block_Type|null
	 */
	private $registered_block;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_offline_mode', '__return_false' );
		$this->simulate_connected_owner();

		$this->registered_block = WP_Block_Type_Registry::get_instance()->get_registered( self::BLOCK_NAME );
		if ( $this->registered_block ) {
			unregister_block_type( self::BLOCK_NAME );
		}
	}

	/**
	 * Tear down after each test.
	 */
	public function tear_down() {
		if ( Blocks::is_registered( self::BLOCK_NAME ) ) {
			unregister_block_type( self::BLOCK_NAME );
		}
		if ( $this->registered_block ) {
			WP_Block_Type_Registry::get_instance()->register( $this->registered_block );
		}

		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		remove_filter( 'jetpack_offline_mode', '__return_false' );
		delete_option( 'jetpack_ai_enabled' );
		$this->disconnect_owner();

		parent::tear_down();
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
	 * Drop the simulated connection so the connection gate fails.
	 */
	private function disconnect_owner() {
		\Jetpack_Options::delete_option( array( 'master_user', 'user_tokens', 'id', 'blog_token' ) );
		( new \Automattic\Jetpack\Connection\Manager( 'jetpack' ) )->reset_connection_status();
	}

	/**
	 * Registered on a connected site with default settings.
	 */
	public function test_registers_when_connected_and_enabled() {
		AIChat\register_block();

		$this->assertTrue( Blocks::is_registered( self::BLOCK_NAME ) );
	}

	/**
	 * The jetpack_ai_enabled master filter turns the block off.
	 */
	public function test_not_registered_when_ai_disabled() {
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		AIChat\register_block();

		$this->assertFalse( Blocks::is_registered( self::BLOCK_NAME ) );
	}

	/**
	 * The AI master switch option turns the block off.
	 */
	public function test_not_registered_when_master_option_off() {
		update_option( 'jetpack_ai_enabled', 0 );

		AIChat\register_block();

		$this->assertFalse( Blocks::is_registered( self::BLOCK_NAME ) );
	}

	/**
	 * A disconnected, non-Simple site does not register the block.
	 */
	public function test_not_registered_when_disconnected() {
		$this->disconnect_owner();

		AIChat\register_block();

		$this->assertFalse( Blocks::is_registered( self::BLOCK_NAME ) );
	}
}
