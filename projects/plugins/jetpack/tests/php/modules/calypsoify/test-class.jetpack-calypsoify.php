<?php
/**
 * Class Calypsoify.
 *
 * @package automattic/jetpack
 */

require_jetpack_file( 'modules/calypsoify/class-jetpack-calypsoify.php' );

/**
 * Class WP_Test_Jetpack_Calypsoify
 */
class WP_Test_Jetpack_Calypsoify extends WP_UnitTestCase {
	/**
	 * Instance to test.
	 *
	 * @var Jetpack_Calypsoify
	 */
	private $instance;

	/**
	 * Sets up each test.
	 *
	 * @inheritDoc
	 */
	public function setUp() {
		parent::setUp();
		$this->instance = Jetpack_Calypsoify::get_instance();
	}

	/**
	 * Sets up the Masterbar mock.
	 *
	 * For sites when Masterbar is not active, we mock it. This test confirms that functions.
	 *
	 * @covers Jetpack_Calypsoify::mock_masterbar_activation
	 * @see https://github.com/Automattic/jetpack/pull/17939
	 */
	public function test_mock_masterbar_activation() {
		$result = $this->instance->mock_masterbar_activation();
		$this->assertInstanceOf( 'Automattic\Jetpack\Dashboard_Customizations\Masterbar', $result, 'The Masterbar class was not initiated.' );
	}
}
