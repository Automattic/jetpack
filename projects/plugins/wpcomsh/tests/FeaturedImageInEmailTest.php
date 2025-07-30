<?php
/**
 * Featured Image in Email Test file.
 *
 * @package wpcomsh
 */

/**
 * Class FeaturedImageInEmailTest.
 */
class FeaturedImageInEmailTest extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up before each test.
	 */
	public function setUp(): void {
		parent::setUp();

		// Remove any existing jetpack_options to start fresh
		delete_option( 'jetpack_options' );
	}

	/**
	 * Test that sites created before May 2, 2025 return false.
	 */
	public function test_sites_before_may_2_2025_return_false() {
		// Set up a site ID that represents a site created before May 2, 2025
		update_option( 'jetpack_options', array( 'id' => 242783457 ) ); // March 2025

		$result = wpcomsh_featured_image_in_email_default();
		$this->assertFalse( $result );
	}

	/**
	 * Test that sites created after May 2, 2025 return true.
	 */
	public function test_sites_after_may_2_2025_return_true() {
		// Set up a site ID that represents a site created after May 2, 2025
		update_option( 'jetpack_options', array( 'id' => 244360257 ) ); // May 9, 2025

		$result = wpcomsh_featured_image_in_email_default();
		$this->assertTrue( $result );
	}

	/**
	 * Test that sites without jetpack_options return false.
	 */
	public function test_sites_without_jetpack_options_return_false() {
		// Don't set jetpack_options at all

		$result = wpcomsh_featured_image_in_email_default();
		$this->assertFalse( $result );
	}

	/**
	 * Test that sites with empty jetpack_options return false.
	 */
	public function test_sites_with_empty_jetpack_options_return_false() {
		// Set up empty jetpack_options
		update_option( 'jetpack_options', array() );

		$result = wpcomsh_featured_image_in_email_default();
		$this->assertFalse( $result );
	}

	/**
	 * Test that sites with jetpack_options but no id return false.
	 */
	public function test_sites_with_jetpack_options_no_id_return_false() {
		// Set up jetpack_options without id
		update_option( 'jetpack_options', array( 'other_option' => 'value' ) );

		$result = wpcomsh_featured_image_in_email_default();
		$this->assertFalse( $result );
	}

	/**
	 * Test that the filter is properly hooked.
	 */
	public function test_filter_is_hooked() {
		global $wp_filter;

		$this->assertArrayHasKey( 'default_option_wpcom_featured_image_in_email', $wp_filter );
		$this->assertNotEmpty( $wp_filter['default_option_wpcom_featured_image_in_email'] );
	}
}
