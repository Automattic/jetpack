<?php
/**
 * Tests for the /wpcom/v2/jetpack-ai/feature-settings endpoint.
 *
 * Locks down the permission gate, the GET payload shape (gate state + toggles),
 * partial POST semantics (only the keys present are written, both bare-boolean
 * and { enabled } forms accepted), and the host-gate write refusal.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\Modules;
use Automattic\Jetpack\Search\Plan as Search_Plan;
use Automattic\Jetpack\Status\Cache as StatusCache;
use PHPUnit\Framework\Attributes\CoversClass;

require_once dirname( __DIR__, 2 ) . '/lib/Jetpack_REST_TestCase.php';
// Defines the is_image_studio_enabled() predicate the feature_clip availability
// reads (shared environment plus the image editor toggle). The endpoint falls
// back to available when it is absent, so it has to be loaded here for these
// assertions to exercise the predicate at all.
require_once JETPACK__PLUGIN_DIR . '/extensions/plugins/image-studio/image-studio.php';

/**
 * Class WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings_Test
 *
 * @covers \WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings
 */
#[CoversClass( WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings::class )]
class WPCOM_REST_API_V2_Endpoint_AI_Feature_Settings_Test extends Jetpack_REST_TestCase {

	const ROUTE = '/wpcom/v2/jetpack-ai/feature-settings';

	/**
	 * Filter used to pin the active plan for the plan-gate tests.
	 */
	const PLAN_FILTER = 'pre_option_' . Current_Plan::PLAN_OPTION;

	/**
	 * Priority for PLAN_FILTER. Later than the default so it wins over any
	 * plan pin an environment already registered at priority 10.
	 */
	const PLAN_FILTER_PRIORITY = 20;

	/**
	 * Admin user id.
	 *
	 * @var int
	 */
	private static $admin_id;

	/**
	 * Second admin user id — an admin who is not the connection owner and holds
	 * no user token, for the is_user_connected assertions.
	 *
	 * @var int
	 */
	private static $second_admin_id;

	/**
	 * Subscriber user id.
	 *
	 * @var int
	 */
	private static $subscriber_id;

	/**
	 * Create fixture users.
	 *
	 * @param WP_UnitTest_Factory $factory Fixture factory.
	 */
	public static function wpSetUpBeforeClass( $factory ) {
		self::$admin_id        = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$second_admin_id = $factory->user->create( array( 'role' => 'administrator' ) );
		self::$subscriber_id   = $factory->user->create( array( 'role' => 'subscriber' ) );
	}

	/**
	 * Reset the options and filters this test touches.
	 */
	public function tear_down() {
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		delete_option( Jetpack_AI_Settings::MASTER_OPTION );
		foreach ( Jetpack_AI_Settings::FEATURE_OPTIONS as $option ) {
			delete_option( $option );
		}
		remove_filter( 'wp_supports_ai', '__return_false' );
		Constants::clear_single_constant( 'IS_WPCOM' );

		delete_option( Search_Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY );

		remove_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();
		\Jetpack_Options::delete_option( array( 'master_user', 'user_tokens' ) );
		( new Connection_Manager( 'jetpack' ) )->reset_connection_status();

		remove_all_filters( 'ai_seo_enhancer_enabled' );
		remove_all_filters( 'jetpack_active_modules' );
		\Jetpack_Options::update_option( 'active_modules', array() );
		// Only our own priority, so an environment's plan pin survives.
		remove_all_filters( self::PLAN_FILTER, self::PLAN_FILTER_PRIORITY );
		self::reset_active_plan_cache();

		parent::tear_down();
	}

	/**
	 * `Current_Plan::get()` memoizes for the request, so option writes leak
	 * between tests unless the cache is cleared.
	 */
	private static function reset_active_plan_cache() {
		$property = ( new \ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support. `setAccessible()` is
		// deprecated in 8.5 (a no-op since 8.1), so only call it where it's needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * Put the site on a plan whose tier grants `ai-seo-enhancer`.
	 *
	 * `Current_Plan::get_class_and_features()` accumulates each tier's features
	 * as it walks PLAN_DATA, so `jetpack_business` is the *minimum* plan that
	 * grants the feature and every higher tier inherits it.
	 *
	 * Filtered rather than written with `update_option()`: a local dev
	 * environment may already short-circuit `pre_option_jetpack_active_plan`
	 * (tools/docker/mu-plugins can pin a plan for manual testing), which makes
	 * an option write invisible to `Current_Plan::get()`. Registering at a
	 * later priority overrides any such pin without disturbing it.
	 *
	 * @param string $product_slug Plan product slug.
	 */
	private static function set_plan( $product_slug ) {
		remove_all_filters( self::PLAN_FILTER, self::PLAN_FILTER_PRIORITY );
		add_filter(
			self::PLAN_FILTER,
			static function () use ( $product_slug ) {
				return array( 'product_slug' => $product_slug );
			},
			self::PLAN_FILTER_PRIORITY
		);
		self::reset_active_plan_cache();
	}

	/**
	 * Force the seo-tools module on or off.
	 *
	 * Filtering is what `Modules::get_active()` applies last — after it
	 * intersects the stored option with the available modules — so this
	 * controls the input regardless of which modules the test build ships.
	 *
	 * @param bool $active Whether seo-tools should report active.
	 */
	private static function set_seo_tools_active( $active ) {
		remove_all_filters( 'jetpack_active_modules' );
		add_filter(
			'jetpack_active_modules',
			static function ( $modules ) use ( $active ) {
				$modules = array_diff( (array) $modules, array( 'seo-tools' ) );
				if ( $active ) {
					$modules[] = 'seo-tools';
				}
				return array_values( $modules );
			}
		);
	}

	/**
	 * Force the `ai` module — the site-wide master switch off WordPress.com
	 * Simple — on or off.
	 *
	 * Off-Simple the master lives in the `ai` module, not the
	 * `jetpack_ai_enabled` option, so tests drive it here. Filtering is applied
	 * last in `Modules::get_active()` (after the availability intersection), so
	 * it controls the master regardless of which modules the build ships.
	 *
	 * @param bool $active Whether the master (the `ai` module) should be on.
	 */
	private static function set_ai_module_active( $active ) {
		add_filter(
			'jetpack_active_modules',
			static function ( $modules ) use ( $active ) {
				$modules = array_diff( (array) $modules, array( 'ai' ) );
				if ( $active ) {
					$modules[] = 'ai';
				}
				return array_values( $modules );
			}
		);
	}

	/**
	 * Read `features.seo.available` off a fresh GET.
	 *
	 * @return bool
	 */
	private function get_seo_available() {
		return $this->dispatch( 'GET' )->get_data()['features']['ai_seo']['available'];
	}

	/**
	 * The availability gate ANDs three independent inputs; with all three
	 * satisfied the row is available.
	 *
	 * Positive-entitlement is asserted on the self-hosted flavor only. On
	 * WordPress.com Atomic (wpcomsh) `advanced-seo` is a registered wpcom
	 * feature, so Current_Plan::supports() resolves it through the real
	 * wpcom_site_has_feature() purchase lookup rather than the
	 * `jetpack_active_plan` filter set here; forcing a matching purchase would
	 * couple this test to wpcomsh's purchase schema. The two unavailable cases
	 * below still run on both flavors.
	 */
	public function test_seo_row_available_when_all_inputs_true() {
		if ( getenv( 'JETPACK_TEST_WPCOMSH' ) ) {
			$this->markTestSkipped( 'Entitlement resolves through the wpcom purchase gate on Atomic; the positive case is covered on the self-hosted flavor.' );
		}

		wp_set_current_user( self::$admin_id );

		// 1. `ai_seo_enhancer_enabled` defaults to true — left unfiltered.
		self::set_seo_tools_active( true );   // 2.
		self::set_plan( 'jetpack_business' ); // 3.

		$this->assertTrue( $this->get_seo_available() );
	}

	/**
	 * Input 1 falsified alone: the `ai_seo_enhancer_enabled` kill switch is off.
	 */
	public function test_seo_row_unavailable_when_filter_off() {
		wp_set_current_user( self::$admin_id );

		self::set_seo_tools_active( true );
		self::set_plan( 'jetpack_business' );
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		$this->assertFalse( $this->get_seo_available() );
	}

	/**
	 * Input 2 falsified alone: the seo-tools module is inactive.
	 *
	 * This input cannot be falsified on WordPress.com Simple —
	 * `Modules::is_active()` returns true unconditionally when `IS_WPCOM` is
	 * defined, so there the gate reduces to inputs 1 AND 3. The assertion below
	 * therefore covers the self-hosted and Atomic paths only; it is not a claim
	 * about Simple.
	 */
	public function test_seo_row_unavailable_when_module_inactive() {
		wp_set_current_user( self::$admin_id );

		self::set_seo_tools_active( false );
		self::set_plan( 'jetpack_business' );

		$this->assertFalse( $this->get_seo_available() );
	}

	/**
	 * Input 3 on a free plan: the row follows `advanced-seo`, which sits in the
	 * free plan's supports list, so it is offered wherever SEO tools run. The
	 * row governs user-initiated suggestions as well as automatic generation,
	 * and only the automatic half needs the higher `ai-seo-enhancer` tier.
	 */
	public function test_seo_row_available_on_a_free_plan() {
		wp_set_current_user( self::$admin_id );

		self::set_seo_tools_active( true );
		self::set_plan( 'jetpack_free' );

		$this->assertTrue( $this->get_seo_available() );
	}

	/**
	 * Simulate a connected owner, which is what the Image Studio environment
	 * predicate requires off WordPress.com Simple.
	 */
	private static function connect_owner() {
		\Jetpack_Options::update_option( 'master_user', self::$admin_id );
		\Jetpack_Options::update_option( 'user_tokens', array( self::$admin_id => 'token.secret.' . self::$admin_id ) );
		( new Connection_Manager( 'jetpack' ) )->reset_connection_status();
	}

	/**
	 * Read `features.feature_clip.available` off a fresh GET.
	 *
	 * @return bool
	 */
	private function get_feature_clip_available() {
		return $this->dispatch( 'GET' )->get_data()['features']['feature_clip']['available'];
	}

	/**
	 * A normal environment — connected owner, master switch on — offers Feature
	 * Clip, so the row is available.
	 */
	public function test_feature_clip_available_in_normal_environment() {
		wp_set_current_user( self::$admin_id );
		self::connect_owner();
		self::set_ai_module_active( true );

		$this->assertTrue( $this->get_feature_clip_available() );
	}

	/**
	 * The master switch is the first check inside the Image Studio environment
	 * predicate: with it off nothing about Image Studio loads, so the row is
	 * unavailable.
	 */
	public function test_feature_clip_unavailable_when_environment_gate_fails() {
		wp_set_current_user( self::$admin_id );
		self::connect_owner();

		// Master enforcement only runs on internal testing environments.
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		// Off-Simple the master is the `ai` module; turn it off.
		self::set_ai_module_active( false );

		$this->assertFalse( $this->get_feature_clip_available() );
	}

	/**
	 * Feature Clip is nested under the image editor: with the image editor
	 * toggle off, availability reports false. The settings page keys the greyed
	 * (but still visible) nested clip row off this field.
	 */
	public function test_feature_clip_unavailable_when_image_editor_off() {
		wp_set_current_user( self::$admin_id );
		self::connect_owner();
		self::set_ai_module_active( true );

		// The owned toggles only apply on internal testing environments.
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		update_option( Jetpack_AI_Settings::FEATURE_OPTIONS['image_editor'], false );

		$data = $this->dispatch( 'GET' )->get_data();

		$this->assertFalse( $data['features']['image_editor']['enabled'] );
		$this->assertFalse( $data['features']['feature_clip']['available'] );
	}

	/**
	 * Dispatch a request against the endpoint.
	 *
	 * @param string     $method HTTP method.
	 * @param array|null $body   JSON body for POST.
	 * @return WP_REST_Response
	 */
	private function dispatch( $method, $body = null ) {
		$request = new WP_REST_Request( $method, self::ROUTE );
		if ( null !== $body ) {
			$request->set_header( 'Content-Type', 'application/json' );
			$request->set_body( wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) );
		}
		return $this->server->dispatch( $request );
	}

	/**
	 * The route is registered.
	 */
	public function test_route_is_registered() {
		$this->assertArrayHasKey( self::ROUTE, $this->server->get_routes() );
	}

	/**
	 * The route registers on WordPress.com Simple too: the Hub's WordPress
	 * Agent view reads and writes through it wherever the page loads, and on
	 * Simple it is the only writable surface for the options.
	 */
	public function test_route_is_registered_on_wpcom_simple() {
		Constants::set_constant( 'IS_WPCOM', true );
		$this->rebuild_rest_server();

		$this->assertArrayHasKey( self::ROUTE, $this->server->get_routes() );
	}

	/**
	 * On WordPress.com Simple the master switch is the jetpack_ai_enabled
	 * option: POST writes it, GET reports it, and the jetpack_ai_enabled
	 * filter every load point consults follows — with no internal-testing
	 * scoping, since the controls always apply on Simple.
	 */
	public function test_post_master_switch_on_wpcom_simple() {
		wp_set_current_user( self::$admin_id );
		Constants::set_constant( 'IS_WPCOM', true );
		$this->rebuild_rest_server();

		$this->assertTrue( $this->dispatch( 'GET' )->get_data()['master_enabled'], 'Precondition: the master defaults on.' );

		$data = $this->dispatch( 'POST', array( 'master_enabled' => false ) )->get_data();

		$this->assertFalse( $data['master_enabled'] );
		$this->assertFalse( (bool) get_option( Jetpack_AI_Settings::MASTER_OPTION, true ), 'The setter routed the write to the option, the master store on Simple.' );
		$this->assertFalse( Jetpack_AI_Settings::is_master_enabled() );
		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', true ) );
	}

	/**
	 * On WordPress.com Simple the per-feature toggles write their options and
	 * the load-point predicate honors them — the same partial-POST semantics
	 * as everywhere else, with no internal-testing scoping.
	 */
	public function test_post_features_on_wpcom_simple() {
		wp_set_current_user( self::$admin_id );
		Constants::set_constant( 'IS_WPCOM', true );
		$this->rebuild_rest_server();

		$data = $this->dispatch(
			'POST',
			array(
				'features' => array(
					'writing_assistant' => false,
					'ai_seo'            => array( 'enabled' => false ),
				),
			)
		)->get_data();

		$this->assertFalse( $data['features']['writing_assistant']['enabled'] );
		$this->assertFalse( $data['features']['ai_seo']['enabled'] );
		// Untouched keys keep their defaults.
		$this->assertTrue( $data['features']['image_editor']['enabled'] );

		// The options actually changed and the load points read them on Simple.
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'writing_assistant' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'ai_seo' ) );
		$this->assertTrue( Jetpack_AI_Settings::is_feature_enabled( 'image_editor' ) );
	}

	/**
	 * Throw away the spy REST server and register every route from scratch.
	 */
	private function rebuild_rest_server() {
		global $wp_rest_server;
		$wp_rest_server = new JPTest_Spy_REST_Server();
		$this->server   = $wp_rest_server;
		do_action( 'rest_api_init', $wp_rest_server );
	}

	/**
	 * Non-admins are refused.
	 */
	public function test_requires_manage_options() {
		wp_set_current_user( self::$subscriber_id );

		$response = $this->dispatch( 'GET' );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'rest_forbidden', $response->get_data()['code'] );
	}

	/**
	 * GET returns the full gate + toggles shape with the documented defaults.
	 */
	public function test_get_returns_gate_state_and_defaults() {
		wp_set_current_user( self::$admin_id );
		// Off-Simple the master is the `ai` module; turn it on for the default shape.
		self::set_ai_module_active( true );

		$response = $this->dispatch( 'GET' );
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $data['host_allows_ai'] );
		$this->assertTrue( $data['master_enabled'] );
		$this->assertArrayHasKey( 'is_connected', $data );
		$this->assertArrayHasKey( 'is_user_connected', $data );
		$this->assertArrayHasKey( 'supports_ai', $data['plan'] );
		$this->assertArrayHasKey( 'supports_search', $data['plan'] );
		// No Search plan info at all: not the free tier, just unentitled.
		$this->assertFalse( $data['plan']['is_free_search_plan'] );

		$features = $data['features'];
		$this->assertTrue( $features['writing_assistant']['enabled'] );
		$this->assertTrue( $features['image_editor']['enabled'] );
		// The image label option is not part of the settings surface.
		$this->assertArrayNotHasKey( 'sub', $features['image_editor'] );
		$this->assertArrayNotHasKey( 'image_label', $features );
		$this->assertArrayNotHasKey( 'excerpt', $features );
		$this->assertTrue( $features['ai_seo']['enabled'] );
		// The automatic-generation option keeps its own surfaces; the settings
		// page only carries the AI SEO row.
		$this->assertArrayNotHasKey( 'seo_enhancer', $features );
		$this->assertFalse( $features['ai_search']['enabled'] );
		// No paid Search product in the test environment.
		$this->assertTrue( $features['ai_search']['requires_upgrade'] );
	}

	/**
	 * The ai_search.requires_upgrade gate clears only when the paid Search product is
	 * provisioned: Instant Search supported and not the free tier. Mirrors the
	 * Search dashboard's own AI Answers upsell gate.
	 */
	public function test_ai_search_gate_clears_with_paid_search() {
		wp_set_current_user( self::$admin_id );

		update_option(
			Search_Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'supports_search'         => true,
				'effective_subscription'  => array( 'product_slug' => 'jetpack_search' ),
			)
		);

		$data = $this->dispatch( 'GET' )->get_data();

		$this->assertFalse( $data['features']['ai_search']['requires_upgrade'] );
		// The entitlement field keeps its own meaning.
		$this->assertTrue( $data['plan']['supports_search'] );
		$this->assertFalse( $data['plan']['is_free_search_plan'] );
	}

	/**
	 * The free Search tier supports Instant Search but cannot run AI Answers,
	 * so the row keeps its upgrade gate. Same for a Classic-only paid plan,
	 * which lacks Instant Search.
	 */
	public function test_ai_search_gate_stays_without_paid_instant_search() {
		wp_set_current_user( self::$admin_id );

		// Free tier: Instant Search supported, free product slug.
		update_option(
			Search_Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => true,
				'supports_search'         => true,
				'effective_subscription'  => array( 'product_slug' => Search_Plan::JETPACK_SEARCH_FREE_PRODUCT_SLUG ),
			)
		);
		$data = $this->dispatch( 'GET' )->get_data();
		$this->assertTrue( $data['features']['ai_search']['requires_upgrade'] );
		// The free tier reports supports_search, so the client needs this flag
		// to route the badge tooltip to the upgrade copy instead of setup.
		$this->assertTrue( $data['plan']['supports_search'] );
		$this->assertTrue( $data['plan']['is_free_search_plan'] );

		// Classic-only: entitled to Search, but no Instant Search.
		update_option(
			Search_Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY,
			array(
				'supports_instant_search' => false,
				'supports_search'         => true,
				'effective_subscription'  => array( 'product_slug' => 'jetpack_search' ),
			)
		);
		$data = $this->dispatch( 'GET' )->get_data();
		$this->assertTrue( $data['features']['ai_search']['requires_upgrade'] );
		$this->assertTrue( $data['plan']['supports_search'] );
		// A paid Classic-only plan is not the free tier — the badge tooltip
		// keeps the setup copy for it.
		$this->assertFalse( $data['plan']['is_free_search_plan'] );
	}

	/**
	 * A connected owner in offline mode must not report is_connected: every AI
	 * feature load point requires `! is_offline_mode()` alongside the connected
	 * owner, so the endpoint has to report the same gate state or the settings
	 * page would describe features that cannot load.
	 */
	public function test_is_connected_false_in_offline_mode() {
		wp_set_current_user( self::$admin_id );

		// Simulate a connected owner — same fixture the load-point tests use.
		\Jetpack_Options::update_option( 'master_user', self::$admin_id );
		\Jetpack_Options::update_option( 'user_tokens', array( self::$admin_id => 'token.secret.' . self::$admin_id ) );
		( new Connection_Manager( 'jetpack' ) )->reset_connection_status();

		$this->assertTrue( $this->dispatch( 'GET' )->get_data()['is_connected'] );

		add_filter( 'jetpack_offline_mode', '__return_true' );
		StatusCache::clear();

		$this->assertFalse( $this->dispatch( 'GET' )->get_data()['is_connected'] );
	}

	/**
	 * The site-level is_connected reports the connected-owner gate while
	 * is_user_connected reports the requesting user's own token: an admin whose
	 * account is not connected on an owner-connected site gets is_connected
	 * true with is_user_connected false — the state where the editor chat
	 * downgrades to its disconnected variant.
	 */
	public function test_is_user_connected_tracks_current_user_not_owner() {
		self::connect_owner();

		wp_set_current_user( self::$second_admin_id );
		$data = $this->dispatch( 'GET' )->get_data();
		$this->assertTrue( $data['is_connected'] );
		$this->assertFalse( $data['is_user_connected'] );

		// The owner holds a token, so the same site reports both bits true.
		wp_set_current_user( self::$admin_id );
		$data = $this->dispatch( 'GET' )->get_data();
		$this->assertTrue( $data['is_connected'] );
		$this->assertTrue( $data['is_user_connected'] );
	}

	/**
	 * POST writes only the keys present and returns the fresh shape. Both the
	 * bare-boolean and { enabled } forms are accepted.
	 */
	public function test_post_partial_update() {
		wp_set_current_user( self::$admin_id );

		// The owned toggles only apply on internal testing environments.
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$data = $this->dispatch(
			'POST',
			array(
				'features' => array(
					'writing_assistant' => false,
					'ai_seo'            => false,
					// A stale client may still send removed keys. They are ignored.
					'seo_enhancer'      => array( 'enabled' => true ),
					'excerpt'           => false,
				),
			)
		)->get_data();

		$this->assertFalse( $data['features']['writing_assistant']['enabled'] );
		$this->assertFalse( $data['features']['ai_seo']['enabled'] );
		// Untouched keys keep their defaults.
		$this->assertTrue( $data['features']['image_editor']['enabled'] );

		// The options actually changed — this is what the load points read.
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'writing_assistant' ) );
		$this->assertFalse( Jetpack_AI_Settings::is_feature_enabled( 'ai_seo' ) );

		// The automatic-generation option is owned by the Traffic page and the SEO
		// dashboard: this endpoint no longer writes it.
		$this->assertFalse( (bool) get_option( 'ai_seo_enhancer_enabled', false ) );
	}

	/**
	 * Turning the master switch off through the endpoint flips the
	 * jetpack_ai_enabled filter every load point consults.
	 */
	public function test_post_master_switch() {
		wp_set_current_user( self::$admin_id );

		// Master enforcement only runs on internal testing environments.
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		// Off-Simple the master is the `ai` module; start it active so the write
		// actually flips state and we exercise the setter's module routing.
		\Jetpack_Options::update_option( 'active_modules', array( 'ai' ) );
		$this->assertTrue( ( new Modules() )->is_active( 'ai' ), 'Precondition: the master is on.' );

		$data = $this->dispatch( 'POST', array( 'master_enabled' => false ) )->get_data();

		$this->assertFalse( $data['master_enabled'] );
		$this->assertFalse( ( new Modules() )->is_active( 'ai' ), 'The setter routed the write to the ai module.' );
		$this->assertFalse( apply_filters( 'jetpack_ai_enabled', true ) );
	}

	/**
	 * When the host has switched AI off there is nothing to configure: writes
	 * are refused.
	 */
	public function test_post_refused_when_host_disallows_ai() {
		if ( ! function_exists( 'wp_supports_ai' ) ) {
			$this->markTestSkipped( 'wp_supports_ai() is not available in this WordPress version.' );
		}

		wp_set_current_user( self::$admin_id );
		add_filter( 'wp_supports_ai', '__return_false' );

		$response = $this->dispatch( 'POST', array( 'master_enabled' => false ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertSame( 'ai_disabled_by_host', $response->get_data()['code'] );
	}
}
