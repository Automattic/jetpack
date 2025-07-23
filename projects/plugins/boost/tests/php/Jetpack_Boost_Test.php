<?php

namespace Automattic\Jetpack_Boost\Tests;

use Automattic\Jetpack_Boost\Jetpack_Boost;
use WorDBless\BaseTestCase;

// Include the main plugin file to load all functions and classes
require_once dirname( __DIR__, 2 ) . '/jetpack-boost.php';

/**
 * Test class for Jetpack_Boost
 *
 * @package Automattic\Jetpack_Boost\Tests
 */
class Jetpack_Boost_Test extends BaseTestCase {

	/**
	 * Test that handle_version_change removes empty string from cornerstone_pages_list
	 */
	public function test_handle_version_change_removes_empty_string_from_cornerstone_pages_list() {
		// Create an instance of Jetpack_Boost to ensure proper initialization
		$jetpack_boost = new Jetpack_Boost();

		// Trigger init to ensure all hooks are set up
		do_action( 'init' );

		// Set up the initial cornerstone_pages_list with an empty string
		$initial_pages = array( '/about', '', '/contact', '/blog' );

		// Set the data sync value
		jetpack_boost_ds_set( 'cornerstone_pages_list', $initial_pages );

		// Call handle_version_change
		$jetpack_boost->handle_version_change();

		// Get the updated cornerstone_pages_list
		$updated_pages = jetpack_boost_ds_get( 'cornerstone_pages_list' );

		// Verify that the empty string was removed but other items remain
		$this->assertIsArray( $updated_pages, 'The updated pages should be an array' );
		$this->assertNotContains( '', $updated_pages, 'Empty string should be removed from cornerstone_pages_list' );
		$this->assertContains( home_url( '/about' ), $updated_pages, 'Other pages should remain in the list' );
		$this->assertContains( home_url( '/contact' ), $updated_pages, 'Other pages should remain in the list' );
		$this->assertContains( home_url( '/blog' ), $updated_pages, 'Other pages should remain in the list' );
		$this->assertCount( 3, $updated_pages, 'Should have exactly 3 items after removing empty string' );
	}

	/**
	 * Test that handle_version_change does nothing when cornerstone_pages_list doesn't contain empty string
	 */
	public function test_handle_version_change_does_nothing_when_no_empty_string() {
		// Create an instance of Jetpack_Boost to ensure proper initialization
		$jetpack_boost = new Jetpack_Boost();

		// Trigger init to ensure all hooks are set up
		do_action( 'init' );

		// Set up the initial cornerstone_pages_list without an empty string
		$initial_pages = array( '/about', '/contact', '/blog' );

		// Set the data sync value
		jetpack_boost_ds_set( 'cornerstone_pages_list', $initial_pages );

		// Call handle_version_change
		$jetpack_boost->handle_version_change();

		// Get the updated cornerstone_pages_list
		$updated_pages = jetpack_boost_ds_get( 'cornerstone_pages_list' );

		// Verify that the array remains unchanged
		$this->assertIsArray( $updated_pages, 'The updated pages should be an array' );
		$this->assertEquals( array_map( 'home_url', $initial_pages ), $updated_pages, 'The array should remain unchanged when no empty string is present' );
	}
}
