<?php
/**
 * Column-rename migration test.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

/**
 * Verifies customer_id -> user_id rename for fresh and existing installs.
 */
class Consent_Log_Migration_Test extends TestCase {

	/**
	 * Don't auto-create the table; these tests control the schema.
	 */
	protected function create_consent_table() {}

	/**
	 * Fresh install creates the table with a user_id column.
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

	/**
	 * Upgrading an install with the old column renames it and keeps data.
	 */
	public function test_migration_renames_customer_id_and_preserves_data() {
		global $wpdb;
		$table = Consent_Log_Controller::get_table_name();

		// Simulate the pre-0.0.2 schema with the old column name + a row.
		$wpdb->query( "DROP TABLE IF EXISTS {$table}" ); // phpcs:ignore WordPress.DB
		// phpcs:disable WordPress.DB
		$wpdb->query(
			"CREATE TABLE {$table} (
				id bigint(20) UNSIGNED NOT NULL AUTO_INCREMENT,
				event_type varchar(50) NOT NULL,
				customer_id bigint(20) UNSIGNED NOT NULL DEFAULT 0,
				ip_address varchar(45) DEFAULT NULL,
				date_created datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
				date_created_gmt datetime NOT NULL DEFAULT '0000-00-00 00:00:00',
				PRIMARY KEY (id)
			)"
		);
		// phpcs:enable WordPress.DB
		$wpdb->query( "INSERT INTO {$table} (event_type, customer_id) VALUES ('accept_all', 42)" ); // phpcs:ignore WordPress.DB
		update_option( 'jetpack_cookie_consent_consent_log_db_version', '0.0.1' );

		Consent_Log_Controller::init()->maybe_create_table();

		$columns = $wpdb->get_col( "DESCRIBE {$table}" ); // phpcs:ignore WordPress.DB
		$this->assertContains( 'user_id', $columns );
		$this->assertNotContains( 'customer_id', $columns );

		$value = $wpdb->get_var( "SELECT user_id FROM {$table} WHERE event_type = 'accept_all'" ); // phpcs:ignore WordPress.DB
		$this->assertEquals( 42, $value );
	}
}
