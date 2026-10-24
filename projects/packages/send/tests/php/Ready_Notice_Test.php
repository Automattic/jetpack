<?php
/**
 * Tests for Ready_Notice.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\Attributes\DataProvider;
use WorDBless\BaseTestCase;

/**
 * @covers \Automattic\Jetpack\Send\Ready_Notice
 */
#[CoversClass( Ready_Notice::class )]
class Ready_Notice_Test extends BaseTestCase {

	const SENT_AT = '2026-10-18T10:00:00Z';

	/**
	 * An admin on an ordinary wp-admin page, with a domain that connected and got its automatic test.
	 */
	public function set_up() {
		parent::set_up();
		require_once ABSPATH . 'wp-admin/includes/class-wp-screen.php';
		require_once ABSPATH . 'wp-admin/includes/screen.php';
		set_current_screen( 'dashboard' );

		$admin = wp_insert_user(
			array(
				'user_login' => 'notice_admin',
				'user_pass'  => 'pass',
				'user_email' => 'owner@example.com',
				'role'       => 'administrator',
			)
		);
		wp_set_current_user( $admin );

		Account::save(
			array(
				'api_key'     => 'key',
				'domain'      => 'example.com',
				'dns_records' => array(),
			)
		);
		Settings::update( array( 'enabled' => true ) );
		Onboarding::restart( 'owner@example.com' );
		Onboarding::record(
			array(
				'test_sent_at'     => self::SENT_AT,
				'auto_test_log_id' => '42',
			)
		);
	}

	/**
	 * Clear stored state and the fake request.
	 */
	public function tear_down() {
		unset( $_GET['page'] );
		$GLOBALS['current_screen'] = null;
		wp_set_current_user( 0 );
		Onboarding::delete();
		Settings::delete();
		Account::delete();
		parent::tear_down();
	}

	/**
	 * The notice's output.
	 *
	 * @return string
	 */
	private static function rendered() {
		ob_start();
		Ready_Notice::render();
		return (string) ob_get_clean();
	}

	public function test_renders_once_with_the_log_link_then_marks_it_seen() {
		$html = self::rendered();

		$this->assertStringContainsString( 'notice-success', $html );
		$this->assertStringContainsString( 'is-dismissible', $html );
		$this->assertStringContainsString( 'Send is on for example.com.', $html );
		$this->assertStringContainsString( 'We sent a test email to owner@example.com.', $html );
		$this->assertStringContainsString( 'page=jetpack-send', $html );
		$this->assertStringContainsString( 'entry=42', $html );
		$this->assertNotNull( Onboarding::state()['verified_seen_at'] );

		$this->assertSame( '', self::rendered() );
	}

	public function test_escapes_the_stored_values() {
		Account::update( array( 'domain' => 'example.com<script>' ) );

		$html = self::rendered();

		$this->assertStringNotContainsString( '<script>', $html );
		$this->assertStringContainsString( 'example.com&lt;script&gt;', $html );
	}

	/**
	 * Requests where the notice stays silent.
	 *
	 * @return array[]
	 */
	public static function provide_silent() {
		return array(
			'on the Send page'         => array( 'send_page' ),
			'for a non-admin'          => array( 'subscriber' ),
			'when sending is off'      => array( 'sending_off' ),
			'without an account'       => array( 'no_account' ),
			'once seen'                => array( 'seen' ),
			'when the auto test fails' => array( 'test_failed' ),
			'with no automatic test'   => array( 'no_auto_test' ),
		);
	}

	/**
	 * @dataProvider provide_silent
	 *
	 * @param string $situation What differs from the default set-up.
	 */
	#[DataProvider( 'provide_silent' )]
	public function test_stays_silent( $situation ) {
		switch ( $situation ) {
			case 'send_page':
				$_GET['page'] = Admin_Page::MENU_SLUG;
				break;
			case 'subscriber':
				wp_set_current_user(
					wp_insert_user(
						array(
							'user_login' => 'notice_subscriber',
							'user_pass'  => 'pass',
							'user_email' => 'reader@example.com',
							'role'       => 'subscriber',
						)
					)
				);
				break;
			case 'sending_off':
				Settings::update( array( 'enabled' => false ) );
				break;
			case 'no_account':
				Account::delete();
				break;
			case 'seen':
				Onboarding::update_from_client( array( 'verified_seen' => true ) );
				break;
			case 'test_failed':
				Onboarding::record( array( 'test_sent_at' => null ) );
				break;
			case 'no_auto_test':
				Onboarding::record( array( 'auto_test_log_id' => null ) );
				break;
		}

		$this->assertSame( '', self::rendered() );
		if ( 'seen' !== $situation ) {
			$this->assertNull( Onboarding::state()['verified_seen_at'] );
		}
	}

	public function test_hooks_into_admin_notices() {
		Ready_Notice::init();

		$this->assertSame( 10, has_action( 'admin_notices', array( Ready_Notice::class, 'render' ) ) );
	}
}
