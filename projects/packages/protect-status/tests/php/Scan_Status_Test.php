<?php
/**
 * Tests for the Protect Scan_Status class.
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Protect_Models\Extension_Model;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Models\Threat_Model;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * Tests for the Protect Scan_Status class.
 */
class Scan_Status_Test extends BaseTestCase {

	/**
	 * Set up before each test
	 */
	protected function set_up() {
		Scan_Status::$status = null;
		$this->mock_data();
	}

	/**
	 * Tear down after each test
	 */
	protected function tear_down() {
		$this->teardown_mock_data();
	}

	/**
	 * Mock site connection
	 */
	public function mock_connection() {
		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );

		// Since this uses WorDBless, our typical invalidation on option update does not work, so invalidate manually
		$manager = new \Automattic\Jetpack\Connection\Manager();
		$manager->reset_connection_status();
	}

	/**
	 * Mock data for tests
	 */
	public function mock_data() {
		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		add_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		add_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );
	}

	/**
	 * Tear down mock data
	 */
	public function teardown_mock_data() {
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		remove_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		remove_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );
	}

	/**
	 * Get a sample empty response
	 *
	 * @return object
	 */
	public static function get_sample_empty_response() {
		return new Status_Model(
			array(
				'last_checked' => '',
			)
		);
	}

	/**
	 * Get a sample invalid response
	 *
	 * @return string
	 */
	public static function get_sample_invalid_response() {
		return 'Invalid response';
	}

	/**
	 * Get a sample response
	 *
	 * @return object
	 */
	public function get_sample_response() {
		return (object) array(
			'state'       => 'idle',
			'threats'     => array(
				(object) array(
					'id'             => '71626681',
					'signature'      => 'EICAR_AV_Test_Critical',
					'description'    => 'This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don\'t expect it to, contact Jetpack support for some help.',
					'first_detected' => '2022-07-27T17 => 49 => 35.000Z',
					'severity'       => 5,
					'fixer'          => null,
					'status'         => 'current',
					'fixable'        => null,
					'filename'       => '/var/www/html/wp-content/uploads/jptt_eicar.php',
					'context'        => (object) array(
						'15'    => 'echo <<',
						'17'    => 'HTML;',
						'marks' => new \stdClass(),
					),
				),
				(object) array(
					'id'             => '71625245',
					'signature'      => 'Vulnerable.WP.Extension',
					'description'    => 'The plugin WooCommerce (version 3.0.0) has a known vulnerability. ',
					'first_detected' => '2022-07-27T17:22:16.000Z',
					'severity'       => 3,
					'fixer'          => null,
					'status'         => 'current',
					'fixable'        => null,
					'extension'      => (object) array(
						'type'      => 'plugin',
						'slug'      => 'woocommerce',
						'name'      => 'WooCommerce',
						'version'   => '3.0.0',
						'isPremium' => false,
					),
					'source'         => 'https://wpvulndb.com/vulnerabilities/10220',
				),
				(object) array(
					'id'             => '69353714',
					'signature'      => 'Core.File.Modification',
					'description'    => 'Core WordPress files are not normally changed. If you did not make these changes you should review the code.',
					'first_detected' => '2022-06-23T18:42:29.000Z',
					'severity'       => 4,
					'status'         => 'current',
					'fixable'        => (object) array(
						'fixer'           => 'replace',
						'file'            => '/var/www/html/wp-admin/index.php',
						'extensionStatus' => '',
					),
					'fixer'          => (object) array(
						'fixer'           => 'replace',
						'file'            => '/var/www/html/wp-admin/index.php',
						'extensionStatus' => '',
					),
					'filename'       => '/var/www/html/wp-admin/index.php',
					'diff'           => "--- /tmp/wordpress/6.0-en_US/wordpress/wp-admin/index.php\t2021-11-03 03:16:57.000000000 +0000\n+++ /tmp/6299071296/core-file-23271BW6i4wLCe3T7\t2022-06-23 18:42:29.087377846 +0000\n@@ -209,3 +209,4 @@\n wp_print_community_events_templates();\n \n require_once ABSPATH . 'wp-admin/admin-footer.php';\n+if ( true === false ) exit();\n\\ No newline at end of file\n",
				),
			),
			'has_cloud'   => true,
			'credentials' => array(),
			'most_recent' => (object) array(
				'is_initial' => false,
				'timestamp'  => '2003-03-03T03:03:03+00:00',
			),
		);
	}

	/**
	 * Get a sample result of Scan_Status::get_status().
	 *
	 * @return object
	 */
	public static function get_sample_status() {
		global $wp_version;

		return new Status_Model(
			array(
				'data_source'         => 'scan_api',
				'last_checked'        => '2003-03-03 03:03:03',
				'num_threats'         => 3,
				'num_plugins_threats' => 1,
				'num_themes_threats'  => 0,
				'status'              => 'idle',
				'threats'             => array(
					new Threat_Model(
						array(
							'id'             => '71626681',
							'signature'      => 'EICAR_AV_Test_Critical',
							'description'    => 'This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don\'t expect it to, contact Jetpack support for some help.',
							'first_detected' => '2022-07-27T17 => 49 => 35.000Z',
							'severity'       => 5,
							'fixer'          => null,
							'status'         => 'current',
							'filename'       => '/var/www/html/wp-content/uploads/jptt_eicar.php',
							'context'        => (object) array(
								'15'    => 'echo <<',
								'17'    => 'HTML;',
								'marks' => new \stdClass(),
							),
						)
					),
					new Threat_Model(
						array(
							'id'             => '69353714',
							'signature'      => 'Core.File.Modification',
							'description'    => 'Core WordPress files are not normally changed. If you did not make these changes you should review the code.',
							'first_detected' => '2022-06-23T18:42:29.000Z',
							'severity'       => 4,
							'status'         => 'current',
							'fixable'        => (object) array(
								'fixer'           => 'replace',
								'file'            => '/var/www/html/wp-admin/index.php',
								'extensionStatus' => '',
							),
							'filename'       => '/var/www/html/wp-admin/index.php',
							'diff'           => "--- /tmp/wordpress/6.0-en_US/wordpress/wp-admin/index.php\t2021-11-03 03:16:57.000000000 +0000\n+++ /tmp/6299071296/core-file-23271BW6i4wLCe3T7\t2022-06-23 18:42:29.087377846 +0000\n@@ -209,3 +209,4 @@\n wp_print_community_events_templates();\n \n require_once ABSPATH . 'wp-admin/admin-footer.php';\n+if ( true === false ) exit();\n\\ No newline at end of file\n",
						)
					),
					new Threat_Model(
						array(
							'id'             => '71625245',
							'signature'      => 'Vulnerable.WP.Extension',
							'description'    => 'The plugin WooCommerce (version 3.0.0) has a known vulnerability. ',
							'first_detected' => '2022-07-27T17:22:16.000Z',
							'severity'       => 3,
							'fixable'        => null,
							'status'         => 'current',
							'source'         => 'https://wpvulndb.com/vulnerabilities/10220',
							'extension'      => new Extension_Model(
								array(
									'type'    => 'plugins',
									'slug'    => 'woocommerce',
									'name'    => 'WooCommerce',
									'version' => '3.0.0',
									'checked' => true,
								)
							),
						)
					),
				),
				'fixable_threat_ids'  => array( '69353714' ),
				'plugins'             => array(
					new Extension_Model(
						array(
							'name'    => 'Woocommerce',
							'slug'    => 'woocommerce',
							'version' => '3.0.0',
							'type'    => 'plugins',
							'checked' => true,
							'threats' => array(
								new Threat_Model(
									array(
										'id'             => '71625245',
										'signature'      => 'Vulnerable.WP.Extension',
										'description'    => 'The plugin WooCommerce (version 3.0.0) has a known vulnerability. ',
										'first_detected' => '2022-07-27T17:22:16.000Z',
										'severity'       => 3,
										'fixable'        => null,
										'status'         => 'current',
										'source'         => 'https://wpvulndb.com/vulnerabilities/10220',
									)
								),
							),
						)
					),
				),
				'themes'              => array(
					new Extension_Model(
						array(
							'name'    => 'Sample Theme',
							'slug'    => 'theme-1',
							'version' => '1.0.2',
							'type'    => 'themes',
							'threats' => array(),
							'checked' => true,
						)
					),
				),
				'core'                => new Extension_Model(
					array(
						'version' => $wp_version,
						'threats' => array(),
						'checked' => true,
						'name'    => 'WordPress',
						'slug'    => 'wordpress',
						'type'    => 'core',
					)
				),
				'files'               => array(
					new Threat_Model(
						array(
							'id'             => '71626681',
							'signature'      => 'EICAR_AV_Test_Critical',
							'description'    => 'This is the standard EICAR antivirus test code, and not a real infection. If your site contains this code when you don\'t expect it to, contact Jetpack support for some help.',
							'first_detected' => '2022-07-27T17 => 49 => 35.000Z',
							'severity'       => 5,
							'fixer'          => null,
							'status'         => 'current',
							'filename'       => '/var/www/html/wp-content/uploads/jptt_eicar.php',
							'context'        => (object) array(
								'15'    => 'echo <<',
								'17'    => 'HTML;',
								'marks' => new \stdClass(),
							),
						)
					),
					new Threat_Model(
						array(
							'id'             => '69353714',
							'signature'      => 'Core.File.Modification',
							'description'    => 'Core WordPress files are not normally changed. If you did not make these changes you should review the code.',
							'first_detected' => '2022-06-23T18:42:29.000Z',
							'severity'       => 4,
							'status'         => 'current',
							'fixable'        => (object) array(
								'fixer'           => 'replace',
								'file'            => '/var/www/html/wp-admin/index.php',
								'extensionStatus' => '',
							),
							'filename'       => '/var/www/html/wp-admin/index.php',
							'diff'           => "--- /tmp/wordpress/6.0-en_US/wordpress/wp-admin/index.php\t2021-11-03 03:16:57.000000000 +0000\n+++ /tmp/6299071296/core-file-23271BW6i4wLCe3T7\t2022-06-23 18:42:29.087377846 +0000\n@@ -209,3 +209,4 @@\n wp_print_community_events_templates();\n \n require_once ABSPATH . 'wp-admin/admin-footer.php';\n+if ( true === false ) exit();\n\\ No newline at end of file\n",
						)
					),
				),
				'database'            => array(),
				'has_unchecked_items' => false,
			)
		);
	}

	/**
	 * Return a sample wpcom status response.
	 *
	 * @return array
	 */
	public function return_sample_response() {
		return array(
			'body'     => wp_json_encode( $this->get_sample_response() ),
			'response' => array(
				'code'    => 200,
				'message' => '',
			),
		);
	}

	/**
	 * Return an array of sample plugins.
	 *
	 * @return array
	 */
	public function return_sample_plugins() {
		return array(
			'woocommerce' => array(
				'Name'    => 'Woocommerce',
				'Version' => '3.0.0',
			),
		);
	}

	/**
	 * Return an array of sample themes.
	 *
	 * @return array
	 */
	public function return_sample_themes() {
		return array(
			'theme-1' => array(
				'Name'    => 'Sample Theme',
				'Version' => '1.0.2',
			),
		);
	}

	/**
	 * Return a sample empty status.
	 *
	 * @return array
	 */
	public function return_sample_empty_response() {
		return array(
			'body'     => wp_json_encode( static::get_sample_empty_response() ),
			'response' => array(
				'code'    => 200,
				'message' => '',
			),
		);
	}

	/**
	 * Return a sample error status.
	 *
	 * @return array
	 */
	public function return_sample_error_response() {
		return array(
			'body'     => wp_json_encode( 'error' ),
			'response' => array(
				'code'    => 400,
				'message' => '',
			),
		);
	}

	/**
	 * Test while site is not connected
	 */
	public function test_get_status_not_connected() {
		$status = Scan_Status::get_status();

		$this->assertSame( 'site_not_connected', $status->error_code );

		// Make sure this was not cached
		$this->assertFalse( Scan_Status::get_from_options() );
	}

	/**
	 * Test get status
	 */
	public function test_get_status() {
		$this->mock_connection();

		$status = Scan_Status::get_status();

		$this->assertEquals( static::get_sample_status(), $status );

		// Make sure this was cached
		$this->assertEquals( $this->get_sample_response(), Scan_Status::get_from_options() );
	}

	/**
	 * Test get total threats
	 */
	public function test_get_total_threats() {
		$this->mock_connection();

		$this->assertSame( 3, Scan_Status::get_total_threats() );
	}

	/**
	 * Test get all threats
	 */
	public function test_get_all_threats() {
		$this->mock_connection();

		$this->assertEquals( static::get_sample_status()->threats, Scan_Status::get_all_threats() );
	}

	/**
	 * Data provider for test_is_cache_expired
	 */
	public static function is_cache_expired_data() {
		return array(
			'empty'         => array( true, null ),
			'one sec ago'   => array( true, time() - 1 ),
			'one min ahead' => array( false, time() + 60 ),
		);
	}

	/**
	 * Tests is_cache_expired
	 *
	 * @param bool $expected the expected result.
	 * @param int  $cache_timestamp The cache timestamp.
	 * @dataProvider is_cache_expired_data
	 */
	#[DataProvider( 'is_cache_expired_data' )]
	public function test_is_cache_expired( $expected, $cache_timestamp ) {
		update_option( Scan_Status::OPTION_TIMESTAMP_NAME, $cache_timestamp );
		$this->assertSame( $expected, Scan_Status::is_cache_expired() );
	}

	/**
	 * Data provider for test_get_cache_end_date_by_status
	 */
	public static function get_cache_end_date_by_status_data() {
		return array(
			'null'    => array(
				'initial',
				null,
			),
			'empty'   => array(
				'initial',
				static::get_sample_empty_response(),
			),
			'invalid' => array(
				'initial',
				static::get_sample_invalid_response(),
			),
			'full'    => array(
				'full',
				static::get_sample_status(),
			),
		);
	}

	/**
	 * Tests get_cache_end_date_by_status
	 *
	 * @param bool $check_type Type of assertion to be made.
	 * @param int  $status The status object.
	 * @dataProvider get_cache_end_date_by_status_data
	 */
	#[DataProvider( 'get_cache_end_date_by_status_data' )]
	public function test_get_cache_end_date_by_status( $check_type, $status ) {
		$timestamp = Scan_Status::get_cache_end_date_by_status( $status );
		if ( ! is_object( $status ) || 'initial' === $check_type ) {
			$this->assertSame( time() + Scan_Status::INITIAL_OPTION_EXPIRES_AFTER, $timestamp );
		}
		if ( is_object( $status ) && 'full' === $check_type ) {
			$this->assertSame( time() + Scan_Status::OPTION_EXPIRES_AFTER, $timestamp );
		}
	}
}
