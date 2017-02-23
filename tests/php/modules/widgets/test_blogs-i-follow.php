<?php

require dirname( __FILE__ ) . '/../../../../modules/widgets/blogs-i-follow.php';

class WP_Test_Jetpack_Blogs_I_Follow extends WP_UnitTestCase {
	protected $widget;

	function __construct() {
		parent::__construct();
		$this->widget = new Jetpack_Widget_Blogs_I_Follow;
	}

	public function test_jetpack_blogs_i_follow_widget_cron_intervals__adds_schedule() {
		$schedules = array();
		$updated_schedules = jetpack_blogs_i_follow_widget_cron_intervals( $schedules );
		$this->assertEquals( 1, count( $updated_schedules ) );
		$this->assertEquals( true, isset( $updated_schedules['minutes_10'] ) );
	}

	public function test_update_subscription_cache_if_needed__skips_with_no_widget_option() {
		// TODO: Make constant
		delete_option( 'widget_jp_blogs_i_follow' );
		$this->assertTrue( $this->widget->update_subscription_cache_if_needed() );
		$this->assertFalse( get_option( 'widget_jp_blogs_i_follow' ) );
	}

	public function test_update_subscription_cache_if_needed__skips_with_only_multiwidget() {
		$inactive_array = array( '_multiwidget' => 1 );
		update_option( 'widget_jp_blogs_i_follow', $inactive_array );
		$this->assertTrue( $this->widget->update_subscription_cache_if_needed() );
		$this->assertEquals( $inactive_array, get_option( 'widget_jp_blogs_i_follow' ) );
	}

	public function test_update_subscription_cache_if_needed__retrieve_subs_fails() {
		$mock = $this->getMockBuilder( 'Jetpack_Widget_Blogs_I_Follow' )
		             ->setMethods( array(
						 'retrieve_subscriptions',
					 	 'should_cron_execute'
					 ) )
		             ->disableOriginalConstructor()
		             ->getMock();

 		$mock->expects( $this->exactly( 1 ) )
 		     ->method( 'should_cron_execute' )
 		     ->will( $this->returnValue( true ) );

		$mock->expects( $this->exactly( 1 ) )
		     ->method( 'retrieve_subscriptions' )
		     ->will( $this->returnValue( array() ) );

		$pre_widget_options = array(
			array(
				'id' => 1,
				'title' => 'Blogs I Follow',
				'number' => 20,
				'user_id' => 1,
				'display' => 'grid',
				'subscriptions_cache' => 'TEST_SUBSCRIPTIONS_CACHE',
				'grid_html_cache' => 'TEST_GRID_CACHE'
			)
		);

		$this->assertTrue( update_option( 'widget_jp_blogs_i_follow', $pre_widget_options ) );
		$this->assertTrue( $mock->update_subscription_cache_if_needed() );
		$post_widget_options = get_option( 'widget_jp_blogs_i_follow' );
		$this->assertEquals( $pre_widget_options, $post_widget_options );
	}

	public function test_update_subscription_cache_if_needed__retrieve_subs_succeeds() {
		$mock = $this->getMockBuilder( 'Jetpack_Widget_Blogs_I_Follow' )
					 ->setMethods( array(
						 'retrieve_subscriptions',
						 'should_cron_execute'
					 ) )
		             ->disableOriginalConstructor()
		             ->getMock();

		$mock->expects( $this->exactly( 1 ) )
 		     ->method( 'should_cron_execute' )
 		     ->will( $this->returnValue( true ) );

		$mock->expects( $this->exactly( 1 ) )
		     ->method( 'retrieve_subscriptions' )
		     ->will( $this->returnValue( array(
				'id' => 1,
				'blog_id' => 1,
				'blog_url' => 'https://subscription.test.wordpress.com/',
				'feed_url' => 'https://feed.test.wordpress.com/',
				'date_subscribed' => null
			) ) );

		$pre_widget_options = array(
			array(
				'id' => 1,
				'title' => 'Blogs I Follow',
				'number' => 20,
				'user_id' => 1,
				'display' => 'grid',
				'subscriptions_cache' => 'TEST_SUBSCRIPTIONS_CACHE',
				'grid_html_cache' => 'TEST_GRID_CACHE'
			)
		);

		$this->assertTrue( update_option( 'widget_jp_blogs_i_follow', $pre_widget_options ) );
		$this->assertTrue( $mock->update_subscription_cache_if_needed() );
		$post_widget_options = get_option( 'widget_jp_blogs_i_follow' );
		$this->assertNotEquals( $pre_widget_options, $post_widget_options );
	}
}
