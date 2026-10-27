<?php
/**
 * Tests for the AI Assistant banner's WordPress Agent and MCP checks.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/expiry-notices/expiry-notices.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-assistant-banner/ai-assistant-banner.php';

/**
 * Test class for the AI Assistant banner visibility helpers.
 */
class AI_Assistant_Banner_Visibility_Test extends \WorDBless\BaseTestCase {

	/**
	 * Give the site a plan that grants Big Sky, which the WordPress Agent needs on Atomic.
	 */
	private function simulate_big_sky_plan() {
		Current_Plan::update_from_site_record(
			array(
				'plan' => array(
					'product_slug' => 'jetpack_personal',
					'features'     => array( 'active' => array( 'big-sky' ) ),
				),
			)
		);
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		delete_transient( 'wpcom_ai_banner_mcp_' . get_current_blog_id() . '_' . get_current_user_id() );
		delete_user_meta( get_current_user_id(), 'wpcom_ai_assistant_banner_dismissed' );
		Constants::clear_constants();
		delete_option( 'big_sky_enable' );
		delete_option( 'jetpack_active_plan' );
		$reset_plan_cache = Closure::bind(
			/** @phan-closure-scope \Automattic\Jetpack\Current_Plan */
			static function () {
				// An empty array is a cache miss for Current_Plan::get().
				self::$active_plan_cache = array();
			},
			null,
			Current_Plan::class
		);
		$reset_plan_cache();
		parent::tear_down();
	}

	/**
	 * Atomic sites keep the banner hidden until the localized MCP check when the Agent is on.
	 */
	public function test_atomic_banner_starts_hidden_when_agent_is_enabled() {
		update_option( 'big_sky_enable', '1' );
		$this->simulate_big_sky_plan();

		ob_start();
		wpcom_render_ai_assistant_banner();
		$markup = ob_get_clean();

		$this->assertStringContainsString( 'id="wpcom-ai-assistant-banner"', $markup );
		$this->assertMatchesRegularExpression( '/id="wpcom-ai-assistant-banner"[^>]* hidden>/', $markup );
	}

	/**
	 * Atomic's cached MCP result preserves all three banner states without another API call.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_cached_mcp_result() {
		define( 'IS_ATOMIC', true );
		$cache_key = 'wpcom_ai_banner_mcp_' . get_current_blog_id() . '_' . get_current_user_id();

		set_transient( $cache_key, 'on', 5 * MINUTE_IN_SECONDS );
		$this->assertTrue( wpcom_ai_assistant_banner_mcp_enabled() );

		set_transient( $cache_key, 'off', 5 * MINUTE_IN_SECONDS );
		$this->assertFalse( wpcom_ai_assistant_banner_mcp_enabled() );

		set_transient( $cache_key, 'unavailable', 5 * MINUTE_IN_SECONDS );
		$this->assertNull( wpcom_ai_assistant_banner_mcp_enabled() );
	}

	/**
	 * A failed Atomic check does not retry on every Dashboard load.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_failed_atomic_mcp_check_is_cached_briefly() {
		define( 'IS_ATOMIC', true );
		$cache_key = 'wpcom_ai_banner_mcp_' . get_current_blog_id() . '_' . get_current_user_id();

		$this->assertNull( wpcom_ai_assistant_banner_mcp_enabled() );
		$this->assertSame( 'unavailable', get_transient( $cache_key ) );

		$expires = (int) get_option( '_transient_timeout_' . $cache_key );
		$this->assertGreaterThan( time(), $expires );
		$this->assertLessThanOrEqual( time() + MINUTE_IN_SECONDS, $expires );
	}

	/**
	 * The script gets a banner visibility decision for each AI tools state.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_script_data_carries_banner_visibility() {
		define( 'IS_ATOMIC', true );
		$cache_key = 'wpcom_ai_banner_mcp_' . get_current_blog_id() . '_' . get_current_user_id();
		set_transient( $cache_key, 'off', 5 * MINUTE_IN_SECONDS );
		update_option( 'big_sky_enable', '1' );
		$this->simulate_big_sky_plan();

		$data = wpcom_ai_assistant_banner_script_data( 'dashboard' );
		$this->assertSame( wpcom_ai_assistant_banner_tracks_props( 'dashboard' ), $data['trackProps'] );
		$this->assertSame( '1', $data['shouldShowBanner'] );

		set_transient( $cache_key, 'unavailable', 5 * MINUTE_IN_SECONDS );
		$this->assertSame( '0', wpcom_ai_assistant_banner_script_data( 'dashboard' )['shouldShowBanner'] );

		update_option( 'big_sky_enable', '0' );
		$this->assertSame( '1', wpcom_ai_assistant_banner_script_data( 'dashboard' )['shouldShowBanner'] );
		$this->assertEmpty( get_user_meta( get_current_user_id(), 'wpcom_ai_assistant_banner_dismissed', true ) );
	}

	/**
	 * Completing setup dismisses the banner for the current user only.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_script_data_auto_dismisses_current_user() {
		define( 'IS_ATOMIC', true );
		$user_id       = wp_insert_user(
			array(
				'user_login' => 'ai_banner_admin_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		$other_user_id = wp_insert_user(
			array(
				'user_login' => 'ai_banner_other_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		set_transient( 'wpcom_ai_banner_mcp_' . get_current_blog_id() . '_' . get_current_user_id(), 'on', 5 * MINUTE_IN_SECONDS );
		update_option( 'big_sky_enable', '1' );
		$this->simulate_big_sky_plan();

		$this->assertSame( '0', wpcom_ai_assistant_banner_script_data( 'dashboard' )['shouldShowBanner'] );
		$this->assertEqualsWithDelta( time(), (int) get_user_meta( $user_id, 'wpcom_ai_assistant_banner_dismissed', true ), 5 );
		$this->assertEmpty( get_user_meta( $other_user_id, 'wpcom_ai_assistant_banner_dismissed', true ) );

		update_option( 'big_sky_enable', '0' );
		$this->assertFalse( wpcom_should_show_ai_assistant_banner() );
	}

	/**
	 * Manual dismissal keeps the original user meta value.
	 */
	public function test_manual_dismissal_stores_one() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'ai_banner_manual_' . wp_rand(),
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		wpcom_ai_assistant_banner_record_dismissal();

		$this->assertSame( 1, get_user_meta( $user_id, 'wpcom_ai_assistant_banner_dismissed', true ) );
	}
}
