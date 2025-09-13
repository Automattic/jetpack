<?php
/**
 * Unit tests for the Jetpack_Backup class.
 *
 * @package automattic/jetpack-backup
 */

namespace Automattic\Jetpack\Backup\V0005;

use PHPUnit\Framework\TestCase;
use WP_Error;

class Jetpack_Backup_Test extends TestCase {

	public function test_get_backup_capabilities_handles_wp_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = Jetpack_Backup::get_backup_capabilities();

		$this->assertNull( $result );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );
	}

	public function test_get_recent_backups_handles_wp_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = Jetpack_Backup::get_recent_backups();

		$this->assertNull( $result );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );
	}

	public function test_get_recent_restores_handles_wp_error() {
		add_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );

		$result = Jetpack_Backup::get_recent_restores();

		$this->assertNull( $result );

		remove_filter( 'pre_http_request', array( $this, 'mock_request_as_wp_error' ) );
	}

	/**
	 * Mock the HTTP request to return a WP_Error.
	 *
	 * @return WP_Error
	 */
	public function mock_request_as_wp_error() {
		return new WP_Error( 'http_request_failed', 'The request failed.' );
	}
}
