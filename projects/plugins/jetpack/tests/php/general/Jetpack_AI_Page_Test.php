<?php
/**
 * Tests for the Jetpack AI admin page script data.
 *
 * The contract worth locking down: the pre-release a11n gate flag rides the
 * jetpackAiSettings inline script and follows
 * jetpack_is_internal_testing_environment(), so the Features view stays hidden
 * outside internal testing environments while the MCP-only page keeps working.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Status\Cache as Status_Cache;
use PHPUnit\Framework\Attributes\CoversClass;

require_once JETPACK__PLUGIN_DIR . '_inc/lib/admin-pages/class-jetpack-ai-page.php';

/**
 * Class Jetpack_AI_Page_Test
 *
 * @covers \Jetpack_AI_Page
 */
#[CoversClass( Jetpack_AI_Page::class )]
class Jetpack_AI_Page_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the proxied-request marker and the scripts registry.
	 */
	public function tear_down() {
		unset( $_SERVER['A8C_PROXIED_REQUEST'] );
		unset( $GLOBALS['wp_scripts'] );
		delete_transient( 'jetpack_ai_overview_plan_name' );
		Status_Cache::clear();

		parent::tear_down();
	}

	/**
	 * Serve a fixed purchase list and site plan, so the plan-name lookup reads
	 * known data instead of contacting WordPress.com.
	 *
	 * @param array  $purchases Purchase objects the site owns.
	 * @param string $plan_slug Slug of the site's current plan, or '' for a free site.
	 */
	private function given_site( array $purchases, $plan_slug = '' ) {
		delete_transient( 'jetpack_ai_overview_plan_name' );

		add_filter(
			'pre_transient_my-jetpack-purchases',
			function () use ( $purchases ) {
				return $purchases;
			}
		);

		// Set the plan through the package's own API: Current_Plan::get() memoises
		// into a private static, so filtering the option read is not enough.
		\Automattic\Jetpack\Current_Plan::update_from_site_record(
			array(
				'plan' => array(
					'product_slug' => '' === $plan_slug ? 'jetpack_free' : $plan_slug,
					'features'     => array( 'active' => array( 'ai-assistant' ) ),
				),
			)
		);
	}

	/**
	 * Answer is_woa_site() without the Atomic constants.
	 *
	 * @param bool $is_woa Whether the site should look like WoA.
	 */
	private function given_woa( $is_woa ) {
		Status_Cache::set( 'is_woa_site', $is_woa );
	}

	/**
	 * A standalone Jetpack AI subscription.
	 *
	 * @return object
	 */
	private function jetpack_ai_purchase() {
		return (object) array(
			'product_slug'  => 'jetpack_ai_yearly',
			'product_name'  => 'Jetpack AI Assistant',
			'expiry_status' => 'active',
		);
	}

	/**
	 * Run page_admin_scripts() against a fresh scripts registry and decode the
	 * jetpackAiSettings payload it injects.
	 *
	 * @return array Decoded payload.
	 */
	private function get_injected_settings() {
		unset( $GLOBALS['wp_scripts'] );

		( new Jetpack_AI_Page() )->page_admin_scripts();

		$inline = implode( "\n", array_filter( (array) wp_scripts()->get_data( 'jetpack-ai-admin', 'before' ) ) );
		$this->assertSame( 1, preg_match( '/var jetpackAiSettings = (\{.*\});/', $inline, $matches ) );

		$settings = json_decode( $matches[1], true );
		$this->assertIsArray( $settings );

		return $settings;
	}

	/**
	 * Outside internal testing environments the Features view flag is off.
	 */
	public function test_features_view_flag_is_off_by_default() {
		$settings = $this->get_injected_settings();

		$this->assertArrayHasKey( 'showFeaturesView', $settings );
		$this->assertFalse( $settings['showFeaturesView'] );
	}

	/**
	 * A proxied a8c request marks an internal testing environment and turns
	 * the Features view flag on.
	 */
	public function test_features_view_flag_follows_internal_testing_environment() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$settings = $this->get_injected_settings();

		$this->assertTrue( $settings['showFeaturesView'] );
	}

	/**
	 * The Tracks audience properties ride the same payload (AIINT-586): isTest
	 * is the environment flag, isA11n the identity flag. The test environment
	 * defines no is_automattician() and connects no user, so isA11n is false.
	 */
	public function test_tracks_audience_properties_default_to_false() {
		$settings = $this->get_injected_settings();

		$this->assertArrayHasKey( 'isA11n', $settings );
		$this->assertArrayHasKey( 'isTest', $settings );
		$this->assertFalse( $settings['isA11n'] );
		$this->assertFalse( $settings['isTest'] );
	}

	/**
	 * A proxied request is a test environment regardless of who made it, so
	 * isTest follows jetpack_is_internal_testing_environment().
	 */
	public function test_tracks_is_test_follows_internal_testing_environment() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';

		$settings = $this->get_injected_settings();

		$this->assertTrue( $settings['isTest'] );
	}

	/**
	 * A WordPress.com site names its own plan, never the Jetpack purchase that
	 * happens to grant AI.
	 */
	public function test_wpcom_site_shows_its_own_plan() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_woa( true );
		$this->given_site(
			array(
				$this->jetpack_ai_purchase(),
				(object) array(
					'product_slug'  => 'business-bundle',
					'product_name'  => 'WordPress.com Business',
					'expiry_status' => 'active',
				),
			),
			'business-bundle'
		);

		$settings = $this->get_injected_settings();

		$this->assertSame( 'Business', $settings['planName'] );
	}

	/**
	 * With no Dotcom plan to name, the card shows nothing rather than falling
	 * back to the Jetpack name.
	 */
	public function test_wpcom_site_shows_nothing_when_its_plan_is_unknown() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_woa( true );
		$this->given_site( array( $this->jetpack_ai_purchase() ), 'business-bundle' );

		$settings = $this->get_injected_settings();

		$this->assertSame( '', $settings['planName'] );
	}

	/**
	 * Self-hosted sites keep the Jetpack purchase name, brand prefix trimmed.
	 */
	public function test_self_hosted_site_shows_the_jetpack_plan() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_woa( false );
		$this->given_site( array( $this->jetpack_ai_purchase() ) );

		$settings = $this->get_injected_settings();

		$this->assertSame( 'AI Assistant', $settings['planName'] );
	}

	/**
	 * An expired purchase names nothing, so a lapsed site cannot read as paid.
	 */
	public function test_expired_purchase_is_not_named() {
		$expired                = $this->jetpack_ai_purchase();
		$expired->expiry_status = 'expired';

		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		$this->given_woa( false );
		$this->given_site( array( $expired ) );

		$settings = $this->get_injected_settings();

		$this->assertSame( '', $settings['planName'] );
	}

	/**
	 * The lookup is memoised for an hour, so the admin page does not repeat a
	 * purchase call that can reach out to WordPress.com on every render.
	 */
	public function test_a_cached_name_is_reused() {
		$_SERVER['A8C_PROXIED_REQUEST'] = '1';
		set_transient( 'jetpack_ai_overview_plan_name', 'Cached', HOUR_IN_SECONDS );

		$settings = $this->get_injected_settings();

		$this->assertSame( 'Cached', $settings['planName'] );
	}

	/**
	 * The name is only looked up for the gated views, so an ungated page ships
	 * an empty value rather than paying for the purchase lookup.
	 */
	public function test_plan_name_is_absent_without_the_gate() {
		$this->given_woa( false );
		$this->given_site( array( $this->jetpack_ai_purchase() ) );

		$settings = $this->get_injected_settings();

		$this->assertSame( '', $settings['planName'] );
	}
}
