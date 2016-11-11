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

	function test_updating_post_immediately_sets_doesnt_set_dont_email_flag() {
		$post_id = $this->factory->post->create();

		// Publish and then immediately update the post, which should set the do not send flag
		wp_publish_post( $post_id );
		wp_update_post( array(
			'ID'           => $post_id,
			'post_content' => 'The updated post content',
		) );

		echo get_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', true );
		$this->assertEmpty( get_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', true ) );
	}

	function test_updating_post_after_day_sets_dont_email_flag() {
		$post_id = $this->factory->post->create();

		// Publish and then immediately update the post, which should set the do not send flag
		wp_publish_post( $post_id );
		add_filter( 'wp_insert_post_data', array( $this, '__set_post_modified_in_future' ) );
		wp_update_post( array(
			'ID'                 => $post_id,
			'post_content'       => 'The updated post content',
			'post_modified'      => gmdate( 'Y-m-d H:i:s', ( time() + 2 * DAY_IN_SECONDS ) ),
			'post_modified_gmt'  => gmdate( 'Y-m-d H:i:s', ( time() + 2 * DAY_IN_SECONDS ) ),
		) );
		remove_filter( 'wp_insert_post_data', array( $this, '__set_post_modified_in_future' ) );

		$this->assertEquals( '1',  get_post_meta( $post_id, '_jetpack_dont_email_post_to_subs', true ) );
	}

	function __set_post_modified_in_future( $post ) {
		$post['post_modified']     = gmdate( 'Y-m-d H:i:s', ( time() + 2 * DAY_IN_SECONDS ) );
		$post['post_modified_gmt'] = gmdate( 'Y-m-d H:i:s', ( time() + 2 * DAY_IN_SECONDS ) );

		return $post;
	}
}
