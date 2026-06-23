<?php
/**
 * Base TestCase for the cookie-consent package.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

use PHPUnit\Framework\TestCase as PHPUnit_TestCase;
use WorDBless\Options as WorDBless_Options;
use WorDBless\Users as WorDBless_Users;

/**
 * Base TestCase: resets WorDBless state between tests. Consent-table helpers
 * are added in Task 2 once the schema and the static get_table_name() exist.
 */
abstract class TestCase extends PHPUnit_TestCase {

	/**
	 * Set up: clear WorDBless state.
	 */
	public function setUp(): void {
		parent::setUp();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		wp_set_current_user( 0 );
		$this->create_consent_table();
	}

	/**
	 * Tear down: clear WorDBless state.
	 */
	public function tearDown(): void {
		parent::tearDown();
		WorDBless_Options::init()->clear_options();
		WorDBless_Users::init()->clear_all_users();
		wp_set_current_user( 0 );
	}

	/**
	 * Create the consent-log table via the controller. Overridable so schema
	 * tests can control table creation themselves.
	 */
	protected function create_consent_table() {
		delete_option( 'jetpack_cookie_consent_consent_log_db_version' );
		Consent_Log_Controller::init()->maybe_create_table();
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
