<?php

require_jetpack_file( 'modules/sitemaps/sitemaps.php' );

class WP_Test_Jetpack_Sitemap_Manager extends WP_UnitTestCase {

	/**
	 * Constructor does not throw any fatal errors.
	 *
	 * @covers Jetpack_Sitemap_Manager::__construct
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_manager_constructor() {
		$manager = new Jetpack_Sitemap_Manager(); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->assertTrue( true );
	}

	/**
	 * Tests default value of 'jetpack_sitemap_location' filter.
	 *
	 * @covers Jetpack_Sitemap_Manager::callback_action_filter_sitemap_location
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_manager_filter_sitemap_location_sets_option_default() {
		$manager = new Jetpack_Sitemap_Manager();

		// Start with an empty option.
		delete_option( 'jetpack_sitemap_location' );

		// Check default value.
		$manager->callback_action_filter_sitemap_location();
		$location = get_option( 'jetpack_sitemap_location' );
		$this->assertSame( '', $location );

		// Clean up.
		delete_option( 'jetpack_sitemap_location' );
	}

	/**
	 * Tests value of 'jetpack_sitemap_location' when a filter is added.
	 *
	 * @covers Jetpack_Sitemap_Manager::callback_action_filter_sitemap_location
	 * @group jetpack-sitemap
	 * @since 4.7.0
	 */
	public function test_sitemap_manager_filter_sitemap_location_sets_option_add() {
		$manager = new Jetpack_Sitemap_Manager();

		// Start with an empty option.
		delete_option( 'jetpack_sitemap_location' );

		// Set the location.
		function add_location( $string ) { // phpcs:ignore MediaWiki.Usage.NestedFunctions.NestedFunction
			$string .= '/blah';
			return $string;
		}
		add_filter( 'jetpack_sitemap_location', 'add_location' );

		$manager->callback_action_filter_sitemap_location();
		$location = get_option( 'jetpack_sitemap_location' );
		$this->assertEquals( '/blah', $location );

		// Clean up.
		delete_option( 'jetpack_sitemap_location' );
	}

}
