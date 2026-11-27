<?php
/**
 * Footer credit separator handling test file.
 *
 * @package wpcomsh
 */

use PHPUnit\Framework\Attributes\DataProvider;

/**
 * Class FooterCreditSeparatorTest.
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
		remove_filter( 'wpcom_better_footer_credit_regex', array( $this, 'match_from_leading_space' ), 20 );

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
	 * Make the credit regex start on the space before the link, as the Twotone filter does.
	 *
	 * @param string $credit_regex The credit regex.
	 * @return string
	 */
	public function match_from_leading_space( $credit_regex ) {
		return str_replace( '#<a', '#\s<a', $credit_regex );
	}

	/**
	 * Only the credit's own separator is removed; separators in site-owner content survive.
	 *
	 * @param string $footer   Footer HTML.
	 * @param string $expected Filtered footer HTML.
	 *
	 * @dataProvider data_footers
	 */
	#[DataProvider( 'data_footers' )]
	public function test_removes_only_the_credit_separator( $footer, $expected ) {
		$this->assertSame( $expected, wpcom_better_footer_links( $footer ) );
	}

	/**
	 * Footers and their expected output.
	 *
	 * @return array[]
	 */
	public static function data_footers() {
		$wporg = '<a href="https://wordpress.org/">Proudly powered by WordPress</a>';

		return array(
			'pipe in a footer widget is kept'              => array(
				'<p>Terms | <a href="https://example.com/privacy">Privacy</a></p>' . $wporg,
				'<p>Terms | <a href="https://example.com/privacy">Privacy</a></p>' . self::CREDIT_LINK,
			),
			'pipe before the credit is removed'            => array(
				'<a href="https://designer.example/">Designer</a> | ' . $wporg,
				'<a href="https://designer.example/">Designer</a>' . self::CREDIT_LINK,
			),
			'sep span is removed, spans after it are kept' => array(
				'<span class="sep"> | </span>' . $wporg . '<p>My <span class="x">own</span> text</p>',
				self::CREDIT_LINK . '<p>My <span class="x">own</span> text</p>',
			),
		);
	}

	/**
	 * A credit regex filter that matches from the leading space still drops the separator.
	 */
	public function test_removes_the_separator_when_the_match_starts_on_a_space() {
		add_filter( 'wpcom_better_footer_credit_regex', array( $this, 'match_from_leading_space' ), 20 );

		$this->assertSame(
			'<a href="https://designer.example/">Designer</a>' . self::CREDIT_LINK,
			wpcom_better_footer_links( '<a href="https://designer.example/">Designer</a> | <a href="https://wordpress.org/">Proudly powered by WordPress</a>' )
		);
	}
}
