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
	public function set_up() {
		parent::set_up();
		$this->instance = new csstidy();
		$this->instance->set_cfg( 'optimise_shorthands', 0 );
	}

	/** Provides values for CSS preserve leading zeros patterns */
	public function custom_preserve_leading_zeros_provider() {
		// phpcs:ignore Squiz.PHP.CommentedOutCode.Found -- false positive
		// 'test case description' => [ 'input', 'expected output', 'preserve_leading_zeros' ].
		return array(
			'test_removes_leading_zeros_by_default'       => array( 'marquee {line-height:0.7;opacity:0.05;background-color:rgba(255, 255, 255, 0.25);}', "marquee {\nline-height:.7;\nopacity:.05;\nbackground-color:rgba(255, 255, 255, 0.25)\n}", false ),
			'test_decimals_greater_than_one_unchanged_default' => array( 'blink {line-height:1.7;top:-100.55em;}', "blink {\nline-height:1.7;\ntop:-100.55em\n}", false ),
			'test_removes_leading_zeros_by_default_units' => array( 'dfn {margin-left:-0.7px;top:0.55rem;line-height:0.3333;text-indent:-9999%}', "dfn {\nmargin-left:-.7px;\ntop:.55rem;\nline-height:.3333;\ntext-indent:-9999%\n}", false ),
			'test_preserves_leading_zeros'                => array( 'aside {line-height:0.7;background-color:rgba(255, 255, 255, 0.25);opacity:0.05;}', "aside {\nline-height:0.7;\nbackground-color:rgba(255, 255, 255, 0.25);\nopacity:0.05\n}", true ),
			'test_preserves_leading_zeros_units'          => array( 'code {line-height:.70;margin-left:-00.70px;top:0.55rem;padding:0.3333%;}', "code {\nline-height:0.7;\nmargin-left:-0.7px;\ntop:0.55rem;\npadding:0.3333%\n}", true ),
			'test_decimals_greater_than_one_unchanged_preserve_zeros' => array( 'blink {line-height:1.70;top:100.55em;margin-left:900px;}', "blink {\nline-height:1.7;\ntop:100.55em;\nmargin-left:900px\n}", false ),
		);
	}

	/**
	 * Provides values for testing allowed CSS properties.
	 * Not all supported/allowed properties are tested here.
	 */
	public function custom_allowed_css_properties_provider() {
		return array(
			'accent-color'          => array(
				'body {accent-color:red;accent-color:#74992e;accent-color:rgb(255,255,128);accent-color:hsl(250,100%,34%)}',
				// csstidy converts the rgb() color format to hex
				"body {\naccent-color:red;\naccent-color:#74992e;\naccent-color:#ffff80;\naccent-color:hsl(250,100%,34%)\n}",
			),
			'aspect-ratio'          => array(
				'body {aspect-ratio:1/1;aspect-ratio:1;aspect-ratio:inherit}',
				"body {\naspect-ratio:1/1;\naspect-ratio:1;\naspect-ratio:inherit\n}",
			),
			'gap'                   => array(
				'body {gap:0;gap:10%;gap:calc(20px+10%)}',
				"body {\ngap:0;\ngap:10%;\ngap:calc(20px+10%)\n}",
			),
			'text-underline-offset' => array(
				'body {text-underline-offset:auto;text-underline-offset:2em;text-underline-offset:initial}',
				"body {\ntext-underline-offset:auto;\ntext-underline-offset:2em;\ntext-underline-offset:initial\n}",
			),
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

	/**
	 * Test that a CSS property is allowed and not removed when parsed by CSSTidy.
	 *
	 * @dataProvider custom_allowed_css_properties_provider
	 *
	 * @param string $input                  potential CSS values.
	 * @param string $expected_output        what we expect csstidy to output.
	 */
	public function test_allowed_css_properties( $input, $expected_output ) {
		$this->instance->parse( $input );
			$this->assertEquals(
				$expected_output,
				$this->instance->print->plain()
			);
	}
}
