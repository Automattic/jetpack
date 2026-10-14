<?php
/**
 * Shared Knowledge test fixtures.
 *
 * @package automattic/jetpack-knowledge
 */

use Automattic\Jetpack\Knowledge\Knowledge_Post_Type;
use Automattic\Jetpack\Knowledge\Knowledge_Scopes_REST_Controller;
use PHPUnit\Framework\TestCase;

/**
 * Exercise WordPress storage and REST against SQLite.
 */
abstract class KnowledgeTestCase extends TestCase {
	/**
	 * Restore WordPress state before each test.
	 */
	protected function setUp(): void {
		parent::setUp();
		require_once __DIR__ . '/../../src/knowledge.php';
		wp_set_current_user( 0 );
		Knowledge_Post_Type::register();
		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		do_action( 'rest_api_init', $GLOBALS['wp_rest_server'] );
		( new Knowledge_Scopes_REST_Controller() )->register_routes();
	}

	/**
	 * Remove test-owned content and extension filters.
	 */
	protected function tearDown(): void {
		wp_set_current_user( 0 );
		foreach ( get_posts(
			array(
				'post_type'   => 'wp_knowledge',
				'post_status' => 'any',
				'numberposts' => -1,
			)
		) as $post ) {
			wp_delete_post( $post->ID, true );
		}
		foreach ( array( 'wp_knowledge_types', 'wp_guideline_scopes', 'wp_guideline_max_length' ) as $hook ) {
			remove_all_filters( $hook );
		}
		parent::tearDown();
	}

	/**
	 * Create a user in the requested WordPress role.
	 *
	 * @param string $role Role name.
	 * @return int User ID.
	 */
	protected function user( $role ) {
		return wp_insert_user(
			array(
				'user_login' => wp_unique_id( 'knowledge-' ),
				'user_pass'  => 'test',
				'role'       => $role,
			)
		);
	}

	/**
	 * Dispatch a REST request through WordPress.
	 *
	 * @param string $method HTTP method.
	 * @param string $path REST route.
	 * @param array  $params Request parameters.
	 * @return WP_REST_Response REST response.
	 */
	protected function request( $method, $path = '/wp/v2/knowledge', $params = array() ) {
		$request = new WP_REST_Request( $method, $path );
		if ( 'GET' === $method ) {
			$request->set_query_params( $params );
		} else {
			$request->set_body_params( $params );
		}
		return rest_get_server()->dispatch( $request );
	}
}
