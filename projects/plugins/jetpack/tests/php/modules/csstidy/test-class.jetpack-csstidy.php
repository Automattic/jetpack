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
		$this->instance->set_cfg( 'discard_invalid_properties', true );
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
			'test_invalid_css_properties_removed'        => array( 'div {--$//2343--3423:red;color:var(--$//2343--3423)}', "div {\ncolor:var(--$//2343--3423)\n}", true ),
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
		$this->instance->set_cfg( 'preserve_css_variables', $preserve_css_variables );
		$this->instance->parse( $input );
		$this->assertEquals(
			$expected_output,
			$this->instance->print->plain()
		);
	}
}
