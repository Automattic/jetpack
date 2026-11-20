<?php
/**
 * Knowledge provider arbitration.
 *
 * @package automattic/jetpack-knowledge
 */

use Automattic\Jetpack\Knowledge;
use Automattic\Jetpack\Knowledge\Knowledge_Post_Type;
use PHPUnit\Framework\Attributes\DataProvider;
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

	public function test_native_api_owns_the_runtime_before_registering_the_post_type() {
		require __DIR__ . '/fixtures/gutenberg-experiment.php';
		require __DIR__ . '/fixtures/knowledge-provider.php';
		Knowledge::init();
		Knowledge::bootstrap();
		$this->assertFalse( post_type_exists( 'wp_knowledge' ) );
		$this->assertArrayNotHasKey( '/wp/v2/knowledge/guideline-scopes', rest_get_server()->get_routes() );
		$this->assertSame( 10, has_action( 'admin_enqueue_scripts', 'gutenberg_guidelines_wp_admin_enqueue_scripts' ) );
		$this->assertFalse( has_action( 'init', array( Knowledge_Post_Type::class, 'register' ) ) );
	}

	/**
	 * @dataProvider gutenberg_load_orders
	 * @param bool $gutenberg_first Whether Gutenberg loads before Jetpack.
	 * @param bool $early_rest Whether REST initializes before Gutenberg loads.
	 */
	#[DataProvider( 'gutenberg_load_orders' )]
	public function test_enabled_gutenberg_experiment_registers_without_collisions( $gutenberg_first, $early_rest ) {
		$GLOBALS['wp_actions']['plugins_loaded'] = 0;
		$GLOBALS['wp_actions']['init']           = 0;
		remove_all_actions( 'plugins_loaded' );
		remove_all_actions( 'init' );
		update_option( 'gutenberg-experiments', array( 'gutenberg-guidelines' => true ) );
		$public_functions = array( 'wp_knowledge_types', 'wp_guideline_scopes', 'wp_guideline_max_length' );

		if ( ! $gutenberg_first ) {
			Knowledge::init();
			if ( $early_rest ) {
				$GLOBALS['wp_rest_server'] = null;
				rest_get_server();
			}
			foreach ( $public_functions as $function ) {
				$this->assertFalse( function_exists( $function ) );
			}
		}

		$experiments = get_option( 'gutenberg-experiments' );
		if ( ! empty( $experiments['gutenberg-guidelines'] ) ) {
			require __DIR__ . '/fixtures/gutenberg-knowledge/index.php';
		}
		if ( $gutenberg_first ) {
			Knowledge::init();
		}

		do_action( 'plugins_loaded' );
		do_action( 'init' );
		$GLOBALS['wp_rest_server'] = new WP_REST_Server();
		do_action( 'rest_api_init', $GLOBALS['wp_rest_server'] );

		$this->assertSame( 'Gutenberg_Knowledge_REST_Controller', get_post_type_object( 'wp_knowledge' )->rest_controller_class );
		foreach ( $public_functions as $function ) {
			$this->assertSame( __DIR__ . '/fixtures/gutenberg-knowledge/knowledge.php', ( new ReflectionFunction( $function ) )->getFileName() );
		}
		$this->assertTrue( taxonomy_exists( 'wp_knowledge_type' ) );
		$route     = rest_get_server()->get_routes()['/wp/v2/knowledge/guideline-scopes'];
		$endpoints = array_values( array_filter( $route, 'is_array' ) );
		$this->assertCount( 1, $endpoints );
		$this->assertSame( 'Gutenberg_Guideline_Scopes_REST_Controller', get_class( $endpoints[0]['callback'][0] ) );
		$this->assertFalse( has_action( 'init', array( Knowledge_Post_Type::class, 'register' ) ) );
		$this->assertFalse( has_action( 'rest_api_init', array( Knowledge::class, 'register_rest_routes' ) ) );
	}

	/**
	 * @return array Plugin loading scenarios.
	 */
	public static function gutenberg_load_orders() {
		return array(
			'gutenberg first'               => array( true, false ),
			'jetpack first'                 => array( false, false ),
			'jetpack first with early REST' => array( false, true ),
		);
	}

	public function test_disabled_experiment_uses_fallback() {
		require __DIR__ . '/fixtures/gutenberg-experiment.php';
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
