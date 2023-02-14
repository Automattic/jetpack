<?php

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';
require_once JETPACK__PLUGIN_DIR . 'extensions/blocks/premium-content/_inc/access-check.php';
require_once JETPACK__PLUGIN_DIR . 'modules/memberships/class-jetpack-memberships.php';

class WP_Test_Jetpack_Premium_Content extends WP_UnitTestCase {

	protected $regular_non_subscriber_id;
	protected $regular_subscriber_id;
	protected $paid_subscriber_id;
	protected $admin_user_id;

	protected $product_id = 1234;

	protected $plan_id;

	public function set_up() {
		parent::set_up();
		Jetpack_Subscriptions::init();
		add_filter( 'test_jetpack_is_supported_jetpack_recurring_payments', '__return_true' );
		$this->set_up_users();
	}

	public function tear_down() {
		// Clean up
		remove_all_filters( 'earn_get_user_subscriptions_for_site_id' );
		remove_all_filters( 'test_jetpack_is_supported_jetpack_recurring_payments' );
		parent::tear_down();
	}

	private function set_up_users() {

		$this->regular_subscriber_id = $this->factory->user->create(
			array(
				'user_email' => 'test-subscriber@example.com',
			)
		);
		$this->paid_subscriber_id    = $this->factory->user->create(
			array(
				'user_email' => 'test-paid@example.com',
			)
		);

		$this->admin_user_id = $this->factory->user->create(
			array(
				'user_email' => 'test-admin@example.com',
			)
		);

		get_user_by( 'id', $this->admin_user_id )->add_role( 'administrator' );
	}

	public function test_access_check_current_visitor_can_access() {
		$post_id         = $this->factory->post->create();
		$GLOBALS['post'] = get_post( $post_id );
		wp_set_current_user( $this->admin_user_id );
		$this->assertTrue( Automattic\Jetpack\Extensions\Premium_Content\current_visitor_can_access( array(), array() ) );
	}
}


