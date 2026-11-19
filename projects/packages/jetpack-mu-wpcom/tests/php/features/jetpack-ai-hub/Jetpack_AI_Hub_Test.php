<?php
/**
 * Tests for the WordPress.com Simple Jetpack AI Hub integration.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Hub;

use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;
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
		unset( $GLOBALS['wpcom_site_stickers_test_value'] );

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
	 * Scheduled tasks are enabled for sites with the Scheduled tasks sticker.
	 */
	public function test_enables_scheduled_tasks_for_sticker_sites() {
		$this->load_integration();
		$GLOBALS['wpcom_site_stickers_test_value'] = array( 'wpcom-agent-scheduled-tasks' );

		$this->assertTrue( enable_scheduled_tasks( false ) );
	}

	/**
	 * Scheduled tasks stay off for sites without the Scheduled tasks sticker.
	 */
	public function test_does_not_enable_scheduled_tasks_without_sticker() {
		$this->load_integration();

		$this->assertFalse( enable_scheduled_tasks( false ) );
	}

	/**
	 * Sites without the sticker keep a flag value set elsewhere.
	 */
	public function test_keeps_scheduled_tasks_enabled_elsewhere() {
		$this->load_integration();

		$this->assertTrue( enable_scheduled_tasks( true ) );
	}

	/**
	 * Sticker states for the Scheduled tasks flag.
	 *
	 * @return array
	 */
	public static function provide_scheduled_tasks_stickers() {
		return array(
			'with the sticker'    => array( array( 'wpcom-agent-scheduled-tasks' ), true ),
			'without the sticker' => array( array(), false ),
		);
	}

	/**
	 * Loading the page turns on the Scheduled tasks flag only for sticker sites.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 * @dataProvider provide_scheduled_tasks_stickers
	 *
	 * @param array $stickers Site stickers.
	 * @param bool  $expected Whether the flag is on.
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	#[DataProvider( 'provide_scheduled_tasks_stickers' )]
	public function test_scheduled_tasks_flag_follows_sticker( $stickers, $expected ) {
		$GLOBALS['wpcom_site_stickers_test_value'] = $stickers;
		$this->load_integration();

		// phpcs:ignore WordPress.NamingConventions.ValidHookName.UseUnderscores -- the hook suffix is the registered feature flag name.
		$this->assertSame( $expected, apply_filters( 'jetpack_feature_flag_enabled_ai-hub-scheduled-tasks', false ) );
	}

	/**
	 * The integration uses the native site-scoped WordPress.com MCP endpoint.
	 */
	public function test_configures_native_wpcom_mcp_api() {
		$this->load_integration();

		$config = configure(
			array(
				'showGatedViews'  => true,
				'isUserConnected' => false,
				'mcpSettingsApi'  => array(),
			)
		);

		$this->assertFalse( $config['showGatedViews'] );
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
			// @phan-suppress-next-line PhanUndeclaredClassInstanceof -- Existence checked above.
			if ( is_array( $function ) && $function[0] instanceof \Jetpack_AI_Page && 'add_actions' === $function[1] ) {
				$registered = true;
				break;
			}
		}

		$this->assertTrue( $registered );
	}
}
