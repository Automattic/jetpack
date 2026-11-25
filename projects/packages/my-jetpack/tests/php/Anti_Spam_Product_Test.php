<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\My_Jetpack\Products\Anti_Spam;
use Automattic\Jetpack\Status\Cache as StatusCache;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WP_Error;

/**
 * Unit tests for the Anti_Spam product.
 *
 * @package automattic/my-jetpack
 * @covers \Automattic\Jetpack\My_Jetpack\Products\Anti_Spam
 */
#[CoversClass( Anti_Spam::class )]
class Anti_Spam_Product_Test extends TestCase {

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );
		Product::reset_site_features_cache();
		// The purchases lookup, which follows a missing feature, finds nothing.
		add_filter( 'pre_http_request', array( $this, 'fail_http_request' ) );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		remove_filter( 'pre_http_request', array( $this, 'fail_http_request' ) );
		Product::reset_site_features_cache();
		Constants::clear_constants();
		StatusCache::clear();
		WorDBless_Options::init()->clear_options();
	}

	/**
	 * Fails every outbound HTTP request.
	 *
	 * @return WP_Error
	 */
	public function fail_http_request() {
		return new WP_Error( 'http_request_failed', 'Simulated WPCOM failure.' );
	}

	/**
	 * On WordPress.com `akismet` pays for Anti-spam; elsewhere only `antispam` or a purchase does.
	 *
	 * @dataProvider provide_site_features
	 *
	 * @param bool     $is_atomic Whether the site is WordPress.com Atomic.
	 * @param string[] $features  The site's active features.
	 * @param bool     $expected  Whether the site pays for Anti-spam.
	 */
	#[DataProvider( 'provide_site_features' )]
	public function test_has_paid_plan_for_product( $is_atomic, $features, $expected ) {
		if ( $is_atomic ) {
			Constants::set_constant( 'ATOMIC_SITE_ID', 123 );
			Constants::set_constant( 'ATOMIC_CLIENT_ID', 123 );
			Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', '/tmp/wpcomsh/wpcomsh.php' );
			StatusCache::clear();
		}
		set_transient(
			Product::MY_JETPACK_SITE_FEATURES_TRANSIENT_KEY,
			array(
				'active'    => $features,
				'available' => array(),
			)
		);

		$this->assertSame( $expected, Anti_Spam::has_paid_plan_for_product() );
	}

	/**
	 * Data provider for test_has_paid_plan_for_product.
	 *
	 * @return array[]
	 */
	public static function provide_site_features() {
		return array(
			'Atomic, akismet'       => array( true, array( 'akismet' ), true ),
			'Atomic, no features'   => array( true, array(), false ),
			'self-hosted, akismet'  => array( false, array( 'akismet' ), false ),
			'self-hosted, antispam' => array( false, array( 'antispam' ), true ),
		);
	}
}
