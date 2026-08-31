<?php
/**
 * Tests for the WordPress.com Simple Jetpack AI Hub integration.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Hub;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;
use WorDBless\BaseTestCase;

/**
 * Tests the Simple-specific Hub settings.
 */
class Jetpack_AI_Hub_Test extends BaseTestCase {
	/**
	 * Load the integration through its production gate.
	 */
	private function load_integration() {
		add_filter( 'jetpack_mu_wpcom_load_jetpack_ai_hub', '__return_true' );
		Jetpack_Mu_Wpcom::load_wpcom_simple_jetpack_ai();
	}

	/**
	 * Reset feature filters changed by the integration.
	 */
	public function tear_down() {
		remove_all_filters( 'jetpack_mu_wpcom_load_jetpack_ai_hub' );
		remove_all_filters( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks' );
		remove_all_filters( 'jetpack_ai_admin_config' );

		parent::tear_down();
	}

	/**
	 * The package does not load the integration without an explicit host opt-in.
	 */
	public function test_loader_is_disabled_by_default() {
		$filters_before = did_filter( 'jetpack_mu_wpcom_load_jetpack_ai_hub' );

		Jetpack_Mu_Wpcom::load_wpcom_simple_jetpack_ai();

		$this->assertSame( $filters_before + 1, did_filter( 'jetpack_mu_wpcom_load_jetpack_ai_hub' ) );
	}

	/**
	 * Scheduled tasks are enabled with the Hub on WordPress.com Simple.
	 */
	public function test_enables_scheduled_tasks() {
		$this->load_integration();

		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- the hook suffix is the registered feature flag name.
		$this->assertTrue( apply_filters( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks', false ) );
	}

	/**
	 * The integration uses the native site-scoped WordPress.com MCP endpoint,
	 * shows every view — the load filter is the gate on Simple — and reports
	 * the current user connected.
	 */
	public function test_configures_native_wpcom_mcp_api() {
		$this->load_integration();

		$config = configure(
			array(
				'showGatedViews'  => false,
				'isUserConnected' => false,
				'mcpSettingsApi'  => array(),
			)
		);

		$this->assertTrue( $config['showGatedViews'] );
		$this->assertTrue( $config['isUserConnected'] );
		$this->assertSame(
			array(
				'path'   => '/wpcom/v2/sites/' . get_current_blog_id() . '/mcp-abilities',
				'format' => 'wpcom',
			),
			$config['mcpSettingsApi']
		);
	}

	/**
	 * Without the WordPress.com store available the plan info degrades to the
	 * empty shape rather than erroring — the Overview card then shows no plan.
	 */
	public function test_plan_info_degrades_without_the_wpcom_store() {
		$this->load_integration();

		$config = configure( array() );

		$this->assertSame(
			array(
				'name'       => '',
				'renews_on'  => '',
				'auto_renew' => true,
			),
			$config['planInfo']
		);
	}

	/**
	 * The plan info comes from the WordPress.com store: the site's `bundle`
	 * purchase carries the dates, and the store product list names it — with
	 * the brand prefix trimmed the way the upstream page trims it.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_plan_info_reads_the_wpcom_store() {
		$this->load_integration();
		require_once __DIR__ . '/fixtures/wpcom-store-fakes.php';

		$info = get_plan_info();

		$this->assertSame(
			array(
				'name'       => 'Business',
				'renews_on'  => '2027-08-30 00:00:00',
				'auto_renew' => false,
			),
			$info
		);
	}

	/**
	 * A packaged integration safely stops when the sibling Jetpack page is absent.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_registration_stops_when_jetpack_page_is_absent() {
		define( 'JETPACK__PLUGIN_DIR', '/jetpack-ai-hub-test/missing/' );

		$this->load_integration();

		$this->assertTrue( function_exists( __NAMESPACE__ . '\\configure' ) );
		$this->assertFalse( has_filter( 'jetpack_ai_admin_config', __NAMESPACE__ . '\\configure' ) );
	}

	/**
	 * The packaged integration registers the upstream Jetpack page when present.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_registration_uses_packaged_jetpack_page() {
		define( 'JETPACK__PLUGIN_DIR', Jetpack_Mu_Wpcom::PKG_DIR . '../../plugins/jetpack/' );

		$this->load_integration();

		$this->assertTrue( class_exists( '\\Jetpack_AI_Page', false ) );
		$this->assertNotFalse( has_filter( 'jetpack_ai_admin_config', __NAMESPACE__ . '\\configure' ) );

		$registered = false;
		foreach ( $GLOBALS['wp_filter']['admin_menu']->callbacks[998] ?? array() as $callback ) {
			$function = $callback['function'] ?? null;
			if ( is_array( $function ) && is_a( $function[0], 'Jetpack_AI_Page' ) && 'add_actions' === $function[1] ) {
				$registered = true;
				break;
			}
		}

		$this->assertTrue( $registered );
	}
}
