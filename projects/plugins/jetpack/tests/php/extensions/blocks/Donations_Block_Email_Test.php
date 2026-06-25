<?php
/**
 * Donations Block Email Rendering tests
 *
 * @package automattic/jetpack
 */

require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/donations/donations.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/button/button.php';

require_once __DIR__ . '/mocks/class-mock-table-wrapper-helper.php';
require_once __DIR__ . '/mocks/class-mock-woocommerce-button-renderer.php';

use PHPUnit\Framework\Attributes\CoversFunction;

/**
 * Donations Block Email Rendering tests.
 *
 * Verifies that render_email builds a dedicated email version of the block from
 * its attributes, preserving per-interval customization and rendering CTA buttons.
 *
 * @covers ::Automattic\Jetpack\Extensions\Donations\render_email
 * @covers ::Automattic\Jetpack\Extensions\Donations\render_email_donate_button
 * @covers ::Automattic\Jetpack\Extensions\Donations\get_email_target_width
 */
#[CoversFunction( 'Automattic\Jetpack\Extensions\Donations\render_email' )]
#[CoversFunction( 'Automattic\Jetpack\Extensions\Donations\render_email_donate_button' )]
#[CoversFunction( 'Automattic\Jetpack\Extensions\Donations\get_email_target_width' )]
class Donations_Block_Email_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Build a parsed block with the given attributes.
	 *
	 * @param array $attrs Block attributes.
	 * @return array
	 */
	private function parsed_block( $attrs = array() ) {
		return array( 'attrs' => $attrs );
	}

	/**
	 * Default attributes showing all three intervals with custom text.
	 *
	 * @return array
	 */
	private function customized_attrs() {
		return array(
			'fallbackLinkUrl' => 'https://example.com/donate-post',
			'oneTimeDonation' => array(
				'show'       => true,
				'heading'    => 'Give once',
				'buttonText' => 'Give now',
				'extraText'  => 'One-time thanks.',
			),
			'monthlyDonation' => array(
				'show'       => true,
				'heading'    => 'Give monthly',
				'buttonText' => 'Subscribe monthly',
			),
			'annualDonation'  => array(
				'show'       => true,
				'heading'    => 'Give yearly',
				'buttonText' => 'Subscribe yearly',
			),
		);
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
	 * Custom per-interval headings, button labels and supporting text are preserved.
	 */
	public function test_render_email_preserves_customization() {
		$result = \Automattic\Jetpack\Extensions\Donations\render_email( '', $this->parsed_block( $this->customized_attrs() ), $this->create_rendering_context_mock() );

		$this->assertStringContainsString( '<table', $result );

		$this->assertStringContainsString( 'Give once', $result );
		$this->assertStringContainsString( 'Give monthly', $result );
		$this->assertStringContainsString( 'Give yearly', $result );

		$this->assertStringContainsString( 'Give now', $result );
		$this->assertStringContainsString( 'Subscribe monthly', $result );
		$this->assertStringContainsString( 'Subscribe yearly', $result );

		$this->assertStringContainsString( 'One-time thanks.', $result );

		$this->assertStringContainsString( 'https://example.com/donate-post', $result );
	}

	/**
	 * Hidden intervals are not rendered.
	 */
	public function test_render_email_respects_hidden_intervals() {
		$attrs = array(
			'fallbackLinkUrl' => 'https://example.com/donate-post',
			'oneTimeDonation' => array(
				'show'       => true,
				'heading'    => 'Give once',
				'buttonText' => 'Give now',
			),
			'monthlyDonation' => array( 'show' => false ),
			'annualDonation'  => array( 'show' => false ),
		);

		$result = \Automattic\Jetpack\Extensions\Donations\render_email( '', $this->parsed_block( $attrs ), $this->create_rendering_context_mock() );

		$this->assertStringContainsString( 'Give once', $result );
		$this->assertStringNotContainsString( 'monthly', $result );
		$this->assertStringNotContainsString( 'yearly', $result );
	}

	/**
	 * Falls back to default texts when nothing is customized.
	 */
	public function test_render_email_uses_default_texts() {
		$attrs = array(
			'fallbackLinkUrl' => 'https://example.com/donate-post',
			'oneTimeDonation' => array( 'show' => true ),
			'monthlyDonation' => array( 'show' => false ),
			'annualDonation'  => array( 'show' => false ),
		);

		$result = \Automattic\Jetpack\Extensions\Donations\render_email( '', $this->parsed_block( $attrs ), $this->create_rendering_context_mock() );

		$this->assertStringContainsString( 'Make a one-time donation', $result );
		$this->assertStringContainsString( 'Donate', $result );
	}

	/**
	 * Returns empty string when no intervals are shown.
	 */
	public function test_render_email_returns_empty_when_no_intervals() {
		$attrs = array(
			'oneTimeDonation' => array( 'show' => false ),
			'monthlyDonation' => array( 'show' => false ),
			'annualDonation'  => array( 'show' => false ),
		);

		$result = \Automattic\Jetpack\Extensions\Donations\render_email( '', $this->parsed_block( $attrs ), $this->create_rendering_context_mock() );
		$this->assertSame( '', $result );
	}

	/**
	 * Returns empty string when attrs are missing.
	 */
	public function test_render_email_returns_empty_with_missing_attrs() {
		$result = \Automattic\Jetpack\Extensions\Donations\render_email( '', array( 'not-attrs' => array() ), $this->create_rendering_context_mock() );
		$this->assertSame( '', $result );
	}

	/**
	 * HTML inside a custom button label is stripped.
	 */
	public function test_render_email_strips_html_in_button_text() {
		$attrs = array(
			'fallbackLinkUrl' => 'https://example.com/donate-post',
			'oneTimeDonation' => array(
				'show'       => true,
				'buttonText' => '<strong>Give now</strong>',
			),
			'monthlyDonation' => array( 'show' => false ),
			'annualDonation'  => array( 'show' => false ),
		);

		$result = \Automattic\Jetpack\Extensions\Donations\render_email( '', $this->parsed_block( $attrs ), $this->create_rendering_context_mock() );

		$this->assertStringContainsString( 'Give now', $result );
		$this->assertStringNotContainsString( '<strong>Give now', $result );
	}
}
