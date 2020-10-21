<?php // phpcs:ignore WordPress.Files.FileName
/**
 * Autoloader container test suite.
 *
 * @package automattic/jetpack-autoloader
 */

use PHPUnit\Framework\TestCase;

/**
 * Test suite class for the autoloader part that handles dependency management.
 *
 * @runClassInSeparateProcess
 * @preserveGlobalState disabled
 */
class Test_Autoloader_Container extends TestCase {

	/**
	 * Tests that the container can register shared dependencies between instances.
	 */
	public function test_container_registers_shared_dependencies() {
		global $jetpack_autoloader_container_shared;
		$this->assertNull( $jetpack_autoloader_container_shared );

		$container_a = new Autoloader_Container();
		$container_b = new Autoloader_Container();

		$this->assertNotNull( $jetpack_autoloader_container_shared );
		$this->assertSame( $container_a->get( Hook_Manager::class ), $container_b->get( Hook_Manager::class ) );
	}
}
