<?php
/**
 * Consent-log schema test.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

/**
 * Verifies the consent-log table is created with the expected schema.
 */
class Consent_Log_Schema_Test extends TestCase {

	/**
	 * Don't auto-create the table; this test controls table creation itself.
	 */
	protected function create_consent_table() {}

	/**
	 * A fresh install creates the table with a user_id column (not customer_id).
	 */
	public function test_fresh_install_has_user_id_column() {
		global $wpdb;
		delete_option( 'jetpack_cookie_consent_consent_log_db_version' );
		Consent_Log_Controller::init()->maybe_create_table();

		$table   = Consent_Log_Controller::get_table_name();
		$columns = $wpdb->get_col( "DESCRIBE {$table}" ); // phpcs:ignore WordPress.DB

		$this->assertContains( 'user_id', $columns );
		$this->assertNotContains( 'customer_id', $columns );
	}
}
