<?php
require dirname( __FILE__ ) . '/../../../../modules/subscriptions.php';

class WP_Test_Jetpack_Subscriptions extends WP_UnitTestCase {
	static function setupBeforeClass() {
		Jetpack_Subscriptions::init();
	}

	function test_publishing_post_first_time_does_not_set_do_not_send_subscription_flag() {
		$post_id = $this->factory->post->create();
		wp_publish_post( $post_id );
		$this->assertEmpty( get_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', true ) );
	}

}
