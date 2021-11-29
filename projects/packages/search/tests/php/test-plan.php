<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Search;

use Automattic\Jetpack\Search\Test_Case as Search_Test_Case;
use WP_Error;

/**
 * Unit tests for the REST_Controller class.
 *
 * @package automattic/jetpack-search
 */
class Test_Plan extends Search_Test_Case {
	/**
	 * Plan object.
	 *
	 * @var Plan
	 */
	protected static $plan;

	/**
	 * Initialize static member `$plan`
	 *
	 * @beforeClass
	 */
	public static function set_up_before_class() {
		static::$plan = new Plan();
	}

	/**
	 * Testing `get_plan_info_from_wpcom`
	 */
	public function test_get_plan_info_from_wpcom() {
		$plan_info = static::$plan->get_plan_info_from_wpcom();
		$this->assertEquals( 200, $plan_info['response']['code'] );
		$this->assertTrue( strpos( $plan_info['body'], '"supports_search"' ) !== false );
	}

	/**
	 * Test `get_plan_info`
	 */
	public function test_get_plan_info() {
		$plan_info = static::$plan->get_plan_info();
		$this->assertTrue( $plan_info['supports_search'] );
		$this->assertFalse( $plan_info['supports_instant_search'] );
	}

	/**
	 * Test `has_jetpack_search_product`
	 */
	public function test_has_jetpack_search_product() {
		update_option( 'has_jetpack_search_product', true );
		$this->assertTrue( static::$plan->has_jetpack_search_product() );
	}

	/**
	 * Test `supports_instant_search`
	 */
	public function test_supports_instant_search() {
		$this->assertFalse( static::$plan->supports_instant_search() );
		$plan_info                            = json_decode( $this->plan_http_response_fixture( null, null, '/jetpack-search/plan' )['body'], true );
		$plan_info['supports_instant_search'] = true;
		update_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, $plan_info );
		$this->assertTrue( static::$plan->supports_instant_search() );
	}

	/**
	 * Test `supports_search`
	 */
	public function test_supports_search() {
		$this->assertTrue( static::$plan->supports_search() );
		$plan_info                    = json_decode( $this->plan_http_response_fixture( null, null, '/jetpack-search/plan' )['body'], true );
		$plan_info['supports_search'] = false;
		update_option( Plan::JETPACK_SEARCH_PLAN_INFO_OPTION_KEY, $plan_info );
		$this->assertFalse( static::$plan->supports_search() );
	}

	/**
	 * Test `supports_only_classic_search`
	 */
	public function test_supports_only_classic_search() {
		$this->assertTrue( static::$plan->supports_only_classic_search() );
	}

	/**
	 * Test `update_search_plan_info`
	 */
	public function test_update_search_plan_info() {
		$this->assertNull( static::$plan->update_search_plan_info( new WP_Error() ) );
		$this->assertNull( static::$plan->update_search_plan_info( array( 'response' => array( 'code' => 500 ) ) ) );
		$this->assertNull( static::$plan->update_search_plan_info( array() ) );

		$response = $this->plan_http_response_fixture( null, null, '/jetpack-search/plan' );
		static::$plan->update_search_plan_info( $response );
		$this->assertEquals( json_decode( $response['body'], true ), static::$plan->get_plan_info() );
		$this->assertFalse( static::$plan->has_jetpack_search_product() );
	}

}
