<?php
/**
 * WP_REST_Jetpack_AI_JWT Tests File
 *
 * @package automattic/jetpack-agents-manager
 */

namespace Automattic\Jetpack\Agents_Manager;

use Automattic\Jetpack\Connection\REST_Jetpack_AI_JWT;
use PHPUnit\Framework\Attributes\CoversClass;

require_once __DIR__ . '/../../src/class-wp-rest-jetpack-ai-jwt.php';

/**
 * Class WP_REST_Jetpack_AI_JWT_Test
 *
 * @covers \Automattic\Jetpack\Agents_Manager\WP_REST_Jetpack_AI_JWT
 */
#[CoversClass( WP_REST_Jetpack_AI_JWT::class )]
class WP_REST_Jetpack_AI_JWT_Test extends \WorDBless\BaseTestCase {

	/**
	 * Deprecated functions reported while a test ran.
	 *
	 * @var string[]
	 */
	private $deprecated = array();

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		add_filter( 'deprecated_function_trigger_error', '__return_false' );
		add_action( 'deprecated_function_run', array( $this, 'record_deprecation' ) );
	}

	/**
	 * Tear down test fixtures.
	 */
	public function tear_down() {
		remove_filter( 'deprecated_function_trigger_error', '__return_false' );
		remove_action( 'deprecated_function_run', array( $this, 'record_deprecation' ) );
		$this->deprecated = array();

		parent::tear_down();
	}

	/**
	 * Records a deprecated function call.
	 *
	 * @param string $function_name The deprecated function.
	 */
	public function record_deprecation( $function_name ) {
		$this->deprecated[] = $function_name;
	}

	/**
	 * Tests that the class is a deprecated alias of the Connection package controller.
	 */
	public function test_is_deprecated_alias_of_connection_controller() {
		// @phan-suppress-next-line PhanDeprecatedClass, PhanDeprecatedFunction -- The deprecated alias is the subject under test.
		$controller = new WP_REST_Jetpack_AI_JWT();

		$this->assertInstanceOf( REST_Jetpack_AI_JWT::class, $controller );
		$this->assertContains( WP_REST_Jetpack_AI_JWT::class . '::__construct', $this->deprecated );
	}

	/**
	 * Tests that the alias still registers the route.
	 */
	public function test_alias_registers_route() {
		// @phan-suppress-next-line PhanDeprecatedClass, PhanDeprecatedFunction -- The deprecated alias is the subject under test.
		( new WP_REST_Jetpack_AI_JWT() )->register_rest_route();

		$this->assertArrayHasKey( '/jetpack/v4/jetpack-ai-jwt', rest_get_server()->get_routes() );

		global $wp_rest_server;
		$wp_rest_server = null;
	}
}
