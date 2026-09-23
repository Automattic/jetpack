<?php
/**
 * Survicate Tests File
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace A8C\FSE;

use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Jetpack_Mu_Wpcom;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/survicate/class-survicate.php';

/**
 * Class Survicate_Test
 *
 * @covers \A8C\FSE\Survicate
 */
#[CoversClass( Survicate::class )]
class Survicate_Test extends \WorDBless\BaseTestCase {

	/**
	 * The Survicate instance.
	 *
	 * @var Survicate
	 */
	private $survicate;

	/**
	 * Original $pagenow global value to restore after tests.
	 *
	 * @var mixed
	 */
	private $original_pagenow;

	/**
	 * Original current_screen global value to restore after tests.
	 *
	 * @var mixed
	 */
	private $original_current_screen;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();
		$this->survicate = new Survicate();

		global $pagenow;
		$this->original_pagenow        = $pagenow;
		$this->original_current_screen = $GLOBALS['current_screen'] ?? null;
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		remove_action( 'admin_enqueue_scripts', array( $this->survicate, 'enqueue_scripts' ), 100 );

		global $pagenow;
		$pagenow = $this->original_pagenow;

		if ( $this->original_current_screen === null ) {
			unset( $GLOBALS['current_screen'] );
		} else {
			$GLOBALS['current_screen'] = $this->original_current_screen;
		}

		wp_set_current_user( 0 );

		global $wp_scripts;
		$wp_scripts = null;

		Constants::clear_constants();

		delete_transient( Survicate::ASSET_TRANSIENT_KEY );
		remove_all_filters( 'pre_http_request' );

		parent::tear_down();
	}

	/**
	 * Helper to call a private method on the Survicate instance via reflection.
	 *
	 * @param string $method_name The method name to call.
	 * @return mixed The method's return value.
	 */
	private function call_private_method( $method_name ) {
		$method = ( new \ReflectionClass( Survicate::class ) )->getMethod( $method_name );
		return $method->invoke( $this->survicate );
	}

	/**
	 * Helper to simulate admin context for tests.
	 */
	private function set_admin_context() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );
	}

	/**
	 * Helper to create a logged-in user.
	 *
	 * @param string $locale The locale for the user.
	 * @return int The user ID.
	 */
	private function create_and_login_user( $locale = 'en_US' ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_user_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'test@example.com',
				'locale'     => $locale,
			)
		);
		wp_set_current_user( $user_id );
		return $user_id;
	}

	/**
	 * Helper to set up a block editor screen via reflection.
	 *
	 * @param string $screen_id The screen ID (e.g. 'post', 'widgets').
	 */
	private function set_block_editor_screen( $screen_id ) {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( $screen_id );
		$screen   = get_current_screen();
		$property = ( new \ReflectionClass( $screen ) )->getProperty( 'is_block_editor' );
		$property->setValue( $screen, true );
	}

	/**
	 * Helper to set up admin context with a logged-in English user and enqueue scripts.
	 */
	private function enqueue_survicate_scripts() {
		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();
		$this->create_and_login_user( 'en_US' );
		$this->survicate->enqueue_scripts();
	}

	/**
	 * Pretend the bundle's asset manifest was already fetched and cached.
	 *
	 * @param array $asset Decoded asset JSON.
	 */
	private function stub_asset_json( $asset ) {
		set_transient( Survicate::ASSET_TRANSIENT_KEY, $asset, HOUR_IN_SECONDS );
	}

	/**
	 * Helper to read the `before` inline script attached to the bundle handle.
	 *
	 * @return string
	 */
	private function get_before_script() {
		global $wp_scripts;
		$before = $wp_scripts->registered['wpcom-survicate']->extra['before'] ?? array();
		return implode( "\n", array_filter( $before ) );
	}

	// ---- should_load() tests ----

	/**
	 * Tests that should_load returns false when user is not logged in.
	 */
	public function test_should_load_returns_false_when_not_logged_in() {
		$this->set_admin_context();
		wp_set_current_user( 0 );

		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Tests that should_load returns false when not in admin context.
	 */
	public function test_should_load_returns_false_when_not_admin() {
		$this->create_and_login_user();

		$this->assertFalse( is_admin() );
		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Tests that should_load returns false for non-English locale users.
	 *
	 * @param string $locale The locale to test.
	 * @dataProvider provide_non_english_locales
	 */
	#[DataProvider( 'provide_non_english_locales' )]
	public function test_should_load_returns_false_for_non_english_locale( $locale ) {
		$this->set_admin_context();
		$this->create_and_login_user( $locale );

		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Data provider for non-English locale tests.
	 *
	 * @return \Iterator
	 */
	public static function provide_non_english_locales(): \Iterator {
		yield 'French' => array( 'fr_FR' );
		yield 'Spanish' => array( 'es_ES' );
		yield 'Japanese' => array( 'ja' );
		yield 'Portuguese (Brazil)' => array( 'pt_BR' );
	}

	/**
	 * Tests that should_load returns true for English locale variants.
	 *
	 * @param string $locale The locale to test.
	 * @dataProvider provide_english_locales
	 */
	#[DataProvider( 'provide_english_locales' )]
	public function test_should_load_returns_true_for_english_locales( $locale ) {
		$this->set_admin_context();
		$this->create_and_login_user( $locale );

		$this->assertTrue( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Tests that should_load returns false on network admin pages.
	 *
	 * Note: is_network_admin() reads $GLOBALS['current_screen']->in_admin( 'network' )
	 * when a screen is set, so we set a -network-suffixed hook to put WP_Screen
	 * into network admin mode.
	 */
	public function test_should_load_returns_false_on_network_admin() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard-network' );
		$this->create_and_login_user();

		$this->assertTrue( is_network_admin() );
		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Tests that should_load returns false on user admin pages.
	 */
	public function test_should_load_returns_false_on_user_admin() {
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard-user' );
		$this->create_and_login_user();

		$this->assertTrue( is_user_admin() );
		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Tests that should_load returns false when WP_NETWORK_ADMIN is set via constant
	 * (the branch hit on real /wp-admin/network/* requests before current_screen exists).
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_should_load_returns_false_when_wp_network_admin_constant_set() {
		define( 'WP_ADMIN', true );
		define( 'WP_NETWORK_ADMIN', true );
		$this->create_and_login_user();

		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Tests that should_load returns false when WP_USER_ADMIN is set via constant.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_should_load_returns_false_when_wp_user_admin_constant_set() {
		define( 'WP_ADMIN', true );
		define( 'WP_USER_ADMIN', true );
		$this->create_and_login_user();

		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Tests that should_load returns false on a P2 site detected via stylesheet.
	 *
	 * Note: get_wpcom_site_id() returns 0 off-wpcom, so we set IS_WPCOM to
	 * route through get_current_blog_id() and surface a non-zero id.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_should_load_returns_false_on_p2_site_via_stylesheet() {
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		add_filter( 'stylesheet', static fn () => 'pub/p2-2020' );

		$this->set_admin_context();
		$this->create_and_login_user();

		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Tests that should_load returns false when WPForTeams reports a P2 site.
	 *
	 * Brain Monkey can't redefine namespaced WP / mu-wpcom functions that this code path
	 * touches (the test bootstrap loads them before Patchwork), so we eval a namespace
	 * block to declare the WPForTeams stub and use @runInSeparateProcess for isolation.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_should_load_returns_false_on_p2_site_via_wpforteams() {
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		eval( 'namespace WPForTeams { function is_wpforteams_site( $blog_id ) { return true; } }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		$this->set_admin_context();
		$this->create_and_login_user();

		$this->assertFalse( $this->call_private_method( 'should_load' ) );
	}

	/**
	 * Data provider for English locale variant tests.
	 *
	 * @return \Iterator
	 */
	public static function provide_english_locales(): \Iterator {
		yield 'en_US' => array( 'en_US' );
		yield 'en_GB' => array( 'en_GB' );
		yield 'en_AU' => array( 'en_AU' );
		yield 'en_CA' => array( 'en_CA' );
	}

	// ---- get_editor_context() tests ----

	/**
	 * Tests that get_editor_context returns 'site-editor' on site-editor.php.
	 */
	public function test_get_editor_context_returns_site_editor() {
		global $pagenow;
		$pagenow = 'site-editor.php';

		$this->assertSame( 'site-editor', $this->call_private_method( 'get_editor_context' ) );
	}

	/**
	 * Tests that get_editor_context returns 'block-editor' in block editor screen.
	 */
	public function test_get_editor_context_returns_block_editor() {
		global $pagenow;
		$pagenow = 'post.php';
		$this->set_block_editor_screen( 'post' );

		$this->assertSame( 'block-editor', $this->call_private_method( 'get_editor_context' ) );
	}

	/**
	 * Tests that get_editor_context returns 'wp-admin' for widgets screen even with block editor.
	 */
	public function test_get_editor_context_returns_wp_admin_for_widgets() {
		global $pagenow;
		$pagenow = 'widgets.php';
		$this->set_block_editor_screen( 'widgets' );

		$this->assertSame( 'wp-admin', $this->call_private_method( 'get_editor_context' ) );
	}

	/**
	 * Tests that get_editor_context returns 'wp-admin' on regular admin pages.
	 */
	public function test_get_editor_context_returns_wp_admin_by_default() {
		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();

		$this->assertSame( 'wp-admin', $this->call_private_method( 'get_editor_context' ) );
	}

	// ---- get_visitor_traits() tests ----

	/**
	 * Tests that get_visitor_traits returns correct structure and values.
	 */
	public function test_get_visitor_traits_returns_correct_structure() {
		global $pagenow;
		$pagenow = 'site-editor.php';
		$this->set_admin_context();
		$this->create_and_login_user();

		$traits = $this->call_private_method( 'get_visitor_traits' );

		$this->assertSame( 'test@example.com', $traits['email'] );
		$this->assertArrayHasKey( 'site_id', $traits );
		$this->assertArrayHasKey( 'site_type', $traits );
		$this->assertSame( 'site-editor', $traits['editor_context'] );
	}

	/**
	 * Tests that get_visitor_traits returns 'atomic' site_type when IS_ATOMIC is set.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_visitor_traits_returns_atomic_site_type() {
		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();
		$this->create_and_login_user();

		if ( ! defined( 'IS_ATOMIC' ) ) {
			define( 'IS_ATOMIC', true );
		}

		$traits = $this->call_private_method( 'get_visitor_traits' );

		$this->assertSame( 'atomic', $traits['site_type'] );
	}

	/**
	 * Tests that get_visitor_traits returns is_big_sky_site = 'false' when neither sticker is set.
	 *
	 * Runs in a separate process so the absence of has_blog_sticker is not coupled to other
	 * tests in this file that may eval one in.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_visitor_traits_returns_is_big_sky_site_false_by_default() {
		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();
		$this->create_and_login_user();

		$traits = $this->call_private_method( 'get_visitor_traits' );

		$this->assertSame( 'false', $traits['is_big_sky_site'] );
	}

	/**
	 * Tests that get_visitor_traits returns is_big_sky_site = 'true' when the big-sky-enabled sticker is set.
	 *
	 * Note: is_big_sky_site() returns false off-wpcom (get_wpcom_blog_id() is falsy), so we
	 * set IS_WPCOM to route through get_current_blog_id() and surface a non-zero id. We then
	 * eval a global-namespace has_blog_sticker stub that wpcom_has_blog_sticker proxies to;
	 * Brain Monkey can't redefine wpcom_has_blog_sticker here because mu-wpcom's test
	 * bootstrap loads utils.php before Patchwork.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_visitor_traits_returns_is_big_sky_site_true_for_big_sky_enabled_sticker() {
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		eval( 'namespace { function has_blog_sticker( $sticker, $blog_id ) { return $sticker === "big-sky-enabled"; } }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();
		$this->create_and_login_user();

		$traits = $this->call_private_method( 'get_visitor_traits' );

		$this->assertSame( 'true', $traits['is_big_sky_site'] );
	}

	/**
	 * Tests that get_visitor_traits returns is_big_sky_site = 'true' when the big-sky-free-trial sticker is set.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_visitor_traits_returns_is_big_sky_site_true_for_big_sky_free_trial_sticker() {
		if ( ! defined( 'IS_WPCOM' ) ) {
			define( 'IS_WPCOM', true );
		}

		eval( 'namespace { function has_blog_sticker( $sticker, $blog_id ) { return $sticker === "big-sky-free-trial"; } }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();
		$this->create_and_login_user();

		$traits = $this->call_private_method( 'get_visitor_traits' );

		$this->assertSame( 'true', $traits['is_big_sky_site'] );
	}

	/**
	 * Tests that is_big_sky_site short-circuits to false when no blog ID is available.
	 *
	 * Covers the get_wpcom_blog_id() === false path. Without IS_WPCOM / IS_ATOMIC the
	 * helper returns false, so the guard fires before the sticker check. has_blog_sticker
	 * is eval'd to return true so a regression that removes the guard would make this
	 * assertion fail.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_get_visitor_traits_returns_is_big_sky_site_false_when_blog_id_unavailable() {
		eval( 'namespace { function has_blog_sticker( $sticker, $blog_id ) { return true; } }' ); // phpcs:ignore Squiz.PHP.Eval.Discouraged,MediaWiki.Usage.ForbiddenFunctions.eval

		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();
		$this->create_and_login_user();

		$traits = $this->call_private_method( 'get_visitor_traits' );

		$this->assertSame( 'false', $traits['is_big_sky_site'] );
	}

	// ---- enqueue_scripts() tests ----

	/**
	 * Tests that enqueue_scripts does not enqueue when should_load returns false.
	 */
	public function test_enqueue_scripts_does_not_enqueue_when_not_logged_in() {
		$this->set_admin_context();
		wp_set_current_user( 0 );

		$this->survicate->enqueue_scripts();

		$this->assertFalse( wp_script_is( 'wpcom-survicate', 'enqueued' ) );
	}

	/**
	 * Tests that enqueue_scripts does not enqueue for non-English locale.
	 */
	public function test_enqueue_scripts_does_not_enqueue_for_non_english_locale() {
		$this->set_admin_context();
		$this->create_and_login_user( 'fr_FR' );

		$this->survicate->enqueue_scripts();

		$this->assertFalse( wp_script_is( 'wpcom-survicate', 'enqueued' ) );
	}

	/**
	 * Tests that the shared widgets.wp.com bundle is enqueued with the manifest's dependencies and version.
	 */
	public function test_enqueue_scripts_enqueues_widgets_bundle_with_asset_metadata() {
		global $wp_scripts;

		$this->stub_asset_json(
			array(
				'dependencies' => array( 'wp-data' ),
				'version'      => 'abc123',
			)
		);

		$this->enqueue_survicate_scripts();

		$this->assertTrue( wp_script_is( 'wpcom-survicate', 'enqueued' ) );

		$script = $wp_scripts->registered['wpcom-survicate'];
		$this->assertSame( 'https://widgets.wp.com/survicate/survicate.min.js', $script->src );
		$this->assertSame( array( 'wp-data' ), $script->deps );
		$this->assertSame( 'abc123', $script->ver );
	}

	/**
	 * Tests that the config the bundle reads is emitted before it, and that no inline implementation remains.
	 */
	public function test_enqueue_scripts_emits_config_before_the_bundle() {
		global $wp_scripts;

		$this->stub_asset_json(
			array(
				'dependencies' => array( 'wp-data' ),
				'version'      => 'abc123',
			)
		);

		$this->enqueue_survicate_scripts();

		$before = $this->get_before_script();
		$this->assertStringStartsWith( 'window.wpcomSurvicateConfig = ', $before );
		$this->assertStringContainsString( '"locale":"en_US"', $before );
		$this->assertStringContainsString( '"email":"test@example.com"', $before );
		$this->assertStringContainsString( '"editor_context":"wp-admin"', $before );
		$this->assertStringContainsString( '"is_big_sky_site":"false"', $before );

		$after = array_filter( $wp_scripts->registered['wpcom-survicate']->extra['after'] ?? array() );
		$this->assertSame( array(), $after, 'The inline Survicate implementation must be gone.' );
	}

	/**
	 * Tests that nothing is enqueued when the asset manifest cannot be read.
	 */
	public function test_enqueue_scripts_does_not_enqueue_when_asset_json_is_unavailable() {
		add_filter( 'pre_http_request', static fn () => new \WP_Error( 'offline' ) );

		$this->enqueue_survicate_scripts();

		$this->assertFalse( wp_script_is( 'wpcom-survicate', 'enqueued' ) );
	}

	/**
	 * Tests that a successfully fetched manifest is cached for later requests.
	 */
	public function test_enqueue_scripts_caches_the_asset_json() {
		add_filter(
			'pre_http_request',
			static fn () => array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode(
					array(
						'dependencies' => array( 'wp-data' ),
						'version'      => 'fetched',
					),
					JSON_UNESCAPED_SLASHES
				),
			)
		);

		$this->enqueue_survicate_scripts();

		$cached = get_transient( Survicate::ASSET_TRANSIENT_KEY );
		$this->assertSame( 'fetched', $cached['version'] );

		global $wp_scripts;
		$this->assertSame( 'fetched', $wp_scripts->registered['wpcom-survicate']->ver );
	}

	/**
	 * Tests that a failed manifest fetch is cached so later requests do not block on the network again.
	 */
	public function test_enqueue_scripts_caches_asset_json_failures() {
		$requests = 0;
		add_filter(
			'pre_http_request',
			static function () use ( &$requests ) {
				++$requests;
				return new \WP_Error( 'offline' );
			}
		);

		$this->enqueue_survicate_scripts();
		$this->survicate->enqueue_scripts();

		$this->assertSame( 1, $requests );
		$this->assertFalse( wp_script_is( 'wpcom-survicate', 'enqueued' ) );
	}

	/**
	 * Tests that nothing is enqueued when the manifest request returns a non-200 response.
	 */
	public function test_enqueue_scripts_does_not_enqueue_on_non_200_response() {
		add_filter(
			'pre_http_request',
			static fn () => array(
				'response' => array( 'code' => 404 ),
				'body'     => '',
			)
		);

		$this->enqueue_survicate_scripts();

		$this->assertFalse( wp_script_is( 'wpcom-survicate', 'enqueued' ) );
	}

	/**
	 * Tests that nothing is enqueued when the manifest has no version.
	 */
	public function test_enqueue_scripts_does_not_enqueue_when_manifest_has_no_version() {
		add_filter(
			'pre_http_request',
			static fn () => array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'dependencies' => array( 'wp-data' ) ), JSON_UNESCAPED_SLASHES ),
			)
		);

		$this->enqueue_survicate_scripts();

		$this->assertFalse( wp_script_is( 'wpcom-survicate', 'enqueued' ) );
	}

	/**
	 * Tests that proxied requests get a random version so sandboxed builds bypass the browser cache.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_enqueue_scripts_busts_cache_when_proxied() {
		global $wp_scripts;

		define( 'A8C_PROXIED_REQUEST', true );
		$this->stub_asset_json(
			array(
				'dependencies' => array( 'wp-data' ),
				'version'      => 'abc123',
			)
		);

		$this->enqueue_survicate_scripts();

		$this->assertTrue( wp_script_is( 'wpcom-survicate', 'enqueued' ) );
		$this->assertNotSame( 'abc123', $wp_scripts->registered['wpcom-survicate']->ver );
	}

	/**
	 * Tests that trait values cannot close the inline script tag.
	 */
	public function test_enqueue_scripts_escapes_script_tags_in_config() {
		// Core sanitizes emails on insert; drop that so a hostile value reaches the traits.
		remove_all_filters( 'pre_user_email' );

		$this->stub_asset_json(
			array(
				'dependencies' => array( 'wp-data' ),
				'version'      => 'abc123',
			)
		);

		global $pagenow;
		$pagenow = 'index.php';
		$this->set_admin_context();
		$user_id = wp_insert_user(
			array(
				'user_login' => 'test_user_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'x</script><script>alert(1)</script>@example.com',
				'locale'     => 'en_US',
			)
		);
		wp_set_current_user( $user_id );
		$this->assertStringContainsString( '</script>', wp_get_current_user()->user_email );

		$this->survicate->enqueue_scripts();

		$before = $this->get_before_script();
		$this->assertStringStartsWith( 'window.wpcomSurvicateConfig = ', $before );
		$this->assertStringNotContainsString( '</script>', $before );
	}

	// ---- Singleton tests ----

	/**
	 * Tests that the init method creates a singleton instance.
	 */
	public function test_init_creates_singleton_instance() {
		$property = ( new \ReflectionClass( Survicate::class ) )->getProperty( 'instance' );

		$dummy = $this->survicate;
		$property->setValue( $dummy, null );

		Survicate::init();
		$instance1 = $property->getValue( $dummy );
		$this->assertInstanceOf( Survicate::class, $instance1 );

		Survicate::init();
		$instance2 = $property->getValue( $dummy );
		$this->assertSame( $instance1, $instance2 );

		$property->setValue( $dummy, null );
	}
}
