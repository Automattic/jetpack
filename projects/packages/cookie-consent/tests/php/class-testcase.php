<?php
/**
 * Base TestCase for the cookie-consent package.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\TestCase as PHPUnit_TestCase;

/**
 * Base TestCase: resets database state between tests and provides consent-log
 * table/row helpers (create_consent_table, insert_consent_row).
 */
abstract class TestCase extends PHPUnit_TestCase {

	/**
	 * Set up: reset database state.
	 */
	public function setUp(): void {
		parent::setUp();
		$this->reset_state();
		$this->create_consent_table();
	}

	/**
	 * Tear down: reset database state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		$this->reset_state();
	}

	/**
	 * Reset state between tests.
	 *
	 * The suite runs on the sqlite engine (the consent-log tests need real
	 * tables), which persists across tests, so WorDBless' in-memory clears are
	 * no-ops here. Truncate the real tables and drop the package's options
	 * directly instead, then flush the object cache so reads don't return
	 * already-deleted rows.
	 */
	private function reset_state() {
		global $wpdb;
		// phpcs:disable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		$wpdb->query( "DELETE FROM {$wpdb->posts}" );
		$wpdb->query( "DELETE FROM {$wpdb->postmeta}" );
		$wpdb->query( "DELETE FROM {$wpdb->options} WHERE option_name LIKE 'jetpack_cookie_consent_%'" );
		// phpcs:enable WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared, WordPress.DB.PreparedSQL.InterpolatedNotPrepared
		wp_cache_flush();
		wp_set_current_user( 0 );
	}

	/**
	 * Create the consent-log table via the controller. Overridable so schema
	 * tests can control table creation themselves.
	 */
	protected function create_consent_table() {
		delete_option( 'jetpack_cookie_consent_consent_log_db_version' );
		Consent_Log_Controller::init()->maybe_create_table();
		global $wpdb;
		$wpdb->query( 'DELETE FROM ' . Consent_Log_Controller::get_table_name() ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery, WordPress.DB.DirectDatabaseQuery.NoCaching, WordPress.DB.PreparedSQL.NotPrepared
	}

	/**
	 * Insert one consent-log row. Returns the inserted row id.
	 *
	 * @param array $overrides Column overrides.
	 * @return int
	 */
	protected function insert_consent_row( array $overrides = array() ) {
		global $wpdb;
		$defaults = array(
			'consent_id'       => wp_generate_uuid4(),
			'event_type'       => 'accept_all',
			'user_id'          => 0,
			'ip_address'       => '203.0.113.1',
			'url'              => 'https://example.com/',
			'consent_types'    => wp_json_encode( array( 'analytics' => true ), JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE ),
			'date_created'     => '2026-06-01 00:00:00',
			'date_created_gmt' => '2026-06-01 00:00:00',
		);
		$row      = array_merge( $defaults, $overrides );
		$wpdb->insert( Consent_Log_Controller::get_table_name(), $row ); // phpcs:ignore WordPress.DB.DirectDatabaseQuery.DirectQuery
		return (int) $wpdb->insert_id;
	}
}
