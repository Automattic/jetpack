<?php
/**
 * Tests for the AI Launchpad DIFM offer eligibility and assignment.
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Constants;
use Brain\Monkey\Functions;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;

//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-difm-offer.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/launchpad/launchpad.php';
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/helpers.php';
// Loaded up front: the file registers the routes on rest_api_init as it loads.
//phpcs:ignore WordPressVIPMinimum.Files.IncludingFile.NotAbsolutePath
require_once \Automattic\Jetpack\Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/ai-launchpad/class-ai-launchpad-rest.php';

/**
 * Test class for AI_Launchpad_Difm_Offer.
 *
 * Each test runs in its own process: Brain Monkey defines get_user_attribute() and
 * ExPlat\assign_current_user(), and other features change behaviour once those exist.
 *
 * @covers \AI_Launchpad_Difm_Offer
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[CoversClass( AI_Launchpad_Difm_Offer::class )]
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class AI_Launchpad_Difm_Offer_Test extends \WorDBless\BaseTestCase {

	/**
	 * The fixed "now" every test judges the site age against.
	 */
	const NOW = 1760000000;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		\Brain\Monkey\setUp();
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		Constants::clear_constants();
		unset( $GLOBALS['wpcom_get_site_purchases_test_value'], $GLOBALS['wpcom_blog_details_registered_test_value'], $GLOBALS['wpcom_site_stickers_test_value'] );
		\Brain\Monkey\tearDown();
		parent::tear_down();
	}

	/**
	 * Stubs an eligible user on an eligible site, with the given parts replaced.
	 *
	 * The default is a two-day-old Simple site on the Free plan, an English administrator, no
	 * stickers, no dismissal, and a user ExPlat assigns to the `no_time_to_build` arm.
	 *
	 * @param array $overrides Any of: is_simple, purchases, registered, locale, stickers, preferences, variation, role.
	 */
	private function stub_site( array $overrides = array() ) {
		$state = array_merge(
			array(
				'is_simple'   => true,
				'purchases'   => array(),
				'registered'  => gmdate( 'Y-m-d H:i:s', self::NOW - 2 * DAY_IN_SECONDS ),
				'locale'      => 'en',
				'stickers'    => array(),
				'preferences' => array(),
				'variation'   => 'no_time_to_build',
				'role'        => 'administrator',
			),
			$overrides
		);

		Constants::set_constant( 'IS_WPCOM', $state['is_simple'] );
		$GLOBALS['wpcom_get_site_purchases_test_value']      = $state['purchases'];
		$GLOBALS['wpcom_blog_details_registered_test_value'] = $state['registered'];
		$GLOBALS['wpcom_site_stickers_test_value']           = $state['stickers'];

		$user_id = wp_insert_user(
			array(
				'user_login' => 'difm_offer_admin',
				'user_pass'  => 'dummy_pass',
				'role'       => $state['role'],
				'locale'     => $state['locale'],
			)
		);
		wp_set_current_user( $user_id );

		Functions\when( 'get_user_attribute' )->alias(
			function ( $id, $key ) use ( $user_id, $state ) {
				return $user_id === $id && 'calypso_preferences' === $key ? $state['preferences'] : false;
			}
		);
		Functions\when( 'ExPlat\assign_current_user' )->alias(
			function ( $experiment ) use ( $state ) {
				return AI_Launchpad_Difm_Offer::EXPERIMENT === $experiment ? $state['variation'] : null;
			}
		);
	}

	/**
	 * A plan purchase as wpcom_get_site_purchases() returns it.
	 *
	 * @param string $slug The product slug.
	 * @return object
	 */
	private static function plan( $slug ) {
		return (object) array(
			'product_slug' => $slug,
			'product_type' => 'bundle',
			'expiry_date'  => '2027-01-01 00:00:00',
		);
	}

	/**
	 * An eligible user in any copy arm gets the offer with that arm.
	 *
	 * @dataProvider provide_arms
	 *
	 * @param string $arm The ExPlat variation.
	 */
	#[DataProvider( 'provide_arms' )]
	public function test_eligible_user_in_an_arm_gets_the_offer( $arm ) {
		$this->stub_site( array( 'variation' => $arm ) );

		$offer = AI_Launchpad_Difm_Offer::get_offer( self::NOW );

		$this->assertSame( $arm, $offer['variation'] );
		$this->assertStringEndsWith( '/images/difm-offer-illustration.webp', $offer['image_url'] );
	}

	/**
	 * Data provider for test_eligible_user_in_an_arm_gets_the_offer.
	 *
	 * @return array
	 */
	public static function provide_arms() {
		return array(
			'expert help'      => array( 'expert_help' ),
			'no time to build' => array( 'no_time_to_build' ),
			'skip the setup'   => array( 'skip_the_setup' ),
		);
	}

	/**
	 * The single arm the experiment had before registration no longer shows the offer.
	 */
	public function test_unknown_variation_gets_no_offer() {
		$this->stub_site( array( 'variation' => 'treatment' ) );

		$this->assertNull( AI_Launchpad_Difm_Offer::get_offer( self::NOW ) );
	}

	/**
	 * The CTA opens the offer on the Calypso site overview of this site.
	 */
	public function test_cta_url_opens_the_offer_on_the_site_overview() {
		$this->stub_site();
		update_option( 'home', 'https://alpinenotes.wordpress.com' );

		$offer = AI_Launchpad_Difm_Offer::get_offer( self::NOW );

		$this->assertSame(
			'https://wordpress.com/sites/alpinenotes.wordpress.com?difmOffer=open&source=site-setup',
			$offer['cta_url']
		);
	}

	/**
	 * The CTA follows an allowed Calypso origin and ignores any other.
	 *
	 * @dataProvider provide_calypso_origins
	 *
	 * @param string $origin   The calypso_origin request parameter.
	 * @param string $expected The expected CTA URL.
	 */
	#[DataProvider( 'provide_calypso_origins' )]
	public function test_cta_url_uses_the_calypso_origin( $origin, $expected ) {
		$this->stub_site();
		update_option( 'home', 'https://alpinenotes.wordpress.com' );
		$_GET['calypso_origin'] = $origin;

		$offer = AI_Launchpad_Difm_Offer::get_offer( self::NOW );

		unset( $_GET['calypso_origin'] );
		$this->assertSame( $expected, $offer['cta_url'] );
	}

	/**
	 * Data provider for test_cta_url_uses_the_calypso_origin.
	 *
	 * @return array
	 */
	public static function provide_calypso_origins() {
		return array(
			'allowed origin'    => array( 'https://wpcalypso.wordpress.com', 'https://wpcalypso.wordpress.com/sites/alpinenotes.wordpress.com?difmOffer=open&source=site-setup' ),
			'disallowed origin' => array( 'https://evil.example', 'https://wordpress.com/sites/alpinenotes.wordpress.com?difmOffer=open&source=site-setup' ),
		);
	}

	/**
	 * Stubs an eligible user in the `no_time_to_build` arm on a site created yesterday, and registers the AI Launchpad routes.
	 */
	private function stub_launchpad() {
		$this->stub_site( array( 'registered' => gmdate( 'Y-m-d H:i:s', time() - DAY_IN_SECONDS ) ) );
		Functions\when( 'wpcom_ai_launchpad_is_eligible' )->justReturn( true );
		wpcom_register_default_launchpad_checklists();
		do_action( 'rest_api_init' );
	}

	/**
	 * Reads GET /wpcom/v2/ai-launchpad.
	 *
	 * @param array $query Query params.
	 * @return array The response data.
	 */
	private function get_launchpad( array $query = array() ) {
		$request = new WP_REST_Request( 'GET', '/wpcom/v2/ai-launchpad' );
		$request->set_query_params( $query );
		return rest_do_request( $request )->get_data();
	}

	/**
	 * A site with no AI output opens on the wizard, so the read neither offers nor assigns.
	 */
	public function test_wizard_view_gets_no_offer_and_no_assignment() {
		$this->stub_launchpad();
		Functions\expect( 'ExPlat\assign_current_user' )->never();

		$data = $this->get_launchpad();

		$this->assertNull( $data['ai_output'] );
		$this->assertNull( $data['difm_offer'] );
	}

	/**
	 * Once the wizard has produced AI output, the list's read carries the offer.
	 */
	public function test_list_view_gets_the_offer() {
		update_option(
			'wpcom_ai_launchpad_ai_output',
			array(
				'version'      => 1,
				'source'       => 'ai',
				'generated_at' => 1717000000,
				'payload'      => array(
					'tasks'    => array(),
					'inferred' => array( 'goal' => 'write' ),
				),
			),
			false
		);
		$this->stub_launchpad();

		$data = $this->get_launchpad();

		$this->assertSame( 'no_time_to_build', $data['difm_offer']['variation'] );
	}

	/**
	 * The ?all_tasks=1 testing view skips the wizard, so it gets the offer too.
	 */
	public function test_all_tasks_view_gets_the_offer() {
		$this->stub_launchpad();

		$data = $this->get_launchpad( array( 'all_tasks' => '1' ) );

		$this->assertSame( 'no_time_to_build', $data['difm_offer']['variation'] );
	}

	/**
	 * An eligible user in control gets no offer.
	 */
	public function test_eligible_control_user_gets_no_offer() {
		$this->stub_site( array( 'variation' => 'control' ) );

		$this->assertNull( AI_Launchpad_Difm_Offer::get_offer( self::NOW ) );
	}

	/**
	 * An eligible user ExPlat has no assignment for gets no offer.
	 */
	public function test_unassigned_user_gets_no_offer() {
		$this->stub_site( array( 'variation' => null ) );

		$this->assertNull( AI_Launchpad_Difm_Offer::get_offer( self::NOW ) );
	}

	/**
	 * Each failed check withholds the offer.
	 *
	 * @dataProvider provide_failed_checks
	 *
	 * @param array $overrides The part of an eligible site that fails.
	 */
	#[DataProvider( 'provide_failed_checks' )]
	public function test_failed_check_gets_no_offer( array $overrides ) {
		$this->stub_site( $overrides );

		$this->assertNull( AI_Launchpad_Difm_Offer::get_offer( self::NOW ) );
	}

	/**
	 * Data provider for test_failed_check_gets_no_offer.
	 *
	 * @return array
	 */
	public static function provide_failed_checks() {
		return array(
			'an Author, not an admin'    => array( array( 'role' => 'author' ) ),
			'not a Simple site'          => array( array( 'is_simple' => false ) ),
			'Business plan'              => array( array( 'purchases' => array( self::plan( 'business-bundle' ) ) ) ),
			'fifteen days old'           => array( array( 'registered' => gmdate( 'Y-m-d H:i:s', self::NOW - 15 * DAY_IN_SECONDS ) ) ),
			'no registered date'         => array( array( 'registered' => '0000-00-00 00:00:00' ) ),
			'no blog details'            => array( array( 'registered' => null ) ),
			'empty registered date'      => array( array( 'registered' => '' ) ),
			'German user'                => array( array( 'locale' => 'de' ) ),
			'A4A dev site'               => array( array( 'stickers' => array( 'a4a-is-dev-site' ) ) ),
			'DIFM Lite in progress'      => array( array( 'stickers' => array( 'difm-lite-in-progress' ) ) ),
			'dismissed on a Calypso one' => array( array( 'preferences' => array( 'hosting-dashboard-difm-offer-dismissed' => '2026-10-01T10:00:00.000Z' ) ) ),
		);
	}

	/**
	 * Each eligible plan, locale and age boundary gets the offer.
	 *
	 * @dataProvider provide_passed_checks
	 *
	 * @param array $overrides The part of an eligible site under test.
	 */
	#[DataProvider( 'provide_passed_checks' )]
	public function test_passed_check_gets_the_offer( array $overrides ) {
		$this->stub_site( $overrides );

		$this->assertIsArray( AI_Launchpad_Difm_Offer::get_offer( self::NOW ) );
	}

	/**
	 * Data provider for test_passed_check_gets_the_offer.
	 *
	 * @return array
	 */
	public static function provide_passed_checks() {
		return array(
			// Literal slugs, copied from Calypso's ELIGIBLE_PLAN_SLUGS: rows built from the constant
			// would only repeat it back and could not catch a typo in it.
			'Personal trial'               => array( array( 'purchases' => array( self::plan( 'wp-personal-bundle-free-trial-monthly' ) ) ) ),
			'Personal monthly'             => array( array( 'purchases' => array( self::plan( 'personal-bundle-monthly' ) ) ) ),
			'Personal yearly'              => array( array( 'purchases' => array( self::plan( 'personal-bundle' ) ) ) ),
			'Personal two-year'            => array( array( 'purchases' => array( self::plan( 'personal-bundle-2y' ) ) ) ),
			'Personal three-year'          => array( array( 'purchases' => array( self::plan( 'personal-bundle-3y' ) ) ) ),
			'Premium monthly'              => array( array( 'purchases' => array( self::plan( 'value_bundle_monthly' ) ) ) ),
			'Premium yearly'               => array( array( 'purchases' => array( self::plan( 'value_bundle' ) ) ) ),
			'Premium two-year'             => array( array( 'purchases' => array( self::plan( 'value_bundle-2y' ) ) ) ),
			'Premium three-year'           => array( array( 'purchases' => array( self::plan( 'value_bundle-3y' ) ) ) ),
			'a non-plan purchase'          => array(
				array(
					'purchases' => array(
						(object) array(
							'product_slug' => 'wp_titan_mail_premium_monthly',
							'product_type' => 'titan-mail',
							'expiry_date'  => '2027-01-01 00:00:00',
						),
					),
				),
			),
			// No product_type, so only the bundle filter keeps the slug fallback from reading
			// "premium" in the slug as a Premium plan.
			'an untyped add-on purchase'   => array(
				array(
					'purchases' => array(
						(object) array(
							'product_slug' => 'wp_titan_mail_premium_monthly',
							'expiry_date'  => '2027-01-01 00:00:00',
						),
					),
				),
			),
			'exactly fourteen days old'    => array( array( 'registered' => gmdate( 'Y-m-d H:i:s', self::NOW - 14 * DAY_IN_SECONDS ) ) ),
			'British English user'         => array( array( 'locale' => 'en-gb' ) ),
			'core-format US English user'  => array( array( 'locale' => 'en_US' ) ),
			'other preferences, no ruling' => array( array( 'preferences' => array( 'sidebarCollapsed' => true ) ) ),
		);
	}

	/**
	 * A dismissed user is never assigned to the experiment.
	 */
	public function test_dismissed_user_is_never_assigned() {
		$this->stub_site( array( 'preferences' => array( 'hosting-dashboard-difm-offer-dismissed' => '2026-10-01T10:00:00.000Z' ) ) );
		Functions\expect( 'ExPlat\assign_current_user' )->never();

		$this->assertNull( AI_Launchpad_Difm_Offer::get_offer( self::NOW ) );
	}

	/**
	 * The override filter forces either arm without asking ExPlat.
	 */
	public function test_override_filter_replaces_the_assignment() {
		$this->stub_site( array( 'variation' => 'control' ) );
		Functions\expect( 'ExPlat\assign_current_user' )->never();

		add_filter( 'wpcom_ai_launchpad_difm_offer_override_is_treatment', '__return_true' );
		$this->assertIsArray( AI_Launchpad_Difm_Offer::get_offer( self::NOW ) );

		add_filter( 'wpcom_ai_launchpad_difm_offer_override_is_treatment', '__return_false', 11 );
		$this->assertNull( AI_Launchpad_Difm_Offer::get_offer( self::NOW ) );

		remove_all_filters( 'wpcom_ai_launchpad_difm_offer_override_is_treatment' );
	}

	/**
	 * The override filter does not bypass eligibility.
	 */
	public function test_override_filter_keeps_the_eligibility_checks() {
		$this->stub_site( array( 'locale' => 'de' ) );
		add_filter( 'wpcom_ai_launchpad_difm_offer_override_is_treatment', '__return_true' );

		$this->assertNull( AI_Launchpad_Difm_Offer::get_offer( self::NOW ) );

		remove_all_filters( 'wpcom_ai_launchpad_difm_offer_override_is_treatment' );
	}
}
