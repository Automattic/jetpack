<?php
require_jetpack_file( 'modules/subscriptions.php' );

class WP_Test_Jetpack_Subscriptions extends WP_UnitTestCase {
	/**
	 * Set up before class.
	 */
	public static function set_up_before_class() {
		parent::set_up_before_class();
		Jetpack_Subscriptions::init();
	}

	public function test_publishing_post_first_time_does_not_set_do_not_send_subscription_flag() {
		$post_id = self::factory()->post->create();
		wp_publish_post( $post_id );
		$this->assertEmpty( get_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', true ) );
	}

}
