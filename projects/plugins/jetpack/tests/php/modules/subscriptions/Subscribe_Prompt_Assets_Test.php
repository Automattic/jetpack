<?php

require_once JETPACK__PLUGIN_DIR . 'modules/subscriptions.php';

class Subscribe_Prompt_Assets_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

	/**
	 * Set up.
	 */
	public function set_up() {
		parent::set_up();
		$_GET['jetpack_skip_subscription_popup'] = '';
	}

	/**
	 * Tear down.
	 */
	public function tear_down() {
		unset( $_GET['jetpack_skip_subscription_popup'] );
		wp_dequeue_script( 'subscribe-modal-js' );
		wp_deregister_script( 'subscribe-modal-js' );
		wp_dequeue_style( 'subscribe-modal-css' );
		wp_deregister_style( 'subscribe-modal-css' );
		wp_dequeue_script( 'subscribe-overlay-js' );
		wp_deregister_script( 'subscribe-overlay-js' );
		wp_dequeue_style( 'subscribe-overlay-css' );
		wp_deregister_style( 'subscribe-overlay-css' );
		parent::tear_down();
	}

	/**
	 * Subscriber email markers must be processed even off the modal surface.
	 */
	public function test_subscriber_email_link_enqueues_modal_script_without_modal_styles() {
		$modal = $this->getMockBuilder( Jetpack_Subscribe_Modal::class )
			->onlyMethods( array( 'should_user_see_modal' ) )
			->disableOriginalConstructor()
			->getMock();
		$modal->expects( $this->once() )->method( 'should_user_see_modal' )->willReturn( false );

		$modal->enqueue_assets();

		$this->assertTrue( wp_script_is( 'subscribe-modal-js', 'enqueued' ) );
		$this->assertFalse( wp_style_is( 'subscribe-modal-css', 'enqueued' ) );
	}

	/**
	 * Subscriber email markers must be processed even off the overlay surface.
	 */
	public function test_subscriber_email_link_enqueues_overlay_script_without_overlay_styles() {
		$overlay = $this->getMockBuilder( Jetpack_Subscribe_Overlay::class )
			->onlyMethods( array( 'should_user_see_overlay' ) )
			->disableOriginalConstructor()
			->getMock();
		$overlay->expects( $this->once() )->method( 'should_user_see_overlay' )->willReturn( false );

		$overlay->enqueue_assets();

		$this->assertTrue( wp_script_is( 'subscribe-overlay-js', 'enqueued' ) );
		$this->assertFalse( wp_style_is( 'subscribe-overlay-css', 'enqueued' ) );
	}
}
