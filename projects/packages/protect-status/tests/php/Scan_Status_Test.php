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
				(object) array(
					'id'             => '69353715',
					'signature'      => 'database_malicious_redirect_wpcode_001',
					'description'    => 'Jetpack has identified a malicious redirect in the database.',
					'first_detected' => '2023-06-23T18:42:29.000Z',
					'severity'       => 2,
					'status'         => 'current',
					'fixable'        => false,
					'table'          => 'wp_options',
					'pk_column'      => 'option_id',
					'value'          => '7062',
					'details'        => (object) array(
						'option_value' => 'unset($value->response[$_insert-headers-and-footers/ihaf.php\r\n\r\nand other stuff',
					),
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
				'num_threats'         => 4,
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
					new Threat_Model(
						array(
							'id'             => '69353715',
							'signature'      => 'database_malicious_redirect_wpcode_001',
							'description'    => 'Jetpack has identified a malicious redirect in the database.',
							'first_detected' => '2023-06-23T18:42:29.000Z',
							'severity'       => 2,
							'fixable'        => null,
							'status'         => 'current',
							'table'          => 'wp_options',
							'details'        => (object) array(
								'table'     => 'wp_options',
								'pk_column' => 'option_id',
								'pk_value'  => '7062',
								'details'   => (object) array(
									'option_value' => 'unset($value->response[$_insert-headers-and-footers/ihaf.php\r\n\r\nand other stuff',
								),
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
										'extension'      => new Extension_Model(
											array(
												'type'    => 'plugin',
												'slug'    => 'woocommerce',
												'name'    => 'WooCommerce',
												'version' => '3.0.0',
												'checked' => null,
											)
										),
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
				'database'            => array(
					new Threat_Model(
						array(
							'id'             => '69353715',
							'signature'      => 'database_malicious_redirect_wpcode_001',
							'description'    => 'Jetpack has identified a malicious redirect in the database.',
							'first_detected' => '2023-06-23T18:42:29.000Z',
							'severity'       => 2,
							'fixable'        => null,
							'status'         => 'current',
							'table'          => 'wp_options',
							'details'        => (object) array(
								'table'     => 'wp_options',
								'pk_column' => 'option_id',
								'pk_value'  => '7062',
								'details'   => (object) array(
									'option_value' => 'unset($value->response[$_insert-headers-and-footers/ihaf.php\r\n\r\nand other stuff',
								),
							),
						)
					),
				),
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
			'body'     => wp_json_encode( $this->get_sample_response(), JSON_UNESCAPED_SLASHES ),
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
			'body'     => wp_json_encode( static::get_sample_empty_response(), JSON_UNESCAPED_SLASHES ),
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
			'body'     => wp_json_encode( 'error', JSON_UNESCAPED_SLASHES ),
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
	 * Test that an expired status is fetched once, while other requests serve the stored one.
	 *
	 * @param string $lock              The lock row: free, held by another request, or stale.
	 * @param bool   $refreshed         Whether another request stored a fresh status after this one loaded its options.
	 * @param bool   $has_stored_status Whether this request loaded a stored status at boot.
	 * @param int    $expected_fetches  How many times WordPress.com should be asked.
	 *
	 * @dataProvider concurrent_refresh_data
	 */
	#[DataProvider( 'concurrent_refresh_data' )]
	public function test_get_status_while_another_request_refreshes( $lock, $refreshed, $has_stored_status, $expected_fetches ) {
		global $wpdb;

		$this->mock_connection();
		if ( $has_stored_status ) {
			update_option( Scan_Status::OPTION_NAME, maybe_serialize( $this->get_sample_response() ) );
		}
		update_option( Scan_Status::OPTION_TIMESTAMP_NAME, time() - 1 );

		$fetches = 0;
		$count   = function ( $response ) use ( &$fetches ) {
			++$fetches;
			return $response;
		};
		add_filter( 'pre_http_request', $count, 20 );

		// No real database here, so stand in one holding what the other request wrote.
		$original_wpdb = $wpdb;
		$wpdb          = new class( $lock, $refreshed ? serialize( maybe_serialize( $this->get_sample_response() ) ) : null ) extends \Db_Less_Wpdb { // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited, WordPress.PHP.DiscouragedPHPFunctions.serialize_serialize
			/**
			 * The lock row.
			 *
			 * @var string
			 */
			private $lock;

			/**
			 * The status row as stored, when another request refreshed it.
			 *
			 * @var string|null
			 */
			private $refreshed_row;

			/**
			 * Lock values this request deleted.
			 *
			 * @var string[]
			 */
			public $released = array();

			/**
			 * Constructor.
			 *
			 * @param string      $lock          The lock row.
			 * @param string|null $refreshed_row The status row as stored.
			 */
			public function __construct( $lock, $refreshed_row ) {
				parent::__construct();
				$this->lock          = $lock;
				$this->refreshed_row = $refreshed_row;
			}

			/**
			 * Answer the lock queries.
			 *
			 * @param string $query The SQL query.
			 * @return int|bool
			 */
			public function query( $query ) {
				if ( false === strpos( $query, Scan_Status::REFRESH_LOCK_NAME ) ) {
					return parent::query( $query );
				}
				if ( 0 === strpos( $query, 'INSERT' ) ) {
					return 'free' === $this->lock ? 1 : 0;
				}
				return 'stale' === $this->lock ? 1 : 0;
			}

			/**
			 * Return the status rows another request stored.
			 *
			 * @param string|null $query  The SQL query.
			 * @param string      $output Output type.
			 * @return array
			 */
			public function get_results( $query = null, $output = OBJECT ) {
				if ( false === strpos( (string) $query, Scan_Status::OPTION_TIMESTAMP_NAME ) ) {
					return parent::get_results( $query, $output );
				}
				if ( null === $this->refreshed_row ) {
					return array();
				}
				return array(
					Scan_Status::OPTION_NAME           => (object) array( 'option_value' => $this->refreshed_row ),
					Scan_Status::OPTION_TIMESTAMP_NAME => (object) array( 'option_value' => (string) ( time() + 60 ) ),
				);
			}

			/**
			 * Record a released lock.
			 *
			 * @param string       $table        Table name.
			 * @param array        $where        Columns to match.
			 * @param array|string $where_format Formats.
			 * @return int|false
			 */
			public function delete( $table, $where, $where_format = null ) {
				if ( isset( $where['option_name'] ) && Scan_Status::REFRESH_LOCK_NAME === $where['option_name'] ) {
					$this->released[] = $where['option_value'];
					return 1;
				}
				return parent::delete( $table, $where, $where_format );
			}
		};
		$wpdb->set_prefix( $original_wpdb->base_prefix );

		$status   = null;
		$released = array();
		try {
			$status   = Scan_Status::get_status();
			$released = $wpdb->released;
		} finally {
			$wpdb = $original_wpdb; // phpcs:ignore WordPress.WP.GlobalVariablesOverride.Prohibited
			remove_filter( 'pre_http_request', $count, 20 );
		}

		$this->assertSame( $expected_fetches, $fetches );
		$this->assertEquals( static::get_sample_status(), $status );
		$this->assertCount( 'held' === $lock ? 0 : 1, $released, 'Only a lock this request took is released.' );
	}

	/**
	 * Data provider for test_get_status_while_another_request_refreshes
	 */
	public static function concurrent_refresh_data() {
		return array(
			'lock held, stored status served'    => array( 'held', false, true, 0 ),
			'lock held, nothing stored, fetched' => array( 'held', false, false, 1 ),
			'lock taken after another refresh'   => array( 'free', true, false, 0 ),
			'lock taken, still expired, fetched' => array( 'free', false, true, 1 ),
			'stale lock taken over, fetched'     => array( 'stale', false, true, 1 ),
		);
	}

	/**
	 * A failed most recent scan is flagged, and the threats from earlier scans are kept.
	 */
	public function test_get_status_flags_failed_scan() {
		$this->mock_connection();
		$response                     = $this->get_sample_response();
		$response->most_recent->error = true;
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		$failed_response = function () use ( $response ) {
			return array(
				'body'     => wp_json_encode( $response, JSON_UNESCAPED_SLASHES ),
				'response' => array( 'code' => 200 ),
			);
		};
		add_filter( 'pre_http_request', $failed_response );

		$status = Scan_Status::get_status();
		remove_filter( 'pre_http_request', $failed_response );

		$this->assertTrue( $status->last_scan_failed );
		$this->assertCount( 4, $status->threats );
		$this->assertTrue( Scan_Status::get_cached_status()->last_scan_failed );
	}

	/**
	 * Keep a flagged extension visible until it reaches the update fixer's target.
	 *
	 * @param string      $plugin_version The installed WooCommerce version.
	 * @param string      $theme_version  The installed theme version.
	 * @param array       $listed         The extension threats still listed.
	 * @param string|null $fixed_in       The fixed version reported by the Scan API.
	 * @param string|null $update_target  The plugin's update target, or null for a delete fixer.
	 * @dataProvider updated_extension_data
	 */
	#[DataProvider( 'updated_extension_data' )]
	public function test_get_status_after_extension_update( $plugin_version, $theme_version, $listed, $fixed_in = null, $update_target = '3.0.2' ) {
		$this->mock_connection();
		$update   = function ( $target ) {
			return (object) array(
				'fixer'  => 'update',
				'target' => $target,
			);
		};
		$response = $this->get_sample_response();

		$response->threats[1]->fixer = null === $update_target ? (object) array( 'fixer' => 'delete' ) : $update( $update_target );
		if ( null !== $fixed_in ) {
			$response->threats[1]->fixed_in = $fixed_in;
		}
		$response->threats[] = (object) array(
			'id'        => 'malware',
			'signature' => 'PHP.Generic.Malware',
			'status'    => 'current',
			'fixer'     => $update( '3.0.2' ),
			'extension' => (object) array(
				'type'    => 'plugin',
				'slug'    => 'woocommerce',
				'version' => '3.0.0',
			),
		);
		$response->threats[] = (object) array(
			'id'        => 'theme',
			'signature' => 'Vulnerable.WP.Extension',
			'status'    => 'current',
			'fixer'     => $update( '1.0.3' ),
			'extension' => (object) array(
				'type'    => 'theme',
				'slug'    => 'theme-1',
				'version' => '1.0.2',
			),
		);
		$filters             = array(
			'pre_http_request'                 => function () use ( $response ) {
				return array(
					'body'     => wp_json_encode( $response, JSON_UNESCAPED_SLASHES ),
					'response' => array( 'code' => 200 ),
				);
			},
			'all_plugins'                      => function () use ( $plugin_version ) {
				return array(
					'woocommerce' => array(
						'Name'    => 'Woocommerce',
						'Version' => $plugin_version,
					),
				);
			},
			'jetpack_sync_get_themes_callable' => function () use ( $theme_version ) {
				return array(
					'theme-1' => array(
						'Name'    => 'Sample Theme',
						'Version' => $theme_version,
					),
				);
			},
		);
		foreach ( $filters as $hook => $filter ) {
			add_filter( $hook, $filter, 11 );
		}

		$threats = array_column( Scan_Status::get_status()->threats, null, 'id' );
		foreach ( $filters as $hook => $filter ) {
			remove_filter( $hook, $filter, 11 );
		}

		$this->assertEqualsCanonicalizing( $listed, array_values( array_intersect( array_map( 'strval', array_keys( $threats ) ), array( '71625245', 'malware', 'theme' ) ) ) );
		if ( isset( $threats['71625245'] ) ) {
			$this->assertSame( $fixed_in ?? ( '0' !== $update_target ? $update_target : null ), $threats['71625245']->fixed_in );
		}
	}

	/**
	 * Data provider for test_get_status_after_extension_update
	 */
	public static function updated_extension_data() {
		return array(
			'still below the fix'                   => array( '3.0.1', '1.0.2', array( '71625245', 'malware', 'theme' ) ),
			'a rollback'                            => array( '2.9', '1.0.2', array( '71625245', 'malware', 'theme' ) ),
			'plugin at the fix'                     => array( '3.0.2', '1.0.2', array( 'malware', 'theme' ) ),
			'plugin past the fix'                   => array( '3.1', '1.0.2', array( 'malware', 'theme' ) ),
			'theme at the fix'                      => array( '3.0.0', '1.0.3', array( '71625245', 'malware' ) ),
			'update target above the fixed version' => array( '3.0.1', '1.0.2', array( '71625245', 'malware', 'theme' ), '3.0.1' ),
			'delete fixer at the fixed version'     => array( '3.0.1', '1.0.2', array( '71625245', 'malware', 'theme' ), '3.0.1', null ),
			'zero update target'                    => array( '3.0.1', '1.0.2', array( '71625245', 'malware', 'theme' ), null, '0' ),
		);
	}

	/**
	 * Test that a threat with no severity sorts between Low and High.
	 */
	public function test_sort_threats_puts_unrated_between_low_and_high() {
		$threats = array_map(
			function ( $severity ) {
				return new Threat_Model(
					array(
						'id'             => (string) $severity,
						'status'         => 'current',
						'severity'       => $severity,
						'first_detected' => '2024-01-01T00:00:00.000Z',
					)
				);
			},
			array( 2, null, 3 )
		);
		$sort    = new \ReflectionMethod( Scan_Status::class, 'sort_threats' );
		if ( PHP_VERSION_ID < 80100 ) {
			$sort->setAccessible( true );
		}

		$sorted = $sort->invoke( null, $threats );
		$this->assertSame( array( 3, null, 2 ), array_column( $sorted, 'severity' ) );
	}

	/**
	 * Test get total threats
	 */
	public function test_get_total_threats() {
		$this->mock_connection();

		$this->assertSame( 4, Scan_Status::get_total_threats() );
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
