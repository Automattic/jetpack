<?php
/**
 * Eraser tests.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

/**
 * Covers Consent_Log_Privacy::erase().
 */
class Consent_Log_Privacy_Eraser_Test extends TestCase {

	/**
	 * Create a user and return [ user_id, email ].
	 *
	 * Returns the existing user when the login already exists in the SQLite
	 * database (wp_insert_user would return WP_Error in that case).
	 *
	 * @return array
	 */
	private function make_user() {
		$email      = 'subject@example.com';
		$user_login = 'subject';

		$existing = get_user_by( 'login', $user_login );
		if ( $existing ) {
			return array( (int) $existing->ID, $email );
		}

		$id = wp_insert_user(
			array(
				'user_login' => $user_login,
				'user_pass'  => 'pw',
				'user_email' => $email,
			)
		);
		return array( (int) $id, $email );
	}

	/**
	 * Count rows still matching a user id.
	 *
	 * @param int $user_id User id.
	 * @return int
	 */
	private function rows_for_user( $user_id ) {
		global $wpdb;
		$table = Consent_Log_Controller::get_table_name();
		return (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$table} WHERE user_id = %d", $user_id ) ); // phpcs:ignore WordPress.DB
	}

	/**
	 * Unknown email erases nothing and is done.
	 */
	public function test_erase_unknown_email_removes_nothing() {
		$result = Consent_Log_Privacy::erase( 'nobody@example.com', 1 );
		$this->assertFalse( $result['items_removed'] );
		$this->assertFalse( $result['items_retained'] );
		$this->assertTrue( $result['done'] );
	}

	/**
	 * Default mode anonymizes: clears IP and zeroes user_id, row survives.
	 */
	public function test_erase_default_anonymizes() {
		global $wpdb;
		list( $user_id, $email ) = $this->make_user();
		$id                      = $this->insert_consent_row(
			array(
				'user_id'    => $user_id,
				'ip_address' => '203.0.113.9',
			)
		);

		$result = Consent_Log_Privacy::erase( $email, 1 );

		$this->assertTrue( $result['items_removed'] );
		$this->assertTrue( $result['items_retained'] );
		$this->assertTrue( $result['done'] );
		$this->assertSame( 0, $this->rows_for_user( $user_id ) );

		$table = Consent_Log_Controller::get_table_name();
		$ip    = $wpdb->get_var( $wpdb->prepare( "SELECT ip_address FROM {$table} WHERE id = %d", $id ) ); // phpcs:ignore WordPress.DB
		$this->assertNull( $ip );
		$still = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$table} WHERE id = %d", $id ) ); // phpcs:ignore WordPress.DB
		$this->assertSame( 1, $still );
	}

	/**
	 * Delete mode hard-deletes the rows.
	 */
	public function test_erase_delete_mode_removes_rows() {
		list( $user_id, $email ) = $this->make_user();
		$this->insert_consent_row( array( 'user_id' => $user_id ) );

		$cb = static function () {
			return 'delete';
		};
		add_filter( 'jetpack_cookie_consent_erase_mode', $cb );
		$result = Consent_Log_Privacy::erase( $email, 1 );
		remove_filter( 'jetpack_cookie_consent_erase_mode', $cb );

		$this->assertTrue( $result['items_removed'] );
		$this->assertFalse( $result['items_retained'] );
		$this->assertTrue( $result['done'] );

		global $wpdb;
		$table = Consent_Log_Controller::get_table_name();
		$total = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" ); // phpcs:ignore WordPress.DB
		$this->assertSame( 0, $total );
	}

	/**
	 * Eraser converges for subjects with more than PER_PAGE (100) rows.
	 *
	 * Core increments $page on each call but the eraser must always process
	 * the un-erased HEAD of the set (page 1 / offset 0) because each pass
	 * anonymizes and thereby removes those rows from the WHERE user_id = N
	 * result set. This drives iteration to convergence without skipping rows.
	 */
	public function test_erase_converges_for_more_than_100_rows() {
		list( $user_id, $email ) = $this->make_user();

		// Insert 150 rows for the subject.
		for ( $i = 0; $i < 150; $i++ ) {
			$this->insert_consent_row( array( 'user_id' => $user_id ) );
		}

		$page      = 1;
		$max_pages = 10;
		$done      = false;

		while ( ! $done && $page <= $max_pages ) {
			$result = Consent_Log_Privacy::erase( $email, $page );
			$done   = $result['done'];
			++$page;
		}

		$this->assertTrue( $done, 'Eraser did not converge within 10 passes — possible infinite loop.' );
		$this->assertSame( 0, $this->rows_for_user( $user_id ), 'All rows must be anonymized (user_id zeroed).' );
		// 150 rows at 100 per pass requires exactly 2 passes.
		$this->assertSame( 3, $page, 'Expected convergence in 2 passes (page increments to 3 after done).' );
	}

	/**
	 * An unrecognised erase_mode falls back to anonymize: row survives,
	 * items_retained is true, and user_id is zeroed.
	 */
	public function test_erase_unknown_mode_falls_back_to_anonymize() {
		global $wpdb;
		list( $user_id, $email ) = $this->make_user();
		$id                      = $this->insert_consent_row(
			array(
				'user_id'    => $user_id,
				'ip_address' => '10.0.0.1',
			)
		);

		$cb = static function () {
			return 'bogus';
		};
		add_filter( 'jetpack_cookie_consent_erase_mode', $cb );
		$result = Consent_Log_Privacy::erase( $email, 1 );
		remove_filter( 'jetpack_cookie_consent_erase_mode', $cb );

		// Row must still exist (not deleted).
		$table = Consent_Log_Controller::get_table_name();
		$still = (int) $wpdb->get_var( $wpdb->prepare( "SELECT COUNT(*) FROM {$table} WHERE id = %d", $id ) ); // phpcs:ignore WordPress.DB
		$this->assertSame( 1, $still, 'Row should survive (anonymized, not deleted).' );

		// But IP and user_id must be cleared.
		$ip = $wpdb->get_var( $wpdb->prepare( "SELECT ip_address FROM {$table} WHERE id = %d", $id ) ); // phpcs:ignore WordPress.DB
		$this->assertNull( $ip, 'IP address must be nulled out.' );
		$this->assertSame( 0, $this->rows_for_user( $user_id ), 'user_id must be zeroed.' );

		// Eraser flags.
		$this->assertTrue( $result['items_removed'] );
		$this->assertTrue( $result['items_retained'], 'items_retained must be true for anonymize path.' );
	}

	/**
	 * Delete mode also converges for subjects with more than PER_PAGE (100) rows.
	 *
	 * Delete drains the WHERE user_id = N set by physically removing rows, a
	 * different mechanism from anonymize (which zeroes user_id), so it needs its
	 * own convergence guard.
	 */
	public function test_erase_delete_mode_converges_for_more_than_100_rows() {
		list( $user_id, $email ) = $this->make_user();

		for ( $i = 0; $i < 150; $i++ ) {
			$this->insert_consent_row( array( 'user_id' => $user_id ) );
		}

		$cb = static function () {
			return 'delete';
		};
		add_filter( 'jetpack_cookie_consent_erase_mode', $cb );

		$page      = 1;
		$max_pages = 10;
		$done      = false;
		while ( ! $done && $page <= $max_pages ) {
			$result = Consent_Log_Privacy::erase( $email, $page );
			$done   = $result['done'];
			++$page;
		}

		remove_filter( 'jetpack_cookie_consent_erase_mode', $cb );

		$this->assertTrue( $done, 'Delete-mode eraser did not converge within 10 passes — possible infinite loop.' );
		$this->assertSame( 3, $page, 'Expected convergence in 2 passes (page increments to 3 after done).' );

		global $wpdb;
		$table = Consent_Log_Controller::get_table_name();
		$total = (int) $wpdb->get_var( "SELECT COUNT(*) FROM {$table}" ); // phpcs:ignore WordPress.DB
		$this->assertSame( 0, $total, 'All matched rows must be deleted.' );
	}

	/**
	 * Erase never touches guest rows (user_id = 0): an email request for one
	 * subject must leave guest rows untouched.
	 */
	public function test_erase_leaves_guest_rows_untouched() {
		global $wpdb;
		list( $user_id, $email ) = $this->make_user();

		$guest_id = $this->insert_consent_row(
			array(
				'user_id'    => 0,
				'ip_address' => '198.51.100.7',
			)
		);
		$this->insert_consent_row( array( 'user_id' => $user_id ) );

		$result = Consent_Log_Privacy::erase( $email, 1 );
		$this->assertTrue( $result['items_removed'] );

		$table    = Consent_Log_Controller::get_table_name();
		$guest_ip = $wpdb->get_var( $wpdb->prepare( "SELECT ip_address FROM {$table} WHERE id = %d", $guest_id ) ); // phpcs:ignore WordPress.DB
		$this->assertSame( '198.51.100.7', $guest_ip, 'Guest row IP must be preserved.' );
	}
}
