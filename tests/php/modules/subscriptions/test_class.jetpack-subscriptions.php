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

	function test_updating_post_sets_do_not_send_subscription_flag() {
		$post_id = $this->factory->post->create();

		// Publish and then immediately update the post, which should set the do not send flag
		wp_publish_post( $post_id );
		wp_update_post( array(
			'ID'           => $post_id,
			'post_content' => 'The updated post content',
		) );

		$this->assertEquals( '1',  get_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', true ) );
	}
}
