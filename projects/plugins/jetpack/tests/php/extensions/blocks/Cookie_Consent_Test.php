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
		wp_styles()->done = array_diff( wp_styles()->done, array( self::HANDLE ) );
		unset( $_COOKIE[ CookieConsent\COOKIE_NAME ] );
		if ( WP_Block_Type_Registry::get_instance()->is_registered( 'jetpack/cookie-consent' ) ) {
			unregister_block_type( 'jetpack/cookie-consent' );
		}

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
		// wp_add_inline_style() rejects the tag, so queue it directly as another plugin could.
		wp_styles()->add_data( self::HANDLE, 'after', array_merge( $before, array( '.b{color:blue}</</stylestyle><script>x</script>' ) ) );

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

	/**
	 * Render the saved template with Custom CSS on a page whose head already printed.
	 *
	 * @return string The footer output.
	 */
	private function render_footer_with_custom_css() {
		register_block_type(
			'jetpack/cookie-consent',
			array(
				'render_callback' => 'Automattic\Jetpack\Extensions\CookieConsent\load_assets',
				'attributes'      => array(
					'render_from_template' => array(
						'type'    => 'boolean',
						'default' => false,
					),
				),
			)
		);
		update_option(
			'cookie_consent_template',
			'<!-- wp:jetpack/cookie-consent {"style":{"css":"border-radius: 10px;"}} --><div class="wp-block-jetpack-cookie-consent" role="dialog" aria-modal="true"><p>Hi</p><span>30</span></div><!-- /wp:jetpack/cookie-consent -->'
		);
		wp_styles()->done[] = self::HANDLE;

		ob_start();
		CookieConsent\render_cookie_consent_template();
		return ob_get_clean();
	}

	/**
	 * The banner carries the class that the printed rule targets.
	 */
	public function test_banner_has_the_class_its_printed_rule_targets() {
		if ( ! function_exists( 'wp_render_custom_css_support_styles' ) ) {
			$this->markTestSkipped( 'Block Custom CSS needs WordPress 7.0.' );
		}

		$output = $this->render_footer_with_custom_css();

		$this->assertSame( 1, preg_match( '/<style id="jetpack-cookie-consent-custom-css">:root :where\(\.(wp-custom-css-[0-9a-f]+)\)\{border-radius: 10px;\}<\/style>/', $output, $matches ), $output );
		$tags = new WP_HTML_Tag_Processor( $output );
		$tags->next_tag( 'style' );
		$tags->next_tag();
		$this->assertSame( 'dialog', $tags->get_attribute( 'role' ) );
		$this->assertTrue( $tags->has_class( $matches[1] ) );
	}

	/**
	 * A visitor who already accepted gets neither the banner nor its CSS.
	 */
	public function test_prints_nothing_once_consent_is_given() {
		if ( ! function_exists( 'wp_render_custom_css_support_styles' ) ) {
			$this->markTestSkipped( 'Block Custom CSS needs WordPress 7.0.' );
		}

		$_COOKIE[ CookieConsent\COOKIE_NAME ] = '1';

		$this->assertSame( '', $this->render_footer_with_custom_css() );
	}
}
