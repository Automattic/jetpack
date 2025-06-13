<?php
/**
 * Jetpack Compatibility Test file.
 *
 * @package wpcomsh
 */

/**
 * Test Jetpack_Compatibility functionality.
 */
class JetpackCompatibilityTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Test_wpcomsh_get_plugin_updated_submenus.
	 */
	public function test_wpcomsh_my_jetpack_rest_apis_available() {
		// Check if the REST API routes are registered if Boost is included.
		$plugins = getenv( 'JP_MONO_INTEGRATION_PLUGINS' );
		if ( ! $plugins || strpos( $plugins, 'boost' ) === false ) {
			$this->markTestSkipped( 'Jetpack Boost plugin is not included in JP_MONO_INTEGRATION_PLUGINS.' );
		}

		$routes = rest_get_server()->get_routes();

		$this->assertArrayHasKey( '/my-jetpack/v1/site/products', $routes, 'Products endpoint is not registered' );
	}
}
