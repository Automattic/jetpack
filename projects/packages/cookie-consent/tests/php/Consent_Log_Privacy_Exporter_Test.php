<?php
/**
 * Exporter tests.
 *
 * @package automattic/jetpack-cookie-consent
 */

namespace Automattic\Jetpack\CookieConsent;

/**
 * Covers Consent_Log_Privacy::export().
 */
class Consent_Log_Privacy_Exporter_Test extends TestCase {

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
	 * Unknown email returns empty + done.
	 */
	public function test_export_unknown_email_is_empty_and_done() {
		$result = Consent_Log_Privacy::export( 'nobody@example.com', 1 );
		$this->assertSame( array(), $result['data'] );
		$this->assertTrue( $result['done'] );
	}

	/**
	 * Rows for the matched user are exported with the right shape.
	 */
	public function test_export_returns_rows_for_user() {
		list( $user_id, $email ) = $this->make_user();
		$this->insert_consent_row(
			array(
				'user_id'    => $user_id,
				'event_type' => 'accept_all',
			)
		);

		$result = Consent_Log_Privacy::export( $email, 1 );

		$this->assertTrue( $result['done'] );
		$this->assertCount( 1, $result['data'] );
		$item = $result['data'][0];
		$this->assertSame( 'jetpack-cookie-consent', $item['group_id'] );
		$this->assertSame( 'Cookie Consent Log', $item['group_label'] );
		$this->assertStringStartsWith( 'consent-log-', $item['item_id'] );
		$names = wp_list_pluck( $item['data'], 'name' );
		$this->assertContains( 'Consent ID', $names );
		$this->assertContains( 'Event', $names );
		$this->assertContains( 'IP Address', $names );
		$this->assertContains( 'URL', $names );
		$this->assertContains( 'Consent Types', $names );
		$this->assertContains( 'Date (GMT)', $names );
	}

	/**
	 * Guest rows (user_id 0) are never matched by email.
	 */
	public function test_export_ignores_guest_rows() {
		list( , $email ) = $this->make_user();
		$this->insert_consent_row( array( 'user_id' => 0 ) );

		$result = Consent_Log_Privacy::export( $email, 1 );
		$this->assertSame( array(), $result['data'] );
		$this->assertTrue( $result['done'] );
	}

	/**
	 * A full page reports done=false; the trailing page reports done=true.
	 */
	public function test_export_paginates() {
		list( $user_id, $email ) = $this->make_user();
		for ( $i = 0; $i < 100; $i++ ) {
			$this->insert_consent_row( array( 'user_id' => $user_id ) );
		}
		$this->insert_consent_row( array( 'user_id' => $user_id ) ); // 101st row.

		$page1 = Consent_Log_Privacy::export( $email, 1 );
		$this->assertCount( 100, $page1['data'] );
		$this->assertFalse( $page1['done'] );

		$page2 = Consent_Log_Privacy::export( $email, 2 );
		$this->assertCount( 1, $page2['data'] );
		$this->assertTrue( $page2['done'] );
	}
}
