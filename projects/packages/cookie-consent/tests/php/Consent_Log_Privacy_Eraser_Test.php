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
}
