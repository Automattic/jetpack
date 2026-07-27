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
	use \Activates_Ai_Module;

	const BLOCK_NAME = 'jetpack/ai-chat';

	/**
	 * The block registration present before the test, if any.
	 *
	 * @var WP_Block_Type|null
	 */
	private $registered_block;

	/**
	 * The original wp_scripts global, restored after each test.
	 *
	 * @var WP_Scripts|null
	 */
	private $saved_wp_scripts;

	/**
	 * The original current screen, restored after each test.
	 *
	 * @var WP_Screen|null
	 */
	private $saved_current_screen;

	/**
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_offline_mode', '__return_false' );
		$this->simulate_connected_owner();
		// Off-Simple the `ai` module is the AI master switch; activate it so the
		// jetpack_ai_enabled gate reads on.
		$this->activate_ai_module_for_test();

		$this->registered_block = WP_Block_Type_Registry::get_instance()->get_registered( self::BLOCK_NAME );
		if ( $this->registered_block ) {
			unregister_block_type( self::BLOCK_NAME );
		}

		$this->saved_wp_scripts     = $GLOBALS['wp_scripts'] ?? null;
		$GLOBALS['wp_scripts']      = new WP_Scripts();
		$this->saved_current_screen = $GLOBALS['current_screen'] ?? null;
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

		$GLOBALS['wp_scripts']     = $this->saved_wp_scripts;
		$GLOBALS['current_screen'] = $this->saved_current_screen;

		$this->deactivate_ai_module_for_test();
		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		remove_filter( 'jetpack_offline_mode', '__return_false' );
		delete_option( 'jetpack_ai_enabled' );
		$this->disconnect_owner();

		parent::tear_down();
	}

	/**
	 * The Jetpack_AIChatBlock inline payload attached to the editor bundle, or
	 * null when absent.
	 *
	 * @return string|null
	 */
	private function get_editor_inline_payload() {
		$data = $GLOBALS['wp_scripts']->get_data( 'jetpack-blocks-editor', 'before' );
		if ( ! is_array( $data ) ) {
			return null;
		}

		$joined = implode( "\n", array_filter( $data ) );
		return false !== strpos( $joined, 'Jetpack_AIChatBlock' ) ? $joined : null;
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
		// Off-Simple the master is the `ai` module; turn it off there.
		$this->deactivate_ai_module_for_test();

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

	/**
	 * The editor payload ships when the block is registered.
	 */
	public function test_editor_payload_prints_when_block_registered() {
		set_current_screen( 'edit-post' );
		wp_register_script( 'jetpack-blocks-editor', false, array(), '1.0', true );

		AIChat\register_block();
		$this->assertTrue( Blocks::is_registered( self::BLOCK_NAME ), 'Precondition: the block must be registered.' );

		AIChat\add_ai_chat_block_data();

		$this->assertNotNull( $this->get_editor_inline_payload() );
	}

	/**
	 * The editor payload follows the registration gate: with the master off the
	 * block never registers, so no payload may ship either.
	 */
	public function test_editor_payload_absent_when_master_option_off() {
		// Off-Simple the master is the `ai` module; turn it off there.
		$this->deactivate_ai_module_for_test();
		set_current_screen( 'edit-post' );
		wp_register_script( 'jetpack-blocks-editor', false, array(), '1.0', true );

		AIChat\register_block();
		$this->assertFalse( Blocks::is_registered( self::BLOCK_NAME ), 'Precondition: the block must not be registered.' );

		AIChat\add_ai_chat_block_data();

		$this->assertNull( $this->get_editor_inline_payload() );
	}

	/**
	 * Same rule for the connection gate: a disconnected site has no registered
	 * block, so the editor payload must not ship.
	 */
	public function test_editor_payload_absent_when_disconnected() {
		$this->disconnect_owner();
		set_current_screen( 'edit-post' );
		wp_register_script( 'jetpack-blocks-editor', false, array(), '1.0', true );

		AIChat\register_block();
		$this->assertFalse( Blocks::is_registered( self::BLOCK_NAME ), 'Precondition: the block must not be registered.' );

		AIChat\add_ai_chat_block_data();

		$this->assertNull( $this->get_editor_inline_payload() );
	}
}
