<?php //phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Test critical CSS
 */

namespace Automattic\Jetpack_Boost\Tests\Modules\Critical_CSS;

use Automattic\Jetpack_Boost\Modules\Critical_CSS\Critical_CSS;
use Automattic\Jetpack_Boost\Tests\Base_Test_Case;
use Brain\Monkey\Functions;

/**
 * Class WP_Test_Critical_Css
 *
 * @package Automattic\Jetpack_Boost\Tests\Modules\Critical_CSS
 */
class WP_Test_Critical_Css extends Base_Test_Case {

	/**
	 * Test on_initialize
	 */
	public function test_css_proxied_urls() {
		$proxied_url = 'http://example.com/proxied-url';

		Functions\stubs(
			array(
				'wp_parse_url'    => function ( $url ) {
					// phpcs:ignore
					return parse_url( $url );
				},
				'wp_create_nonce' => 'foo',
				'sanitize_key'    => 'foo',
				'add_query_arg'   => $proxied_url,
				'home_url'        => 'http://localhost',
			)
		);

		// phpcs:ignore
		$GLOBALS['wp'] = (object) array( 'request' => null );

		$module               = new Critical_CSS();
		$_SERVER['HTTP_HOST'] = 'localhost';

		// Test relative url.
		$this->assertEquals( 'style.css', $module->force_proxied_css( 'style.css' ) );

		// Test without port.
		$this->assertEquals( 'http://localhost/style.css', $module->force_proxied_css( 'http://localhost/style.css' ) );
		$this->assertEquals( $proxied_url, $module->force_proxied_css( 'https://example.com/style.css' ) );

		// Test with port specified.
		$_SERVER['HTTP_HOST'] = 'localhost:8080';
		$this->assertEquals( 'http://localhost:8080/style.css', $module->force_proxied_css( 'http://localhost:8080/style.css' ) );
		$this->assertEquals( $proxied_url, $module->force_proxied_css( 'http://localhost/style.css' ) );
		$this->assertEquals( $proxied_url, $module->force_proxied_css( 'https://example.com/style.css' ) );
	}
}
