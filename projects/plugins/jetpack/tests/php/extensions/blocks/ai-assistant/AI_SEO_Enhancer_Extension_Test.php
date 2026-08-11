<?php
/**
 * Tests that the `ai-seo-enhancer` extension registration honors the stored
 * admin toggle: absent = offered, stored off = withheld with a named,
 * non-upsell reason.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Current_Plan;
use Automattic\Jetpack\SEO\AI_SEO_Enhancer;
use Automattic\Jetpack\Status\Cache as Status_Cache;

require_once JETPACK__PLUGIN_DIR . '/extensions/blocks/ai-assistant/ai-assistant.php';

/**
 * Tests the `ai-seo-enhancer` extension registration gate.
 */
class AI_SEO_Enhancer_Extension_Test extends WP_UnitTestCase {
	use Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;
	use \Activates_Ai_Module;

	const EXTENSION_SLUG = 'ai-seo-enhancer';

	/**
	 * Priority for the plan pin — later than a dev environment's own
	 * `pre_option_jetpack_active_plan` short-circuit, so ours wins.
	 */
	const PLAN_FILTER_PRIORITY = 20;

	/**
	 * Set up: AI master on, business plan pinned, clean availability slate.
	 */
	public function set_up() {
		parent::set_up();

		Jetpack_Gutenberg::reset();
		add_filter( 'jetpack_offline_mode', '__return_false' );
		// `get_availability()` walks `get_extensions()`, which is empty under
		// `TESTING_IN_JETPACK` unless the allowed list is filtered back in, and
		// `should_load()` bails out early without a ready connection. Mirrors the
		// minimal pattern `Jetpack_AI_Sidebar_Test` uses for the same reason.
		add_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		add_filter( 'jetpack_gutenberg', '__return_true' );
		add_filter( 'jetpack_set_available_extensions', array( __CLASS__, 'get_extension_allowlist' ) );
		Status_Cache::clear();
		$this->activate_ai_module_for_test();
		self::pin_plan( 'jetpack_business' );
	}

	/**
	 * Tear down: drop the option, filters, plan pin and availability state.
	 */
	public function tear_down() {
		delete_option( AI_SEO_Enhancer::OPTION );
		remove_filter( 'jetpack_offline_mode', '__return_false' );
		remove_filter( 'jetpack_is_connection_ready', '__return_true', 1000 );
		remove_filter( 'jetpack_gutenberg', '__return_true' );
		remove_filter( 'jetpack_set_available_extensions', array( __CLASS__, 'get_extension_allowlist' ) );
		remove_all_filters( 'ai_seo_enhancer_enabled' );
		remove_all_filters( 'pre_option_' . Current_Plan::PLAN_OPTION, self::PLAN_FILTER_PRIORITY );
		self::reset_active_plan_cache();
		$this->deactivate_ai_module_for_test();
		Jetpack_Gutenberg::reset();

		parent::tear_down();
	}

	/**
	 * Limit Jetpack Gutenberg availability checks to the extension under test.
	 *
	 * @return array
	 */
	public static function get_extension_allowlist() {
		return array( self::EXTENSION_SLUG );
	}

	/**
	 * Pin the site's plan without writing the option, surviving dev-env pins.
	 *
	 * @param string $product_slug Plan product slug.
	 */
	private static function pin_plan( $product_slug ) {
		add_filter(
			'pre_option_' . Current_Plan::PLAN_OPTION,
			static function () use ( $product_slug ) {
				return array( 'product_slug' => $product_slug );
			},
			self::PLAN_FILTER_PRIORITY
		);
		self::reset_active_plan_cache();
	}

	/**
	 * `Current_Plan::get()` memoizes per request; reset between tests.
	 */
	private static function reset_active_plan_cache() {
		$property = ( new ReflectionClass( Current_Plan::class ) )->getProperty( 'active_plan_cache' );
		// @todo Remove once we drop PHP < 8.1 support. `setAccessible()` is
		// deprecated in 8.5 (a no-op since 8.1), so only call it where needed.
		if ( PHP_VERSION_ID < 80100 ) {
			$property->setAccessible( true );
		}
		$property->setValue( null, null );
	}

	/**
	 * Run the extension registration and return this slug's availability row.
	 *
	 * @return array
	 */
	private function register_and_get_availability() {
		do_action( 'jetpack_register_gutenberg_extensions' );
		$availability = Jetpack_Gutenberg::get_availability();

		$this->assertArrayHasKey( self::EXTENSION_SLUG, $availability );

		return $availability[ self::EXTENSION_SLUG ];
	}

	/**
	 * An absent option must not hide the feature: the enhancer pre-dates its
	 * toggle, so most sites never stored a value. Absent = offered.
	 */
	public function test_extension_is_available_when_option_absent() {
		delete_option( AI_SEO_Enhancer::OPTION );

		$row = $this->register_and_get_availability();

		$this->assertTrue( $row['available'] );
	}

	/**
	 * A stored on is offered.
	 */
	public function test_extension_is_available_when_option_on() {
		update_option( AI_SEO_Enhancer::OPTION, 1 );

		$row = $this->register_and_get_availability();

		$this->assertTrue( $row['available'] );
	}

	/**
	 * Todd's case: the admin switched the enhancer off, so the extension is
	 * withheld — which removes every enhancer surface in the editor, including
	 * the manual "Generate metadata" path.
	 */
	public function test_extension_is_unavailable_when_option_off() {
		update_option( AI_SEO_Enhancer::OPTION, 0 );

		$row = $this->register_and_get_availability();

		$this->assertFalse( $row['available'] );
		$this->assertSame( 'ai_seo_enhancer_disabled', $row['unavailable_reason'] );
	}

	/**
	 * The withheld reason must never be `missing_plan`: that is the only
	 * reason value with upgrade-nudge semantics in the editor's shared
	 * helpers, and a deliberate off must not render upgrade messaging.
	 */
	public function test_switched_off_reason_is_not_missing_plan() {
		update_option( AI_SEO_Enhancer::OPTION, 0 );

		$row = $this->register_and_get_availability();

		$this->assertStringNotContainsString( 'missing_plan', $row['unavailable_reason'] );
	}

	/**
	 * The host veto filter still wins regardless of the stored toggle, and now
	 * leaves a named reason instead of silence.
	 */
	public function test_filter_veto_wins_over_stored_on() {
		update_option( AI_SEO_Enhancer::OPTION, 1 );
		add_filter( 'ai_seo_enhancer_enabled', '__return_false' );

		$row = $this->register_and_get_availability();

		$this->assertFalse( $row['available'] );
		$this->assertSame( 'ai_seo_enhancer_disabled', $row['unavailable_reason'] );
	}
}
