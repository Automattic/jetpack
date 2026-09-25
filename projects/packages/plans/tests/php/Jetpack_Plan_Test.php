<?php
/**
 * This file was copied and adapted from the Jetpack plugin on Jan 2022
 */

namespace Automattic\Jetpack;

use Automattic\Jetpack\Connection\Manager;
use Automattic\Jetpack\Current_Plan as Jetpack_Plan;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WP_Error;

/**
 * Contains the tests for the Jetpack_Plan class.
 */
class Jetpack_Plan_Test extends TestCase {

	/**
	 * Blog ID the connection state and the cached site record are keyed on.
	 */
	const TEST_BLOG_ID = 1234;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();
		delete_option( 'jetpack_active_plan' );
	}

	/**
	 * Returning the environment to its initial state. This class does not roll the database back
	 * between tests, so connection state a test writes would otherwise reach the next one.
	 */
	public function tearDown(): void {
		Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		delete_transient( Manager::SITE_DATA_TRANSIENT_PREFIX . self::TEST_BLOG_ID );
		Constants::clear_constants();

		parent::tearDown();
	}

	/**
	 * A refresh reads WordPress.com directly, so the shared site record cache can still hold an
	 * older record. A cached read stores the plan again, so leaving that copy in place would
	 * revert the plan this fetch just stored — the case a plan purchase hits.
	 */
	public function test_a_refresh_drops_the_cached_site_record() {
		Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		Jetpack_Options::update_option( 'id', self::TEST_BLOG_ID );
		( new Manager() )->reset_connection_status();

		// Signing needs an absolute URL, so the API base has to resolve.
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		Constants::set_constant( 'JETPACK__API_VERSION', 1 );

		$transient_key = Manager::SITE_DATA_TRANSIENT_PREFIX . self::TEST_BLOG_ID;
		set_transient( $transient_key, array( 'body' => wp_json_encode( array( 'plan' => self::get_free_plan() ), JSON_UNESCAPED_SLASHES ) ) );

		$serve_personal_plan = function () {
			return array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'plan' => self::get_personal_plan() ), JSON_UNESCAPED_SLASHES ),
			);
		};

		add_filter( 'pre_http_request', $serve_personal_plan );
		$updated = Jetpack_Plan::refresh_from_wpcom();
		remove_filter( 'pre_http_request', $serve_personal_plan );

		$this->assertTrue( $updated );
		$this->assertFalse( get_transient( $transient_key ), 'A stale record would overwrite the plan this refresh stored.' );
	}

	public function test_update_from_sites_response_failure_to_update() {
		update_option( 'jetpack_active_plan', $this->get_free_plan(), true );

		$option = get_option( 'jetpack_active_plan' );
		$this->assertSame( 'jetpack_free', $option['product_slug'] );

		// Set up an issue where the value in cache does not match the DB, so the DB update fails.
		Jetpack_Options::update_raw_option( 'jetpack_active_plan', $this->get_personal_plan(), true );

		$this->assertTrue( Jetpack_Plan::update_from_sites_response( $this->get_response_personal_plan() ) );
	}

	/**
	 * A record that matches what is already stored must not touch the options. `update_option()`
	 * reports false for an unchanged value, which previously read as a failure and triggered a
	 * delete plus a rewrite of an autoloaded option on every fetch.
	 */
	public function test_an_unchanged_record_does_not_rewrite_the_options() {
		$record = array(
			'plan'     => array( 'product_slug' => 'jetpack_personal' ),
			'products' => array( array( 'product_slug' => 'jetpack_backup_t1_yearly' ) ),
		);

		Jetpack_Plan::update_from_site_record( $record );

		$deleted = array();
		add_action(
			'delete_option',
			function ( $option ) use ( &$deleted ) {
				$deleted[] = $option;
			}
		);

		Jetpack_Plan::update_from_site_record( $record );

		$this->assertSame( array(), $deleted );
	}

	/**
	 * @dataProvider get_update_from_sites_response_data
	 */
	#[DataProvider( 'get_update_from_sites_response_data' )]
	public function test_update_from_sites_response( $response, $expected_plan_slug_after, $expected_return, $initial_option = null ) {

		if ( $initial_option !== null ) {
			update_option( 'jetpack_active_plan', $initial_option, true );
		}

		$this->assertSame( $expected_return, Jetpack_Plan::update_from_sites_response( $response ) );

		$plan = Jetpack_Plan::get();
		$this->assertSame( $expected_plan_slug_after, $plan['product_slug'] );
	}

	public static function get_update_from_sites_response_data() {
		return array(
			'is_errored_response'                    => array(
				static::get_errored_sites_response(),
				'jetpack_free',
				false,
			),
			'response_is_empty'                      => array(
				static::get_mocked_response( 200, '' ),
				'jetpack_free',
				false,
			),
			'response_does_not_have_body'            => array(
				array( 'code' => 400 ),
				'jetpack_free',
				false,
			),
			'response_does_not_have_plan'            => array(
				array(
					'code' => 200,
					array(),
				),
				'jetpack_free',
				false,
			),
			'initially_empty_option_to_free'         => array(
				static::get_response_free_plan(),
				'jetpack_free',
				true,
			),
			'initially_empty_to_personal'            => array(
				static::get_response_personal_plan(),
				'jetpack_personal',
				true,
			),
			'initially_free_to_personal'             => array(
				static::get_response_personal_plan(),
				'jetpack_personal',
				true,
				static::get_free_plan(),
			),
			'initially_personal_to_free'             => array(
				static::get_response_free_plan(),
				'jetpack_free',
				true,
				static::get_personal_plan(),
			),
			'initially_free_no_change'               => array(
				static::get_response_free_plan(),
				'jetpack_free',
				false,
				static::get_free_plan(),
			),
			'initially_personal_to_changed_personal' => array(
				static::get_response_changed_personal_plan(),
				'jetpack_personal',
				true,
				static::get_response_personal_plan(),
			),
		);
	}

	private static function get_response_free_plan() {
		return static::get_successful_plan_response( static::get_free_plan() );
	}

	private static function get_response_personal_plan() {
		return static::get_successful_plan_response( static::get_personal_plan() );
	}

	private static function get_response_changed_personal_plan() {
		return static::get_successful_plan_response( static::get_changed_personal_plan() );
	}

	private static function get_successful_plan_response( $plan_response ) {
		$body = wp_json_encode(
			array(
				'plan' => $plan_response,
			),
			JSON_UNESCAPED_SLASHES
		);
		return static::get_mocked_response( 200, $body );
	}

	private static function get_errored_sites_response() {
		return static::get_mocked_response( 400, new WP_Error() );
	}

	private static function get_mocked_response( $code, $body ) {
		return array(
			'code' => $code,
			'body' => $body,
		);
	}

	private static function get_free_plan() {
		return array(
			'product_id'         => 2002,
			'product_slug'       => 'jetpack_free',
			'product_name_short' => 'Free',
			'expired'            => false,
			'user_is_owner'      => false,
			'is_free'            => true,
			'features'           => array(
				'active'    => array(
					'akismet',
					'support',
				),
				'available' => array(
					'akismet'                       => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'vaultpress-backups'            => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'vaultpress-backup-archive'     => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'vaultpress-storage-space'      => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'vaultpress-automated-restores' => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'simple-payments'               => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'support'                       => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_personal',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
						'jetpack_personal_monthly',
					),
					'premium-themes'                => array(
						'jetpack_business',
						'jetpack_business_monthly',
					),
					'vaultpress-security-scanning'  => array(
						'jetpack_business',
						'jetpack_business_monthly',
					),
					'polldaddy'                     => array(
						'jetpack_business',
						'jetpack_business_monthly',
					),
				),
			),
		);
	}

	private static function get_changed_personal_plan() {
		$changed_personal_plan = static::get_personal_plan();

		$changed_personal_plan['features']['available']['test_feature'] = array( 'jetpack_free' );
		return $changed_personal_plan;
	}

	private static function get_personal_plan() {
		return array(
			'product_id'         => 2005,
			'product_slug'       => 'jetpack_personal',
			'product_name_short' => 'Personal',
			'expired'            => false,
			'user_is_owner'      => false,
			'is_free'            => false,
			'features'           => array(
				'active'    => array(
					'support',
				),
				'available' => array(
					'akismet'                       => array(
						'jetpack_free',
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'support'                       => array(
						'jetpack_free',
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
						'jetpack_personal_monthly',
					),
					'vaultpress-backups'            => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'vaultpress-backup-archive'     => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'vaultpress-storage-space'      => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'vaultpress-automated-restores' => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'simple-payments'               => array(
						'jetpack_premium',
						'jetpack_business',
						'jetpack_premium_monthly',
						'jetpack_business_monthly',
					),
					'premium-themes'                => array(
						'jetpack_business',
						'jetpack_business_monthly',
					),
					'vaultpress-security-scanning'  => array(
						'jetpack_business',
						'jetpack_business_monthly',
					),
					'polldaddy'                     => array(
						'jetpack_business',
						'jetpack_business_monthly',
					),
				),
			),
		);
	}
}
