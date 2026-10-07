<?php
/**
 * Tests for the Stats start date and its script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversFunction;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/stats-start-date.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_start_date
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_wpcom_registered_date
 * @covers ::Automattic\Jetpack\PremiumAnalytics\to_site_day
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_stats_start_date_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_start_date' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_wpcom_registered_date' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\to_site_day' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_stats_start_date_script_data' )]
class Stats_Start_Date_Test extends BaseTestCase {

	/**
	 * WPCOM requests made during a test.
	 *
	 * @var string[]
	 */
	private $requests = array();

	/**
	 * Connect the site and answer WPCOM requests with the given response.
	 *
	 * @param array $response The `pre_http_request` response to return.
	 */
	private function answer_wpcom_with( array $response ) {
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		Jetpack_Options::update_option( 'id', 4242 );
		Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();

		add_filter(
			'pre_http_request',
			function ( $pre, $args, $url ) use ( $response ) {
				$this->requests[] = $url;
				return $response;
			},
			10,
			3
		);
	}

	/**
	 * Reset the connection, caches, and request globals.
	 */
	public function tear_down() {
		remove_all_filters( 'pre_http_request' );
		Jetpack_Options::delete_option( 'blog_token' );
		Jetpack_Options::delete_option( 'id' );
		( new Connection_Manager() )->reset_connection_status();
		Constants::clear_constants();
		delete_option( WPCOM_REGISTERED_OPTION );
		delete_option( 'timezone_string' );
		delete_transient( WPCOM_REGISTERED_RETRY_TRANSIENT );
		delete_transient( 'jetpack_assumed_site_creation_date' );
		unset( $_GET['page'], $GLOBALS['current_screen'] );
		$this->requests = array();

		parent::tear_down();
	}

	/**
	 * The registration date is read in the site timezone and fetched only once.
	 */
	public function test_fetches_the_wpcom_registration_once_as_a_site_day() {
		update_option( 'timezone_string', 'Asia/Taipei' );
		$this->answer_wpcom_with(
			array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'options' => array( 'created_at' => '2012-03-04T22:30:00+00:00' ) ), JSON_UNESCAPED_SLASHES ),
				'headers'  => array(),
			)
		);

		$this->assertSame( array( '2012-03-05', '2012-03-05' ), array( get_stats_start_date(), get_stats_start_date() ) );
		$this->assertCount( 1, $this->requests );
		$this->assertStringContainsString( '/sites/4242?force=wpcom&options=created_at', $this->requests[0] );
	}

	/**
	 * A date cached for an earlier WPCOM site ID is not reused after reconnecting.
	 */
	public function test_refetches_the_registration_for_a_new_site_id() {
		update_option(
			WPCOM_REGISTERED_OPTION,
			array(
				'site_id'    => 1111,
				'registered' => '2009-01-01T00:00:00+00:00',
			)
		);
		$this->answer_wpcom_with(
			array(
				'response' => array( 'code' => 200 ),
				'body'     => wp_json_encode( array( 'options' => array( 'created_at' => '2018-07-01T00:00:00+00:00' ) ), JSON_UNESCAPED_SLASHES ),
				'headers'  => array(),
			)
		);

		$this->assertSame( '2018-07-01', get_stats_start_date() );
		$this->assertCount( 1, $this->requests );
	}

	/**
	 * A failed lookup falls back to the assumed creation date and holds off retrying.
	 */
	public function test_falls_back_to_the_assumed_creation_date_without_retrying() {
		set_transient( 'jetpack_assumed_site_creation_date', '2015-06-01 10:00:00' );
		$this->answer_wpcom_with(
			array(
				'response' => array( 'code' => 500 ),
				'body'     => '{"error":"unknown_error"}',
				'headers'  => array(),
			)
		);

		$this->assertSame( array( '2015-06-01', '2015-06-01' ), array( get_stats_start_date(), get_stats_start_date() ) );
		$this->assertCount( 1, $this->requests );
	}

	/**
	 * Other admin pages never pay for the lookup.
	 */
	public function test_injects_the_start_date_on_the_dashboard_page_only() {
		update_option( 'timezone_string', 'UTC' );
		set_transient( 'jetpack_assumed_site_creation_date', '2012-03-04 00:00:00' );
		set_current_screen( 'dashboard' );

		$this->assertSame( array(), inject_stats_start_date_script_data( array() ) );

		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;

		$this->assertSame(
			array( 'premium_analytics' => array( 'stats_start_date' => '2012-03-04' ) ),
			inject_stats_start_date_script_data( array() )
		);
	}
}
