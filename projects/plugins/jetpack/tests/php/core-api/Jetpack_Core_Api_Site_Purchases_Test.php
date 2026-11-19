<?php

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Wpcom_Products;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . '/_inc/lib/core-api/class.jetpack-core-api-site-endpoints.php';

/**
 * @covers \Jetpack_Core_API_Site_Endpoint
 */
#[CoversClass( Jetpack_Core_API_Site_Endpoint::class )]
class Jetpack_Core_Api_Site_Purchases_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Requests sent to WordPress.com.
	 *
	 * @var int
	 */
	private $requests = 0;

	/**
	 * Status code the mocked `/upgrades` request answers with.
	 *
	 * @var int
	 */
	private $status = 200;

	/**
	 * Body the mocked `/upgrades` request answers with.
	 *
	 * @var string
	 */
	private $body = '';

	public function set_up() {
		parent::set_up();

		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		Wpcom_Products::reset_purchases_cache();
		Wpcom_Products::reset_request_failures();
		add_filter( 'pre_http_request', array( $this, 'mock_upgrades' ), 10, 3 );
	}

	public function tear_down() {
		remove_filter( 'pre_http_request', array( $this, 'mock_upgrades' ) );
		Wpcom_Products::reset_purchases_cache();
		Wpcom_Products::reset_request_failures();
		Constants::clear_constants();
		Jetpack_Options::delete_option( array( 'id', 'blog_token' ) );

		parent::tear_down();
	}

	/**
	 * @param false|array $preempt Whether to preempt the request.
	 * @param array       $args    Request arguments.
	 * @param string      $url     Request URL.
	 * @return false|array
	 */
	public function mock_upgrades( $preempt, $args, $url ) {
		if ( ! str_contains( $url, '/upgrades' ) ) {
			return $preempt;
		}
		++$this->requests;

		return array(
			'body'     => $this->body,
			'response' => array(
				'code'    => $this->status,
				'message' => '',
			),
		);
	}

	/**
	 * @return array[]
	 */
	public static function provide_purchases() {
		return array(
			'one purchase' => array( '[{"product_slug":"jetpack_complete","expiry_date":"2027-11-18T00:00:00+00:00"}]' ),
			'no purchases' => array( '[]' ),
		);
	}

	/**
	 * @dataProvider provide_purchases
	 *
	 * @param string $body The `/upgrades` response body.
	 */
	#[DataProvider( 'provide_purchases' )]
	public function test_reuses_the_my_jetpack_purchases_lookup_and_keeps_the_payload( $body ) {
		$this->body = $body;
		Wpcom_Products::get_site_current_purchases();

		$response = Jetpack_Core_API_Site_Endpoint::get_purchases();

		$this->assertSame( 1, $this->requests );
		$this->assertSame( json_decode( $body, true ), json_decode( $response->get_data()['data'], true ) );
	}

	public function test_failed_lookup_returns_an_error() {
		$this->status = 500;

		$result = Jetpack_Core_API_Site_Endpoint::get_purchases();

		$this->assertWPError( $result );
		$this->assertSame( 'failed_to_fetch_data', $result->get_error_code() );
	}
}
