<?php
/**
 * BlocklogManager test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\Waf_Blocklog_Manager;

/**
 * BlocklogManager test suite.
 */
final class WafBlocklogManagerTest extends PHPUnit\Framework\TestCase {
	/**
	 * Test calling the log function and check if a file is written.
	 *
	 * @runInSeparateProcess
	 */
	public function testWriteBlocklog() {
		$tmp_dir      = sys_get_temp_dir();
		$waf_log_path = $tmp_dir . '/waf-blocklog';

		define( 'JETPACK_WAF_DIR', $tmp_dir );
		define( 'JETPACK_WAF_WPCONFIG', $tmp_dir . '/wp-config.php' );
		define( 'JETPACK_WAF_SHARE_DATA', true );

		// Create a partial mock of Waf_Blocklog_Manager to mock update_daily_summary method
		$mock = $this->getMockBuilder( Waf_Blocklog_Manager::class )
			->onlyMethods( array( 'update_daily_summary' ) )
			->getMock();

		// Configure the mock to do nothing when update_daily_summary is called
		$mock->expects( $this->once() )
			->method( 'update_daily_summary' )
			->with()
			->willReturn( null );

		$mock->write_blocklog( 1337, 'test block' );
		$file_content = file_get_contents( $waf_log_path );

		$this->assertTrue( file_exists( $waf_log_path ) );
		$this->assertTrue( strpos( $file_content, '{"rule_id":1337,"reason":"test block"' ) !== true );

		unlink( $waf_log_path );
	}
}
