<?php
/**
 * Tests for the purchase success script data.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Status\Cache;
use PHPUnit\Framework\Attributes\CoversFunction;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

require_once __DIR__ . '/../../src/purchase-success.php';

/**
 * @covers ::Automattic\Jetpack\PremiumAnalytics\get_stats_purchase_success_type
 * @covers ::Automattic\Jetpack\PremiumAnalytics\is_site_commercial
 * @covers ::Automattic\Jetpack\PremiumAnalytics\configure_purchase_success
 * @covers ::Automattic\Jetpack\PremiumAnalytics\inject_purchase_success_script_data
 */
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\get_stats_purchase_success_type' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\is_site_commercial' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\configure_purchase_success' )]
#[CoversFunction( 'Automattic\Jetpack\PremiumAnalytics\inject_purchase_success_script_data' )]
class Purchase_Success_Test extends BaseTestCase {

	/**
	 * URLs of the site lookups sent to WordPress.com during the test.
	 *
	 * @var string[]
	 */
	private $site_requests = array();

	/**
	 * Serve the dashboard of a connected site, with WordPress.com answering the site lookup.
	 */
	public function set_up() {
		parent::set_up();
		Cache::clear();
		$_GET['page'] = Analytics::MENU_PAGE_SLUG;
		set_current_screen( 'toplevel_page_' . Analytics::MENU_PAGE_SLUG );

		\Jetpack_Options::update_option( 'id', 1234 );
		\Jetpack_Options::update_option( 'blog_token', 'blog_token.secret' );
		( new Connection_Manager() )->reset_connection_status();
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		$this->answer_site_lookup( array( 'options' => array( 'is_commercial' => true ) ) );
	}

	/**
	 * Reset the request, connection and filters.
	 */
	public function tear_down() {
		Constants::clear_constants();
		Cache::clear();
		remove_all_filters( 'pre_http_request' );
		remove_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_purchase_success_script_data', 20 );
		unset( $_GET['page'], $_GET['statsPurchaseSuccess'], $GLOBALS['current_screen'] );
		\Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );
		parent::tear_down();
	}

	/**
	 * Answer the WordPress.com site lookup, recording each request.
	 *
	 * @param array|\WP_Error $answer The decoded body to answer with, or a transport error.
	 * @param int             $code   The response status.
	 */
	private function answer_site_lookup( $answer, $code = 200 ) {
		remove_all_filters( 'pre_http_request' );
		add_filter(
			'pre_http_request',
			function ( $preempt, $args, $url ) use ( $answer, $code ) {
				if ( false === strpos( $url, '/sites/1234' ) ) {
					return $preempt;
				}
				$this->site_requests[] = $url;
				if ( is_wp_error( $answer ) ) {
					return $answer;
				}
				return array(
					'response' => array( 'code' => $code ),
					'body'     => wp_json_encode( $answer, JSON_UNESCAPED_SLASHES ),
				);
			},
			10,
			3
		);
	}

	/**
	 * Only the two types checkout reports reach the client.
	 *
	 * @dataProvider provide_purchase_success_params
	 *
	 * @param string|null $param    The `statsPurchaseSuccess` query value, or none.
	 * @param string      $expected The type the server reports.
	 */
	#[DataProvider( 'provide_purchase_success_params' )]
	public function test_reads_only_the_types_checkout_reports( $param, $expected ) {
		if ( null !== $param ) {
			$_GET['statsPurchaseSuccess'] = $param;
		}

		$this->assertSame( $expected, get_stats_purchase_success_type() );
	}

	/**
	 * Query values and the type each one reports.
	 *
	 * @return array
	 */
	public static function provide_purchase_success_params() {
		return array(
			'paid'    => array( 'paid', 'paid' ),
			'free'    => array( 'free', 'free' ),
			'unknown' => array( 'refund', '' ),
			'absent'  => array( null, '' ),
		);
	}

	/**
	 * A paid return carries WordPress.com's classification, read from WordPress.com itself.
	 *
	 * @dataProvider provide_site_lookups
	 *
	 * @param array|\WP_Error $answer   What WordPress.com answers.
	 * @param int             $code     The response status.
	 * @param bool            $expected Whether the notice gets the commercial copy.
	 */
	#[DataProvider( 'provide_site_lookups' )]
	public function test_paid_return_carries_the_commercial_classification( $answer, $code, $expected ) {
		$this->answer_site_lookup( $answer, $code );
		$_GET['statsPurchaseSuccess'] = 'paid';

		$data = inject_purchase_success_script_data( array( 'premium_analytics' => array( 'has_videopress' => true ) ) );

		$this->assertTrue( $data['premium_analytics']['has_videopress'] );
		$this->assertSame(
			array(
				'type'          => 'paid',
				'is_commercial' => $expected,
			),
			$data['premium_analytics']['purchase_success']
		);
		$this->assertCount( 1, $this->site_requests );
		$this->assertStringContainsString( 'force=wpcom', $this->site_requests[0] );
	}

	/**
	 * WordPress.com answers and the classification each one gives.
	 *
	 * @return array
	 */
	public static function provide_site_lookups() {
		return array(
			'commercial'     => array( array( 'options' => array( 'is_commercial' => true ) ), 200, true ),
			'not commercial' => array( array( 'options' => array( 'is_commercial' => false ) ), 200, false ),
			'server error'   => array( array( 'options' => array( 'is_commercial' => true ) ), 500, false ),
			'timeout'        => array( new \WP_Error( 'http_request_failed', 'Operation timed out' ), 200, false ),
		);
	}

	public function test_free_return_skips_the_lookup() {
		$_GET['statsPurchaseSuccess'] = 'free';

		$data = inject_purchase_success_script_data( array() );

		$this->assertSame( array( 'type' => 'free' ), $data['premium_analytics']['purchase_success'] );
		$this->assertSame( array(), $this->site_requests );
	}

	public function test_simple_skips_the_lookup() {
		Constants::set_constant( 'IS_WPCOM', true );

		$this->assertFalse( is_site_commercial() );
		$this->assertSame( array(), $this->site_requests );
	}

	/**
	 * Other admin pages and ordinary loads print script data too, and must not pay for the lookup.
	 */
	public function test_script_data_is_left_alone_off_the_dashboard_or_without_a_purchase() {
		$this->assertSame( array( 'premium_analytics' => array() ), inject_purchase_success_script_data( array( 'premium_analytics' => array() ) ) );

		$_GET['statsPurchaseSuccess'] = 'paid';
		$_GET['page']                 = 'jetpack';
		set_current_screen( 'toplevel_page_jetpack' );

		$this->assertSame( array( 'premium_analytics' => array() ), inject_purchase_success_script_data( array( 'premium_analytics' => array() ) ) );
		$this->assertSame( array(), $this->site_requests );
	}

	public function test_configure_registers_the_injector_at_priority_20() {
		configure_purchase_success();

		$this->assertSame( 20, has_filter( 'jetpack_admin_js_script_data', __NAMESPACE__ . '\\inject_purchase_success_script_data' ) );
	}
}
