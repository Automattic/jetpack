<?php
/**
 * Standalone bootstrap test suite.
 *
 * @package automattic/jetpack-waf
 */

use Automattic\Jetpack\Waf\WafStandaloneBootstrap;

/**
 * Runtime test suite.
 */
final class WafStandaloneBootstrapTest extends PHPUnit\Framework\TestCase {

	/**
	 * Test guarding against running outside of WP context.
	 */
	public function testConstructingTheBootstrapWithoutAbspathConstantThrowsException() {
		$this->assertFalse( defined( 'ABSPATH' ) );
		$this->expectExceptionMessage( 'Cannot generate the WAF bootstrap if we are not running in WordPress context.' );
		new WafStandaloneBootstrap();
	}

	/**
	 * Test constructing the generator defined WAF constants if they are still missing.
	 *
	 * @runInSeparateProcess
	 */
	public function testConstructingTheBootstrapDefinesRequiredWafConstants() {
		define( 'ABSPATH', '/pseudo' );
		define( 'WP_CONTENT_DIR', '/pseudo/dir' );

		$this->assertFalse( defined( 'JETPACK_WAF_DIR' ) );
		$this->assertFalse( defined( 'JETPACK_WAF_WPCONFIG' ) );

		new WafStandaloneBootstrap();

		$this->assertSame( '/pseudo/dir/jetpack-waf', JETPACK_WAF_DIR );
		$this->assertSame( '/pseudo/wp-config.php', JETPACK_WAF_WPCONFIG );
	}

	/**
	 * Test throwing an exception if the filesystem is not initialized.
	 *
	 * @runInSeparateProcess
	 */
	public function testGenerateThrowsAnExceptionIfFilesystemIsNotInitialized() {
		define( 'ABSPATH', '/pseudo' );
		define( 'WP_CONTENT_DIR', '/pseudo/dir' );

		$mock_builder = $this->getMockBuilder( WafStandaloneBootstrap::class );
		$mock_builder->setMethods( array( 'initialize_filesystem' ) );

		$sut = $mock_builder->getMock();
		$this->expectExceptionMessage( 'Can not work without the file system being initialized.' );
		$sut->generate();
	}

	/**
	 * Test generating the bootstrap file successfully.
	 *
	 * @runInSeparateProcess
	 */
	public function testGenerateGeneratesTheBootstrapFileSuccessfully() {
		define( 'ABSPATH', '/awesome' );
		define( 'WP_CONTENT_DIR', '/awesome/dir' );

		$filesystem_mock_builder = $this->getMockBuilder( stdClass::class );
		$filesystem_mock_builder->setMethods( array( 'put_contents' ) );

		$filesystem_mock = $filesystem_mock_builder->getMock();

		$filesystem_mock->expects( $this->once() )
			->method( 'put_contents' )
			->with(
				'/awesome/dir/jetpack-waf/bootstrap.php',
				$this->callback(
					function ( $file_contents ) {
						return strpos( $file_contents, "define( 'JETPACK_WAF_MODE', 'mockModeOption' );" ) !== false
							&& strpos( $file_contents, "define( 'JETPACK_WAF_DIR', '/awesome/dir/jetpack-waf' );" ) !== false
							&& strpos( $file_contents, "define( 'JETPACK_WAF_WPCONFIG', '/awesome/wp-config.php' );" ) !== false
							// Checking the include path fuzzy because it will vary depending on the system that the test is executed on.
							&& preg_match( '/include.*run\.php/', $file_contents ) === 1;
					}
				)
			)
			->willReturn( true );

		add_test_option( 'jetpack_waf_mode', 'mockModeOption' );

		global $wp_filesystem;
		$wp_filesystem = $filesystem_mock;

		$mock_builder = $this->getMockBuilder( WafStandaloneBootstrap::class );
		$mock_builder->setMethods( array( 'initialize_filesystem' ) );

		$sut = $mock_builder->getMock();

		$sut->expects( $this->once() )->method( 'initialize_filesystem' );

		$bootstrap_path = $sut->generate();

		$this->assertSame( '/awesome/dir/jetpack-waf/bootstrap.php', $bootstrap_path );
	}

	/**
	 * Test not being able to write the bootstrap file throws an exception.
	 *
	 * @runInSeparateProcess
	 */
	public function testGenerateThrowsAnExceptionIfUnableToWriteBootstrapFile() {
		define( 'ABSPATH', '/foo' );
		define( 'WP_CONTENT_DIR', '/awesome/dir' );

		$filesystem_mock_builder = $this->getMockBuilder( stdClass::class );
		$filesystem_mock_builder->setMethods( array( 'put_contents' ) );

		$filesystem_mock = $filesystem_mock_builder->getMock();
		$filesystem_mock->expects( $this->once() )
			->method( 'put_contents' )
			->willReturn( false );

		add_test_option( 'jetpack_waf_mode', 'mockModeOption' );

		global $wp_filesystem;
		$wp_filesystem = $filesystem_mock;

		$mock_builder = $this->getMockBuilder( WafStandaloneBootstrap::class );
		$mock_builder->setMethods( array( 'initialize_filesystem' ) );

		$sut = $mock_builder->getMock();

		$this->expectExceptionMessage( 'Failed writing WAF standalone bootstrap file to: /awesome/dir/jetpack-waf/bootstrap.php' );
		$sut->generate();
	}

}
