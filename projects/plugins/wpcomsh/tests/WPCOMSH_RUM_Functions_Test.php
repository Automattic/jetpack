<?php
/**
 * Wpcomsh Test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class Test_WPCOMSH_RUM_Functions
 */
class WPCOMSH_RUM_Functions_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test that the script function is hooked correctly
	 */
	public function test_wpcomsh_footer_rum_js_hooks() {
		// Check if the function is hooked to wp_footer and admin_footer
		$this->assertEquals(
			10,
			has_action( 'wp_footer', 'wpcomsh_footer_rum_js' ),
			'wpcomsh_footer_rum_js is not properly hooked to wp_footer'
		);

		$this->assertEquals(
			10,
			has_action( 'admin_footer', 'wpcomsh_footer_rum_js' ),
			'wpcomsh_footer_rum_js is not properly hooked to admin_footer'
		);
	}

	/**
	 * Test the output of wpcomsh_head_rum_meta
	 */
	public function test_wpcomsh_head_rum_meta_output() {
		// Start output buffering
		ob_start();
		wpcomsh_footer_rum_js();
		$output = ob_get_clean();

		$this->assertStringContainsString( '<meta id="bilmur"', $output );
		$this->assertStringContainsString( 'property="bilmur:data"', $output );
		$this->assertStringContainsString( 'data-provider="wordpress.com"', $output );
		$this->assertStringContainsString( 'data-service="atomic"', $output );
		$this->assertStringContainsString( 'bilmur.min.js', $output );
	}

	/**
	 * Test that the site v is omitted by default
	 */
	public function test_wpcomsh_footer_rum_js_omits_site_v_by_default() {
		ob_start();
		wpcomsh_footer_rum_js();
		$output = ob_get_clean();

		$this->assertStringNotContainsString( 'data-site-v', $output );
	}

	/**
	 * Test that the site v is included when the filter is enabled
	 */
	public function test_wpcomsh_footer_rum_js_includes_site_v_when_enabled() {
		add_filter( 'wpcomsh_bilmur_site_v', '__return_true' );

		ob_start();
		wpcomsh_footer_rum_js();
		$output = ob_get_clean();

		remove_filter( 'wpcomsh_bilmur_site_v', '__return_true' );

		$expected = md5( (string) wp_parse_url( home_url(), PHP_URL_HOST ) );
		$this->assertStringContainsString( 'data-site-v="' . $expected . '"', $output );
	}

	/**
	 * Test that the site v is included when the filter is enabled
	 */
	public function test_wpcomsh_footer_rum_js_uses_custom_site_v_string() {
		$callback = static function () {
				return 'custom-value';
		};
		add_filter( 'wpcomsh_bilmur_site_v', $callback );

		ob_start();
		wpcomsh_footer_rum_js();
		$output = ob_get_clean();

		remove_filter( 'wpcomsh_bilmur_site_v', $callback );

		$this->assertStringContainsString( 'data-site-v="custom-value"', $output );
	}

	/**
	 * Test that bilmur waits for consent on the front end only when the WP Consent API is active.
	 *
	 * @dataProvider provide_consent_gate_actions
	 *
	 * @param string $action      The footer action being run.
	 * @param bool   $expect_gate Whether the script load should be gated.
	 */
	#[DataProvider( 'provide_consent_gate_actions' )]
	public function test_wpcomsh_footer_rum_js_consent_gate( $action, $expect_gate ) {
		if ( ! function_exists( 'wp_has_consent' ) ) {
			require __DIR__ . '/wp-consent-api-stub.php';
		}

		$GLOBALS['wp_current_filter'][] = $action;
		ob_start();
		wpcomsh_footer_rum_js();
		$output = ob_get_clean();
		array_pop( $GLOBALS['wp_current_filter'] );

		$this->assertSame( ! $expect_gate, str_contains( $output, 'src="https://s0.wp.com/wp-content/js/bilmur.min.js' ) );
		$this->assertSame( $expect_gate, str_contains( $output, 'wp_has_consent( "statistics" )' ) );
	}

	/**
	 * Data provider for test_wpcomsh_footer_rum_js_consent_gate.
	 *
	 * @return array
	 */
	public static function provide_consent_gate_actions() {
		return array(
			'front end' => array( 'wp_footer', true ),
			'wp-admin'  => array( 'admin_footer', false ),
		);
	}
}
