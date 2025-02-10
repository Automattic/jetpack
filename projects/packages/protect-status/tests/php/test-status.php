<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Tests for the Protect_Status class.
 *
 * @package automattic/jetpack-protect-status
 */

namespace Automattic\Jetpack\Protect_Status;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Protect_Models\Extension_Model;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Models\Threat_Model;
use Automattic\Jetpack\Protect_Models\Vulnerability_Model;
use Jetpack_Options;
use WorDBless\BaseTestCase;

/**
 * Tests for the Protect_Status class.
 */
class Test_Status extends BaseTestCase {

	/**
	 * Set up before each test
	 */
	protected function set_up() {
		Protect_Status::$status = null;

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
		// to do - mock a scan plan
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
	public function get_sample_empty_response() {
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
	public function get_sample_invalid_response() {
		return 'Invalid response';
	}

	/**
	 * Get a sample response
	 *
	 * @return object
	 */
	public function get_sample_api_response() {
		global $wp_version;

		return (object) array(
			'last_checked'                => '2003-03-03 03:03:03',
			'num_vulnerabilities'         => 3,
			'num_themes_vulnerabilities'  => 1,
			'num_plugins_vulnerabilities' => 1,
			'themes'                      => (object) array(
				'theme-1' => (object) array(
					'slug'            => 'theme-1',
					'name'            => 'Sample Theme 1',
					'version'         => '1.0.2',
					'checked'         => true,
					'vulnerabilities' => array(
						(object) array(
							'id'       => 'test-vuln-1',
							'title'    => 'Test Vuln 1',
							'fixed_in' => '1.0.0',
						),
					),
				),
			),
			'plugins'                     => (object) array(
				'plugin-1' => (object) array(
					'slug'            => 'plugin-1',
					'name'            => 'Sample Plugin 1',
					'version'         => '1.0.2',
					'checked'         => true,
					'vulnerabilities' => array(
						(object) array(
							'id'       => 'test-vuln-2',
							'title'    => 'Test Vuln 2',
							'fixed_in' => '2.0.0',
						),
					),
				),
				'plugin-2' => (object) array(
					'slug'            => 'plugin-2',
					'name'            => 'Sample Plugin 2',
					'version'         => '1.0.2',
					'checked'         => true,
					'vulnerabilities' => array(),
				),
			),
			'core'                        => (object) array(
				'version'         => $wp_version,
				'checked'         => true,
				'vulnerabilities' => array(
					(object) array(
						'id'       => 'test-vuln-3',
						'title'    => 'Test Vuln 3',
						'fixed_in' => null,
					),
				),
				'name'            => 'WordPress',
			),
		);
	}

	/**
	 * Get a sample result of Protect_Status::get_status().
	 *
	 * @phan-suppress PhanDeprecatedProperty -- Testing backwards compatibility.
	 *
	 * @return object
	 */
	public function get_sample_status() {
		global $wp_version;

		$vulnerability_1 = new Vulnerability_Model(
			array(
				'id'       => 'test-vuln-1',
				'title'    => 'Test Vuln 1',
				'fixed_in' => '1.0.0',
			)
		);

		$vulnerability_2 = new Vulnerability_Model(
			array(
				'id'       => 'test-vuln-2',
				'title'    => 'Test Vuln 2',
				'fixed_in' => '2.0.0',
			)
		);

		$vulnerability_3 = new Vulnerability_Model(
			array(
				'id'       => 'test-vuln-3',
				'title'    => 'Test Vuln 3',
				'fixed_in' => null,
			)
		);

		$plugin_1 = new Extension_Model(
			array(
				'version' => '1.0.2',
				'name'    => 'Sample Plugin 1',
				'checked' => true,
				'type'    => 'plugins',
				'slug'    => 'plugin-1',
			)
		);

		$theme_1 = new Extension_Model(
			array(
				'version' => '1.0.2',
				'name'    => 'Sample Theme 1',
				'checked' => true,
				'type'    => 'themes',
				'slug'    => 'theme-1',
			)
		);

		$core = new Extension_Model(
			array(
				'version' => $wp_version,
				'name'    => 'WordPress',
				'checked' => true,
				'type'    => 'core',
				'slug'    => 'wordpress',
			)
		);

		$plugin_1_threat = new Threat_Model(
			array(
				'id'              => 'plugins-plugin-1-1.0.2',
				'title'           => 'Vulnerable plugin: Sample Plugin 1 (version 1.0.2)',
				'description'     => 'The installed version of Sample Plugin 1 (1.0.2) has a known security vulnerability.',
				'fixed_in'        => '2.0.0',
				'source'          => null,
				'vulnerabilities' => array( $vulnerability_2 ),
			)
		);

		$theme_1_threat = new Threat_Model(
			array(
				'id'              => 'themes-theme-1-1.0.2',
				'title'           => 'Vulnerable theme: Sample Theme 1 (version 1.0.2)',
				'description'     => 'The installed version of Sample Theme 1 (1.0.2) has a known security vulnerability.',
				'fixed_in'        => '1.0.0',
				'source'          => null,
				'vulnerabilities' => array( $vulnerability_1 ),
			)
		);

		$core_threat = new Threat_Model(
			array(
				'id'              => 'core-wordpress-' . $wp_version,
				'title'           => 'Vulnerable WordPress (version ' . $wp_version . ')',
				'description'     => 'The installed version of WordPress (' . $wp_version . ') has a known security vulnerability.',
				'fixed_in'        => null,
				'source'          => null,
				'vulnerabilities' => array( $vulnerability_3 ),
			)
		);

		$core_threat_with_extension            = clone $core_threat;
		$core_threat_with_extension->extension = $core;

		$plugin_1_threat_with_extension            = clone $plugin_1_threat;
		$plugin_1_threat_with_extension->extension = $plugin_1;

		$theme_1_threat_with_extension            = clone $theme_1_threat;
		$theme_1_threat_with_extension->extension = $theme_1;

		$plugin_1_with_threats          = clone $plugin_1;
		$plugin_1_with_threats->threats = array( $plugin_1_threat );

		$theme_1_with_threats          = clone $theme_1;
		$theme_1_with_threats->threats = array( $theme_1_threat );

		$core_with_threats          = clone $core;
		$core_with_threats->threats = array( $core_threat );

		return new Status_Model(
			array(
				'data_source'         => 'protect_report',
				'last_checked'        => '2003-03-03 03:03:03',
				'num_threats'         => 3,
				'num_themes_threats'  => 1,
				'num_plugins_threats' => 1,
				'has_unchecked_items' => false,
				'plugins'             => array(
					new Extension_Model(
						array(
							'version' => '1.0.2',
							'name'    => 'Sample Plugin 2',
							'checked' => true,
							'type'    => 'plugins',
							'threats' => array(),
							'slug'    => 'plugin-2',
						)
					),
					$plugin_1_with_threats,
				),
				'themes'              => array(
					$theme_1_with_threats,
				),
				'core'                => $core_with_threats,
				'threats'             => array(
					$theme_1_threat_with_extension,
					$plugin_1_threat_with_extension,
					$core_threat_with_extension,
				),
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
			'body'     => wp_json_encode( $this->get_sample_api_response() ),
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
			'plugin-1' => array(
				'Name'    => 'Sample Plugin 1',
				'Version' => '1.0.2',
			),
			'plugin-2' => array(
				'Name'    => 'Sample Plugin 2',
				'Version' => '1.0.2',
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
				'Name'    => 'Sample Theme 1',
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
			'body'     => wp_json_encode( $this->get_sample_empty_response() ),
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
		$status = Protect_Status::get_status();

		$this->assertSame( 'site_not_connected', $status->error_code );

		// Make sure this was not cached
		$this->assertFalse( Protect_Status::get_from_options() );
	}

	/**
	 * Test get status
	 */
	public function test_get_status() {
		$this->mock_connection();

		$status = Protect_Status::get_status();

		$this->assertEquals( $this->get_sample_status(), $status );

		// Make sure this was cached
		$this->assertEquals( $this->get_sample_api_response(), Protect_Status::get_from_options() );
	}

	/**
	 * Test get total threats
	 */
	public function test_get_total_threats() {
		$this->mock_connection();

		$status = Protect_Status::get_total_threats();

		$this->assertSame( 3, $status );
	}

	/**
	 * Test get all threats
	 */
	public function test_get_all_threats() {
		$this->mock_connection();

		$status_threats = Protect_Status::get_all_threats();

		$this->assertEquals( $this->get_sample_status()->threats, $status_threats );
	}

	/**
	 * Data provider for test_is_cache_expired
	 */
	public function is_cache_expired_data() {
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
	public function test_is_cache_expired( $expected, $cache_timestamp ) {
		update_option( Protect_Status::OPTION_TIMESTAMP_NAME, $cache_timestamp );
		$this->assertSame( $expected, Protect_Status::is_cache_expired() );
	}

	/**
	 * Data provider for test_get_cache_end_date_by_status
	 */
	public function get_cache_end_date_by_status_data() {
		return array(
			'null'    => array(
				'initial',
				null,
			),
			'empty'   => array(
				'initial',
				$this->get_sample_empty_response(),
			),
			'invalid' => array(
				'initial',
				$this->get_sample_invalid_response(),
			),
			'full'    => array(
				'full',
				$this->get_sample_api_response(),
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
	public function test_get_cache_end_date_by_status( $check_type, $status ) {
		$timestamp = Protect_Status::get_cache_end_date_by_status( $status );
		if ( ! is_object( $status ) || 'initial' === $check_type ) {
			$this->assertSame( time() + Protect_Status::INITIAL_OPTION_EXPIRES_AFTER, $timestamp );
		}
		if ( is_object( $status ) && 'full' === $check_type ) {
			$this->assertSame( time() + Protect_Status::OPTION_EXPIRES_AFTER, $timestamp );
		}
	}
}
