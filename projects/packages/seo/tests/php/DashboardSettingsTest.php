<?php
/**
 * Tests for the dashboard's write surface: the SEO options exposed to
 * WordPress core's `/wp/v2/settings` endpoint, and the package's own route for
 * the one toggle that is module activation rather than an option.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

use Automattic\Jetpack\Constants;
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

		\Jetpack_Options::delete_option( 'active_modules' );
		\Jetpack_SEO_Utils::$enabled = true;

		add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ), 5 );
		add_action( 'rest_api_init', array( Dashboard_Data::class, 'register_module_routes' ) );
		$this->reset_rest_server();
	}

	/**
	 * Undo everything the registration wires up, so no other suite inherits the
	 * settings, the option-write hooks, or a REST server built around them.
	 */
	protected function tearDown(): void {
		remove_action( 'rest_api_init', array( Dashboard_Data::class, 'register_rest_settings' ), 5 );
		remove_action( 'rest_api_init', array( Dashboard_Data::class, 'register_module_routes' ) );
		remove_action( 'add_option_' . Dashboard_Data::FRONT_PAGE_META_OPTION, array( Dashboard_Data::class, 'after_setting_write' ) );
		remove_action( 'update_option_' . Dashboard_Data::FRONT_PAGE_META_OPTION, array( Dashboard_Data::class, 'after_setting_write' ) );
		remove_filter( 'register_setting_args', array( Dashboard_Data::class, 'force_setting_args' ), 10 );
		remove_all_filters( 'jetpack_get_available_standalone_modules' );
		remove_all_filters( 'jetpack_disable_seo_tools' );
		remove_all_filters( 'pre_option_' . \Automattic\Jetpack\Current_Plan::PLAN_OPTION );
		Constants::clear_single_constant( 'IS_WPCOM' );
		\Wpcom_Test_Features::reset();
		\Jetpack_SEO_Utils::$enabled = true;
		self::reset_active_plan_cache();

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
	 * Pin the site's plan. Same approach as `SeoTestCase::set_plan()`, which this class
	 * can't inherit — it extends `TestCase` directly.
	 *
	 * @param string $product_slug Plan product slug.
	 * @return void
	 */
	private static function set_plan( $product_slug ) {
		add_filter(
			'pre_option_' . \Automattic\Jetpack\Current_Plan::PLAN_OPTION,
			static function () use ( $product_slug ) {
				return array( 'product_slug' => $product_slug );
			}
		);
		self::reset_active_plan_cache();
	}

	/**
	 * Clear `Current_Plan::get()`'s request memo so a pin doesn't leak between tests.
	 *
	 * @return void
	 */
	private static function reset_active_plan_cache() {
		$property = ( new \ReflectionClass( \Automattic\Jetpack\Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * Put the site in the shape that keeps the legacy front-page option live: Jetpack's
	 * SEO output off, and a description already stored there.
	 *
	 * @return void
	 */
	private function become_legacy_site() {
		// The plugin helper is authoritative wherever it's loaded, so that's what has to
		// say "off" — the package must never decide differently from the front end.
		\Jetpack_SEO_Utils::$enabled = false;
		update_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION, 'Old description.' );
		// Re-register: which option is exposed is decided at registration time.
		$this->reset_rest_server();
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
	 * The module-backed settings are deliberately NOT core settings: writing one has a
	 * side effect that can fail, and `/wp/v2/settings` has no way to report a refusal —
	 * it answers 200 with whatever is stored. They belong to the package's own route.
	 */
	public function test_module_backed_settings_are_not_core_settings() {
		$registered = get_registered_settings();

		$this->assertArrayNotHasKey( Initializer::SITEMAP_ENABLED_OPTION, $registered );
		$this->assertArrayNotHasKey( Initializer::CANONICAL_ENABLED_OPTION, $registered );
	}

	/**
	 * The flat toggles round-trip: a write lands in the option the dashboard reads
	 * back, and the response echoes the saved value.
	 */
	public function test_boolean_settings_round_trip() {
		$this->act_as( 'administrator' );

		$response = $this->save_settings(
			array(
				Dashboard_Data::AI_SEO_ENHANCER_OPTION => true,
				Llms_Txt::OPTION                       => true,
			)
		);
		$data     = $response->get_data();

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $data[ Llms_Txt::OPTION ] );
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
		$this->become_legacy_site();
		$this->act_as( 'administrator' );

		$this->save_settings( array( Dashboard_Data::FRONT_PAGE_META_OPTION => 'Legacy description.' ) );

		$this->assertSame( 'Legacy description.', get_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION ) );
		$this->assertFalse( get_option( Dashboard_Data::FRONT_PAGE_META_OPTION, false ) );
	}

	/**
	 * And the legacy value survives that save. This is the regression the
	 * `class_exists( 'Jetpack_SEO_Utils' )` check used to cause: wherever the Jetpack
	 * plugin's SEO files aren't loaded — which includes the package's own runtime —
	 * the site looked "modern", the description saved to the wrong option, and the
	 * cleanup below then deleted the live one, wiping the site's public description.
	 * Nothing here depends on that class existing.
	 */
	public function test_legacy_front_page_description_survives_a_save() {
		$this->become_legacy_site();
		$this->act_as( 'administrator' );

		$this->save_settings( array( Dashboard_Data::FRONT_PAGE_META_OPTION => 'Still here.' ) );

		$this->assertSame( 'Still here.', get_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION ) );
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
	 * The Settings bootstrap reports the same legacy state the save writes by, so the
	 * form can't offer a field that the save would send to a different option.
	 */
	public function test_settings_bootstrap_agrees_about_legacy_storage() {
		$this->become_legacy_site();

		$this->assertTrue( Dashboard_Data::get_settings_data()['has_legacy_front_page_meta'] );

		\Jetpack_SEO_Utils::$enabled = true;

		$this->assertFalse( Dashboard_Data::get_settings_data()['has_legacy_front_page_meta'] );
	}

	/**
	 * The site's plan does not get a vote where the plugin helper is loaded.
	 *
	 * `Jetpack_SEO_Utils::is_enabled_jetpack_seo()` plan-gates only behind `IS_WPCOM`, so
	 * an Atomic site below the SEO plan still has SEO enabled and its front end still
	 * prefers the modern description. A gate of our own that also covered Atomic would
	 * send that site's edits to the legacy option, report success, and never change the
	 * public description.
	 */
	public function test_a_plan_gate_does_not_override_the_plugin_helper() {
		self::set_plan( 'free_plan' );
		// Plan-gated, but the helper — which is what the front end reads by — says SEO
		// is on, exactly as it does on Atomic.
		\Jetpack_SEO_Utils::$enabled = true;
		update_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION, 'Old description.' );
		$this->reset_rest_server();
		$this->act_as( 'administrator' );

		$this->save_settings( array( Dashboard_Data::FRONT_PAGE_META_OPTION => 'Modern description.' ) );

		$this->assertSame( 'Modern description.', get_option( Dashboard_Data::FRONT_PAGE_META_OPTION ) );
		$this->assertFalse( Dashboard_Data::get_settings_data()['has_legacy_front_page_meta'] );
	}

	/**
	 * The rule used where `Jetpack_SEO_Utils` isn't loaded — the WordPress.com Simple
	 * path this PR exists to fix, and what decides which option a save targets there.
	 *
	 * It has to match `Jetpack_SEO_Utils::is_enabled_jetpack_seo()` exactly, and that
	 * helper plan-gates only behind `IS_WPCOM`. Reached directly because the package's
	 * own test suite always loads a stand-in for the helper.
	 */
	public function test_seo_enabled_without_the_plugin_helper() {
		$enabled = function () {
			$method = new \ReflectionMethod( Dashboard_Data::class, 'is_jetpack_seo_enabled_without_helper' );
			// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
			if ( PHP_VERSION_ID < 80100 ) {
				$method->setAccessible( true );
			}
			return $method->invoke( null );
		};

		// Self-hosted: never gated, whatever the plan says.
		self::set_plan( 'free_plan' );
		$this->assertTrue( $enabled() );

		// A conflicting SEO plugin switches Jetpack's output off everywhere.
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );
		$this->assertFalse( $enabled() );
		remove_all_filters( 'jetpack_disable_seo_tools' );

		// WordPress.com Simple: the site's `advanced-seo` entitlement decides, which is
		// exactly what the helper's IS_WPCOM branch asks `wpcom_site_has_feature()`.
		Constants::set_constant( 'IS_WPCOM', true );
		\Wpcom_Test_Features::$known    = array( 'advanced-seo' );
		\Wpcom_Test_Features::$entitled = array();
		self::reset_active_plan_cache();
		$this->assertFalse( $enabled() );

		\Wpcom_Test_Features::$entitled = array( 'advanced-seo' );
		self::reset_active_plan_cache();
		$this->assertTrue( $enabled() );

		// And Atomic — WordPress.com, but not Simple — is not gated by it even without
		// the entitlement. That's the case a wider copy of this rule got wrong.
		//
		// The site has to actually be Atomic for this to prove anything: merely clearing
		// `IS_WPCOM` makes `is_wpcom_platform()` false too, so the assertion passes under
		// the very bug it names. Verified by mutation — with `is_wpcom_simple()` widened
		// to `is_wpcom_platform()`, this block fails and the one above still passes.
		Constants::clear_single_constant( 'IS_WPCOM' );
		Constants::set_constant( 'ATOMIC_SITE_ID', 1 );
		Constants::set_constant( 'ATOMIC_CLIENT_ID', 1 );
		Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', 'wpcomsh/wpcomsh.php' );
		\Automattic\Jetpack\Status\Cache::clear();
		$this->assertTrue( ( new \Automattic\Jetpack\Status\Host() )->is_wpcom_platform(), 'The site must read as Atomic for this assertion to mean anything.' );

		\Wpcom_Test_Features::$entitled = array();
		self::reset_active_plan_cache();
		$this->assertTrue( $enabled() );

		Constants::clear_single_constant( 'ATOMIC_SITE_ID' );
		Constants::clear_single_constant( 'ATOMIC_CLIENT_ID' );
		Constants::clear_single_constant( 'WPCOMSH__PLUGIN_FILE' );
		\Automattic\Jetpack\Status\Cache::clear();
	}

	/**
	 * The front page description the Settings field shows, on a site that doesn't load
	 * `Jetpack_SEO_Utils` — WordPress.com Simple. Reading it through `class_exists()`
	 * returned `''` for every Simple site, so the field rendered blank over a live
	 * description. Reached directly, because the suite always loads a stand-in helper.
	 */
	public function test_front_page_description_without_the_plugin_helper() {
		$description = function () {
			$method = new \ReflectionMethod( Dashboard_Data::class, 'get_front_page_meta_description_without_helper' );
			// Required to invoke a private method on PHP < 8.1 (a no-op from 8.1 on).
			if ( PHP_VERSION_ID < 80100 ) {
				$method->setAccessible( true );
			}
			return $method->invoke( null );
		};

		// SEO on: the modern option wins, and falls back to the legacy one.
		update_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION, 'Legacy description.' );
		$this->assertSame( 'Legacy description.', $description() );

		update_option( Dashboard_Data::FRONT_PAGE_META_OPTION, 'Modern description.' );
		$this->assertSame( 'Modern description.', $description() );

		// SEO off for this site: the legacy option is what the front end reads, so it is
		// what the field has to show — even with a modern value stored. (Re-set here
		// because writing the modern option above correctly deletes the superseded
		// legacy one, which is what `after_setting_write()` is for.)
		update_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION, 'Legacy description.' );
		add_filter( 'jetpack_disable_seo_tools', '__return_true' );
		$this->assertSame( 'Legacy description.', $description() );
		remove_all_filters( 'jetpack_disable_seo_tools' );
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
	 * Turning the sitemap setting on activates the legacy `sitemaps` module where that
	 * module exists, and records the durable option the dashboard reads.
	 */
	public function test_sitemap_setting_toggles_the_legacy_module() {
		$this->make_modules_available( array( 'sitemaps' ) );
		$this->act_as( 'administrator' );
		$modules = new Modules();

		$response = $this->update_modules( array( 'sitemap_active' => true ) );
		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $modules->is_active( 'sitemaps' ) );
		$this->assertTrue( get_option( Initializer::SITEMAP_ENABLED_OPTION ) );

		$this->update_modules( array( 'sitemap_active' => false ) );
		$this->assertFalse( $modules->is_active( 'sitemaps' ) );
		$this->assertFalse( get_option( Initializer::SITEMAP_ENABLED_OPTION ) );
	}

	/**
	 * Where the module doesn't exist — WordPress.com Simple has no Jetpack modules on
	 * disk — the durable option is the whole story and still saves. This is what makes
	 * the toggle work on every platform.
	 */
	public function test_sitemap_setting_saves_without_a_module_present() {
		$this->act_as( 'administrator' );

		$response = $this->update_modules( array( 'sitemap_active' => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( get_option( Initializer::SITEMAP_ENABLED_OPTION ) );
		$this->assertEmpty( \Jetpack_Options::get_option( 'active_modules' ) );
	}

	/**
	 * ...and can be turned back off there, which is the half that didn't work.
	 *
	 * With no row yet stored, `update_option( $option, false )` matched the `false` a
	 * missing option reads back as, so WordPress short-circuited and wrote nothing —
	 * while the route's read-back still agreed and reported success. The dashboard then
	 * re-read, found no row, and fell back to asking the module, which reports active
	 * unconditionally on WordPress.com. The toggle snapped straight back on.
	 *
	 * WordPress.com Simple is always in that state: the durable options are seeded by a
	 * Jetpack-plugin upgrade hook that never runs there, and the toggle starts on — so
	 * "off" was the only move available and the only one that silently failed.
	 */
	public function test_sitemap_setting_saves_off_without_a_module_to_switch() {
		// The shape WordPress.com Simple is always in: the module reports active, but
		// isn't present to switch, and no durable option has been stored yet. (`is_active()`
		// returns true unconditionally under the real `IS_WPCOM` constant, which a test
		// can't define; forcing the same answer through the filter it applies last
		// reproduces the condition without it.)
		add_filter( 'jetpack_active_modules', array( $this, 'force_sitemaps_and_canonical_active' ) );
		$this->act_as( 'administrator' );

		// The precondition that makes the bug reachable: with nothing stored, the
		// dashboard reports the sitemap on, from the module state alone.
		$this->assertTrue( Dashboard_Data::get_settings_data()['sitemap_active'] );

		$response = $this->update_modules( array( 'sitemap_active' => false ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( Dashboard_Data::get_settings_data()['sitemap_active'] );

		remove_filter( 'jetpack_active_modules', array( $this, 'force_sitemaps_and_canonical_active' ) );
	}

	/**
	 * The same for canonical URLs, which shares the code path.
	 */
	public function test_canonical_setting_saves_off_without_a_module_to_switch() {
		add_filter( 'jetpack_active_modules', array( $this, 'force_sitemaps_and_canonical_active' ) );
		$this->act_as( 'administrator' );

		$this->assertTrue( Dashboard_Data::get_settings_data()['canonical_active'] );

		$response = $this->update_modules( array( 'canonical_active' => false ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertFalse( Dashboard_Data::get_settings_data()['canonical_active'] );

		remove_filter( 'jetpack_active_modules', array( $this, 'force_sitemaps_and_canonical_active' ) );
	}

	/**
	 * Report both module-backed settings as active regardless of what's stored or
	 * available, the way WordPress.com does.
	 *
	 * @return string[]
	 */
	public function force_sitemaps_and_canonical_active() {
		return array( 'sitemaps', 'canonical-urls' );
	}

	/**
	 * Add wpcomsh's private-site module suppression callback.
	 */
	private function suppress_modules_for_private_site() {
		if ( ! function_exists( '\Private_Site\filter_jetpack_active_modules' ) ) {
			require_once __DIR__ . '/files/wpcomsh-private-site-filter.php';
		}

		add_filter( 'jetpack_active_modules', '\Private_Site\filter_jetpack_active_modules' );
	}

	/**
	 * A private or coming-soon Atomic site can still switch the sitemap on.
	 *
	 * Wpcomsh strips `sitemaps` and `verification-tools` from `jetpack_active_modules`
	 * on those sites, so verifying the switch through `Modules::is_active()` reported
	 * failure for a module that had switched correctly: the route answered 500 on a save
	 * that worked, and skipped the durable option. The Jetpack plugin works around the
	 * same filter in `Jetpack::is_module_active_for_seo_option()`.
	 */
	public function test_sitemap_setting_saves_on_a_private_site() {
		$this->make_modules_available( array( 'sitemaps' ) );
		$this->suppress_modules_for_private_site();
		$this->act_as( 'administrator' );

		$response = $this->update_modules( array( 'sitemap_active' => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( get_option( Initializer::SITEMAP_ENABLED_OPTION ) );
		// The module really is switched on in the site's own list; only the filtered
		// report hides it.
		$this->assertContains( 'sitemaps', (array) \Jetpack_Options::get_option( 'active_modules' ) );

		remove_filter( 'jetpack_active_modules', '\Private_Site\filter_jetpack_active_modules' );
	}

	/**
	 * ...while a module that genuinely won't switch is still an error. Only wpcomsh's
	 * own callback is lifted, so every other filter still counts.
	 */
	public function test_module_that_will_not_switch_still_errors_alongside_the_private_site_filter() {
		$this->make_modules_available( array( 'sitemaps' ) );
		$this->suppress_modules_for_private_site();
		add_filter( 'jetpack_active_modules', array( $this, 'hold_sitemaps_inactive' ) );
		$this->act_as( 'administrator' );

		$response = $this->update_modules( array( 'sitemap_active' => true ) );

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'jetpack_seo_module_toggle_failed', $response->get_data()['code'] );

		remove_filter( 'jetpack_active_modules', array( $this, 'hold_sitemaps_inactive' ) );
		remove_filter( 'jetpack_active_modules', '\Private_Site\filter_jetpack_active_modules' );
	}

	/**
	 * Hold the sitemaps module inactive whatever the stored state says.
	 *
	 * @param array $modules Active module slugs.
	 * @return array
	 */
	public function hold_sitemaps_inactive( $modules ) {
		return array_values( array_diff( (array) $modules, array( 'sitemaps' ) ) );
	}

	/**
	 * The legacy front-page description is only dropped once the modern one is live.
	 *
	 * On a site where Jetpack's SEO output is off, the legacy option is still what the
	 * front end reads, so deleting it would take down a live description. The guard on
	 * that delete had no test: removing it left every assertion green.
	 */
	public function test_legacy_front_page_description_survives_while_seo_is_disabled() {
		$this->act_as( 'administrator' );
		update_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION, 'Legacy description.' );
		\Jetpack_SEO_Utils::$enabled = false;

		update_option( Dashboard_Data::FRONT_PAGE_META_OPTION, 'Modern description.' );

		$this->assertSame( 'Legacy description.', get_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION ) );

		// And once SEO output is live, the superseded legacy value does go.
		\Jetpack_SEO_Utils::$enabled = true;
		update_option( Dashboard_Data::FRONT_PAGE_META_OPTION, 'Newer description.' );

		$this->assertFalse( get_option( Dashboard_Data::LEGACY_FRONT_PAGE_META_OPTION, false ) );
	}

	/**
	 * The canonical setting drives its legacy module the same way.
	 */
	public function test_canonical_setting_toggles_the_legacy_module() {
		$this->make_modules_available( array( 'canonical-urls' ) );
		$this->act_as( 'administrator' );

		$this->update_modules( array( 'canonical_active' => true ) );

		$this->assertTrue( ( new Modules() )->is_active( 'canonical-urls' ) );
		$this->assertTrue( get_option( Initializer::CANONICAL_ENABLED_OPTION ) );
	}

	/**
	 * A module that won't switch is an error the client can show — and the durable
	 * option is left alone, so it never claims a state the module never reached. This
	 * is exactly what core's settings endpoint had no way to express.
	 */
	public function test_sitemap_setting_errors_when_the_module_will_not_switch() {
		$this->make_modules_available( array( 'sitemaps' ) );
		// Hold the module inactive whatever the stored module state says, so activation
		// runs and then doesn't take.
		add_filter(
			'jetpack_active_modules',
			static function ( $modules ) {
				return array_values( array_diff( (array) $modules, array( 'sitemaps' ) ) );
			}
		);
		$this->act_as( 'administrator' );

		$response = $this->update_modules( array( 'sitemap_active' => true ) );

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'jetpack_seo_module_toggle_failed', $response->get_data()['code'] );
		$this->assertEmpty( get_option( Initializer::SITEMAP_ENABLED_OPTION ) );

		remove_all_filters( 'jetpack_active_modules' );
	}

	/**
	 * A setting the store refuses is an error, not a success — and the module goes back
	 * where it was, so the two never disagree. This is the whole check on WordPress.com
	 * Simple, where there's no module and the option is the entire setting.
	 */
	public function test_sitemap_setting_errors_when_the_option_will_not_save() {
		$this->make_modules_available( array( 'sitemaps' ) );
		$this->act_as( 'administrator' );
		// Something else owns this option and refuses the change — a `pre_update_option_*`
		// filter is how that shows up in practice.
		add_filter( 'pre_update_option_' . Initializer::SITEMAP_ENABLED_OPTION, '__return_false' );

		$response = $this->update_modules( array( 'sitemap_active' => true ) );

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'jetpack_seo_setting_not_saved', $response->get_data()['code'] );
		// Rolled back: the module isn't left on while the setting reads off.
		$this->assertFalse( ( new Modules() )->is_active( 'sitemaps' ) );

		remove_all_filters( 'pre_update_option_' . Initializer::SITEMAP_ENABLED_OPTION );
	}

	/**
	 * The same check with no module at all — the WordPress.com Simple shape, where a
	 * silently dropped write would otherwise be reported as saved.
	 */
	public function test_sitemap_setting_errors_when_the_option_will_not_save_without_a_module() {
		$this->act_as( 'administrator' );
		add_filter( 'pre_update_option_' . Initializer::SITEMAP_ENABLED_OPTION, '__return_false' );

		$response = $this->update_modules( array( 'sitemap_active' => true ) );

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'jetpack_seo_setting_not_saved', $response->get_data()['code'] );

		remove_all_filters( 'pre_update_option_' . Initializer::SITEMAP_ENABLED_OPTION );
	}

	/**
	 * Writing a value that's already stored is not a failure. `update_option()` returns
	 * false for a no-op, so only reading the value back tells the two apart.
	 */
	public function test_an_unchanged_module_setting_is_not_an_error() {
		$this->act_as( 'administrator' );
		update_option( Initializer::SITEMAP_ENABLED_OPTION, true );

		$response = $this->update_modules( array( 'sitemap_active' => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array( 'sitemap_active' => true ), $response->get_data() );
	}

	/**
	 * When one field of a multi-field request fails, the error names it and lists what
	 * did land, so the client isn't left with a generic failure and unknown state.
	 */
	public function test_a_partial_failure_reports_which_field_and_what_applied() {
		$this->make_modules_available( array( 'sitemaps' ) );
		$this->act_as( 'administrator' );
		add_filter( 'pre_update_option_' . Initializer::CANONICAL_ENABLED_OPTION, '__return_false' );

		$response = $this->update_modules(
			array(
				'sitemap_active'   => true,
				'canonical_active' => true,
			)
		);
		$data     = $response->get_data();

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'canonical_active', $data['data']['field'] );
		$this->assertSame( array( 'sitemap_active' => true ), $data['data']['applied'] );
		// And the field that did land really did.
		$this->assertTrue( get_option( Initializer::SITEMAP_ENABLED_OPTION ) );

		remove_all_filters( 'pre_update_option_' . Initializer::CANONICAL_ENABLED_OPTION );
	}

	/**
	 * One request can carry several module-backed settings, and applies each of them.
	 */
	public function test_module_route_applies_every_submitted_setting() {
		$this->make_modules_available( array( 'sitemaps', 'canonical-urls' ) );
		$this->act_as( 'administrator' );

		$response = $this->update_modules(
			array(
				'sitemap_active'   => true,
				'canonical_active' => true,
			)
		);

		$this->assertSame(
			array(
				'sitemap_active'   => true,
				'canonical_active' => true,
			),
			$response->get_data()
		);
	}

	/**
	 * Our registration arguments stay authoritative even when another surface
	 * re-registers the same option later — the verification-tools module does exactly
	 * that, and a plain last-one-wins would drop `show_in_rest` and leave core
	 * silently ignoring dashboard writes.
	 */
	public function test_a_later_registration_cannot_drop_the_rest_exposure() {
		register_setting(
			'verification_services_codes_fields',
			Dashboard_Data::VERIFICATION_CODES_OPTION,
			array( 'sanitize_callback' => 'strval' )
		);

		$registered = get_registered_settings();

		$this->assertNotEmpty( $registered[ Dashboard_Data::VERIFICATION_CODES_OPTION ]['show_in_rest'] );
		$this->assertSame( 'object', $registered[ Dashboard_Data::VERIFICATION_CODES_OPTION ]['type'] );
	}

	/**
	 * ...and that other surface keeps its own sanitizer. The verification-tools module
	 * registers `jetpack_verification_validate` there, which is what fires the documented
	 * `jetpack_site_verification_validate` action — replacing its arguments wholesale
	 * would silently unhook it from every consumer.
	 */
	public function test_a_later_registration_keeps_its_own_sanitizer() {
		$seen = array();
		register_setting(
			'verification_services_codes_fields',
			Dashboard_Data::VERIFICATION_CODES_OPTION,
			array(
				'sanitize_callback' => static function ( $value ) use ( &$seen ) {
					$seen[] = $value;
					return $value;
				},
			)
		);

		update_option( Dashboard_Data::VERIFICATION_CODES_OPTION, array( 'bing' => 'bing-code' ) );

		// `update_option()` on a missing option routes through `add_option()`, so the
		// filter runs on both — what matters is that it ran at all.
		$this->assertNotEmpty( $seen );
		// And ours still ran too — sanitize filters accumulate rather than replace.
		$this->assertSame( array( 'bing' => 'bing-code' ), get_option( Dashboard_Data::VERIFICATION_CODES_OPTION ) );
	}

	/**
	 * A caller's own label and description survive too — only the REST contract is ours.
	 */
	public function test_a_later_registration_keeps_its_own_labels() {
		register_setting(
			'verification_services_codes_fields',
			Dashboard_Data::VERIFICATION_CODES_OPTION,
			array( 'description' => 'Someone else\'s description.' )
		);

		$registered = get_registered_settings();

		$this->assertSame(
			'Someone else\'s description.',
			$registered[ Dashboard_Data::VERIFICATION_CODES_OPTION ]['description']
		);
	}

	/**
	 * A value that is neither a bare code nor a parsable tag isn't a verification code
	 * at all, so it is refused and whatever was already stored is kept. The old
	 * `/jetpack/v4/settings` route rejected the same input with a 400 and left the
	 * saved code alone; overwriting a working code with an empty string because of a
	 * bad paste is the worse of the two failures.
	 */
	public function test_verification_codes_reject_unparsable_values() {
		$this->act_as( 'administrator' );
		update_option( Dashboard_Data::VERIFICATION_CODES_OPTION, array( 'bing' => 'bing-code' ) );

		$this->save_settings(
			array(
				Dashboard_Data::VERIFICATION_CODES_OPTION => array(
					'bing'   => 'not a code',
					'yandex' => '"quoted"',
				),
			)
		);

		$stored = get_option( Dashboard_Data::VERIFICATION_CODES_OPTION );

		// Kept, not wiped.
		$this->assertSame( 'bing-code', $stored['bing'] );
		// Nothing was stored for a service that had no code to begin with.
		$this->assertArrayNotHasKey( 'yandex', $stored );
	}

	/**
	 * An empty string is a deliberate clear, not a failed parse, so it still empties
	 * the field.
	 */
	public function test_verification_codes_can_still_be_cleared() {
		$this->act_as( 'administrator' );
		update_option( Dashboard_Data::VERIFICATION_CODES_OPTION, array( 'bing' => 'bing-code' ) );

		$this->save_settings(
			array(
				Dashboard_Data::VERIFICATION_CODES_OPTION => array( 'bing' => '' ),
			)
		);

		$this->assertSame( '', get_option( Dashboard_Data::VERIFICATION_CODES_OPTION )['bing'] );
	}

	/**
	 * A title token has to be one its page type actually offers — `post_title` means
	 * nothing on the front page, and the old Jetpack settings endpoint rejected it.
	 */
	public function test_title_formats_reject_a_token_the_page_type_does_not_offer() {
		$this->act_as( 'administrator' );

		$response = $this->save_settings(
			array(
				Dashboard_Data::TITLE_FORMATS_OPTION => array(
					'front_page' => array(
						array(
							'type'  => 'token',
							'value' => 'post_title',
						),
					),
				),
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertEmpty( get_option( Dashboard_Data::TITLE_FORMATS_OPTION ) );
	}

	/**
	 * Both keys are required: the front-end renderer reads `type` on every public
	 * request, so a token missing it must never reach storage.
	 */
	public function test_title_formats_reject_a_token_missing_its_type() {
		$this->act_as( 'administrator' );

		$response = $this->save_settings(
			array(
				Dashboard_Data::TITLE_FORMATS_OPTION => array(
					'posts' => array( array( 'value' => 'some text' ) ),
				),
			)
		);

		$this->assertSame( 400, $response->get_status() );
		$this->assertEmpty( get_option( Dashboard_Data::TITLE_FORMATS_OPTION ) );
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

		$response = $this->update_modules( array( 'verification_tools_active' => true ) );

		$this->assertSame( 200, $response->get_status() );
		$this->assertTrue( $response->get_data()['verification_tools_active'] );
		$this->assertTrue( $modules->is_active( 'verification-tools' ) );

		$response = $this->update_modules( array( 'verification_tools_active' => false ) );

		$this->assertFalse( $response->get_data()['verification_tools_active'] );
		$this->assertFalse( $modules->is_active( 'verification-tools' ) );
	}

	/**
	 * With no Jetpack modules on the site there is nothing to switch, so the route
	 * reports the failure instead of a toggle that springs back on the next load.
	 */
	public function test_module_route_errors_without_a_module_present() {
		$this->act_as( 'administrator' );

		$response = $this->update_modules( array( 'verification_tools_active' => false ) );

		// A request this site can't support, not a server failure.
		$this->assertSame( 400, $response->get_status() );
		$this->assertSame( 'jetpack_seo_module_unavailable', $response->get_data()['code'] );
	}

	/**
	 * A module that exists but won't switch is a genuine failure, and says so.
	 */
	public function test_module_route_errors_when_the_toggle_does_not_take() {
		$this->make_modules_available( array( 'verification-tools' ) );
		add_filter(
			'jetpack_active_modules',
			static function ( $modules ) {
				return array_values( array_diff( (array) $modules, array( 'verification-tools' ) ) );
			}
		);
		$this->act_as( 'administrator' );

		$response = $this->update_modules( array( 'verification_tools_active' => true ) );

		$this->assertSame( 500, $response->get_status() );
		$this->assertSame( 'jetpack_seo_module_toggle_failed', $response->get_data()['code'] );

		remove_all_filters( 'jetpack_active_modules' );
	}

	/**
	 * The dashboard is told whether module toggles can do anything here, so it can
	 * hide the controls instead of offering one the route would refuse.
	 */
	public function test_overview_reports_whether_verification_can_be_switched() {
		// Another module existing is not enough — it has to be this one, or the toggle
		// renders and the route refuses the click.
		$this->make_modules_available( array( 'sitemaps' ) );
		$this->assertFalse( Dashboard_Data::get_overview_data()['verification_switchable'] );

		remove_all_filters( 'jetpack_get_available_standalone_modules' );
		$this->make_modules_available( array( 'verification-tools' ) );

		$this->assertTrue( Dashboard_Data::get_overview_data()['verification_switchable'] );
	}

	/**
	 * Toggling a module requires `manage_options`, like every other dashboard write.
	 */
	public function test_module_route_requires_manage_options() {
		$this->make_modules_available( array( 'verification-tools' ) );
		$this->act_as( 'subscriber' );

		$response = $this->update_modules( array( 'verification_tools_active' => false ) );

		$this->assertSame( 403, $response->get_status() );
	}

	/**
	 * Fields are optional — the dashboard sends only what changed — so an empty request
	 * applies nothing rather than guessing at a default.
	 */
	public function test_module_route_applies_nothing_for_an_empty_request() {
		$this->make_modules_available( array( 'verification-tools' ) );
		$this->act_as( 'administrator' );

		$response = $this->update_modules( array() );

		$this->assertSame( 200, $response->get_status() );
		$this->assertSame( array(), $response->get_data() );
	}

	/**
	 * POST module-backed settings.
	 *
	 * @param array $data Settings payload.
	 * @return \WP_REST_Response
	 */
	private function update_modules( array $data ) {
		$request = new WP_REST_Request( 'POST', '/' . Dashboard_Data::REST_NAMESPACE . Dashboard_Data::MODULES_REST_BASE );
		$request->set_header( 'content-type', 'application/json' );
		$request->set_body( wp_json_encode( $data, JSON_UNESCAPED_SLASHES ) );

		return rest_get_server()->dispatch( $request );
	}
}
