<?php
/**
 * Footer credit separator handling test file.
 *
 * @package wpcomsh
 */

/**
 * Class FooterCreditSeparatorTest.
 *
 * The wpcom_better_footer_links() function runs on an output buffer that covers the whole footer,
 * which includes any footer widget areas the theme renders from footer.php. These tests pin down
 * that it only removes the separator belonging to the credit it replaces, and leaves separators
 * in site-owner content alone.
 */
class FooterCreditSeparatorTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * A fixed credit link, so the assertions do not depend on the site's footercredit option.
	 *
	 * @var string
	 */
	const CREDIT_LINK = '<a href="https://wordpress.com/?ref=footer_blog">Blog at WordPress.com.</a>';

	/**
	 * Set up.
	 */
	public function setUp(): void {
		parent::setUp();

		add_filter( 'wpcom_better_footer_credit_apply', '__return_true', PHP_INT_MAX );
		add_filter( 'wpcom_better_footer_credit_link', array( $this, 'fixed_credit_link' ), PHP_INT_MAX );
	}

	/**
	 * Tear down.
	 */
	public function tearDown(): void {
		remove_filter( 'wpcom_better_footer_credit_apply', '__return_true', PHP_INT_MAX );
		remove_filter( 'wpcom_better_footer_credit_link', array( $this, 'fixed_credit_link' ), PHP_INT_MAX );

		parent::tearDown();
	}

	/**
	 * Return a fixed credit link.
	 *
	 * @return string
	 */
	public function fixed_credit_link() {
		return self::CREDIT_LINK;
	}

	/**
	 * A pipe a site owner typed into a footer widget must survive, even when it sits directly in
	 * front of a link. Regression test for a footer widget losing "Terms | <a>Privacy</a>".
	 */
	public function test_separator_in_footer_widget_content_is_preserved() {
		$footer = '<div class="widget widget_block"><p>Terms &amp; Conditions | <a href="https://example.com/privacy">Privacy Policy</a></p></div>'
			. '<div class="site-info"><a href="https://wordpress.org/">Proudly powered by WordPress</a></div>';

		$filtered = wpcom_better_footer_links( $footer );

		$this->assertStringContainsString(
			'Terms &amp; Conditions | <a href="https://example.com/privacy">Privacy Policy</a>',
			$filtered,
			'The separator in footer widget content should be left alone.'
		);
	}

	/**
	 * A footer with no WordPress credit link at all should come back untouched. This is the common
	 * case on themes that do not ship a WordPress colophon, where there is no credit to replace.
	 */
	public function test_footer_without_a_credit_link_is_unchanged() {
		$footer = '<div class="footer-widgets"><p>Shop | <a href="https://example.com/shop">All products</a></p></div>';

		$this->assertSame( $footer, wpcom_better_footer_links( $footer ) );
	}

	/**
	 * The separator that belongs to the credit link must still be removed, otherwise replacing the
	 * credit leaves a dangling pipe behind.
	 */
	public function test_separator_before_the_credit_link_is_removed() {
		$footer = '<div class="site-info"><a href="https://designer.example/">Designer</a> | <a href="https://wordpress.org/">Proudly powered by WordPress</a></div>';

		$filtered = wpcom_better_footer_links( $footer );

		$this->assertSame(
			'<div class="site-info"><a href="https://designer.example/">Designer</a>' . self::CREDIT_LINK . '</div>',
			$filtered,
			'The separator belonging to the credit link should be removed along with the credit.'
		);
	}

	/**
	 * A ".sep" separator span next to the credit is still removed.
	 */
	public function test_sep_span_is_removed() {
		$footer = '<div class="site-info"><span class="sep"> | </span><a href="https://wordpress.org/">Proudly powered by WordPress</a></div>';

		$filtered = wpcom_better_footer_links( $footer );

		$this->assertStringNotContainsString( 'class="sep"', $filtered );
		$this->assertStringContainsString( self::CREDIT_LINK, $filtered );
	}
}
