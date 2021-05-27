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

	/**
	 * Test that css variable properties are removed by default.
	 */
	public function test_removes_css_var_properties_by_default() {
		// $this->instance->set_cfg( 'preserve_css_variables', false ); //this should be default but even if set manually css var not removed
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
	public function test_removes_css_var_properties_preserved() {
		$this->instance->set_cfg( 'preserve_css_variables', true );
		$css      = 'div {--base-color:red;color:var(--base-color)}';
		$expected = "div {\n--base-color:red;\ncolor:var(--base-color)\n}";
		$this->instance->parse( $css );
		$this->assertEquals(
			$this->instance->print->plain(),
			$expected
		);
	}
}
