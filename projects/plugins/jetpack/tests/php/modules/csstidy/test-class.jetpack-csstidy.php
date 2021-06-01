<?php
/**
 * Class WP_Test_Jetpack_CSSTidy.
 *
 * @package automattic/jetpack
 */

require_jetpack_file( 'modules/custom-css/csstidy/class.csstidy.php' );

/**
 * Class WP_Test_Jetpack_CSSTidy
 */
class WP_Test_Jetpack_CSSTidy extends WP_UnitTestCase {

	/**
	 * The tested instance.
	 *
	 * @var csstidy
	 */
	public $instance;

	/**
	 * Sets up each test.
	 *
	 * @inheritDoc
	 */
	public function setUp() {
		parent::setUp();
		$this->instance = new csstidy();
		$this->instance->set_cfg( 'optimise_shorthands', 0 );
	}

	/** Provides values for CSS preserve leading zero patterns */
	public function custom_preserve_leading_zeros_provider() {
		// phpcs:ignore Squiz.PHP.CommentedOutCode.Found -- false positive
		// 'test case description' => [ 'input', 'expected output', 'preserve_leading_zero' ].
		return array(
			'test_removes_leading_zeros_by_default_single_value' => array( 'marquee {line-height:0.7}', "marquee {\nline-height:.7\n}", false ),
			'test_decimals_greater_than_zero_unchanged'    => array( 'blink {line-height:1.7}', "blink {\nline-height:1.7\n}", false ),
			'test_removes_leading_zeros_by_default_multiple_values' => array( 'dfn {margin-left:-0.7px;top:0.55rem;line-height:0.3333;}', "dfn {\nmargin-left:-.7px;\ntop:.55rem;\nline-height:.3333\n}", false ),
			'test_preserves_leading_zeros_single_value'    => array( 'aside {line-height:0.7}', "aside {\nline-height:0.7\n}", true ),
			'test_preserves_leading_zeros_multiple_values' => array( 'code {margin-left:-0.7px;top:0.55rem;line-height:0.3333;}', "code {\nmargin-left:-0.7px;\ntop:0.55rem;\nline-height:0.3333\n}", true ),
		);
	}

	/**
	 * Test that leading zeros for decimals values are preserved/discarded as expected.
	 *
	 * @dataProvider custom_preserve_leading_zeros_provider
	 *
	 * @param string $input                  potential CSS values.
	 * @param string $expected_output        what we expect csstidy to output.
	 * @param bool   $preserve_css_variables the value of `preserve_leading_zero` in csstidy's config.
	 */
	public function test_preserve_leading_zeros( $input, $expected_output, $preserve_css_variables ) {
		$this->instance->set_cfg( 'preserve_leading_zero', $preserve_css_variables );
		$this->instance->parse( $input );
		$this->assertEquals(
			$expected_output,
			$this->instance->print->plain(),
		);
	}
}
