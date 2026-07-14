<?php
/**
 * Test Nova_Restaurant.
 *
 * @package automattic/jetpack-classic-theme-helper
 */

namespace Automattic\Jetpack\Classic_Theme_Helper;

use PHPUnit\Framework\Attributes\CoversClass;
use PHPUnit\Framework\TestCase;

/**
 * Class Nova_Restaurant_Test
 *
 * @covers Automattic\Jetpack\Classic_Theme_Helper\Nova_Restaurant
 */
#[CoversClass( Nova_Restaurant::class )]
class Nova_Restaurant_Test extends TestCase {

	/**
	 * Instances created by a test, so their callbacks can be unhooked afterwards.
	 *
	 * @var Nova_Restaurant[]
	 */
	private $instances = array();

	/**
	 * Hooks that Nova_Restaurant attaches its methods to.
	 *
	 * @var array<string, string>
	 */
	private const HOOKS = array(
		'restapi_theme_init'     => 'maybe_register_cpt',
		'admin_menu'             => 'add_admin_menus',
		'admin_enqueue_scripts'  => 'enqueue_nova_styles',
		'admin_head'             => 'set_custom_font_icon',
		'parse_query'            => 'sort_menu_item_queries_by_menu_order',
		'posts_results'          => 'sort_menu_item_queries_by_menu_taxonomy',
		'wp_insert_post'         => 'add_post_meta',
		'template_include'       => 'setup_menu_item_loop_markup__in_filter',
		'enter_title_here'       => 'change_default_title',
		'post_updated_messages'  => 'updated_messages',
		'dashboard_glance_items' => 'add_to_dashboard',
	);

	/**
	 * Create an instance and remember it, so tearDown can unhook it again.
	 *
	 * @return Nova_Restaurant
	 */
	private function create_nova() {
		$nova              = new Nova_Restaurant();
		$this->instances[] = $nova;

		return $nova;
	}

	/**
	 * Count how many callbacks an instance has on a given hook.
	 *
	 * @param Nova_Restaurant $nova   Instance.
	 * @param string          $hook   Hook name.
	 * @param string          $method Method name.
	 * @return int
	 */
	private function count_callbacks( Nova_Restaurant $nova, $hook, $method ) {
		global $wp_filter;

		if ( ! isset( $wp_filter[ $hook ] ) ) {
			return 0;
		}

		$count = 0;
		foreach ( $wp_filter[ $hook ]->callbacks as $callbacks ) {
			foreach ( $callbacks as $callback ) {
				if ( is_array( $callback['function'] )
					&& $callback['function'][0] === $nova
					&& $callback['function'][1] === $method
				) {
					++$count;
				}
			}
		}

		return $count;
	}

	/**
	 * Undo the global state each test leaves behind: theme support, the post type, its taxonomies, and
	 * every callback the instances hooked. Leaving the object callbacks installed would let them pile up
	 * across tests and make later tests order-dependent.
	 */
	protected function tearDown(): void {
		remove_theme_support( Nova_Restaurant::MENU_ITEM_POST_TYPE );

		foreach ( $this->instances as $nova ) {
			foreach ( self::HOOKS as $hook => $method ) {
				remove_filter( $hook, array( $nova, $method ), 15 );
				remove_filter( $hook, array( $nova, $method ) );
			}
		}
		$this->instances = array();

		if ( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) ) {
			unregister_post_type( Nova_Restaurant::MENU_ITEM_POST_TYPE );
		}

		foreach ( array( Nova_Restaurant::MENU_TAX, Nova_Restaurant::MENU_ITEM_LABEL_TAX ) as $taxonomy ) {
			if ( taxonomy_exists( $taxonomy ) ) {
				unregister_taxonomy( $taxonomy );
			}
		}

		remove_all_actions( 'restapi_theme_after_setup_theme' );
		remove_all_actions( 'restapi_theme_init' );

		parent::tearDown();
	}

	/**
	 * A theme that declares support before the class is instantiated gets the post type right away.
	 */
	public function test_registers_post_type_when_theme_declares_support_up_front() {
		add_theme_support( Nova_Restaurant::MENU_ITEM_POST_TYPE );

		$this->create_nova();

		$this->assertTrue( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );
	}

	/**
	 * Without theme support, nothing is registered.
	 */
	public function test_does_not_register_post_type_without_theme_support() {
		$this->create_nova();

		$this->assertFalse( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );
	}

	/**
	 * The post type stays unregistered when the theme never declares support, even once the hook fires.
	 */
	public function test_does_not_register_post_type_on_restapi_theme_init_without_theme_support() {
		$this->create_nova();

		do_action( 'restapi_theme_init' );

		$this->assertFalse( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );
	}

	/**
	 * The production path for a theme like Canape, which declares support from `after_setup_theme`: the REST
	 * loader replays those callbacks on `restapi_theme_after_setup_theme` before firing `restapi_theme_init`.
	 */
	public function test_registers_post_type_when_theme_support_is_replayed_on_after_setup_theme() {
		$this->create_nova();

		$this->assertFalse( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );

		add_action(
			'restapi_theme_after_setup_theme',
			function () {
				add_theme_support( Nova_Restaurant::MENU_ITEM_POST_TYPE );
			}
		);

		do_action( 'restapi_theme_after_setup_theme' );
		do_action( 'restapi_theme_init' );

		$this->assertTrue( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );
	}

	/**
	 * A theme declaring support from `init` instead: the replayed callback keeps its original priority and is
	 * hooked after ours, so at the default priority WordPress would run ours first and see no support.
	 */
	public function test_registers_post_type_when_theme_support_is_declared_from_replayed_init() {
		$this->create_nova();

		add_action(
			'restapi_theme_init',
			function () {
				add_theme_support( Nova_Restaurant::MENU_ITEM_POST_TYPE );
			},
			10
		);

		do_action( 'restapi_theme_init' );

		$this->assertTrue( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );
	}

	/**
	 * Consumers that enumerate registered post types (post likes, sharing) hook `restapi_theme_init` at
	 * priority 20 precisely because theme-dependent CPTs register on this hook, so the post type has to exist
	 * by the time they run.
	 */
	public function test_post_type_exists_for_consumers_running_at_priority_20() {
		$this->create_nova();

		add_action(
			'restapi_theme_init',
			function () {
				add_theme_support( Nova_Restaurant::MENU_ITEM_POST_TYPE );
			},
			10
		);

		$seen_by_consumer = null;
		add_action(
			'restapi_theme_init',
			function () use ( &$seen_by_consumer ) {
				$seen_by_consumer = in_array(
					Nova_Restaurant::MENU_ITEM_POST_TYPE,
					get_post_types( array( 'public' => true ) ),
					true
				);
			},
			20
		);

		do_action( 'restapi_theme_init' );

		$this->assertTrue( $seen_by_consumer, 'A consumer at priority 20 should see the Nova post type.' );
	}

	/**
	 * Registration is idempotent: an instance that already registered on `init` must not hook its callbacks a
	 * second time when `restapi_theme_init` fires.
	 */
	public function test_registers_only_once() {
		add_theme_support( Nova_Restaurant::MENU_ITEM_POST_TYPE );

		$nova = $this->create_nova();

		do_action( 'restapi_theme_init' );

		$this->assertTrue( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );
		$this->assertSame(
			1,
			$this->count_callbacks( $nova, 'template_include', 'setup_menu_item_loop_markup__in_filter' ),
			'The instance should only hook its callbacks once.'
		);
	}
}
