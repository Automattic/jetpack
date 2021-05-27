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

	/**
	 * Test that css variable properties are removed by default.
	 */
	public function test_removes_css_var_properties_by_default() {
		$css      = 'div {--base-color:red;color:var(--base-color)}';
		$expected = "div {\ncolor:var(--base-color)\n}";
		$this->instance->parse( $css );
		$this->assertEquals(
			$this->instance->print->plain(),
			$expected
		);
	}

	/**
	 * Test that css variable properties are preserved when flag toggled.
	 */
	public function test_css_var_properties_preserved() {
		$this->instance->set_cfg( 'preserve_css_variables', true );
		$css      = 'div {--base-color_for_1st-child:red;color:var(--base-color)}';
		$expected = "div {\n--base-color_for_1st-child:red;\ncolor:var(--base-color)\n}";
		$this->instance->parse( $css );
		$this->assertEquals(
			$this->instance->print->plain(),
			$expected
		);
	}

	/**
	 * Test that unkown properties still removed when css variables enabled.
	 */
	public function test_unknown_properties_removed() {
		$this->instance->set_cfg( 'preserve_css_variables', true );
		$css      = 'div {clowns-nose:red;color:var(--base-color)}';
		$expected = "div {\ncolor:var(--base-color)\n}";
		$this->instance->parse( $css );
		$this->assertEquals(
			$this->instance->print->plain(),
			$expected
		);
	}

	/**
	 * Test that broken or potentially dangerious css still removed when css variables enabled.
	 */
	public function test_broken_or_dangerous_css_removed() {
		$this->instance->set_cfg( 'preserve_css_variables', true );
		$css      = 'div {xss-trap-be-careful:red;}</style><script>alert(\'Gotcha!\')</script>color:var(--base-color)}';
		$expected = '';
		$this->instance->parse( $css );
		$this->assertEquals(
			$this->instance->print->plain(),
			$expected
		);
	}
}
