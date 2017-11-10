<?php
require dirname( __FILE__ ) . '/../../../../modules/asset-cdn.php';

class WP_Test_Asset_CDN extends WP_UnitTestCase {
	/**
	 * Test if likes are rendered correctly.
	 *
	 * @since 4.6.0
	 */
	public function test_runs() {
		$this->assertTrue( true );
	}
}