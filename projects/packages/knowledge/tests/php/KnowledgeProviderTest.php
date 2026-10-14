<?php
/**
 * Knowledge provider arbitration.
 *
 * @package automattic/jetpack-knowledge
 */

use Automattic\Jetpack\Knowledge;
use Automattic\Jetpack\Knowledge\Knowledge_Post_Type;
use PHPUnit\Framework\Attributes\PreserveGlobalState;
use PHPUnit\Framework\Attributes\RunTestsInSeparateProcesses;
use PHPUnit\Framework\TestCase;

/**
 * Each request chooses its provider before registering any feature hooks.
 *
 * @runTestsInSeparateProcesses
 * @preserveGlobalState disabled
 */
#[RunTestsInSeparateProcesses]
#[PreserveGlobalState( false )]
class KnowledgeProviderTest extends TestCase {
	public function test_fallback_without_gutenberg_registers_once() {
		$admin_menu_hooks = $GLOBALS['wp_filter']['admin_menu']->callbacks ?? array();
		Knowledge::init();
		// @phan-suppress-next-line PhanPluginDuplicateAdjacentStatement -- Verify repeated initialization is idempotent.
		Knowledge::init();
		Knowledge::bootstrap();
		$this->assertSame( $admin_menu_hooks, $GLOBALS['wp_filter']['admin_menu']->callbacks ?? array() );
		$this->assertSame( \Automattic\Jetpack\Knowledge\Knowledge_REST_Controller::class, get_post_type_object( 'wp_knowledge' )->rest_controller_class );
		$this->assertSame( 10, has_action( 'init', array( Knowledge_Post_Type::class, 'register' ) ) );
		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		do_action( 'rest_api_init', $GLOBALS['wp_rest_server'] );
		$route = rest_get_server()->get_routes()['/wp/v2/knowledge/guideline-scopes'];
		$this->assertCount( 1, array_filter( $route, 'is_array' ) );
	}

	public function test_enabled_experiment_owns_the_runtime() {
		require __DIR__ . '/fixtures/gutenberg-experiment.php';
		update_option( 'gutenberg-experiments', array( 'gutenberg-guidelines' => true ) );
		Knowledge::init();
		Knowledge::bootstrap();
		$this->assertFalse( post_type_exists( 'wp_knowledge' ) );
		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', 'gutenberg_guidelines_wp_admin_enqueue_scripts' ) );
		$this->assertFalse( has_action( 'init', array( Knowledge_Post_Type::class, 'register' ) ) );
	}

	public function test_disabled_experiment_uses_fallback() {
		require __DIR__ . '/fixtures/gutenberg-experiment.php';
		update_option( 'gutenberg-experiments', array( 'gutenberg-guidelines' => false ) );
		Knowledge::init();
		$this->assertTrue( post_type_exists( 'wp_knowledge' ) );
		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', 'gutenberg_guidelines_wp_admin_enqueue_scripts' ) );
		$this->assertSame( 10, has_action( 'guidelines-wp-admin_init', 'gutenberg_register_guidelines_wp_admin_page_routes' ) );
	}

	public function test_existing_provider_is_preserved() {
		register_post_type(
			'wp_knowledge', // phpcs:ignore WordPress.NamingConventions.ValidPostTypeSlug.ReservedPrefix -- Simulate the upstream provider.
			array(
				'rest_base' => 'knowledge',
				'supports'  => array( 'title' ),
			)
		);
		Knowledge::init();
		$this->assertSame( array( 'title' => true ), get_all_post_type_supports( 'wp_knowledge' ) );
		$this->assertFalse( has_action( 'init', array( Knowledge_Post_Type::class, 'register' ) ) );
	}

	public function test_early_rest_initialization_registers_storage_before_routes() {
		$GLOBALS['wp_actions']['init'] = 0;
		Knowledge::init();
		$this->assertFalse( post_type_exists( 'wp_knowledge' ) );
		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		do_action( 'rest_api_init', $GLOBALS['wp_rest_server'] );
		$this->assertTrue( post_type_exists( 'wp_knowledge' ) );
		$this->assertArrayHasKey( '/wp/v2/knowledge', rest_get_server()->get_routes() );
		$this->assertArrayHasKey( '/wp/v2/knowledge/guideline-scopes', rest_get_server()->get_routes() );
	}
}
