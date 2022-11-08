<?php
require_jetpack_file( 'modules/memberships/class-jetpack-memberships.php' );

class WP_Test_Jetpack_Memberships extends WP_UnitTestCase {
	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();

		global $post;
		$post_id = self::factory()->post->create();
		$post    = get_post( $post_id );
		setup_postdata( $post );
	}

	public function test_post_with_no_post_visibility_setting_is_accessible() {
		update_post_meta( get_the_ID(), Jetpack_Memberships::$newsletter_access_level_meta_name, '' );
		$this->assertTrue( Jetpack_Memberships::user_can_view_post() );
	}

	public function test_post_not_marked_as_everybody_is_accessible() {
		update_post_meta( get_the_ID(), Jetpack_Memberships::$newsletter_access_level_meta_name, 'everybody' );
		$this->assertTrue( Jetpack_Memberships::user_can_view_post() );
	}

	public function test_post_not_marked_as_subscribers_is_not_accessible_to_everyone() {
		update_post_meta( get_the_ID(), Jetpack_Memberships::$newsletter_access_level_meta_name, 'subscribers' );
		$this->assertFalse( Jetpack_Memberships::user_can_view_post() );
	}

	// public function test_post_not_marked_as_paid_subscribers_is_not_accessible_to_everyone() {
	// update_post_meta( get_the_ID(), Jetpack_Memberships::$newsletter_access_level_meta_name, 'paid_subscribers' );
	// $this->assertFalse( Jetpack_Memberships::user_can_view_post() );
	// }
}
