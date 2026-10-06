<?php

namespace Automattic\Jetpack_Boost\Tests\Lib\Minify;

use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

if ( ! defined( 'JETPACK_BOOST_DIR_PATH' ) ) {
	define( 'JETPACK_BOOST_DIR_PATH', dirname( __DIR__, 4 ) );
}
require_once JETPACK_BOOST_DIR_PATH . '/app/lib/minify/loader.php';

class Cache_Bust_Mtime_Test extends BaseTestCase {

	/**
	 * @dataProvider provide_site_urls
	 */
	#[DataProvider( 'provide_site_urls' )]
	public function test_absolute_path_keeps_site_origin( $siteurl, $expected ) {
		$this->assertSame(
			$expected,
			jetpack_boost_page_optimize_cache_bust_mtime( '/wp-content/missing.js', $siteurl )
		);
	}

	public static function provide_site_urls() {
		return array(
			'port and subdirectory' => array( 'http://localhost:8888/blog', 'http://localhost:8888/wp-content/missing.js' ),
			'default port'          => array( 'https://example.com/blog', 'https://example.com/wp-content/missing.js' ),
		);
	}
}
