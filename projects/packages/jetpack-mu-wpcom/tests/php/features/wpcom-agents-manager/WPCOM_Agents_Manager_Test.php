<?php
/**
 * Tests for the WordPress.com Agents Manager gates.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-agents-manager/wpcom-agents-manager.php';
// The real support session detector, which Wpcom_Feature_Flags::is_a11n() consults on Atomic.
require_once Jetpack_Mu_Wpcom::PKG_DIR . '../../plugins/wpcomsh/support-session.php';

/**
 * Test class for the wpcom-agents-manager feature.
 */
class WPCOM_Agents_Manager_Test extends \WorDBless\BaseTestCase {

	/**
	 * Start on a non-editor wp-admin screen.
	 */
	public function set_up() {
		parent::set_up();
		set_current_screen( 'tools' );
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
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
		remove_filter( 'jetpack_ai_sidebar_agents_manager_data', 'wpcom_agents_manager_mark_internal_only' );
		Constants::clear_constants();
		unset( $_COOKIE[ \WPCOMSH_Support_Session_Detect::COOKIE_NAME ] );
		set_current_screen( 'front' );
		parent::tear_down();
	}

	/**
	 * @dataProvider provide_hooks
	 *
	 * @param string $hook     The Agents Manager filter.
	 * @param string $callback The callback that answers it.
	 * @param int    $priority The priority it runs at.
	 */
	#[DataProvider( 'provide_hooks' )]
	public function test_hooks_the_agents_manager_filters( $hook, $callback, $priority ) {
		$this->assertSame( $priority, has_filter( $hook, $callback ) );
	}

	/**
	 * Data provider for test_hooks_the_agents_manager_filters.
	 *
	 * @return array
	 */
	public static function provide_hooks() {
		return array(
			'block editor gate'          => array( 'agents_manager_enabled_in_block_editor', 'wpcom_agents_manager_enable_in_block_editor', 10 ),
			'proxied Automattician gate' => array( 'agents_manager_should_load', 'wpcom_agents_manager_should_load_for_proxied_automattician', 20 ),
		);
	}

	/**
	 * A true from an earlier filter is preserved even when the WordPress Agent is off.
	 */
	public function test_preserves_an_earlier_true() {
		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( true ) );
	}

	/**
	 * Off Simple, without the option WordPress.com writes when the WordPress
	 * Agent is switched on, the filter stays false.
	 */
	public function test_stays_false_without_the_wordpress_agent() {
		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * Off Simple, the option written by WordPress.com decides.
	 */
	public function test_enabled_by_the_option_off_simple() {
		update_option( 'big_sky_enable', '1' );
		Current_Plan::update_from_site_record(
			array(
				'plan' => array(
					'product_slug' => 'jetpack_personal',
					'features'     => array( 'active' => array( 'big-sky' ) ),
				),
			)
		);

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, the platform's big_sky_is_enabled() decides.
	 *
	 * The stub is evaluated into the global namespace, so the test runs in its
	 * own process. Brain Monkey can't redefine it because the function does not
	 * exist when Patchwork loads.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enabled_when_the_platform_reports_big_sky_enabled() {
		eval( 'function big_sky_is_enabled() { return true; } function big_sky_is_available_for_site() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, the platform saying no wins even though the option defaults to on.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_stays_false_when_the_platform_reports_big_sky_disabled() {
		eval( 'function big_sky_is_enabled() { return false; } function big_sky_is_available_for_site() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, the admin's opt-out option wins over the site-level setting.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_big_sky_enable_option_switches_it_off_on_simple() {
		eval( 'function big_sky_is_enabled() { return true; } function big_sky_is_available_for_site() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		update_option( 'big_sky_enable', '0' );

		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, a site downgraded to Free keeps the Big Sky sticker but has no plan, so the Agent is off.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_stays_false_on_simple_without_a_plan() {
		eval( 'function big_sky_is_enabled() { return true; } function big_sky_is_available_for_site() { return false; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, a plan that grants Big Sky keeps the Agent on.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enabled_on_simple_with_a_plan() {
		eval( 'function big_sky_is_enabled() { return true; } function big_sky_is_available_for_site() { return true; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * On Simple, a legacy Big Sky free-trial site has no plan but keeps the Agent.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enabled_on_simple_for_a_free_trial_site() {
		eval( 'function big_sky_is_enabled() { return true; } function big_sky_is_available_for_site() { return false; } function has_blog_sticker( $sticker ) { return "big-sky-free-trial" === $sticker; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * Off Simple, the option alone is not enough: the site's plan must grant Big Sky.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_stays_false_off_simple_without_a_plan() {
		update_option( 'big_sky_enable', '1' );

		$this->assertFalse( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * Off Simple, the option plus a plan that grants Big Sky keeps the Agent on.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enabled_off_simple_with_a_plan() {
		Current_Plan::update_from_site_record(
			array(
				'plan' => array(
					'product_slug' => 'jetpack_personal',
					'features'     => array( 'active' => array( 'big-sky' ) ),
				),
			)
		);

		update_option( 'big_sky_enable', '1' );

		$this->assertTrue( wpcom_agents_manager_enable_in_block_editor( false ) );
	}

	/**
	 * The WordPress Agent option belongs to the editors, so switching it off keeps this chat.
	 */
	public function test_should_load_ignores_the_wordpress_agent_option() {
		update_option( 'big_sky_enable', '0' );
		$this->simulate_atomic_request( true, false );

		$this->assertTrue( wpcom_agents_manager_should_load_for_proxied_automattician( false ) );
	}

	/**
	 * Only a chat this gate loads gets the "A8C Only" label; an earlier request is kept as it was.
	 *
	 * @dataProvider provide_internal_only_cases
	 *
	 * @param string $screen            The current screen.
	 * @param bool   $loaded_by_another Whether another integration (Woo-AI, the plugins screens) requested the chat.
	 * @param bool   $is_internal_only  Whether the chat gets the label.
	 */
	#[DataProvider( 'provide_internal_only_cases' )]
	public function test_labels_only_the_chat_it_loads( $screen, $loaded_by_another, $is_internal_only ) {
		set_current_screen( $screen );
		$this->simulate_atomic_request( true, false );

		$this->assertTrue( wpcom_agents_manager_should_load_for_proxied_automattician( $loaded_by_another ) );

		$data = apply_filters( 'jetpack_ai_sidebar_agents_manager_data', array() );
		$this->assertSame( $is_internal_only, ! empty( $data['isInternalOnly'] ) );
	}

	/**
	 * Data provider for test_labels_only_the_chat_it_loads.
	 *
	 * @return array
	 */
	public static function provide_internal_only_cases() {
		return array(
			'loaded by this gate'           => array( 'tools', false, true ),
			'loaded by another integration' => array( 'plugins', true, false ),
		);
	}

	/**
	 * @dataProvider provide_closed_contexts
	 *
	 * @param string $screen          The current screen.
	 * @param bool   $block_editor    Whether the screen is a block editor.
	 * @param bool   $proxied         Whether the request came through the proxy.
	 * @param bool   $support_session Whether the request is a support session.
	 * @param bool   $iframe          Whether the screen renders inside an iframe.
	 */
	#[DataProvider( 'provide_closed_contexts' )]
	public function test_should_load_stays_off( $screen, $block_editor, $proxied, $support_session, $iframe = false ) {
		set_current_screen( $screen );
		get_current_screen()->is_block_editor( $block_editor );
		if ( $iframe ) {
			Constants::set_constant( 'IFRAME_REQUEST', true );
		}
		$this->simulate_atomic_request( $proxied, $support_session );

		$this->assertFalse( wpcom_agents_manager_should_load_for_proxied_automattician( false ) );
	}

	/**
	 * Data provider for test_should_load_stays_off.
	 *
	 * @return array
	 */
	public static function provide_closed_contexts() {
		return array(
			'front end'       => array( 'front', false, true, false ),
			'iframed screen'  => array( 'media-upload', false, true, false, true ),
			'block widgets'   => array( 'widgets', true, true, false ),
			'classic editor'  => array( 'post', false, true, false ),
			'support session' => array( 'tools', false, true, true ),
			'not proxied'     => array( 'tools', false, false, false ),
		);
	}

	/**
	 * On Simple, both the proxy and the Automattician account are required.
	 *
	 * @dataProvider provide_simple_requests
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 *
	 * @param bool $proxied       Whether wpcom_is_proxied_request() is true.
	 * @param bool $automattician Whether is_automattician() is true.
	 * @param bool $expected      Whether the gate opens.
	 */
	#[DataProvider( 'provide_simple_requests' )]
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_should_load_on_simple( $proxied, $automattician, $expected ) {
		Constants::set_constant( 'IS_WPCOM', true );
		eval( 'function wpcom_is_proxied_request() { return ' . ( $proxied ? 'true' : 'false' ) . '; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval
		eval( 'function is_automattician() { return ' . ( $automattician ? 'true' : 'false' ) . '; }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->assertSame( $expected, wpcom_agents_manager_should_load_for_proxied_automattician( false ) );
	}

	/**
	 * Data provider for test_should_load_on_simple.
	 *
	 * @return array
	 */
	public static function provide_simple_requests() {
		return array(
			'proxied Automattician'       => array( true, true, true ),
			'Automattician off the proxy' => array( false, true, false ),
			'proxied non-Automattician'   => array( true, false, false ),
		);
	}

	/**
	 * Make the request look like it reached an Atomic site.
	 *
	 * @param bool $proxied         Whether it came through the proxy.
	 * @param bool $support_session Whether wpcomsh detected a support session.
	 */
	private function simulate_atomic_request( $proxied, $support_session ) {
		if ( $proxied ) {
			Constants::set_constant( 'AT_PROXIED_REQUEST', true );
		}
		$_COOKIE[ \WPCOMSH_Support_Session_Detect::COOKIE_NAME ] = $support_session ? 'true' : 'false';
	}
}
