<?php
/**
 * Tests for the dashboard's write surface: the SEO options exposed to
 * WordPress core's `/wp/v2/settings` endpoint, and the package's own route for
 * the one toggle that is module activation rather than an option.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Modules;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;
use WP_REST_Request;

/**
 * @covers \Automattic\Jetpack\SEO\Dashboard_Data
 */
#[CoversClass( Dashboard_Data::class )]
class DashboardSettingsTest extends TestCase {

	/**
	 * The core settings endpoint the dashboard writes through.
	 */
	const CORE_SETTINGS_ROUTE = '/wp/v2/settings';

	/**
	 * Options this suite writes, cleared between tests.
	 *
	 * @var string[]
	 */
	private $options = array(
		'blog_public',
		Initializer::SITEMAP_ENABLED_OPTION,
		Initializer::CANONICAL_ENABLED_OPTION,
		Dashboard_Data::AI_SEO_ENHANCER_OPTION,
		Llms_Txt::OPTION,
		Ai_Crawlers::OPTION,
		Dashboard_Data::TITLE_FORMATS_OPTION,
		Dashboard_Data::VERIFICATION_CODES_OPTION,
		Dashboard_Data::FRONT_PAGE_META_OPTION,
		Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION,
	);

	/**
	 * Users created by a test, removed afterwards.
	 *
	 * @var int[]
	 */
	private $user_ids = array();

	/**
	 * Register the package's REST surface the way `Initializer::init()` does, then
	 * rebuild the REST server so core's settings controller picks the settings up
	 * (it reads the registry when it registers its route, at priority 99).
	 */
	protected function setUp(): void {
		parent::setUp();

		\Jetpack_SEO_Utils::$has_legacy_front_page_meta = false;
		\Jetpack_Options::delete_option( 'active_modules' );

		add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ), 20 );
		add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_module_routes' ) );
		$this->reset_rest_server();
	}

	/**
	 * Undo everything the registration wires up, so no other suite inherits the
	 * settings, the option-write hooks, or a REST server built around them.
	 */
	protected function tearDown(): void {
		remove_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ), 20 );
		remove_action( 'rest_api_init', array( Dashboard_Data::class, 'register_module_routes' ) );
		remove_action( 'added_option', array( Dashboard_Data::class, 'after_setting_write' ) );
		remove_action( 'updated_option', array( Dashboard_Data::class, 'after_setting_write' ) );
		remove_all_filters( 'jetpack_get_available_standalone_modules' );

		foreach ( array_keys( get_registered_settings() ) as $option ) {
			if ( in_array( $option, $this->options, true ) ) {
				unregister_setting( Dashboard_Data::SETTINGS_GROUP, $option );
			}
		}
		foreach ( $this->options as $option ) {
			delete_option( $option );
		}
		foreach ( $this->user_ids as $user_id ) {
			wp_delete_user( $user_id );
		}
		$this->user_ids = array();
		\Jetpack_Options::delete_option( 'active_modules' );

		wp_set_current_user( 0 );
		$this->reset_rest_server();

		parent::tearDown();
	}

	/**
	 * Drop the cached REST server so the next `rest_get_server()` fires
	 * `rest_api_init` again and rebuilds every route from current state.
	 */
	private function reset_rest_server() {
		$GLOBALS['wp_rest_server'] = null;
		rest_get_server();
	}

	/**
	 * Act as a user with the given role.
	 *
	 * @param string $role Role slug.
	 * @return int User ID.
	 */
	private function act_as( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'seo_' . $role . '_' . wp_rand(),
				'user_pass'  => 'password',
				'user_email' => 'seo_' . $role . '_' . wp_rand() . '@example.test',
				'role'       => $role,
			)
		);

		$this->assertIsInt( $user_id );
		$this->user_ids[] = $user_id;
		wp_set_current_user( $user_id );

		return $user_id;
	}

	/**
	 * POST a payload to core's settings endpoint.
	 *
	 * @param array $data Settings payload.
	 * @return \WP_REST_Response
	 */
	private function save_settings( array $data ) {
		$request = new WP_REST_Request( 'POST', self::CORE_SETTINGS_ROUTE );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $data, JSON_UNESCAPED_SLASHES ) );

		return rest_get_server()->dispatch( $request );
	}

	/**
	 * Make a module exist on this site, so module state is togglable.
	 *
	 * `Modules::get_available()` falls back to this filter when the Jetpack plugin
	 * isn't loaded, which is also the package's own runtime shape.
	 *
	 * @param string[] $modules Module slugs.
	 * @return void
	 */
	private function make_modules_available( array $modules ) {
		add_filter(
			'jetpack_get_available_standalone_modules',
			static function () use ( $modules ) {
				return $modules;
			}
		);
	}

	/**
	 * Every option the dashboard saves is exposed to core's settings endpoint, so a
	 * write needs no Jetpack-plugin route.
	 */
	public function test_every_dashboard_setting_is_exposed_to_core_rest() {
		$registered = get_registered_settings();

		$expected = array(
			'blog_public',
			Initializer::SITEMAP_ENABLED_OPTION,
			Initializer::CANONICAL_ENABLED_OPTION,
			Dashboard_Data::AI_SEO_ENHANCER_OPTION,
			Llms_Txt::OPTION,
			Ai_Crawlers::OPTION,
			Dashboard_Data::TITLE_FORMATS_OPTION,
			Dashboard_Data::VERIFICATION_CODES_OPTION,
			Dashboard_Data::FRONT_PAGE_META_OPTION,
		);

		foreach ( $expected as $option ) {
			$this->assertArrayHasKey( $option, $registered, $option . ' is not registered' );
			$this->assertNotEmpty( $registered[ $option ]['show_in_rest'], $option . ' is not exposed to REST' );
		}
	}

	/**
	 * The flat toggles round-trip: a write lands in the option the dashboard reads
	 * back, and the response echoes the saved value.
	 */
	public function test_boolean_settings_round_trip() {
		$this->act_as( 'administrator' );

		$response = $this->save_settings(
			array(
				Initializer::SITEMAP_ENABLED_OPTION    => true,
				Initializer::CANONICAL_ENABLED_OPTION  => true,
				Dashboard_Data::AI_SEO_ENHANCER_OPTION => true,
				Llms_Txt::OPTION                       => true,
			)
		);
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $data[ Initializer::SITEMAP_ENABLED_OPTION ] );
		$this->assertTrue( $data[ Llms_Txt::OPTION ] );

		$this->assertTrue( get_option( Initializer::SITEMAP_ENABLED_OPTION ) );
		$this->assertTrue( get_option( Initializer::CANONICAL_ENABLED_OPTION ) );
		$this->assertTrue( get_option( Dashboard_Data::AI_SEO_ENHANCER_OPTION ) );
		$this->assertTrue( Llms_Txt::is_enabled() );

		// And back off again, so the toggle isn't one-way.
		$this->save_settings( array( Llms_Txt::OPTION => false ) );
		$this->assertFalse( Llms_Txt::is_enabled() );
	}

	/**
	 * Search-engine visibility keeps saving to the core `blog_public` option.
	 */
	public function test_blog_public_round_trips() {
		$this->act_as( 'administrator' );

		$this->save_settings( array( 'blog_public' => 0 ) );

		$this->assertSame( 0, (int) get_option( 'blog_public' ) );
	}

	/**
	 * Title structures round-trip through the endpoint, and the literal text
	 * between tokens is stripped of markup without losing its spacing — the
	 * separator a user types is exactly what the front end renders.
	 */
	public function test_title_formats_round_trip_and_are_sanitized() {
		$this->act_as( 'administrator' );

		$this->save_settings(
			array(
				Dashboard_Data::TITLE_FORMATS_OPTION => array(
					'posts' => array(
						array(
							'type'  => 'token',
							'value' => 'post_title',
						),
						array(
							'type'  => 'string',
							'value' => ' <b>|</b> ',
						),
						array(
							'type'  => 'token',
							'value' => 'site_name',
						),
					),
				),
			)
		);

		$stored = get_option( Dashboard_Data::TITLE_FORMATS_OPTION );

		$this->assertSame( 'post_title', $stored['posts'][0]['value'] );
		$this->assertSame( ' | ', $stored['posts'][1]['value'] );
		$this->assertSame( 'site_name', $stored['posts'][2]['value'] );
	}

	/**
	 * The schema bounds what a title structure may contain: an unsupported page type
	 * is rejected outright rather than quietly stored.
	 */
	public function test_title_formats_reject_unknown_page_types() {
		$this->act_as( 'administrator' );

		$response = $this->save_settings(
			array(
				Dashboard_Data::TITLE_FORMATS_OPTION => array(
					'made_up' => array(
						array(
							'type'  => 'token',
							'value' => 'nope',
						),
					),
				),
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertEmpty( get_option( Dashboard_Data::TITLE_FORMATS_OPTION ) );
	}

	/**
	 * A verification code pasted as the whole `<meta …>` tag the service hands out
	 * is reduced to the code, and untouched services keep their stored value.
	 */
	public function test_verification_codes_unwrap_a_pasted_meta_tag_and_merge() {
		$this->act_as( 'administrator' );
		update_option( Dashboard_Data::VERIFICATION_CODES_OPTION, array( 'bing' => 'bing-code' ) );

		$this->save_settings(
			array(
				Dashboard_Data::VERIFICATION_CODES_OPTION => array(
					'google' => '<meta name="google-site-verification" content="g00gle-c0de" />',
				),
			)
		);

		$stored = get_option( Dashboard_Data::VERIFICATION_CODES_OPTION );

		$this->assertSame( 'g00gle-c0de', $stored['google'] );
		$this->assertSame( 'bing-code', $stored['bing'] );
	}

	/**
	 * The AI crawler override map keeps arbitrary catalog slugs (it's sparse and
	 * keyed by bot, not a fixed property list) and normalizes values to booleans.
	 */
	public function test_ai_crawler_overrides_round_trip() {
		$this->act_as( 'administrator' );

		$this->save_settings(
			array(
				Ai_Crawlers::OPTION => array(
					'gptbot'        => false,
					'perplexitybot' => true,
				),
			)
		);

		$this->assertSame(
			array(
				'gptbot'        => false,
				'perplexitybot' => true,
			),
			get_option( Ai_Crawlers::OPTION )
		);
		$this->assertSame(
			array(
				'gptbot'        => false,
				'perplexitybot' => true,
			),
			Ai_Crawlers::get_overrides()
		);
	}

	/**
	 * The front page description is clamped to plain text of a bounded length.
	 */
	public function test_front_page_description_is_sanitized_and_clamped() {
		$this->act_as( 'administrator' );

		$this->save_settings(
			array(
				Dashboard_Data::FRONT_PAGE_META_OPTION => '<b>Hello</b> ' . str_repeat( 'a', 400 ),
			)
		);

		$stored = get_option( Dashboard_Data::FRONT_PAGE_META_OPTION );

		$this->assertStringStartsWith( 'Hello ', $stored );
		$this->assertSame( 300, strlen( $stored ) );
	}

	/**
	 * A site still on the legacy front-page option saves to that option, so the
	 * value the front end reads back is the one the dashboard just wrote.
	 */
	public function test_front_page_description_targets_the_legacy_option() {
		// Only ever one of the two is registered for a request; drop the modern
		// registration setUp made before re-registering as a legacy site would.
		unregister_setting( Dashboard_Data::SETTINGS_GROUP, Dashboard_Data::FRONT_PAGE_META_OPTION );
		\Jetpack_SEO_Utils::$has_legacy_front_page_meta = true;
		$this->reset_rest_server();
		$this->act_as( 'administrator' );

		$this->save_settings( array( Dashboard_Data::FRONT_PAGE_META_OPTION => 'Legacy description.' ) );

		$this->assertSame( 'Legacy description.', get_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION ) );
		$this->assertFalse( get_option( Dashboard_Data::FRONT_PAGE_META_OPTION ) );
	}

	/**
	 * Writing the modern front-page option drops the legacy one, so clearing the
	 * description can't resurrect text the site set years ago.
	 */
	public function test_saving_the_front_page_description_drops_the_legacy_option() {
		$this->act_as( 'administrator' );
		update_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION, 'Old description.' );

		$this->save_settings( array( Dashboard_Data::FRONT_PAGE_META_OPTION => 'New description.' ) );

		$this->assertSame( 'New description.', get_option( Dashboard_Data::FRONT_PAGE_META_OPTION ) );
		$this->assertFalse( get_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION ) );
	}

	/**
	 * Saving a setting requires `manage_options` — the same capability the Jetpack
	 * settings endpoint enforced, and the one the SEO page itself requires.
	 */
	public function test_saving_settings_requires_manage_options() {
		$this->act_as( 'subscriber' );

		$response = $this->save_settings( array( Llms_Txt::OPTION => true ) );

		$this->assertSame( 403, $response->get_status() );
		$this->assertFalse( Llms_Txt::is_enabled() );
	}

	/**
	 * Turning the sitemap setting on activates the legacy `sitemaps` module where
	 * that module exists, so the front end follows the setting.
	 */
	public function test_sitemap_setting_toggles_the_legacy_module() {
		$this->make_modules_available( array( 'sitemaps' ) );
		$this->act_as( 'administrator' );
		$modules = new Modules();

		$this->save_settings( array( Initializer::SITEMAP_ENABLED_OPTION => true ) );
		$this->assertTrue( $modules->is_active( 'sitemaps' ) );

		$this->save_settings( array( Initializer::SITEMAP_ENABLED_OPTION => false ) );
		$this->assertFalse( $modules->is_active( 'sitemaps' ) );
	}

	/**
	 * Where the module doesn't exist — WordPress.com Simple has no Jetpack modules
	 * on disk — the setting still saves, and nothing tries to toggle a module that
	 * isn't there. This is what makes the toggle work on every platform.
	 */
	public function test_sitemap_setting_saves_without_a_module_present() {
		$this->act_as( 'administrator' );

		$response = $this->save_settings( array( Initializer::SITEMAP_ENABLED_OPTION => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( get_option( Initializer::SITEMAP_ENABLED_OPTION ) );
		$this->assertEmpty( \Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * The canonical setting drives its legacy module the same way.
	 */
	public function test_canonical_setting_toggles_the_legacy_module() {
		$this->make_modules_available( array( 'canonical-urls' ) );
		$this->act_as( 'administrator' );

		$this->save_settings( array( Initializer::CANONICAL_ENABLED_OPTION => true ) );

		$this->assertTrue( ( new Modules() )->is_active( 'canonical-urls' ) );
	}

	/**
	 * Module activation is the one dashboard setting core's endpoint can't express,
	 * so the package registers a write route for it under its own namespace.
	 */
	public function test_module_route_is_registered() {
		$routes = rest_get_server()->get_routes();
		$route  = '/' . Dashboard_Data::REST_NAMESPACE . Dashboard_Data::MODULES_REST_BASE;

		$this->assertArrayHasKey( $route, $routes );
	}

	/**
	 * The route toggles the `verification-tools` module and reports the state the
	 * site ended up in.
	 */
	public function test_module_route_toggles_verification_tools() {
		$this->make_modules_available( array( 'verification-tools' ) );
		$this->act_as( 'administrator' );
		$modules = new Modules();

		$response = $this->update_modules( true );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['verification_tools_active'] );
		$this->assertTrue( $modules->is_active( 'verification-tools' ) );

		$response = $this->update_modules( false );

		$this->assertFalse( $response->get_data()['verification_tools_active'] );
		$this->assertFalse( $modules->is_active( 'verification-tools' ) );
	}

	/**
	 * With no Jetpack modules on the site there is nothing to switch, so the route
	 * reports the failure instead of a toggle that springs back on the next load.
	 */
	public function test_module_route_errors_without_a_module_present() {
		$this->act_as( 'administrator' );

		$response = $this->update_modules( false );

		$this->assertSame( 500, $response->get_status() );
	}

	/**
	 * Toggling a module requires `manage_options`, like every other dashboard write.
	 */
	public function test_module_route_requires_manage_options() {
		$this->make_modules_available( array( 'verification-tools' ) );
		$this->act_as( 'subscriber' );

		$response = $this->update_modules( false );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * The state is required — an empty request can't silently report success.
	 */
	public function test_module_route_requires_the_state() {
		$this->act_as( 'administrator' );

		$request  = new WP_REST_Request( 'POST', '/' . Dashboard_Data::REST_NAMESPACE . Dashboard_Data::MODULES_REST_BASE );
		$response = rest_get_server()->dispatch( $request );

		$this->assertSame( 400, $response->get_status() );
	}

	/**
	 * POST the module state.
	 *
	 * @param bool $active Whether site verification should be on.
	 * @return \WP_REST_Response
	 */
	private function update_modules( $active ) {
		$request = new WP_REST_Request( 'POST', '/' . Dashboard_Data::REST_NAMESPACE . Dashboard_Data::MODULES_REST_BASE );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( array( 'verification_tools_active' => $active ), JSON_UNESCAPED_SLASHES ) );

		return rest_get_server()->dispatch( $request );
	}
}
