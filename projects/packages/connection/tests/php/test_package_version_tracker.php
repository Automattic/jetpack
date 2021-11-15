<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

namespace Automattic\Jetpack\Connection;

use Automattic\Jetpack\Constants;
use PHPUnit\Framework\TestCase;

/**
 * Unit tests for the Package_Version_Tracker class.
 *
 * @package automattic/jetpack-connection
 */
class Test_Package_Version_Tracker extends TestCase {

	/**
	 * Whether an http request to the jetpack-package-versions endoint was attempted.
	 *
	 * @var bool
	 */
	private $http_request_attempted = false;

	/**
	 * An array of package versions.
	 */
	const PACKAGE_VERSIONS = array(
		'connection' => '1.0',
		'backup'     => '2.0',
		'sync'       => '3.0',
	);

	/**
	 * An array of package versions that are different
	 * from the versions in PACKAGE_VERSIONS.
	 */
	const CHANGED_VERSIONS = array(
		'connection' => '1.2',
		'backup'     => '3.4',
		'sync'       => '4.5',
	);

	/**
	 * Setting up the testing environment.
	 *
	 * @before
	 */
	public function set_up() {
		Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
	}

	/**
	 * Returning the environment into its initial state.
	 *
	 * @after
	 */
	public function tear_down() {
		$this->http_request_attempted = false;
		Constants::clear_constants();
	}

	/**
	 * Tests the maybe_update_package_versions method.
	 *
	 * @param array $option_value The value that will be set in the 'jetpack_package_versions' option.
	 * @param array $filter_value The value that will be returned by the 'jetpack_package_versions' filter.
	 * @param array $expected_value The value of the 'jetpack_package_versions' option after maybe_update_package_versions
	 *                              is called.
	 * @param bool  $updated Whether the option should be updated.
	 *
	 * @dataProvider jetpack_maybe_update_package_versions_data_provider
	 */
	public function test_maybe_update_package_versions( $option_value, $filter_value, $expected_value, $updated ) {
		$tracker = $this->getMockBuilder( 'Automattic\Jetpack\Connection\Package_Version_Tracker' )
			->setMethods( array( 'update_package_versions_option' ) )
			->getMock();

		update_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION, $option_value );

		add_filter(
			'jetpack_package_versions',
			function () use ( $filter_value ) {
				return $filter_value;
			}
		);

		if ( $updated ) {
			$tracker->expects( $this->once() )
				->method( 'update_package_versions_option' )
				->with(
					$this->callback(
						function ( $package_versions ) {
							update_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION, $package_versions );
							return true;
						}
					)
				);
		} else {
			$tracker->expects( $this->never() )
				->method( 'update_package_versions_option' );
		}

		$tracker->maybe_update_package_versions();

		$this->assertSame( $expected_value, get_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION ) );
	}

	/**
	 * Data provider for 'test_maybe_update_package_versions'.
	 *
	 * The test data arrays have the format:
	 *    'option_value'   => The value that will be set in the 'jetpack_package_versions' option.
	 *    'filter_value'   => The value that will be returned by the 'jetpack_package_versions' filter.
	 *    'expected_value' => The expected value of the option after maybe_update_package_versions is called.
	 *    'updated'        => Whether the option should be updated.
	 */
	public function jetpack_maybe_update_package_versions_data_provider() {
		$added_version = array_merge( self::PACKAGE_VERSIONS, array( 'test' => '4.0' ) );

		$removed_version = self::PACKAGE_VERSIONS;
		unset( $removed_version['sync'] );

		return array(
			'versions did not change'        =>
				array(
					'option_value'    => self::PACKAGE_VERSIONS,
					'filter_value'    => self::PACKAGE_VERSIONS,
					'expected_option' => self::PACKAGE_VERSIONS,
					'updated'         => false,
				),
			'option is empty'                =>
				array(
					'option_value'    => array(),
					'filter_value'    => self::PACKAGE_VERSIONS,
					'expected_option' => self::PACKAGE_VERSIONS,
					'updated'         => true,
				),
			'filter is empty'                =>
				array(
					'option_value'    => self::PACKAGE_VERSIONS,
					'filter_value'    => array(),
					'expected_option' => array(),
					'updated'         => true,
				),
			'versions changed'               =>
				array(
					'option_value'    => self::PACKAGE_VERSIONS,
					'filter_value'    => self::CHANGED_VERSIONS,
					'expected_option' => self::CHANGED_VERSIONS,
					'updated'         => true,
				),
			'filter added new package'       =>
				array(
					'option_value'    => self::PACKAGE_VERSIONS,
					'filter_value'    => $added_version,
					'expected_option' => $added_version,
					'updated'         => true,
				),
			'filter removed a package'       =>
				array(
					'option_value'    => self::PACKAGE_VERSIONS,
					'filter_value'    => $removed_version,
					'expected_option' => $removed_version,
					'updated'         => true,
				),
			'filter not an array'            =>
				array(
					'option_value'    => self::PACKAGE_VERSIONS,
					'filter_value'    => 'not an array',
					'expected_option' => self::PACKAGE_VERSIONS,
					'updated'         => false,
				),
			'option not an array'            =>
				array(
					'option_value'    => 'not an array',
					'filter_value'    => self::PACKAGE_VERSIONS,
					'expected_option' => self::PACKAGE_VERSIONS,
					'updated'         => true,
				),
			'option, filter both not arrays' =>
				array(
					'option_value'    => 'option not an array',
					'filter_value'    => 'filter not an array',
					'expected_option' => 'option not an array',
					'updated'         => false,
				),
			'filter version not string, option version is string' =>
				array(
					'option_value'    => self::PACKAGE_VERSIONS,
					'filter_value'    => array(
						'connection' => 1,
						'backup'     => '1.0',
						'sync'       => '2.0',
					),
					'expected_option' => array(
						'backup' => '1.0',
						'sync'   => '2.0',
					),
					'updated'         => true,
				),
			'filter version not string, option version also not string' =>
				array(
					'option_value'    => array(
						'connection' => 1,
						'backup'     => '1.0',
						'sync'       => '2.0',
					),
					'filter_value'    => array(
						'connection' => 2,
						'backup'     => '1.0',
						'sync'       => '2.0',
					),
					'expected_option' => array(
						'backup' => '1.0',
						'sync'   => '2.0',
					),
					'updated'         => true,
				),
			'filter version not string, option version does not exist, no update' =>
				array(
					'option_value'    => self::PACKAGE_VERSIONS,
					'filter_value'    => array_merge( self::PACKAGE_VERSIONS, array( 'test' => 5 ) ),
					'expected_option' => self::PACKAGE_VERSIONS,
					'updated'         => false,
				),
			'filter version not string, option version does not exist, with update' =>
				array(
					'option_value'    => self::PACKAGE_VERSIONS,
					'filter_value'    => array_merge( self::CHANGED_VERSIONS, array( 'test' => 5 ) ),
					'expected_option' => self::CHANGED_VERSIONS,
					'updated'         => true,
				),
		);
	}

	/**
	 * Tests the maybe_update_package_versions method when the HTTP request to WPCOM succeeds.
	 */
	public function test_maybe_update_package_versions_success() {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		add_filter( 'pre_http_request', array( $this, 'intercept_http_request_success' ) );

		update_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION, self::PACKAGE_VERSIONS );

		add_filter(
			'jetpack_package_versions',
			function () {
				return self::CHANGED_VERSIONS;
			}
		);

		( new Package_Version_Tracker() )->maybe_update_package_versions();

		remove_filter( 'pre_http_request', array( $this, 'intercept_http_request_success' ) );

		$this->assertTrue( $this->http_request_attempted );

		$this->assertSame( self::CHANGED_VERSIONS, get_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION ) );
	}

	/**
	 * Tests the maybe_update_package_versions method when the HTTP request to WPCOM fails.
	 */
	public function test_maybe_update_package_versions_failure() {
		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		add_filter( 'pre_http_request', array( $this, 'intercept_http_request_failure' ) );

		update_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION, self::PACKAGE_VERSIONS );

		add_filter(
			'jetpack_package_versions',
			function () {
				return self::CHANGED_VERSIONS;
			}
		);

		( new Package_Version_Tracker() )->maybe_update_package_versions();

		remove_filter( 'pre_http_request', array( $this, 'intercept_http_request_failure' ) );

		$this->assertTrue( $this->http_request_attempted );

		$this->assertSame( self::PACKAGE_VERSIONS, get_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION ) );

		$failed_request_cached = get_transient( Package_Version_Tracker::CACHED_FAILED_REQUEST_KEY );

		$this->assertNotFalse( $failed_request_cached );

		// Clean-up.
		delete_transient( Package_Version_Tracker::CACHED_FAILED_REQUEST_KEY );
	}

	/**
	 * Tests the maybe_update_package_versions method when the HTTP request to WPCOM has already failed within last hour..
	 */
	public function test_remote_package_versions_will_not_be_updated_if_a_previous_failed_request_occurred_within_hour() {
		set_transient( Package_Version_Tracker::CACHED_FAILED_REQUEST_KEY, time() );

		\Jetpack_Options::update_option( 'blog_token', 'asdasd.123123' );
		\Jetpack_Options::update_option( 'id', 1234 );

		add_filter( 'pre_http_request', array( $this, 'intercept_http_request_failure' ) );

		update_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION, self::PACKAGE_VERSIONS );

		add_filter(
			'jetpack_package_versions',
			function () {
				return self::CHANGED_VERSIONS;
			}
		);

		( new Package_Version_Tracker() )->maybe_update_package_versions();

		remove_filter( 'pre_http_request', array( $this, 'intercept_http_request_failure' ) );

		$this->assertFalse( $this->http_request_attempted );

		$this->assertSame( self::PACKAGE_VERSIONS, get_option( Package_Version_Tracker::PACKAGE_VERSION_OPTION ) );

		// Clean-up.
		delete_transient( Package_Version_Tracker::CACHED_FAILED_REQUEST_KEY );
	}

	/**
	 * Intercept the API request sent to WP.com, and mock success response.
	 *
	 * @return array
	 */
	public function intercept_http_request_success() {
		$this->http_request_attempted = true;

		$response = array();

		$response['response']['code'] = 200;
		return $response;
	}

	/**
	 * Intercept the API request sent to WP.com, and mock failure response.
	 *
	 * @return array
	 */
	public function intercept_http_request_failure() {
		$this->http_request_attempted = true;

		$response = array();

		$response['response']['code'] = 400;
		return $response;
	}
}
