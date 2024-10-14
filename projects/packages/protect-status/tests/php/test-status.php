<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * The Protect Status class.
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
use WorDBless\BaseTestCase;

/**
 * The Protect Status class.
 */
class Test_Status extends BaseTestCase {

	/**
	 * Set up before each test
	 */
	protected function set_up() {
		Protect_Status::$status = null;
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
	public function get_sample_response() {
		global $wp_version;

		return (object) array(
			'last_checked'                => '2003-03-03 03:03:03',
			'num_vulnerabilities'         => 3,
			'num_themes_vulnerabilities'  => 1,
			'num_plugins_vulnerabilities' => 1,
			'themes'                      => (object) array(
				'example-theme-1' => (object) array(
					'slug'            => 'example-theme',
					'name'            => 'Example Theme',
					'version'         => '1.0.2',
					'checked'         => true,
					'vulnerabilities' => array(
						(object) array(
							'id'       => 'example-theme-threat',
							'title'    => 'Example Theme Threat',
							'fixed_in' => '2.0.0',
						),
					),
				),
			),
			'plugins'                     => (object) array(
				'example-plugin-1' => (object) array(
					'slug'            => 'example-plugin',
					'name'            => 'Example Plugin',
					'version'         => '1.0.2',
					'checked'         => true,
					'vulnerabilities' => array(
						(object) array(
							'id'       => 'example-plugin-threat',
							'title'    => 'Example Plugin Threat',
							'fixed_in' => '2.0.0',
						),
					),
				),
				'example-plugin-2' => (object) array(
					'slug'            => 'example-plugin-2',
					'name'            => 'Example Plugin 2',
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
						'id'    => 'example-core-threat',
						'title' => 'Example Core Threat',
					),
				),
				'name'            => 'WordPress',
			),
		);
	}

	/**
	 * Get a sample result of Protect_Status::get_status().
	 *
	 * @return object
	 */
	public function get_sample_status() {
		global $wp_version;

		return new Status_Model(
			array(
				'data_source'  => 'protect_report',
				'threats'      => array(
					new Threat_Model(
						array(
							'id'        => 'example-plugin-threat',
							'title'     => 'Example Plugin Threat',
							'fixed_in'  => '2.0.0',
							'source'    => 'https://jetpack.com/redirect/?source=jetpack-protect-vul-info&site=example.org&path=example-plugin-threat',
							'extension' => new Extension_Model(
								array(
									'name'    => 'Example Plugin',
									'slug'    => 'example-plugin-1',
									'version' => '1.0.2',
									'type'    => 'plugin',
								)
							),
						)
					),
					new Threat_Model(
						array(
							'id'        => 'example-theme-threat',
							'title'     => 'Example Theme Threat',
							'fixed_in'  => '2.0.0',
							'source'    => 'https://jetpack.com/redirect/?source=jetpack-protect-vul-info&site=example.org&path=example-theme-threat',
							'extension' => new Extension_Model(
								array(
									'name'    => 'Example Theme',
									'slug'    => 'example-theme-1',
									'version' => '1.0.2',
									'type'    => 'theme',
								)
							),
						)
					),
					new Threat_Model(
						array(
							'id'        => 'example-core-threat',
							'title'     => 'Example Core Threat',
							'source'    => 'https://jetpack.com/redirect/?source=jetpack-protect-vul-info&site=example.org&path=example-core-threat',
							'extension' => new Extension_Model(
								array(
									'name'    => 'WordPress',
									'slug'    => 'wordpress',
									'version' => $wp_version,
									'type'    => 'core',
								)
							),
						)
					),
				),
				'last_checked' => '2003-03-03 03:03:03',
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
			'example-plugin-1' => array(
				'Name'    => 'Example Plugin',
				'Version' => '1.0.2',
			),
			'example-plugin-2' => array(
				'Name'    => 'Example Plugin',
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
			'example-theme-1' => array(
				'Name'    => 'Example Theme',
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
	 * Mock site connection
	 */
	public function mock_connection() {
		( new Tokens() )->update_blog_token( 'test.test' );
		Jetpack_Options::update_option( 'id', 123 );
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		// to do - mock a scan plan
	}

	/**
	 * Test while site is not connected
	 */
	public function test_get_status_not_connected() {
		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		add_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		add_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );
		$status = Protect_Status::get_status();
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		remove_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		remove_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );

		$this->assertSame( 'site_not_connected', $status->error_code );

		// Make sure this was not cached
		$this->assertFalse( Protect_Status::get_from_options() );
	}

	/**
	 * Test get status
	 */
	public function test_get_status() {
		$this->mock_connection();

		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		add_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		add_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );
		$status = Protect_Status::get_status();
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		remove_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		remove_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );

		$this->assertEquals( $this->get_sample_status(), $status );

		// Make sure this was cached
		$this->assertEquals( $this->get_sample_response(), Protect_Status::get_from_options() );
	}

	/**
	 * Test get total threats
	 */
	public function test_get_total_threats() {
		$this->mock_connection();

		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		add_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		add_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );
		$status = Protect_Status::get_total_threats();
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		remove_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		remove_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );

		$this->assertSame( 3, $status );
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
				$this->get_sample_response(),
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
