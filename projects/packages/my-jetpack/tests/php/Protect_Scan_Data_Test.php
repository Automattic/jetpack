<?php

namespace Automattic\Jetpack\My_Jetpack;

use Automattic\Jetpack\Connection\Tokens;
use Automattic\Jetpack\Protect_Models\Extension_Model;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Models\Threat_Model;
use Automattic\Jetpack\Protect_Status\Status as Protect_Status;
use Jetpack_Options;
use PHPUnit\Framework\Attributes\DataProvider;
use PHPUnit\Framework\TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;
use WP_REST_Request;
use WP_REST_Server;

/**
 * Unit tests for the capability filtering of the scan status served by
 * GET /my-jetpack/v1/site/protect/data.
 *
 * @package automattic/my-jetpack
 * @see \Automattic\Jetpack\My_Jetpack\Products\Protect::get_site_protect_data
 */
class Protect_Scan_Data_Test extends TestCase {

	/**
	 * Values that only an administrator may see, one per admin-only field of the fixture below:
	 * a threat's filename, context, signature, table and details; an extension's version, slug and
	 * name; and a fixable threat ID.
	 *
	 * @var string[]
	 */
	private const ADMIN_ONLY_VALUES = array(
		'/var/www/html/wp-content/uploads/sentinel-backdoor.php',
		'SENTINEL_PAYLOAD',
		'Backdoor.PHP.Generic.Sentinel',
		'wp_sentinel_options',
		'sentinel_pk_column',
		'1.2.3-sentinel',
		'sentinel-plugin',
		'Sentinel Theme',
		'threat-plugin-sentinel',
	);

	/**
	 * Threat_Model and Extension_Model properties that must not reach a non-administrator.
	 *
	 * @var string[]
	 */
	private const ADMIN_ONLY_KEYS = array(
		'filename',
		'context',
		'signature',
		'table',
		'details',
		'version',
		'slug',
		'name',
		'extension',
		'fixable',
		'fixable_threat_ids',
	);

	/**
	 * REST Server object.
	 *
	 * @var WP_REST_Server
	 */
	private $server;

	/**
	 * The scan status the endpoint serves.
	 *
	 * @var Status_Model
	 */
	private $status;

	/**
	 * Setting up the test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Protect_Status::get_status() would otherwise reach out to WPCOM.
		add_filter( 'pre_http_request', array( $this, 'block_http_request' ) );

		$this->status           = $this->build_status();
		Protect_Status::$status = $this->status;

		// Mock site connection.
		( new Tokens() )->update_blog_token( 'test.test.1' );
		Jetpack_Options::update_option( 'id', 123 );

		global $wp_rest_server;

		$wp_rest_server = new WP_REST_Server();
		$this->server   = $wp_rest_server;

		Initializer::init();
		do_action( 'rest_api_init' );
	}

	/**
	 * Returning the environment into its initial state.
	 */
	public function tearDown(): void {
		parent::tearDown();

		remove_filter( 'pre_http_request', array( $this, 'block_http_request' ) );

		Protect_Status::$status = null;

		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
	}

	/**
	 * Short-circuit every outbound HTTP request.
	 *
	 * @return \WP_Error
	 */
	public function block_http_request() {
		return new \WP_Error( 'http_request_blocked', 'Blocked in tests.' );
	}

	/**
	 * A representative paid-plan scan status: file, database and extension threats.
	 *
	 * @return Status_Model
	 */
	private function build_status() {
		$file_threat = new Threat_Model(
			array(
				'id'             => 'threat-file-sentinel',
				'signature'      => 'Backdoor.PHP.Generic.Sentinel',
				'title'          => 'Malicious code found',
				'description'    => 'A malicious file was found on the site.',
				'first_detected' => '2026-07-01 09:00:00',
				'severity'       => 5,
				'fixable'        => false,
				'status'         => 'current',
				'filename'       => '/var/www/html/wp-content/uploads/sentinel-backdoor.php',
				'context'        => (object) array( '12' => 'eval( base64_decode( "SENTINEL_PAYLOAD" ) );' ),
			)
		);

		$database_threat = new Threat_Model(
			array(
				'id'       => 'threat-database-sentinel',
				'severity' => 3,
				'table'    => 'wp_sentinel_options',
				'details'  => (object) array( 'pk_column' => 'sentinel_pk_column' ),
			)
		);

		$plugin_threat = new Threat_Model(
			array(
				'id'        => 'threat-plugin-sentinel',
				'severity'  => 5,
				'title'     => 'Vulnerable plugin',
				'fixable'   => true,
				'extension' => array(
					'name'    => 'Sentinel Plugin',
					'slug'    => 'sentinel-plugin',
					'version' => '1.2.3-sentinel',
					'type'    => 'plugins',
				),
			)
		);

		$theme_threat = new Threat_Model(
			array(
				'id'       => 'threat-theme-sentinel',
				'severity' => 2,
				'title'    => 'Vulnerable theme',
			)
		);

		return new Status_Model(
			array(
				'data_source'         => 'scan_api',
				'status'              => 'idle',
				'last_checked'        => '2026-07-20 12:00:00',
				'has_unchecked_items' => false,
				'num_threats'         => 4,
				'num_plugins_threats' => 1,
				'num_themes_threats'  => 1,
				'fixable_threat_ids'  => array( 'threat-plugin-sentinel' ),
				'threats'             => array( $file_threat, $database_threat, $plugin_threat, $theme_threat ),
				'files'               => array( $file_threat ),
				'database'            => array( $database_threat ),
				'plugins'             => array(
					new Extension_Model(
						array(
							'name'    => 'Sentinel Plugin',
							'slug'    => 'sentinel-plugin',
							'version' => '1.2.3-sentinel',
							'type'    => 'plugins',
							'checked' => true,
							'threats' => array( $plugin_threat ),
						)
					),
				),
				'themes'              => array(
					new Extension_Model(
						array(
							'name'    => 'Sentinel Theme',
							'slug'    => 'sentinel-theme',
							'version' => '9.9.9',
							'type'    => 'themes',
							'checked' => true,
							'threats' => array( $theme_threat ),
						)
					),
				),
				'core'                => new Extension_Model(
					array(
						'name'    => 'WordPress',
						'slug'    => 'wordpress',
						'version' => '6.9',
						'type'    => 'core',
						'checked' => true,
					)
				),
			)
		);
	}

	/**
	 * Set the current user to a freshly created user with the given role.
	 *
	 * @param string $role The role to create the user with.
	 * @return void
	 */
	private function set_current_user_role( $role ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => "test_$role",
				'user_pass'  => '123',
				'role'       => $role,
			)
		);
		wp_set_current_user( $user_id );
	}

	/**
	 * Dispatch the Protect data endpoint and return the `scanData` it served, as the client sees it.
	 *
	 * @return array
	 */
	private function get_served_scan_data() {
		$response = $this->server->dispatch( new WP_REST_Request( 'GET', '/my-jetpack/v1/site/protect/data' ) );

		$this->assertSame( 200, $response->get_status() );

		return json_decode( wp_json_encode( $response->get_data()['scanData'], JSON_UNESCAPED_SLASHES ), true );
	}

	/**
	 * Render a served payload the way the sentinel assertions read it.
	 *
	 * @param array $scan_data The served scan data.
	 * @return string
	 */
	private function encode( array $scan_data ) {
		return wp_json_encode( $scan_data, JSON_UNESCAPED_SLASHES );
	}

	/**
	 * Collect every string key in a nested array, at any depth.
	 *
	 * @param array $data The array to walk.
	 * @return string[]
	 */
	private function collect_keys( array $data ) {
		$keys = array();

		foreach ( $data as $key => $value ) {
			if ( is_string( $key ) ) {
				$keys[] = $key;
			}
			if ( is_array( $value ) ) {
				$keys = array_merge( $keys, $this->collect_keys( $value ) );
			}
		}

		return array_values( array_unique( $keys ) );
	}

	/**
	 * Administrators keep receiving the full scan status.
	 */
	public function test_administrator_receives_full_scan_data() {
		$this->set_current_user_role( 'administrator' );

		$scan_data = $this->get_served_scan_data();

		$this->assertSame( json_decode( wp_json_encode( $this->status, JSON_UNESCAPED_SLASHES ), true ), $scan_data );

		// Also pins the fixture: the values the non-admin assertions look for are really in there.
		foreach ( self::ADMIN_ONLY_VALUES as $value ) {
			$this->assertStringContainsString( $value, $this->encode( $scan_data ) );
		}
	}

	/**
	 * Users without `manage_options` receive no threat or extension detail.
	 *
	 * @dataProvider provide_non_admin_roles
	 *
	 * @param string $role A role without the `manage_options` capability.
	 */
	#[DataProvider( 'provide_non_admin_roles' )]
	public function test_non_admin_receives_no_threat_detail( $role ) {
		$this->set_current_user_role( $role );

		$scan_data = $this->get_served_scan_data();
		$encoded   = $this->encode( $scan_data );

		foreach ( self::ADMIN_ONLY_VALUES as $value ) {
			$this->assertStringNotContainsString( $value, $encoded );
		}

		$keys = $this->collect_keys( $scan_data );
		foreach ( self::ADMIN_ONLY_KEYS as $key ) {
			$this->assertNotContains( $key, $keys );
		}
	}

	/**
	 * The counts and timestamps the Protect card renders survive the filtering.
	 *
	 * @dataProvider provide_non_admin_roles
	 *
	 * @param string $role A role without the `manage_options` capability.
	 */
	#[DataProvider( 'provide_non_admin_roles' )]
	public function test_non_admin_keeps_the_aggregates_the_card_renders( $role ) {
		$this->set_current_user_role( $role );

		$this->assertSame(
			array(
				'last_checked'        => '2026-07-20 12:00:00',
				'threats'             => array(
					array( 'severity' => 5 ),
					array( 'severity' => 3 ),
					array( 'severity' => 5 ),
					array( 'severity' => 2 ),
				),
				'num_threats'         => 4,
				'num_plugins_threats' => 1,
				'num_themes_threats'  => 1,
				'core'                => array( 'threats' => array() ),
				'themes'              => array(
					array( 'threats' => array( array( 'severity' => 2 ) ) ),
				),
				'plugins'             => array(
					array( 'threats' => array( array( 'severity' => 5 ) ) ),
				),
				'files'               => array( array( 'severity' => 5 ) ),
				'database'            => array( array( 'severity' => 3 ) ),
			),
			$this->get_served_scan_data()
		);
	}

	/**
	 * Roles that hold `edit_posts` but not `manage_options`.
	 *
	 * @return array[]
	 */
	public static function provide_non_admin_roles() {
		return array(
			'editor'      => array( 'editor' ),
			'author'      => array( 'author' ),
			'contributor' => array( 'contributor' ),
		);
	}
}
