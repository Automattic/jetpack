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
	use \Reads_Block_Availability;

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

		Jetpack_Gutenberg::reset();
		add_filter( 'jetpack_offline_mode', '__return_false' );
		$this->simulate_connected_owner();
		// Off-Simple the `ai` module is the AI master switch; activate it so the
		// jetpack_ai_enabled gate reads on.
		$this->activate_ai_module_for_test();

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

		$this->deactivate_ai_module_for_test();
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		remove_filter( 'jetpack_ai_enabled', '__return_false' );
		remove_filter( 'jetpack_offline_mode', '__return_false' );
		delete_option( 'jetpack_ai_enabled' );
		$this->disconnect_owner();
		Jetpack_Gutenberg::reset();

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
	 * The jetpack_ai_enabled master filter keeps the block registered, so its
	 * render callback still runs, but reports it to the editor as off.
	 */
	public function test_registered_but_unavailable_when_ai_disabled() {
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		AIChat\register_block();

		$this->assertTrue( Blocks::is_registered( self::BLOCK_NAME ) );

		$availability = $this->get_block_availability( 'ai-chat' );
		$this->assertFalse( $availability['available'] );
		$this->assertSame( 'ai_disabled', $availability['unavailable_reason'] );
	}

	/**
	 * The AI master switch option reports the block as off, with the master as the gate.
	 */
	public function test_reports_master_gate_when_master_option_off() {
		// Off-Simple the master is the `ai` module; turn it off there.
		$this->force_master_enforcement_for_test();
		$this->deactivate_ai_module_for_test();

		AIChat\register_block();

		$this->assertTrue( Blocks::is_registered( self::BLOCK_NAME ) );

		$availability = $this->get_block_availability( 'ai-chat' );
		$this->assertFalse( $availability['available'] );
		$this->assertSame( 'ai_disabled', $availability['unavailable_reason'] );
		$this->assertSame( array( 'gate' => 'master' ), $availability['details'] );
	}

	/**
	 * With AI on, the front end gets the chat container the view script mounts into.
	 */
	public function test_renders_container_when_ai_enabled() {
		AIChat\register_block();

		$html = do_blocks( '<!-- wp:jetpack/ai-chat --><div class="wp-block-jetpack-ai-chat"></div><!-- /wp:jetpack/ai-chat -->' );

		$this->assertStringContainsString( 'id="jetpack-ai-chat"', $html );
	}

	/**
	 * With AI off, the front end gets nothing at all, not the saved empty div.
	 */
	public function test_renders_nothing_when_ai_disabled() {
		add_filter( 'jetpack_ai_enabled', '__return_false' );

		AIChat\register_block();

		$html = do_blocks( '<!-- wp:jetpack/ai-chat --><div class="wp-block-jetpack-ai-chat"></div><!-- /wp:jetpack/ai-chat -->' );

		$this->assertSame( '', trim( $html ) );
	}

	/**
	 * A disconnected site keeps the generic reason: the block is missing for a
	 * reason the AI settings placeholder must not claim as its own.
	 */
	public function test_keeps_generic_reason_when_disconnected() {
		$this->disconnect_owner();

		AIChat\register_block();

		$availability = $this->get_block_availability( 'ai-chat' );
		$this->assertFalse( $availability['available'] );
		$this->assertSame( 'missing_module', $availability['unavailable_reason'] );
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
