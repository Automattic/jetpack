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
	 * Software the route is asked to delete, and the error it answers with, if any.
	 *
	 * @return array[]
	 */
	public static function provider_delete_software() {
		$slug = 'protect-delete-test';
		return array(
			'inactive plugin is deleted'               => array( 'plugins', $slug, array(), null ),
			'active plugin is kept'                    => array( 'plugins', $slug, array( 'active' => $slug ), 'software_not_deletable' ),
			'plugin is kept from a user who cannot'    => array( 'plugins', $slug, array( 'role' => 'editor' ), 'software_not_deletable' ),
			'plugin is kept without filesystem access' => array( 'plugins', $slug, array( 'filesystem' => 'ftpext' ), 'software_not_deleted' ),
			'unused theme is deleted'                  => array( 'themes', $slug, array(), null ),
			'active theme is kept'                     => array( 'themes', $slug, array( 'active' => $slug ), 'software_not_deletable' ),
			'parent of the active theme is kept'       => array( 'themes', $slug, array( 'parent' => $slug ), 'software_not_deletable' ),
			'theme is kept when the slug is a path'    => array( 'themes', './' . $slug, array(), 'software_not_deletable' ),
		);
	}

	/**
	 * Test that the route deletes only software the site doesn't use, named by its own slug, for a user who may.
	 *
	 * @dataProvider provider_delete_software
	 * @param string      $type  The plural extension type.
	 * @param string      $slug  The slug the request names.
	 * @param array       $site  What differs from an administrator deleting unused software: `active`, `parent`, `role` or `filesystem`.
	 * @param string|null $error The expected error code, or null when the files should be gone.
	 */
	#[DataProvider( 'provider_delete_software' )]
	public function test_delete_software( $type, $slug, $site, $error ) {
		$plugin    = WP_PLUGIN_DIR . '/protect-delete-test.php';
		$theme_dir = get_theme_root() . '/protect-delete-test';
		$file      = 'plugins' === $type ? $plugin : $theme_dir . '/style.css';
		wp_mkdir_p( WP_PLUGIN_DIR );
		// phpcs:disable WordPress.WP.AlternativeFunctions
		mkdir( $theme_dir, 0777, true ); // wp_mkdir_p() refuses the `../` in WorDBless's content path.
		file_put_contents( $plugin, "<?php\n/**\n * Plugin Name: Protect Delete Test\n */\n" );
		file_put_contents( $theme_dir . '/style.css', "/*\nTheme Name: Protect Delete Test\n*/\n" );
		file_put_contents( $theme_dir . '/index.php', "<?php\n" );
		// phpcs:enable
		register_theme_directory( get_theme_root() );
		wp_clean_plugins_cache( false );
		wp_clean_themes_cache( false );
		update_option( 'active_plugins', isset( $site['active'] ) ? array( $site['active'] . '.php' ) : array() );
		update_option( 'stylesheet', $site['active'] ?? 'protect-other-theme' );
		update_option( 'template', $site['active'] ?? $site['parent'] ?? 'protect-other-theme' );
		$filesystem = function () use ( $site ) {
			return $site['filesystem'] ?? 'direct';
		};
		add_filter( 'filesystem_method', $filesystem );
		$user_id = wp_insert_user(
			array(
				'user_login' => 'user',
				'user_pass'  => 'pass',
				'role'       => $site['role'] ?? 'administrator',
			)
		);
		wp_set_current_user( $user_id );

		$request = new \WP_REST_Request( 'POST', '/jetpack/v4/protect-dashboard/scan/software/delete' );
		$request->set_param( 'type', $type );
		$request->set_param( 'slug', $slug );
		$result = Scan::delete_software( $request );
		$exists = file_exists( $file );
		remove_filter( 'filesystem_method', $filesystem );
		array_map( 'wp_delete_file', array_filter( array( $plugin, $theme_dir . '/style.css', $theme_dir . '/index.php' ), 'file_exists' ) );
		if ( is_dir( $theme_dir ) ) {
			rmdir( $theme_dir ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_operations_rmdir
		}

		$this->assertSame( $error, is_wp_error( $result ) ? $result->get_error_code() : null, 'Result' );
		$this->assertSame( null === $error, ! $exists, 'File' );
	}
}
