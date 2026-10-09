<?php
/**
 * Tests for the Protect dashboard's Scan section.
 *
 * @package automattic/jetpack-protect
 */

namespace Automattic\Jetpack\Protect;

use Automattic\Jetpack\Protect\Sections\Scan;
use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Protect\Sections\Scan
 */
#[CoversClass( Scan::class )]
class Scan_Section_Test extends BaseTestCase {

	/**
	 * Release the scan request lock between tests.
	 */
	public function tear_down() {
		delete_transient( Scan::REQUEST_LOCK );
		delete_transient( Scan::HISTORY_CACHE );
		wp_set_current_user( 0 );
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
}
