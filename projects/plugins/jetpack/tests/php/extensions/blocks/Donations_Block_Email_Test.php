<?php
/**
 * Donations Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/donations/donations.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/button/button.php';

// Ensure the functions are available.
if ( ! function_exists( 'Automattic\Jetpack\Extensions\Donations\render_email' ) ) {
	require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/donations/donations.php';
}
if ( ! function_exists( 'Automattic\Jetpack\Extensions\Button\render_email' ) ) {
	require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/button/button.php';
}

// Include mock classes for WooCommerce Email Editor helpers.
require_once __DIR__ . '/mocks/class-mock-styles-helper.php';
require_once __DIR__ . '/mocks/class-mock-table-wrapper-helper.php';
require_once __DIR__ . '/mocks/class-mock-woocommerce-button-renderer.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Donations Block Email Rendering tests.
 *
 * Verifies that render_email reuses the block's static fallback HTML and swaps
 * each fallback donation link for an email-friendly CTA button.
 *
 * @covers ::Automattic\Jetpack\Extensions\Donations\render_email
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Donations\render_email' )]
class Donations_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Build fallback block content matching the block's saved/static output.
	 *
	 * @param string $url      Fallback link URL.
	 * @param array  $buttons  Button texts to render as fallback links.
	 * @return string
	 */
	private function build_fallback_content( $url = 'https://example.com/my-post', $buttons = array( 'Donate', 'Donate monthly' ) ) {
		$content = '<div class="wp-block-jetpack-donations">';
		foreach ( $buttons as $index => $text ) {
			if ( $index > 0 ) {
				$content .= '<hr class="donations__separator" />';
			}
			$content .= '<h4>Make a donation</h4>';
			$content .= '<p>Your contribution is appreciated.</p>';
			$content .= sprintf(
				'<a class="jetpack-donations-fallback-link" href="%s" rel="noopener noreferrer noamphtml" target="_blank">%s</a>',
				esc_url( $url ),
				esc_html( $text )
			);
		}
		return $content . '</div>';
	}

	/**
	 * Helper to create a rendering context mock.
	 *
	 * @param string $width The width to return from get_layout_width_without_padding.
	 * @return object Mock rendering context.
	 */
	private function create_rendering_context_mock( $width = '600px' ) {
		return new class( $width ) {
			private $width;

			public function __construct( $width ) {
				$this->width = $width;
			}

			public function get_layout_width_without_padding() {
				return $this->width;
			}
		};
	}

	/**
	 * Each fallback link is replaced with a CTA button.
	 */
	public function test_render_email_replaces_links_with_buttons() {
		$content = $this->build_fallback_content();
		$result  = \Automattic\Jetpack\Extensions\Donations\render_email( $content, array( 'attrs' => array() ), $this->create_rendering_context_mock() );

		// Fallback links are gone, replaced by table-based buttons.
		$this->assertStringNotContainsString( 'jetpack-donations-fallback-link', $result );
		$this->assertStringContainsString( '<table', $result );

		// Both button texts and the destination URL survive.
		$this->assertStringContainsString( 'Donate', $result );
		$this->assertStringContainsString( 'Donate monthly', $result );
		$this->assertStringContainsString( 'https://example.com/my-post', $result );
	}

	/**
	 * Headings, supporting text and separators from the fallback are preserved.
	 */
	public function test_render_email_preserves_surrounding_content() {
		$content = $this->build_fallback_content();
		$result  = \Automattic\Jetpack\Extensions\Donations\render_email( $content, array( 'attrs' => array() ), $this->create_rendering_context_mock() );

		$this->assertStringContainsString( '<h4>Make a donation</h4>', $result );
		$this->assertStringContainsString( 'Your contribution is appreciated.', $result );
		$this->assertStringContainsString( 'donations__separator', $result );
	}

	/**
	 * HTML inside the button text is stripped before rendering.
	 */
	public function test_render_email_strips_html_in_button_text() {
		$content = $this->build_fallback_content( 'https://example.com/my-post', array( '<strong>Give now</strong>' ) );
		$result  = \Automattic\Jetpack\Extensions\Donations\render_email( $content, array( 'attrs' => array() ), $this->create_rendering_context_mock() );

		$this->assertStringContainsString( 'Give now', $result );
		$this->assertStringNotContainsString( '<strong>Give now', $result );
	}

	/**
	 * Content without fallback links is returned unchanged.
	 */
	public function test_render_email_without_links_returns_content_unchanged() {
		$content = '<div class="wp-block-jetpack-donations"><h4>Make a donation</h4></div>';
		$result  = \Automattic\Jetpack\Extensions\Donations\render_email( $content, array( 'attrs' => array() ), $this->create_rendering_context_mock() );

		$this->assertSame( $content, $result );
	}

	/**
	 * Empty content is returned unchanged.
	 */
	public function test_render_email_with_empty_content() {
		$result = \Automattic\Jetpack\Extensions\Donations\render_email( '', array( 'attrs' => array() ), $this->create_rendering_context_mock() );
		$this->assertSame( '', $result );
	}
}
