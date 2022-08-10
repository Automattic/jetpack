<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * The Protect Status class.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Constants;
use Jetpack_Options;
use WorDBless\BaseTestCase;

/**
 * The Protect Status class.
 */
class Test_Status extends BaseTestCase {

	/**
	 * Set up before each test
	 *
	 * @before
	 */
	protected function set_up() {
		parent::setUp();
		Status::$status = null;
	}

	/**
	 * Get a sample checked theme result
	 *
	 * @param string $id The unique theme ID.
	 * @param bool   $with_vuls Whether the sample should include a vulnerability.
	 * @return object
	 */
	public function get_sample_theme( $id, $with_vuls = true ) {
		$item = (object) array(
			'version'         => '1.0.2',
			'name'            => 'Sample Theme',
			'checked'         => true,
			'type'            => 'themes',
			'vulnerabilities' => array(),
			'slug'            => "theme-$id",
		);
		if ( $with_vuls ) {
			$item->vulnerabilities[] = $this->get_sample_vul();
		}
		return $item;
	}

	/**
	 * Get a sample checked plugin result
	 *
	 * @param string $id The unique plugin ID.
	 * @param bool   $with_vuls Whether the sample should include a vulnerability.
	 * @return object
	 */
	public function get_sample_plugin( $id, $with_vuls = true ) {
		$item = (object) array(
			'version'         => '1.0.2',
			'name'            => 'Sample Plugin',
			'checked'         => true,
			'type'            => 'plugins',
			'vulnerabilities' => array(),
			'slug'            => "plugin-$id",
		);
		if ( $with_vuls ) {
			$item->vulnerabilities[] = $this->get_sample_vul();
		}
		return $item;
	}

	/**
	 * Get a sample checked core result
	 *
	 * @param bool $with_vuls Whether the sample should include a vulnerability.
	 * @return object
	 */
	public function get_sample_core( $with_vuls = true ) {
		global $wp_version;

		$item = (object) array(
			'version'         => $wp_version,
			'vulnerabilities' => array(),
			'checked'         => true,
			'name'            => 'WordPress',
			'type'            => 'core',
		);
		if ( $with_vuls ) {
			$item->vulnerabilities[] = $this->get_sample_vul();
		}

		return $item;
	}

	/**
	 * Get a sample vulnerabilty
	 *
	 * @return object
	 */
	public function get_sample_vul() {
		return (object) array(
			'id'       => 'asdasdasd-123123-asdasd',
			'title'    => 'Sample Vul',
			'fixed_in' => '2.0.0',
		);
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
	 * Get a sample response
	 *
	 * @return object
	 */
	public function get_sample_response() {
		return (object) array(
			'last_checked'                => '2003-03-03 03:03:03',
			'num_vulnerabilities'         => 3,
			'num_themes_vulnerabilities'  => 1,
			'num_plugins_vulnerabilities' => 1,
			'themes'                      => (object) array(
				'theme-1' => $this->get_sample_theme( '1' ),
			),
			'plugins'                     => (object) array(
				'plugin-1' => $this->get_sample_plugin( '1' ),
				'plugin-2' => $this->get_sample_plugin( '2', false ),
			),
			'core'                        => $this->get_sample_core(),
			'wordpress'                   => $this->get_sample_core(),
		);
	}

	/**
	 * Get a sample result of Status::get_status().
	 *
	 * @return object
	 */
	public function get_sample_status() {
		return new Status_Model(
			array(
				'plugins'                     => array(
					new Extension_Model( $this->get_sample_plugin( '1' ) ),
					new Extension_Model( $this->get_sample_plugin( '2', false ) ),
				),
				'themes'                      => array(
					new Extension_Model( $this->get_sample_theme( '1' ) ),
				),
				'core'                        => new Extension_Model( $this->get_sample_core() ),
				'wordpress'                   => $this->get_sample_core(),
				'last_checked'                => '2003-03-03 03:03:03',
				'num_vulnerabilities'         => 3,
				'num_themes_vulnerabilities'  => 1,
				'num_plugins_vulnerabilities' => 1,
				'has_unchecked_items'         => false,
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
			'plugin-1' => array(
				'Name'    => 'Sample Plugin',
				'Version' => '1.0.2',
			),
			'plugin-2' => array(
				'Name'    => 'Sample Plugin',
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
	}

	/**
	 * Test while site is not connected
	 */
	public function test_get_status_not_connected() {
		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		add_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		add_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );
		$status = Status::get_status();
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		remove_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		remove_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );

		$this->assertSame( 'site_not_connected', $status->error_code );

		// Make sure this was not cached
		$this->assertFalse( Status::get_from_options() );
	}

	/**
	 * Test get status
	 */
	public function test_get_status() {
		$this->mock_connection();

		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		add_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		add_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );
		$status = Status::get_status();
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		remove_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		remove_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );

		$this->assertEquals( $this->get_sample_status(), $status );

		// Make sure this was cached
		$this->assertEquals( $this->get_sample_response(), Status::get_from_options() );
	}

	/**
	 * Test get total vuls
	 */
	public function test_get_total_vuls() {
		$this->mock_connection();

		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		$status = Status::get_total_vulnerabilities();
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );

		$this->assertSame( 3, $status );

	}

	/**
	 * Test get total vuls
	 */
	public function test_get_all_vuls() {
		$this->mock_connection();

		$expected = array(
			new Threat_Model( $this->get_sample_vul() ),
			new Threat_Model( $this->get_sample_vul() ),
			new Threat_Model( $this->get_sample_vul() ),
		);

		add_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		add_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		add_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );
		$status = Status::get_all_vulnerabilities();
		remove_filter( 'pre_http_request', array( $this, 'return_sample_response' ) );
		remove_filter( 'all_plugins', array( $this, 'return_sample_plugins' ) );
		remove_filter( 'jetpack_sync_get_themes_callable', array( $this, 'return_sample_themes' ) );

		$this->assertEquals( $expected, $status );

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
		update_option( Status::OPTION_TIMESTAMP_NAME, $cache_timestamp );
		$this->assertSame( $expected, Status::is_cache_expired() );
	}

	/**
	 * Data provider for test_get_cache_end_date_by_status
	 */
	public function get_cache_end_date_by_status_data() {
		return array(
			'null'  => array(
				'initial',
				null,
			),
			'empty' => array(
				'initial',
				$this->get_sample_empty_response(),
			),
			'full'  => array(
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
		$timestamp = Status::get_cache_end_date_by_status( $status );
		if ( 'initial' === $check_type ) {
			$this->assertSame( time() + Status::INITIAL_OPTION_EXPIRES_AFTER, $timestamp );
		}
		if ( 'full' === $check_type ) {
			$this->assertSame( time() + Status::OPTION_EXPIRES_AFTER, $timestamp );
		}
	}
}
