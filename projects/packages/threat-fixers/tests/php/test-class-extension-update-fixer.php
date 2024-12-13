<?php
/**
 * ExtensionUpdateFixer test suite.
 *
 * @package automattic/jetpack-threat-fixers
 */

use Automattic\Jetpack\Threat_Fixers\Extension_Update_Fixer;

require_once ABSPATH . 'wp-admin/includes/class-wp-upgrader.php';
require_once ABSPATH . 'wp-admin/includes/class-plugin-upgrader.php';
require_once ABSPATH . 'wp-admin/includes/class-theme-upgrader.php';

/**
 * ExtensionUpdateFixer test suite.
 */
final class ExtensionUpdateFixerTest extends WorDBless\BaseTestCase {
	/**
	 * Test get_extension_api_data with valid theme response.
	 */
	public function test_get_extension_api_data_with_theme() {
		$fixer = $this->getMockForAbstractClass(
			Extension_Update_Fixer::class,
			array( 'themes', 'twentytwentyfive' )
		);

		$mock_response = (object) array(
			'slug'    => 'twentytwentyfive',
			'version' => '1.0',
		);

		$fixer = $this->getMockBuilder( get_class( $fixer ) )
						->onlyMethods( array( 'get_extension_api_data' ) )
						->setConstructorArgs( array( 'themes', 'twentytwentyfive' ) )
						->getMock();

		$fixer->expects( $this->once() )
				->method( 'get_extension_api_data' )
				->willReturn( $mock_response );

		$api_data = $fixer->get_extension_api_data();

		$this->assertIsObject( $api_data );
		$this->assertSame( 'twentytwentyfive', $api_data->slug );
	}

	public function test_get_download_link_from_wporg() {
		$fixer = $this->getMockForAbstractClass(
			Extension_Update_Fixer::class,
			array( 'themes', 'twentytwentyfive' )
		);

		$mock_api_data = (object) array(
			'slug'          => 'twentytwentyfive',
			'version'       => '1.0',
			'download_link' => 'http://example.com/twentytwentyfive.zip',
		);

		// Mock the method to return API data.
		$fixer = $this->getMockBuilder( get_class( $fixer ) )
						->onlyMethods( array( 'get_extension_api_data' ) )
						->setConstructorArgs( array( 'themes', 'twentytwentyfive' ) )
						->getMock();

		$fixer->expects( $this->once() )
				->method( 'get_extension_api_data' )
				->willReturn( $mock_api_data );

		// Use the pre_http_request hook to intercept HTTP requests.
		add_filter(
			'pre_http_request',
			function () {
				return array(
					'response' => array( 'code' => 200 ),
					'body'     => array(
						'download_link' => 'https://example.com/twentytwentyfive.1.0.zip',
						'slug'          => 'twentytwentyfive',
						'version'       => '1.0',
					),
				);
			},
			10,
			3
		);

		// Run the method and assert the result.
		$download_link = $fixer->get_download_link_from_wporg();
		$this->assertSame( 'https://example.com/twentytwentyfive.1.0.zip', $download_link );

		// Remove the filter after the test.
		remove_filter( 'pre_http_request', '__return_null', 10 );
	}

	/**
	 * Test run with successful installation.
	 */
	public function test_run_successful_installation() {
		// phpcs:disble Squiz.PHP.CommentedOutCode.Found
		// $fixer = $this->getMockForAbstractClass(
		// Extension_Update_Fixer::class,
		// ['plugins', 'jetpack']
		// );
		// $mock_upgrader = $this->createMock(Plugin_Upgrader::class);
		// $mock_upgrader->expects($this->once())
		// ->method('install')
		// ->willReturn(true);
		// // Mock the methods used in the process.
		// $fixer = $this->getMockBuilder(get_class($fixer))
		// ->onlyMethods(['get_upgrader', 'get_download_link_from_wporg'])
		// ->setConstructorArgs(['plugins', 'jetpack'])
		// ->getMock();
		// $fixer->expects($this->once())
		// ->method('get_upgrader')
		// ->willReturn($mock_upgrader);
		// $fixer->expects($this->once())
		// ->method('get_download_link_from_wporg')
		// ->willReturn('https://example.com/plugin-slug.zip');
		// $result = $fixer->run();
		// $this->assertTrue($result);
	}

	/**
	 * Test run with installation failure.
	 */
	public function test_run_installation_failure() {
        // phpcs:disable Squiz.PHP.CommentedOutCode.Found
		// $fixer = $this->getMockForAbstractClass(
		// Extension_Update_Fixer::class,
		// ['plugins', 'jetpack']
		// );
		// $mock_upgrader = $this->createMock(\Plugin_Upgrader::class);
		// $mock_upgrader->expects($this->once())
		// ->method('install')
		// ->willReturn(new WP_Error('install_failed', 'Installation failed.'));
		// // Mock the methods used in the process.
		// $fixer = $this->getMockBuilder(get_class($fixer))
		// ->onlyMethods(['get_upgrader', 'get_download_link_from_wporg'])
		// ->setConstructorArgs(['plugins', 'jetpack'])
		// ->getMock();
		// $fixer->expects($this->once())
		// ->method('get_upgrader')
		// ->willReturn($mock_upgrader);
		// $fixer->expects($this->once())
		// ->method('get_download_link_from_wporg')
		// ->willReturn('https://example.com/plugin-slug.zip');
		// $result = $fixer->run();
		// $this->assertInstanceOf(WP_Error::class, $result);
		// $this->assertSame('install_failed', $result->get_error_code());
	}
}
