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

	/** Provides values for CSS preserve leading zeros patterns */
	public function custom_preserve_leading_zeros_provider() {
		// phpcs:ignore Squiz.PHP.CommentedOutCode.Found -- false positive
		// 'test case description' => [ 'input', 'expected output', 'preserve_leading_zeros' ].
		return array(
			'test_removes_leading_zeros_by_default'       => array( 'marquee {line-height:0.7;opacity:0.05;background-color:rgba(255, 255, 255, 0.25);}', "marquee {\nline-height:.7;\nopacity:.05;\nbackground-color:rgba(255,255,255,0.25)\n}", false ),
			'test_decimals_greater_than_one_unchanged_default' => array( 'blink {line-height:1.7;top:-100.55em;}', "blink {\nline-height:1.7;\ntop:-100.55em\n}", false ),
			'test_removes_leading_zeros_by_default_units' => array( 'dfn {margin-left:-0.7px;top:0.55rem;line-height:0.3333;text-indent:-9999%}', "dfn {\nmargin-left:-.7px;\ntop:.55rem;\nline-height:.3333;\ntext-indent:-9999%\n}", false ),
			'test_preserves_leading_zeros'                => array( 'aside {line-height:0.7;background-color:rgba(255, 255, 255, 0.25);opacity:0.05;}', "aside {\nline-height:0.7;\nbackground-color:rgba(255,255,255,0.25);\nopacity:0.05\n}", true ),
			'test_preserves_leading_zeros_units'          => array( 'code {line-height:.70;margin-left:-00.70px;top:0.55rem;padding:0.3333%;}', "code {\nline-height:0.7;\nmargin-left:-0.7px;\ntop:0.55rem;\npadding:0.3333%\n}", true ),
			'test_decimals_greater_than_one_unchanged_preserve_zeros' => array( 'blink {line-height:1.70;top:100.55em;margin-left:900px;}', "blink {\nline-height:1.7;\ntop:100.55em;\nmargin-left:900px\n}", false ),
		);
	}

	/**
	 * Test that leading zeros for decimals values are preserved/discarded as expected.
	 *
	 * @dataProvider custom_preserve_leading_zeros_provider
	 *
	 * @param string $input                  potential CSS values.
	 * @param string $expected_output        what we expect csstidy to output.
	 * @param bool   $preserve_leading_zeros the value of `preserve_leading_zeros` in csstidy's config.
	 */
	public function test_preserve_leading_zeros( $input, $expected_output, $preserve_leading_zeros ) {
		$this->instance->set_cfg( 'preserve_leading_zeros', $preserve_leading_zeros );
		$this->instance->parse( $input );
		$this->assertEquals(
			$expected_output,
			$this->instance->print->plain()
		);
	}

	/** Provides values for CSS custom property patterns */
	public function custom_property_matches_provider() {
		// phpcs:ignore Squiz.PHP.CommentedOutCode.Found -- false positive
		// 'test case description' => [ 'input', 'expected output', 'preserve_css_variables' ].
		return array(
			'test_removes_css_var_properties_by_default' => array( 'div {--base-color:red;color:var(--base-color)}', "div {\ncolor:var(--base-color)\n}", false ),
			'test_css_var_properties_preserved'          => array( 'div {--base-color_for_1st-child:red;color:var(--base-color)}', "div {\n--base-color_for_1st-child:red;\ncolor:var(--base-color)\n}", true ),
			'test_css_var_properties_with_no_alphanum_chars_removed' => array( 'div {--_:red;color:var(--base-color)}', "div {\ncolor:var(--base-color)\n}", true ),
			'test_css_var_properties_ending_in_hyphen_removed' => array( 'div {--base-color-:red;color:var(--base-color)}', "div {\ncolor:var(--base-color)\n}", true ),
			'test_css_var_properties_ending_in_underscore_removed' => array( 'div {--base-color_:red;color:var(--base-color)}', "div {\ncolor:var(--base-color)\n}", true ),
			'test_unknown_properties_removed'            => array( 'div {clowns-nose:red;color:var(--base-color)}', "div {\ncolor:var(--base-color)\n}", true ),
			'test_invalid_css_properties_removed'        => array( 'div {--$//2343--3423:red;color:var(--$//2343--3423)}', "div {\n--2343--3423:red;\ncolor:var(--$//2343--3423)\n}", true ),
			'test_broken_or_dangerous_css_removed'       => array( 'div {xss-trap-be-careful:red;}</style><script>alert(\'Gotcha!\')</script>color:var(--base-color)}', '', true ),
		);
	}

	/**
	 * Test that css variable properties are valid/invalid.
	 *
	 * @dataProvider custom_property_matches_provider
	 *
	 * @param string $input                  potential CSS custom property.
	 * @param string $expected_output        what we expect css tidy to output.
	 * @param bool   $preserve_css_variables the value of preserve_css_variables in csstidy's config.
	 */
	public function test_custom_property_patterns( $input, $expected_output, $preserve_css_variables ) {
		$this->instance->set_cfg( 'discard_invalid_properties', true );
		$this->instance->set_cfg( 'preserve_css_variables', $preserve_css_variables );
		$this->instance->parse( $input );
		$this->assertEquals(
			$expected_output,
			$this->instance->print->plain()
		);
	}
}
