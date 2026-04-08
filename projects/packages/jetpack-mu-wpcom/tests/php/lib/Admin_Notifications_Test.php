<?php
/**
 * Admin Notifications Lib Tests.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

/**
 * Tests for admin notification lib functions.
 */
class Admin_Notifications_Test extends \WorDBless\BaseTestCase {

	/**
	 * Tests that bell notification no-ops when notes_send_callback is unavailable.
	 */
	public function test_bell_notification_noop_without_notes_function() {
		// notes_send_callback does not exist in this test environment.
		// Should not throw — gracefully skips.
		wpcom_send_bell_notification( 1, 'test_type', array( 'key' => 'value' ), 'dedup-1' );
		$this->assertTrue( true );
	}

	/**
	 * Tests that email notification sends via wp_mail fallback.
	 */
	public function test_email_notification_sends_via_wp_mail() {
		// Reset wp_mail state.
		reset_phpmailer_instance();

		wpcom_send_email_notification( 'test@example.com', 'Test Subject', '<p>Hello</p>' );

		$mailer = tests_retrieve_phpmailer_instance();
		$this->assertSame( 'test@example.com', $mailer->get_recipient( 'to' )->address );
		$this->assertSame( 'Test Subject', $mailer->get_sent()->subject );
		$this->assertStringContainsString( '<p>Hello</p>', $mailer->get_sent()->body );
	}

	/**
	 * Tests that build_email_html produces valid HTML with expected elements.
	 */
	public function test_build_email_html_contains_expected_elements() {
		$html = wpcom_build_email_html(
			'https://example.com/hero.png',
			'Test Heading',
			'Test body text',
			'https://example.com/upgrade',
			'Upgrade Now'
		);

		$this->assertStringContainsString( 'https://example.com/hero.png', $html );
		$this->assertStringContainsString( 'Test Heading', $html );
		$this->assertStringContainsString( 'Test body text', $html );
		$this->assertStringContainsString( 'https://example.com/upgrade', $html );
		$this->assertStringContainsString( 'Upgrade Now', $html );
		$this->assertStringContainsString( '#3858e9', $html );
	}

	/**
	 * Tests that build_email_html escapes output properly.
	 */
	public function test_build_email_html_escapes_output() {
		$html = wpcom_build_email_html(
			'https://example.com/hero.png',
			'<script>alert("xss")</script>',
			'Body text',
			'https://example.com',
			'Click <here>'
		);

		$this->assertStringNotContainsString( '<script>', $html );
		$this->assertStringContainsString( '&lt;script&gt;', $html );
		$this->assertStringNotContainsString( 'Click <here>', $html );
	}
}
