<?php
/**
 * Tests for the Protect dashboard's Scan section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Protect\Sections\Scan;
use Automattic\Jetpack\Protect_Models\Status_Model;
use Automattic\Jetpack\Protect_Models\Threat_Model;
use Automattic\Jetpack\Protect_Status\Scan_Status;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;
use WP_REST_Request;

/**
 * @covers \Automattic\Jetpack\Protect\Sections\Scan
 */
#[CoversClass( Scan::class )]
class Scan_Section_Test extends BaseTestCase {

	/**
	 * The query filter flag_option_row() adds, removed after each test.
	 *
	 * @var callable|null
	 */
	private static $row_lookup;

	/**
	 * Files written by a test, removed afterwards.
	 *
	 * @var string[]
	 */
	private $files = array();

	/**
	 * Release the scan request lock between tests.
	 */
	public function tear_down() {
		foreach ( $this->files as $file ) {
			wp_delete_file( $file );
		}
		delete_transient( Scan::REQUEST_LOCK );
		delete_transient( Scan::HISTORY_CACHE );
		delete_option( Dashboard_Threats::RESOLVED_OPTION );
		remove_all_filters( 'map_meta_cap' );
		remove_all_filters( 'pre_http_request' );
		wp_set_current_user( 0 );
		remove_all_filters( 'jetpack_protect_dashboard_scan_upsell_variant' );
		remove_all_filters( 'jetpack_protect_threat_ignoring_enabled' );
		remove_all_actions( 'rest_api_init' );
		$GLOBALS['wp_rest_server'] = null;
		delete_option( \Automattic\Jetpack\Current_Plan::SITE_PRODUCTS_OPTION );
		\Automattic\Jetpack\Protect_Status\Plan::has_required_plan( true );
		\Jetpack_Options::delete_option( 'id' );
		delete_option( Scan_Status::OPTION_NAME );
		Scan_Status::$status = null;
		\Automattic\Jetpack\Constants::clear_constants();
		\Automattic\Jetpack\Status\Cache::clear();
		if ( self::$row_lookup ) {
			remove_filter( 'wordbless_wpdb_query_results', self::$row_lookup );
			self::$row_lookup = null;
		}
		parent::tear_down();
	}

	/**
	 * Call a private static method of the Scan section.
	 *
	 * @param string $method The method.
	 * @param mixed  ...$args Its arguments.
	 * @return mixed
	 */
	private static function call( $method, ...$args ) {
		$reflection = new \ReflectionMethod( Scan::class, $method );
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$reflection->setAccessible( true );
		}
		return $reflection->invoke( null, ...$args );
	}

	/**
	 * A WoA site with Scan gets no credentials link or status, since WordPress.com runs Scan without them.
	 *
	 * @dataProvider provide_credentials_hosts
	 *
	 * @param bool $is_woa Whether the site is on WoA.
	 */
	#[DataProvider( 'provide_credentials_hosts' )]
	public function test_credentials_follow_the_host( $is_woa ) {
		if ( $is_woa ) {
			\Automattic\Jetpack\Constants::set_constant( 'ATOMIC_SITE_ID', 1 );
			\Automattic\Jetpack\Constants::set_constant( 'ATOMIC_CLIENT_ID', 2 );
			\Automattic\Jetpack\Constants::set_constant( 'WPCOMSH__PLUGIN_FILE', true );
		}
		update_option( \Automattic\Jetpack\Current_Plan::SITE_PRODUCTS_OPTION, array( array( 'product_slug' => 'jetpack_scan' ) ) );
		\Automattic\Jetpack\Protect_Status\Plan::has_required_plan( true );

		$state = ( new Scan() )->get_state();

		$this->assertTrue( $state['hasPlan'] );
		$this->assertSame( ! $is_woa, $state['needsCredentials'] );
		$this->assertSame( $is_woa, '' === $state['url'] );
		$this->assertSame( ! $is_woa, array_key_exists( 'hasCredentials', $state ) );
	}

	/**
	 * Data provider for test_credentials_follow_the_host.
	 *
	 * @return array[]
	 */
	public static function provide_credentials_hosts() {
		return array(
			'WoA'     => array( true ),
			'not WoA' => array( false ),
		);
	}

	/**
	 * Test that the ignored list keeps only ignored threats from the history it shares with the History tab.
	 */
	public function test_ignored_threats_come_from_the_shared_history() {
		set_transient(
			Scan::HISTORY_CACHE,
			array(
				array(
					'id'     => 1,
					'status' => 'fixed',
				),
				array(
					'id'     => 2,
					'status' => 'ignored',
				),
			)
		);

		$this->assertSame( array( 2 ), array_column( Scan::get_ignored_threats(), 'id' ) );
	}

	/**
	 * Test that only administrators may fix or ignore threats.
	 */
	public function test_non_admins_cannot_act_on_threats() {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'editor',
				'user_pass'  => 'pass',
				'role'       => 'editor',
			)
		);
		wp_set_current_user( $user_id );

		$this->assertFalse( Scan::can_act_on_threats() );
	}

	/**
	 * Who may view, delete or restore a threat's file.
	 *
	 * @return array[]
	 */
	public static function provide_threat_file_users() {
		return array(
			'administrator'                   => array( 'administrator', false, true ),
			'administrator, file editing off' => array( 'administrator', true, false ),
			'editor'                          => array( 'editor', false, false ),
		);
	}

	/**
	 * @dataProvider provide_threat_file_users
	 *
	 * @param string $role             The user's role.
	 * @param bool   $file_editing_off Whether core refuses `edit_plugins`, as it does under DISALLOW_FILE_EDIT.
	 * @param bool   $allowed          Whether the user may act on threat files, and the dashboard offers to.
	 */
	#[DataProvider( 'provide_threat_file_users' )]
	public function test_threat_files_need_permission_to_edit_code( $role, $file_editing_off, $allowed ) {
		update_option( \Automattic\Jetpack\Current_Plan::SITE_PRODUCTS_OPTION, array( array( 'product_slug' => 'jetpack_scan' ) ) );
		\Automattic\Jetpack\Protect_Status\Plan::has_required_plan( true );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => $role,
					'user_pass'  => 'pass',
					'role'       => $role,
				)
			)
		);
		$refuse = function ( $caps, $cap ) {
			return 'edit_plugins' === $cap ? array( 'do_not_allow' ) : $caps;
		};
		if ( $file_editing_off ) {
			add_filter( 'map_meta_cap', $refuse, 10, 2 );
		}

		$this->assertSame( $allowed, true === Scan::can_act_on_threat_files() );
		$this->assertSame( $allowed, ( new Scan() )->get_state()['canViewFiles'] );
	}

	/**
	 * Test that a host turning ignoring off hides Ignore and refuses the ignore route, but leaves unignoring alone.
	 *
	 * @param string $action        `ignore` or `unignore`.
	 * @param string $expected_code The error the route answers with.
	 * @dataProvider provide_ignore_routes
	 */
	#[DataProvider( 'provide_ignore_routes' )]
	public function test_hosts_can_turn_off_ignoring_but_not_unignoring( $action, $expected_code ) {
		update_option( \Automattic\Jetpack\Current_Plan::SITE_PRODUCTS_OPTION, array( array( 'product_slug' => 'jetpack_scan' ) ) );
		\Automattic\Jetpack\Protect_Status\Plan::has_required_plan( true );
		wp_set_current_user(
			wp_insert_user(
				array(
					'user_login' => 'admin',
					'user_pass'  => 'pass',
					'role'       => 'administrator',
				)
			)
		);
		add_filter( 'jetpack_protect_threat_ignoring_enabled', '__return_false' );
		add_action( 'rest_api_init', array( new Scan(), 'register_routes' ) );

		$response = rest_do_request( new \WP_REST_Request( 'POST', "/jetpack/v4/protect-dashboard/scan/threats/1/$action" ) );

		$this->assertFalse( ( new Scan() )->get_state()['canIgnore'] );
		$this->assertSame( $expected_code, $response->as_error()->get_error_code() );
	}

	/**
	 * The ignore routes, and what each answers with while ignoring is off and WordPress.com is unreachable.
	 *
	 * @return array[]
	 */
	public static function provide_ignore_routes() {
		return array(
			'ignore'   => array( 'ignore', 'threat_ignoring_disabled' ),
			'unignore' => array( 'unignore', 'threat_not_unignored' ),
		);
	}

	/**
	 * @dataProvider provide_failed_unignore_replies
	 *
	 * @param \WP_Error|array $reply   What WordPress.com answers.
	 * @param bool            $dropped Whether the caches are dropped.
	 */
	#[DataProvider( 'provide_failed_unignore_replies' )]
	public function test_failed_unignore_drops_the_caches_only_when_unanswered( $reply, $dropped ) {
		$user_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'password',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $user_id );
		\Automattic\Jetpack\Constants::set_constant( 'JETPACK__WPCOM_JSON_API_BASE', 'https://public-api.wordpress.com' );
		\Jetpack_Options::update_option( 'id', 123 );
		\Jetpack_Options::update_option( 'user_tokens', array( $user_id => "token.secret.$user_id" ) );
		set_transient( Scan::HISTORY_CACHE, array( array( 'id' => 1 ) ), MINUTE_IN_SECONDS );
		update_option( Scan_Status::OPTION_NAME, 'report' );
		$timeout = null;
		$answer  = function ( $pre, $args ) use ( $reply, &$timeout ) {
			$timeout = $args['timeout'];
			return $reply;
		};
		add_filter( 'pre_http_request', $answer, 10, 2 );

		$result = self::call( 'set_ignored', 1, false );
		remove_filter( 'pre_http_request', $answer );

		$this->assertSame( 'threat_not_unignored', $result->get_error_code() );
		$this->assertSame( 30, $timeout );
		$this->assertSame( $dropped, false === get_transient( Scan::HISTORY_CACHE ) );
		$this->assertSame( $dropped, false === get_option( Scan_Status::OPTION_NAME ) );
	}

	/**
	 * WordPress.com replies that fail an unignore, and whether each may still have applied it.
	 *
	 * @return array[]
	 */
	public static function provide_failed_unignore_replies() {
		return array(
			'timed out'    => array( new \WP_Error( 'http_request_failed', 'cURL error 28' ), true ),
			'server error' => array(
				array(
					'response' => array( 'code' => 500 ),
					'body'     => '',
				),
				false,
			),
		);
	}

	/**
	 * Test that a held request lock refuses a second scan, and a released one allows a retry.
	 */
	public function test_request_lock_refuses_a_second_claim_until_released() {
		$this->assertTrue( self::call( 'claim_request_lock' ) );
		$this->assertFalse( self::call( 'claim_request_lock' ) );

		self::call( 'release_request_lock' );

		$this->assertTrue( self::call( 'claim_request_lock' ) );
	}

	/**
	 * WordPress.com fixer responses, and the status the dashboard reads from each.
	 *
	 * @return array[]
	 */
	public static function provider_fix_status() {
		return array(
			'reported status is kept'           => array(
				'{"threats":{"7":{"status":"fixed"}}}',
				array(
					'status' => 'fixed',
					'error'  => null,
				),
			),
			'unreported threat is in progress'  => array(
				'{"threats":{}}',
				array(
					'status' => 'in_progress',
					'error'  => null,
				),
			),
			'error without status is not fixed' => array(
				'{"threats":{"7":{"error":"failed"}}}',
				array(
					'status' => 'not_fixed',
					'error'  => 'failed',
				),
			),
		);
	}

	/**
	 * Test that a threat's fix status is read from WordPress.com's response by its numeric id.
	 *
	 * @dataProvider provider_fix_status
	 * @param string $response The decoded response body, as JSON.
	 * @param array  $expected The status the dashboard reports.
	 */
	#[DataProvider( 'provider_fix_status' )]
	public function test_fix_status_is_read_from_the_response( $response, $expected ) {
		$this->assertSame( $expected, self::call( 'get_threat_fix_status', json_decode( $response ), 7 ) );
	}

	/**
	 * Enqueue responses from WordPress.com, and the error the dashboard reports, if any.
	 *
	 * @return array[]
	 */
	public static function provider_enqueue_response() {
		$response = function ( $code, $body ) {
			return array(
				'response' => array( 'code' => $code ),
				'body'     => $body,
			);
		};
		return array(
			'enqueued'                    => array( $response( 200, '{"success":true}' ), null ),
			'200 with success false'      => array(
				$response( 200, '{"success":false,"error":{"errors":{"vp_api_error":["Unable to find a valid site."]}}}' ),
				'The scan couldn’t be started: Unable to find a valid site.',
			),
			'error status with a message' => array( $response( 403, '{"message":"Forbidden."}' ), 'The scan couldn’t be started: Forbidden.' ),
			'error status without a body' => array( $response( 500, '' ), 'The scan couldn’t be started. Try again in a few minutes.' ),
			'request failed'              => array( new \WP_Error( 'http_request_failed' ), 'The scan couldn’t be started. Try again in a few minutes.' ),
		);
	}

	/**
	 * Test that a scan request only counts as started when WordPress.com says so, and keeps its reason when not.
	 *
	 * @dataProvider provider_enqueue_response
	 * @param array|\WP_Error $response The enqueue response.
	 * @param string|null     $expected The error message, or null when the scan started.
	 */
	#[DataProvider( 'provider_enqueue_response' )]
	public function test_enqueue_failures_are_reported( $response, $expected ) {
		$error = self::call( 'get_enqueue_error', $response );
		$this->assertSame( $expected, $error ? $error->get_error_message() : null );
	}

	/**
	 * Plugin files, the active ones, the slug to delete, and whether the route deletes it.
	 *
	 * @return array[]
	 */
	public static function provider_delete_plugin() {
		$folder = array( 'protect-folder/a.php', 'protect-folder/b.php' );
		return array(
			'inactive plugin is deleted'            => array( array( 'protect-delete-test.php' ), array(), 'protect-delete-test', true ),
			'active plugin is kept'                 => array( array( 'protect-delete-test.php' ), array( 'protect-delete-test.php' ), 'protect-delete-test', false ),
			'folder of inactive plugins is deleted' => array( $folder, array(), 'protect-folder', true ),
			'folder with an active plugin is kept'  => array( $folder, array( 'protect-folder/a.php' ), 'protect-folder', false ),
		);
	}

	/**
	 * Test that the route deletes an inactive plugin's files, but never a folder holding an active plugin.
	 *
	 * @dataProvider provider_delete_plugin
	 * @param string[] $files      Plugin files to install.
	 * @param string[] $active     The active ones.
	 * @param string   $slug       The plugin to delete.
	 * @param bool     $is_deleted Whether its files should be gone.
	 */
	#[DataProvider( 'provider_delete_plugin' )]
	public function test_delete_software_only_deletes_inactive_plugins( $files, $active, $slug, $is_deleted ) {
		foreach ( $files as $file ) {
			// wp_mkdir_p() refuses the test environment's plugin root, whose path has `..` in it.
			if ( ! is_dir( dirname( WP_PLUGIN_DIR . "/$file" ) ) ) {
				mkdir( dirname( WP_PLUGIN_DIR . "/$file" ), 0777, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
			}
			file_put_contents( WP_PLUGIN_DIR . "/$file", "<?php\n/**\n * Plugin Name: $file\n */\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		}
		wp_clean_plugins_cache( false );
		update_option( 'active_plugins', $active );

		$result = self::delete_as_admin( 'plugins', $slug );
		$exists = file_exists( WP_PLUGIN_DIR . '/' . $files[0] );
		foreach ( $files as $file ) {
			if ( file_exists( WP_PLUGIN_DIR . "/$file" ) ) {
				wp_delete_file( WP_PLUGIN_DIR . "/$file" );
			}
		}
		if ( is_dir( WP_PLUGIN_DIR . '/protect-folder' ) ) {
			rmdir( WP_PLUGIN_DIR . '/protect-folder' ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
		}

		$this->assertSame( $is_deleted, ! is_wp_error( $result ), 'Result' );
		$this->assertSame( $is_deleted, ! $exists, 'File' );
	}

	/**
	 * Test that the route answers with an error, and keeps the files, when WordPress would ask for filesystem credentials.
	 */
	public function test_delete_software_needs_direct_filesystem_access() {
		$file = WP_PLUGIN_DIR . '/protect-delete-test.php';
		wp_mkdir_p( WP_PLUGIN_DIR );
		file_put_contents( $file, "<?php\n/**\n * Plugin Name: Protect Delete Test\n */\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		wp_clean_plugins_cache( false );
		update_option( 'active_plugins', array() );
		$use_ftp = function () {
			return 'ftpext';
		};
		add_filter( 'filesystem_method', $use_ftp );

		$result = self::delete_as_admin( 'plugins', 'protect-delete-test' );
		remove_filter( 'filesystem_method', $use_ftp );
		$exists = file_exists( $file );
		wp_delete_file( $file );

		$this->assertSame( 'software_not_deleted', is_wp_error( $result ) ? $result->get_error_code() : null );
		$this->assertTrue( $exists );
	}

	/**
	 * Themes, and whether the route should delete each while a child theme is active.
	 *
	 * @return array[]
	 */
	public static function provider_delete_theme() {
		return array(
			'unused theme is deleted'         => array( 'protect-unused', true ),
			'active theme is kept'            => array( 'protect-child', false ),
			'parent of active theme is kept'  => array( 'protect-parent', false ),
			'path to an unused theme is kept' => array( './protect-unused', false ),
		);
	}

	/**
	 * Test that the route deletes an unused theme, but never the active theme or its parent.
	 *
	 * @dataProvider provider_delete_theme
	 * @param string $slug       The theme to delete.
	 * @param bool   $is_deleted Whether its directory should be gone.
	 */
	#[DataProvider( 'provider_delete_theme' )]
	public function test_delete_software_only_deletes_unused_themes( $slug, $is_deleted ) {
		$headers = array(
			'protect-parent' => '',
			'protect-child'  => "Template: protect-parent\n",
			'protect-unused' => '',
		);
		foreach ( $headers as $theme => $header ) {
			// wp_mkdir_p() refuses the test environment's theme root, whose path has `..` in it.
			if ( ! is_dir( get_theme_root() . "/$theme" ) ) {
				mkdir( get_theme_root() . "/$theme", 0777, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
			}
			file_put_contents( get_theme_root() . "/$theme/style.css", "/*\nTheme Name: $theme\n{$header}*/\n" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		}
		wp_clean_themes_cache( false );
		update_option( 'template', 'protect-parent' );
		update_option( 'stylesheet', 'protect-child' );

		$result = self::delete_as_admin( 'themes', $slug );
		$exists = is_dir( get_theme_root() . "/$slug" );
		foreach ( array_keys( $headers ) as $theme ) {
			if ( is_dir( get_theme_root() . "/$theme" ) ) {
				wp_delete_file( get_theme_root() . "/$theme/style.css" );
				rmdir( get_theme_root() . "/$theme" ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
			}
		}

		$this->assertSame( $is_deleted, ! is_wp_error( $result ), 'Result' );
		$this->assertSame( $is_deleted, ! $exists, 'Directory' );
	}

	/**
	 * Ask the delete route, as an administrator, to delete a plugin or theme.
	 *
	 * @param string $type `plugins` or `themes`.
	 * @param string $slug The plugin or theme.
	 * @return array|\WP_Error
	 */
	private static function delete_as_admin( $type, $slug ) {
		$admin_id = wp_insert_user(
			array(
				'user_login' => 'admin',
				'user_pass'  => 'pass',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin_id );

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/protect-dashboard/scan/software/delete' );
		$request->set_param( 'type', $type );
		$request->set_param( 'slug', $slug );
		return Scan::delete_software( $request );
	}

	/**
	 * Blog IDs, a filtered variant or null for none, and the variant the site starts on.
	 *
	 * @return array[]
	 */
	public static function provide_upsell_variants() {
		return array(
			'no blog ID'             => array( 0, null, 1 ),
			'blog ID 7'              => array( 7, null, 8 ),
			'blog ID 8 wraps around' => array( 8, null, 1 ),
			'forced by the filter'   => array( 7, 3, 3 ),
			'filtered out of range'  => array( 7, 9, 1 ),
		);
	}

	/**
	 * @dataProvider provide_upsell_variants
	 *
	 * @param int      $blog_id  The site's WordPress.com blog ID.
	 * @param int|null $filtered What the filter returns, or null for no filter.
	 * @param int      $expected The variant the site starts on.
	 */
	#[DataProvider( 'provide_upsell_variants' )]
	public function test_upsell_variant_spreads_sites_and_honors_the_filter( $blog_id, $filtered, $expected ) {
		\Jetpack_Options::update_option( 'id', $blog_id );
		if ( null !== $filtered ) {
			add_filter(
				'jetpack_protect_dashboard_scan_upsell_variant',
				function () use ( $filtered ) {
					return $filtered;
				}
			);
		}

		$this->assertSame( $expected, Scan::get_upsell_variant() );
	}

	/**
	 * Cached Scan reports, or null for none, and whether Scan has server credentials.
	 *
	 * @return array[]
	 */
	public static function provide_credentials() {
		return array(
			'no cached report'     => array( null, null ),
			'report without field' => array( (object) array( 'state' => 'idle' ), null ),
			'no credentials'       => array( (object) array( 'credentials' => array() ), false ),
			'managed credentials'  => array( (object) array( 'credentials' => array( (object) array( 'type' => 'managed' ) ) ), true ),
		);
	}

	/**
	 * @dataProvider provide_credentials
	 *
	 * @param object|null $report   The cached Scan report.
	 * @param bool|null   $expected Whether Scan has server credentials.
	 */
	#[DataProvider( 'provide_credentials' )]
	public function test_credentials_are_read_from_the_cached_report( $report, $expected ) {
		if ( null !== $report ) {
			update_option( \Automattic\Jetpack\Protect_Status\Scan_Status::OPTION_NAME, maybe_serialize( $report ) );
		}

		$this->assertSame( $expected, self::call( 'has_credentials' ) );
	}

	/**
	 * Report states with no scan on record, and whether the page should show a scan running.
	 *
	 * @return array[]
	 */
	public static function provide_never_scanned_states() {
		return array(
			'Scan idle, no scan queued'         => array( true, 'idle', false ),
			'Scan unavailable, plan just added' => array( true, 'unavailable', true ),
			'free report idle, not built yet'   => array( false, 'idle', true ),
		);
	}

	/**
	 * @dataProvider provide_never_scanned_states
	 *
	 * @param bool   $has_plan Whether the site has a Scan plan.
	 * @param string $state    The state WordPress.com reports.
	 * @param bool   $scanning Whether the report says a scan is running.
	 */
	#[DataProvider( 'provide_never_scanned_states' )]
	public function test_a_site_with_no_scan_on_record_reads_as_scanning_only_while_setting_up( $has_plan, $state, $scanning ) {
		Scan_Status::$status = new Status_Model( array( 'status' => $state ) );

		$report = self::call( 'get_scan_report', $has_plan );

		$this->assertSame( $scanning, $report['scanning'] );
		$this->assertNull( $report['lastChecked'] );
	}

	/**
	 * Threats whose row the dashboard must not read, by threat id and table.
	 *
	 * @return array[]
	 */
	public static function provider_find_threat_row_refuses() {
		global $wpdb;
		return array(
			'an id Scan did not report' => array( '2', $wpdb->options ),
			'a table outside the site'  => array( '1', 'information_schema.tables' ),
			'the shared users table'    => array( '1', $wpdb->users ),
		);
	}

	/**
	 * Test that only the rows of current threats, in the site's own tables, can be reached.
	 *
	 * @dataProvider provider_find_threat_row_refuses
	 * @param string $id    The requested threat id.
	 * @param string $table The table the reported threat names.
	 */
	#[DataProvider( 'provider_find_threat_row_refuses' )]
	public function test_find_threat_row_refuses( $id, $table ) {
		Scan_Status::$status = new Status_Model(
			array(
				'threats' => array(
					new Threat_Model(
						array(
							'id'      => '1',
							'details' => (object) array(
								'table'     => $table,
								'pk_column' => 'option_id',
								'pk_value'  => '315',
							),
						)
					),
				),
			)
		);

		$found = self::call( 'find_threat_row', $id );

		$this->assertInstanceOf( \WP_Error::class, $found );
		$this->assertSame( 'threat_row_not_found', $found->get_error_code() );
	}

	/**
	 * Rows a threat was found in, and the option name the dashboard may delete.
	 *
	 * @return array[]
	 */
	public static function provider_get_deletable_option() {
		global $wpdb;
		$row = static function ( $name ) {
			return array( 'option_name' => $name );
		};
		return array(
			'a flagged option'                    => array( $wpdb->options, 'option_id', $row( '_wpc_ak' ), '_wpc_ak', '_wpc_ak' ),
			'an option the site needs'            => array( $wpdb->options, 'option_id', $row( 'active_plugins' ), null, null ),
			'a row in another table'              => array( $wpdb->posts, 'ID', $row( '_wpc_ak' ), null, null ),
			'a name delete_option() would trim'   => array( $wpdb->options, 'option_id', $row( ' _wpc_ak' ), null, null ),
			'a key that now holds another option' => array( $wpdb->options, 'option_id', $row( '_wpc_ak' ), '_wpc_uid', null ),
		);
	}

	/**
	 * Test that only ordinary options can be deleted from the dashboard.
	 *
	 * @dataProvider provider_get_deletable_option
	 * @param string      $table     The row's table.
	 * @param string      $pk_column The table's key column.
	 * @param array       $row       The row.
	 * @param string|null $flagged   The option name Scan reported, if any.
	 * @param string|null $expected  The deletable option's name.
	 */
	#[DataProvider( 'provider_get_deletable_option' )]
	public function test_get_deletable_option( $table, $pk_column, $row, $flagged, $expected ) {
		$found = array(
			'threat'    => new Threat_Model( array( 'details' => (object) array( 'details' => (object) array( 'option_name' => $flagged ) ) ) ),
			'table'     => $table,
			'pk_column' => $pk_column,
			'row'       => $row,
		);

		$this->assertSame( $expected, self::call( 'get_deletable_option', $found ) );
	}

	/**
	 * Report a threat in option row 315, `_wpc_ak`, and answer its lookup the way MySQL would, as WorDBless has no tables.
	 *
	 * @param string $value The option's value.
	 * @return WP_REST_Request A request naming the threat.
	 */
	private static function flag_option_row( $value ) {
		global $wpdb;
		Scan_Status::$status = new Status_Model(
			array(
				'threats' => array(
					new Threat_Model(
						array(
							'id'      => '7',
							'details' => (object) array(
								'table'     => $wpdb->options,
								'pk_column' => 'option_id',
								'pk_value'  => '315',
								'details'   => (object) array( 'option_name' => '_wpc_ak' ),
							),
						)
					),
				),
			)
		);
		self::$row_lookup    = function ( $results, $query ) use ( $value ) {
				$row = array(
					'option_id'    => '315',
					'option_name'  => '_wpc_ak',
					'option_value' => $value,
				);
				return false !== strpos( $query, '`option_id` = \'315\'' ) ? array( (object) $row ) : $results;
		};
		add_filter( 'wordbless_wpdb_query_results', self::$row_lookup, 10, 2 );

		$request = new WP_REST_Request( 'GET', '/jetpack/v4/protect-dashboard/scan/threats/7/row' );
		$request->set_url_params( array( 'id' => '7' ) );
		return $request;
	}

	/**
	 * Test that a long value is cut by characters, so a multibyte one stays valid UTF-8 for the JSON response.
	 */
	public function test_get_threat_row_cuts_long_values_by_characters() {
		$response = Scan::get_threat_row( self::flag_option_row( str_repeat( 'é', Scan::ROW_VALUE_LIMIT + 1 ) ) );

		$this->assertSame( str_repeat( 'é', Scan::ROW_VALUE_LIMIT ) . '…', $response['columns']->option_value );
		$this->assertTrue( $response['canDelete'] );
	}

	/**
	 * Test that deleting a flagged option removes it and lists its threat as fixed in History.
	 */
	public function test_delete_threat_row_deletes_the_option_and_marks_the_threat_fixed() {
		add_option( '_wpc_ak', 'malicious' );
		set_transient( Scan::HISTORY_CACHE, array(), MINUTE_IN_SECONDS );

		$response = Scan::delete_threat_row( self::flag_option_row( 'malicious' ) );

		$this->assertFalse( get_option( '_wpc_ak' ) );
		$this->assertSame( 'fixed', $response['threat']['status'] );
		$this->assertSame( array( 'fixed' ), array_column( Scan::get_history_threats(), 'status' ) );
		delete_option( Dashboard_Threats::RESOLVED_OPTION );
	}

	/**
	 * Write a test file, removed after the test.
	 *
	 * @param string $path     The path.
	 * @param string $contents The contents.
	 */
	private function write_file( $path, $contents = '<?php' ) {
		if ( ! is_dir( dirname( $path ) ) ) {
			mkdir( dirname( $path ), 0777, true ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_mkdir
		}
		file_put_contents( $path, $contents ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_file_put_contents
		$this->files[] = $path;
	}

	/**
	 * A path as Scan reports it, with `{root}`, `{content}` and `{uploads}` standing for the site root's, content directory's and uploads folder's names.
	 *
	 * @param string $path The path with placeholders.
	 * @return string
	 */
	private static function scan_path( $path ) {
		return str_replace( array( '{root}', '{content}', '{uploads}' ), array( basename( realpath( dirname( WP_CONTENT_DIR ) ) ), basename( WP_CONTENT_DIR ), basename( self::uploads_dir() ) ), $path );
	}

	/**
	 * The uploads folder, which the bootstrap gives Protect alone.
	 *
	 * @return string
	 */
	private static function uploads_dir() {
		return wp_upload_dir( null, false )['basedir'];
	}

	/**
	 * View, then delete or restore, the uploaded test file of a threat History lists, as the viewer would.
	 *
	 * @param string      $status     The threat's status in History.
	 * @param string|null $changed_to What the file is changed to after it was viewed.
	 * @param array       $current    Scan's current threats.
	 * @param array[]     $history    Other threats History lists.
	 * @param string      $action     `delete` or `restore`.
	 * @return array|\WP_Error The response.
	 */
	private function act_on_history_threat_file( $status, $changed_to = null, $current = array(), $history = array(), $action = 'delete' ) {
		// Invalid UTF-8, which the viewer scrubs from what it shows but not from what it hashes.
		$this->write_file( self::uploads_dir() . '/protect-threat-file.php', "<?php // \xff" );
		Scan_Status::$status = new Status_Model( array( 'threats' => $current ) );
		$threat              = array(
			'id'       => 9,
			'status'   => $status,
			'filename' => self::scan_path( '/{root}/{content}/{uploads}/protect-threat-file.php' ),
		);
		set_transient( Scan::HISTORY_CACHE, array_merge( array( $threat ), $history ), MINUTE_IN_SECONDS );
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/protect-dashboard/scan/threats/9/file' );
		$request->set_url_params( array( 'id' => '9' ) );
		$shown = Scan::get_threat_file( $request );
		if ( null !== $changed_to ) {
			$this->write_file( self::uploads_dir() . '/protect-threat-file.php', $changed_to );
		}
		$request = new WP_REST_Request( 'POST', "/jetpack/v4/protect-dashboard/scan/threats/9/file/$action" );
		$request->set_url_params( array( 'id' => '9' ) );
		$request->set_param( 'hash', $shown['hash'] );
		return 'restore' === $action ? Scan::restore_threat_file( $request ) : Scan::delete_threat_file( $request );
	}

	/**
	 * Test that deleting an ignored threat's file moves it from Ignored to History as fixed.
	 */
	public function test_delete_threat_file_marks_an_ignored_threat_fixed() {
		$response = $this->act_on_history_threat_file( 'ignored' );

		$this->assertFileDoesNotExist( self::uploads_dir() . '/protect-threat-file.php' );
		$this->assertSame( 'fixed', $response['threat']['status'] );
		$this->assertSame( array(), Scan::get_ignored_threats() );
		$this->assertSame( array( 'fixed' ), array_column( Scan::get_history_threats(), 'status' ) );
		delete_option( Dashboard_Threats::RESOLVED_OPTION );
	}

	public function test_delete_threat_file_marks_the_file_s_other_threats_fixed() {
		$in_file = self::scan_path( '/{root}/{content}/{uploads}/protect-threat-file.php' );
		$current = array(
			new Threat_Model(
				array(
					'id'       => 11,
					'filename' => $in_file,
				)
			),
			new Threat_Model(
				array(
					'id'       => 12,
					'filename' => self::scan_path( '/{root}/{content}/{uploads}/elsewhere.php' ),
				)
			),
		);
		$history = array(
			array(
				'id'       => 10,
				'status'   => 'ignored',
				'filename' => $in_file,
			),
		);

		$response = $this->act_on_history_threat_file( 'ignored', null, $current, $history );

		$this->assertEqualsCanonicalizing( array( 11, 10 ), $response['others'] );
		$this->assertEqualsCanonicalizing( array( '9', '10', '11' ), array_map( 'strval', array_keys( Dashboard_Threats::get_resolved() ) ) );
	}

	public function test_restore_threat_file_refuses_a_file_that_is_not_changed_core() {
		$response = $this->act_on_history_threat_file( 'ignored', null, array(), array(), 'restore' );

		$this->assertSame( 'threat_file_not_restorable', $response->get_error_code() );
		$this->assertSame( "<?php // \xff", file_get_contents( self::uploads_dir() . '/protect-threat-file.php' ) ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents
		$this->assertSame( array(), Dashboard_Threats::get_resolved() );
	}

	/**
	 * Files the viewer won't show, by what they hold.
	 *
	 * @return array[]
	 */
	public static function provide_unviewable_files() {
		return array(
			'larger than the viewer shows' => array( '<?php // ' . str_repeat( 'x', Scan::MAX_FILE_BYTES ), 'threat_file_too_large' ),
			'binary'                       => array( "<?php // \0", 'threat_file_binary' ),
		);
	}

	/**
	 * @dataProvider provide_unviewable_files
	 *
	 * @param string $contents The file's contents.
	 * @param string $expected The error code.
	 */
	#[DataProvider( 'provide_unviewable_files' )]
	public function test_get_threat_file_refuses_files_it_cannot_show( $contents, $expected ) {
		$this->write_file( self::uploads_dir() . '/protect-threat-file.php', $contents );
		Scan_Status::$status = new Status_Model( array( 'threats' => array() ) );
		set_transient(
			Scan::HISTORY_CACHE,
			array(
				array(
					'id'       => 9,
					'status'   => 'ignored',
					'filename' => self::scan_path( '/{root}/{content}/{uploads}/protect-threat-file.php' ),
				),
			),
			MINUTE_IN_SECONDS
		);
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/protect-dashboard/scan/threats/9/file' );
		$request->set_url_params( array( 'id' => '9' ) );

		$this->assertSame( $expected, Scan::get_threat_file( $request )->get_error_code() );
	}

	/**
	 * Threats looked up while WordPress.com can't answer for history, and what the viewer gets.
	 *
	 * @return array[]
	 */
	public static function provide_lookups_without_history() {
		return array(
			'ignored threat'    => array( false, 'threat_history_unavailable' ),
			'threat site fixed' => array( true, null ),
		);
	}

	/**
	 * @dataProvider provide_lookups_without_history
	 *
	 * @param bool        $fixed    Whether the site marked the threat fixed itself.
	 * @param string|null $expected The error code, or null when the file is shown.
	 */
	#[DataProvider( 'provide_lookups_without_history' )]
	public function test_get_threat_file_without_history( $fixed, $expected ) {
		$this->write_file( self::uploads_dir() . '/protect-threat-file.php' );
		Scan_Status::$status = new Status_Model( array( 'threats' => array() ) );
		if ( $fixed ) {
			Dashboard_Threats::resolve(
				array(
					'id'       => 9,
					'filename' => self::scan_path( '/{root}/{content}/{uploads}/protect-threat-file.php' ),
				)
			);
		}
		$fail = function () {
			return new \WP_Error( 'offline' );
		};
		add_filter( 'pre_http_request', $fail );
		$request = new WP_REST_Request( 'GET', '/jetpack/v4/protect-dashboard/scan/threats/9/file' );
		$request->set_url_params( array( 'id' => '9' ) );

		$response = Scan::get_threat_file( $request );

		$this->assertSame( $expected, is_wp_error( $response ) ? $response->get_error_code() : null );
	}

	public function test_delete_threat_file_refuses_when_history_cannot_name_the_file_s_ignored_threats() {
		$this->write_file( self::uploads_dir() . '/protect-threat-file.php' );
		Scan_Status::$status = new Status_Model(
			array(
				'threats' => array(
					new Threat_Model(
						array(
							'id'       => 9,
							'filename' => self::scan_path( '/{root}/{content}/{uploads}/protect-threat-file.php' ),
						)
					),
				),
			)
		);
		$request             = new WP_REST_Request( 'GET', '/jetpack/v4/protect-dashboard/scan/threats/9/file' );
		$request->set_url_params( array( 'id' => '9' ) );
		$hash = Scan::get_threat_file( $request )['hash'];
		add_filter(
			'pre_http_request',
			function () {
				return new \WP_Error( 'offline' );
			}
		);
		$request = new WP_REST_Request( 'POST', '/jetpack/v4/protect-dashboard/scan/threats/9/file/delete' );
		$request->set_url_params( array( 'id' => '9' ) );
		$request->set_param( 'hash', $hash );

		$this->assertSame( 'threat_history_unavailable', Scan::delete_threat_file( $request )->get_error_code() );
		$this->assertFileExists( self::uploads_dir() . '/protect-threat-file.php' );
	}

	/**
	 * Why deleting a file is refused: a fixed threat, a file changed since the viewer showed it, or one WordPress won't let go.
	 *
	 * @return array[]
	 */
	public static function provide_refused_deletes() {
		return array(
			'threat already fixed'           => array( 'fixed', null, 'threat_not_open' ),
			'file changed since it was seen' => array( 'ignored', '<?php echo 1;', 'threat_file_changed' ),
			'file changes turned off'        => array( 'ignored', null, 'threat_file_not_deletable', false ),
		);
	}

	/**
	 * @dataProvider provide_refused_deletes
	 *
	 * @param string      $status     The threat's status in History.
	 * @param string|null $changed_to What the file is changed to after it was viewed.
	 * @param string      $expected   The error code.
	 * @param bool        $file_mods  Whether WordPress allows file changes.
	 */
	#[DataProvider( 'provide_refused_deletes' )]
	public function test_delete_threat_file_refuses_and_keeps_the_file( $status, $changed_to, $expected, $file_mods = true ) {
		if ( ! $file_mods ) {
			add_filter( 'file_mod_allowed', '__return_false' );
		}
		$response = $this->act_on_history_threat_file( $status, $changed_to );
		remove_filter( 'file_mod_allowed', '__return_false' );

		$this->assertSame( $expected, $response->get_error_code() );
		$this->assertFileExists( self::uploads_dir() . '/protect-threat-file.php' );
	}

	/**
	 * Scan paths, which start from Scan's own root, and whether each resolves to the test file.
	 *
	 * @return array[]
	 */
	public static function provide_threat_files() {
		return array(
			'Scan root above ours'                => array( 'uploads', '/{root}/{content}/{uploads}/protect-threat-file.php', true ),
			'deleted plugin file, same basename'  => array( 'uploads', '/{root}/{content}/plugins/gone/protect-threat-file.php', false ),
			'nested copy of the site'             => array( 'uploads', '/{root}/staging/{content}/{uploads}/protect-threat-file.php', false ),
			'Scan root unrelated to ours'         => array( 'uploads', '/var/www/elsewhere/{content}/{uploads}/protect-threat-file.php', false ),
			'traversal out of the site'           => array( 'uploads', '/{root}/{content}/../../../../../../../etc/passwd', false ),
			'file in the site root'               => array( 'root', '/{root}/protect-threat-file.php', true ),
			'deleted folder, same basename above' => array( 'root', '/{root}/gone/protect-threat-file.php', false ),
			'through a symlinked plugin folder'   => array( 'linked', '/{root}/{content}/plugins/protect-linked/protect-threat-file.php', false ),
		);
	}

	/**
	 * @dataProvider provide_threat_files
	 *
	 * @param string $where    Where the test file is: `uploads`, the site `root`, or uploads `linked` as a plugin folder.
	 * @param string $filename The path as Scan reports it.
	 * @param bool   $is_found Whether it resolves to the test file.
	 */
	#[DataProvider( 'provide_threat_files' )]
	public function test_threat_files_are_found_only_inside_the_site( $where, $filename, $is_found ) {
		$dir = 'root' === $where ? dirname( WP_CONTENT_DIR ) : self::uploads_dir();
		$this->write_file( "$dir/protect-threat-file.php" );
		if ( 'linked' === $where ) {
			symlink( $dir, WP_PLUGIN_DIR . '/protect-linked' );
			$this->files[] = WP_PLUGIN_DIR . '/protect-linked';
		}

		$path = self::call( 'locate_threat_file', self::scan_path( $filename ) );

		$this->assertSame( $is_found ? realpath( $dir ) . '/protect-threat-file.php' : null, $path );
	}
}
