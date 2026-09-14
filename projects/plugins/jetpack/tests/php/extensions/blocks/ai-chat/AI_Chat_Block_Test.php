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
use Automattic\Jetpack\Search\Plan;
use Automattic\Jetpack\Search\Search_Blocks;

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
	 * Set up before each test.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'jetpack_offline_mode', '__return_false' );
		$this->simulate_connected_owner();
		// Off-Simple the `ai` module is the AI master switch; activate it so the
		// jetpack_ai_enabled gate reads on.
		$this->activate_ai_module_for_test();
		// @phan-suppress-next-line PhanAccessMethodInternal -- Phan is correct, but the usage is intentional: a monorepo-sibling test resetting the memo between cases.
		Search_Blocks::reset_supports_paid_search_cache();

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
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		delete_transient( 'jetpack_ai_chat_plan_lookup_failed' );
		// @phan-suppress-next-line PhanAccessMethodInternal -- Phan is correct, but the usage is intentional: a monorepo-sibling test resetting the memo between cases.
		Search_Blocks::reset_supports_paid_search_cache();

		parent::tear_down();
	}

	/**
	 * Simulate a connected Jetpack owner so the connection gate passes.
	 */
	private function simulate_connected_owner() {
		$user_id = self::factory()->user->create( array( 'role' => 'administrator' ) );
		\Jetpack_Options::update_option( 'master_user', $user_id );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => 'token.secret.' . $user_id ) );
		// is_ai_chat_enabled() checks the blog-level connection, not just the owner.
		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'asd.qwe' );
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
	 * Seed a paid-plan option.
	 */
	private function set_paid_search_plan() {
		update_option(
			Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'effective_subscription'  => array( 'product_slug' => 'jetpack_search' ),
			)
		);
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
		$this->force_master_enforcement_for_test();
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
	 * Front-end render emits nothing on a free plan - mirrors ai-answer's
	 * render.php gate; editor shows an upgrade prompt instead (edit.jsx).
	 */
	public function test_load_assets_renders_nothing_on_free_plan() {
		update_option(
			Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'effective_subscription'  => array( 'product_slug' => Plan::JETPACK_SEARCH_FREE_PRODUCT_SLUG ),
			)
		);

		$this->assertSame( '', AIChat\load_assets( array() ) );
	}

	/**
	 * Front-end render renders the block markup on a paid plan.
	 */
	public function test_load_assets_renders_markup_on_paid_plan() {
		$this->set_paid_search_plan();

		$markup = AIChat\load_assets( array() );

		$this->assertStringContainsString( 'id="jetpack-ai-chat"', $markup );
	}

	/**
	 * A missing plan with a recent failed lookup disables the render.
	 */
	public function test_load_assets_renders_nothing_when_plan_info_uncached() {
		delete_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );
		set_transient( 'jetpack_ai_chat_plan_lookup_failed', true, MINUTE_IN_SECONDS );

		$this->assertSame( '', AIChat\load_assets( array() ) );
	}
}
