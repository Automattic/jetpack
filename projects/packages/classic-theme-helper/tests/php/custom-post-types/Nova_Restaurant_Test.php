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
	 * Clean up the post type, taxonomies, theme support and hooks between tests.
	 */
	protected function tearDown(): void {
		remove_theme_support( Nova_Restaurant::MENU_ITEM_POST_TYPE );

		if ( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) ) {
			unregister_post_type( Nova_Restaurant::MENU_ITEM_POST_TYPE );
		}

		foreach ( array( Nova_Restaurant::MENU_TAX, Nova_Restaurant::MENU_ITEM_LABEL_TAX ) as $taxonomy ) {
			if ( taxonomy_exists( $taxonomy ) ) {
				unregister_taxonomy( $taxonomy );
			}
		}

		remove_all_actions( 'restapi_theme_init' );

		parent::tearDown();
	}

	/**
	 * A theme that declares support before the class is instantiated gets the post type right away.
	 */
	public function test_registers_post_type_when_theme_declares_support_up_front() {
		add_theme_support( Nova_Restaurant::MENU_ITEM_POST_TYPE );

		new Nova_Restaurant();

		$this->assertTrue( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );
	}

	/**
	 * Without theme support, nothing is registered.
	 */
	public function test_does_not_register_post_type_without_theme_support() {
		new Nova_Restaurant();

		$this->assertFalse( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );
	}

	/**
	 * WordPress.com Simple loads the theme after `init` during REST API requests, replaying the theme's
	 * `after_setup_theme` callbacks on `restapi_theme_init`. Theme support is undeclared when the class is
	 * instantiated, so the post type has to be registered once the hook fires.
	 */
	public function test_registers_post_type_when_theme_support_arrives_on_restapi_theme_init() {
		new Nova_Restaurant();

		$this->assertFalse( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );

		add_action(
			'restapi_theme_init',
			function () {
				add_theme_support( Nova_Restaurant::MENU_ITEM_POST_TYPE );
			}
		);

		do_action( 'restapi_theme_init' );

		$this->assertTrue( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );
	}

	/**
	 * The replayed theme callbacks keep their original priority and are hooked after ours, so a theme
	 * declaring support from a default-priority `init` callback would otherwise run too late for us to see.
	 */
	public function test_registers_post_type_when_theme_support_is_declared_at_default_priority() {
		new Nova_Restaurant();

		// Mirrors a theme `init` callback copied onto `restapi_theme_init` at its original priority.
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
	 * The post type stays unregistered when the theme never declares support, even once the hook fires.
	 */
	public function test_does_not_register_post_type_on_restapi_theme_init_without_theme_support() {
		new Nova_Restaurant();

		do_action( 'restapi_theme_init' );

		$this->assertFalse( post_type_exists( Nova_Restaurant::MENU_ITEM_POST_TYPE ) );
	}
}
