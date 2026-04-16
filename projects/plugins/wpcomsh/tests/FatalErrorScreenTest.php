<?php
/**
 * Fatal Error Screen Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunInSeparateProcess;

/**
 * Class FatalErrorScreenTest.
 */
class FatalErrorScreenTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Reset the current screen to a non-admin context after each test so the
	 * protected-endpoint branch does not leak into later cases.
	 */
	public function tear_down() {
		set_current_screen( 'front' );
		parent::tear_down();
	}

	/**
	 * The troubleshooting link is appended to every filter output, pointing
	 * visitors at the WordPress.com troubleshooting documentation.
	 */
	public function test_filter_output_contains_wpcom_troubleshooting_link() {
		$message = wpcomsh_filter_fatal_error_message();

		$this->assertStringContainsString(
			'href="https://wordpress.com/support/plugins/troubleshooting/"',
			$message
		);
		$this->assertStringContainsString(
			'Learn more about troubleshooting WordPress.com.',
			$message
		);
	}

	/**
	 * The filter output must never leak the default WordPress.org links
	 * through, regardless of which body branch was taken.
	 */
	public function test_filter_output_contains_no_wordpress_org_links() {
		$message = wpcomsh_filter_fatal_error_message();

		$this->assertStringNotContainsString( 'wordpress.org/support/forums', $message );
		$this->assertStringNotContainsString( 'wordpress.org/documentation/article/faq-troubleshooting', $message );
	}

	/**
	 * The filter output is wrapped in the same two-paragraph structure that WP
	 * core uses, so downstream wp_die() rendering stays consistent.
	 */
	public function test_filter_output_uses_core_paragraph_structure() {
		$message = wpcomsh_filter_fatal_error_message();

		$this->assertMatchesRegularExpression(
			'#^<p>.+</p><p><a href="https://wordpress\.com/support/plugins/troubleshooting/">[^<]+</a></p>$#',
			$message
		);
	}

	/**
	 * Outside admin and recovery mode, the body is the short generic sentence —
	 * core's default branch.
	 */
	public function test_body_defaults_to_short_critical_error_sentence() {
		$body = wpcomsh_get_fatal_error_body();

		$this->assertSame( 'There has been a critical error on this website.', $body );
	}

	/**
	 * On admin screens with recovery mode initialized, a single-site install
	 * returns a body that includes the WordPress.com support forums link in
	 * place of the default WordPress.org one.
	 *
	 * Runs in a separate process so `wp_recovery_mode()` singleton state does
	 * not leak into other tests.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_protected_endpoint_body_links_to_wpcom_support_forums() {
		if ( is_multisite() ) {
			$this->markTestSkipped( 'Only relevant on single-site; see the multisite test.' );
		}

		set_current_screen( 'dashboard' );
		wp_recovery_mode()->initialize();

		$body = wpcomsh_get_fatal_error_body();

		$this->assertStringContainsString( 'href="https://wordpress.com/forums/"', $body );
		$this->assertStringContainsString( 'WordPress.com support forums', $body );
		$this->assertStringNotContainsString( 'wordpress.org/support/forums', $body );
	}

	/**
	 * Multisite shows the administrator-contact sentence in the protected
	 * endpoint branch and does not include a support forums link.
	 *
	 * @runInSeparateProcess
	 * @preserveGlobalState disabled
	 */
	#[RunInSeparateProcess]
	#[PreserveGlobalState( false )]
	public function test_multisite_protected_endpoint_body_has_no_forum_link() {
		if ( ! is_multisite() ) {
			$this->markTestSkipped( 'Only relevant on multisite.' );
		}

		set_current_screen( 'dashboard' );
		wp_recovery_mode()->initialize();

		$body = wpcomsh_get_fatal_error_body();

		$this->assertStringContainsString( 'your site administrator', $body );
		$this->assertStringNotContainsString( 'wordpress.com/forums', $body );
		$this->assertStringNotContainsString( 'wordpress.org/support/forums', $body );
	}
}
