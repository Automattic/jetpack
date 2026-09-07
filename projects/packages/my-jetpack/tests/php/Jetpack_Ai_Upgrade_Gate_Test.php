<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Products\Jetpack_Ai;
use Automattic\Jetpack\Status\Cache as StatusCache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Whether the AI product offers an upgrade when the feature lookup fails.
 *
 * @package automattic/my-jetpack
 */
class Jetpack_Ai_Upgrade_Gate_Test extends TestCase {

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		Constants::clear_constants();
		StatusCache::clear();
		( new Connection_Manager() )->reset_connection_status();
		$this->install_mock_plugins();
		wp_cache_delete( 'plugins', 'plugins' );

		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_admin',
				'user_pass'  => '123',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Installs the mock Jetpack plugin.
	 *
	 * @return void
	 */
	public function install_mock_plugins() {
		if ( ! file_exists( WP_PLUGIN_DIR . '/jetpack' ) ) {
			mkdir( WP_PLUGIN_DIR . '/jetpack', 0777, true );
		}
		copy( __DIR__ . '/assets/jetpack-mock-plugin.txt', WP_PLUGIN_DIR . '/jetpack/jetpack.php' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		delete_transient( 'my-jetpack-site-features' );
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		( new Connection_Manager() )->reset_connection_status();
		Constants::clear_constants();
		StatusCache::clear();
	}

	/**
	 * Connect the site and give it the AI entitlement, as a paid site has.
	 *
	 * @return void
	 */
	private function set_up_connected_site_with_ai_feature() {
		activate_plugins( 'jetpack/jetpack.php' );
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );
		Jetpack_Options::update_option( 'master_user', get_current_user_id() );

		// Primed so the blog-token /sites/N/features lookup is not attempted.
		set_transient(
			'my-jetpack-site-features',
			array(
				'active'    => array( 'ai-assistant' ),
				'available' => array(),
			),
			15
		);
	}

	/**
	 * Stand in for the Jetpack plugin's helper, which is not loadable from here.
	 *
	 * @param mixed $response What the helper should return.
	 * @return void
	 */
	private function stub_ai_helper( $response ) {
		$GLOBALS['jpai_ai_feature_response'] = $response;

		require_once __DIR__ . '/assets/class-jetpack-ai-helper.php';

		if ( ! defined( 'JETPACK__PLUGIN_DIR' ) ) {
			define( 'JETPACK__PLUGIN_DIR', WP_PLUGIN_DIR . '/jetpack/' );
		}
	}

	/**
	 * A user whose feature lookup is refused must not be sent to checkout.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_no_upgrade_is_offered_when_the_feature_lookup_is_refused() {
		$this->set_up_connected_site_with_ai_feature();
		$this->stub_ai_helper( new \WP_Error( 'failed_to_fetch_data', 'Unable to fetch the requested data.', array( 'status' => 403 ) ) );

		$this->assertFalse( Jetpack_Ai::is_upgradable() );
	}

	/**
	 * A site that really is on the free tier still gets its upgrade offer.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_upgrade_is_still_offered_on_the_free_tier() {
		$this->set_up_connected_site_with_ai_feature();
		$this->stub_ai_helper(
			array(
				'has-feature'          => true,
				'site-require-upgrade' => true,
				'current-tier'         => array( 'value' => 0 ),
				'next-tier'            => array( 'value' => 100 ),
				'tier-plans-enabled'   => true,
			)
		);

		$this->assertTrue( Jetpack_Ai::is_upgradable() );
	}

	/**
	 * A refused lookup is not the same as being on the free tier.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_refused_lookup_does_not_report_the_free_tier() {
		$this->set_up_connected_site_with_ai_feature();
		$this->stub_ai_helper( new \WP_Error( 'failed_to_fetch_data', 'Unable to fetch the requested data.', array( 'status' => 403 ) ) );

		$this->assertNull( Jetpack_Ai::get_current_usage_tier() );
	}
}
