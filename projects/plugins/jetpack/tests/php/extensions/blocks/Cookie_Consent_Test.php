<?php
/**
 * Cookie Consent block tests.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Extensions\CookieConsent;

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/cookie-consent/cookie-consent.php';

/**
 * Cookie Consent block tests.
 */
class Cookie_Consent_Test extends \WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	const HANDLE = 'wp-block-custom-css';

	/**
	 * Reset the core handle between tests.
	 */
	public function tear_down() {
		wp_dequeue_style( self::HANDLE );
		wp_deregister_style( self::HANDLE );

		parent::tear_down();
	}

	/**
	 * Register the handle and mark it printed, as after wp_head.
	 *
	 * @param string $rule Rule queued before the footer render.
	 */
	private function print_head_with( $rule ) {
		wp_register_style( self::HANDLE, false, array(), '1.0' );
		wp_add_inline_style( self::HANDLE, $rule );
		wp_enqueue_style( self::HANDLE );
		wp_styles()->done[] = self::HANDLE;
	}

	/**
	 * The helper returns no rules when core never registered the handle.
	 */
	public function test_get_custom_css_rules_empty_without_handle() {
		$this->assertSame( array(), CookieConsent\get_custom_css_rules() );
	}

	/**
	 * Only rules queued after the snapshot are printed.
	 */
	public function test_prints_only_new_rules_when_head_is_done() {
		$this->print_head_with( '.a{color:red}' );
		$before = CookieConsent\get_custom_css_rules();
		wp_add_inline_style( self::HANDLE, '.b{color:blue}</style><script>x</script>' );

		ob_start();
		CookieConsent\print_late_custom_css_rules( $before );
		$output = ob_get_clean();

		$this->assertStringContainsString( '.b{color:blue}', $output );
		$this->assertStringNotContainsString( '.a{color:red}', $output );
		$this->assertSame( 1, substr_count( strtolower( $output ), '</style' ) );
	}

	/**
	 * Core prints the rules itself when the handle has not printed yet.
	 */
	public function test_prints_nothing_when_head_is_not_done() {
		wp_register_style( self::HANDLE, false, array(), '1.0' );
		wp_add_inline_style( self::HANDLE, '.b{color:blue}' );

		ob_start();
		CookieConsent\print_late_custom_css_rules( array() );
		$output = ob_get_clean();

		$this->assertSame( '', $output );
	}
}
