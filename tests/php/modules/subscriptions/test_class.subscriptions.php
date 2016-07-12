<?php

require dirname( __FILE__ ) . '/../../../../modules/subscriptions.php';

class WP_Test_Subscriptions extends WP_UnitTestCase {

	private $fired_email_subscribers = false;
	private $emailed_post_id = null;
	private $post;

	public function setUp() {
		parent::setUp();

		$this->subscriptions  = Jetpack_Subscriptions::init();
		$this->fired_email_subscribers = false;
		$this->emailed_post_id = null;

		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$this->post = get_post( $post_id );

		add_action( 'jetpack_email_subscribers', array( $this, 'email_subscribers' ), 10, 1 );
	}

	public function test_fires_jetpack_email_subscribers_on_save_as_published() {
		$this->post->post_status = 'publish';
		$post_id = wp_insert_post( $this->post->to_array() );
		$this->assertSendEmail( true, $post_id );
	}

	public function test_does_not_fire_jetpack_email_subscribers_on_other_status_transitions() {
		$this->post->post_status = 'pending';
		wp_insert_post( $this->post->to_array() );

		$this->assertSendEmail( false, $this->post->ID );
	}
	public function test_does_not_fire_jetpack_email_subscribers_on_other_post_types() {
		$this->post->post_status = 'publish';
		$this->post->post_status = 'page';
		wp_insert_post( $this->post->to_array() );

		$this->assertSendEmail( false, $this->post->ID );
	}

	public function test_does_not_fire_jetpack_email_subscribers_post_with_passwords() {
		$this->post->post_status = 'publish';
		$this->post->post_password = 'password';
		wp_insert_post( $this->post->to_array() );

		$this->assertSendEmail( false, $this->post->ID );
	}

	public function test_does_not_fire_jetpack_email_subscribers_with_filters_set() {
		$this->post->post_status = 'publish';
		
		add_filter( 'jetpack_is_post_mailable', '__return_false' );
		wp_insert_post( $this->post->to_array() );
		
		$this->assertSendEmail( false, $this->post->ID );

		remove_filter( 'jetpack_is_post_mailable', '__return_false' );

		$this->fired_email_subscribers = false;
		$this->emailed_post_id = null;

		add_filter( 'jetpack_subscriptions_exclude_these_categories', array( __CLASS__, 'exclude_category_from_subscribers' ) );
		wp_insert_post( $this->post->to_array() );
		$this->assertSendEmail( false, $this->post->ID );
		remove_filter( 'jetpack_subscriptions_exclude_these_categories', array( __CLASS__, 'exclude_category_from_subscribers' ) );


		// Don't send the email because the category is not included...
		add_filter( 'jetpack_subscriptions_exclude_all_categories_except', array( __CLASS__, 'include_category_from_subscribers' ) );
		wp_insert_post( $this->post->to_array() );
		$this->assertSendEmail( false, $this->post->ID );
		remove_filter( 'jetpack_subscriptions_exclude_all_categories_except', array( __CLASS__, 'include_category_from_subscribers' ) );


		// Should send the email if the filters are not there any more..
		wp_insert_post( $this->post->to_array() );
		$this->assertSendEmail( true, $this->post->ID );
	}

	public function test_does_not_fire_jetpack_email_subscribers_with_checkbox_to_not_send_email() {
		global $_POST;
		$nonce = wp_create_nonce( 'disable_subscribe' );
		$_POST['disable_subscribe_nonce'] = $nonce;
		$_POST['_jetpack_dont_email_post_to_subs'] = true;
		$this->post->post_status = 'publish';

		// Should send the email if the filters are not there any more..
		wp_insert_post( $this->post->to_array() );
		$this->assertSendEmail( false, $this->post->ID );
	}


	function assertSendEmail( $should_have_sent_email, $post_id ) {
		if ( $should_have_sent_email ) {
			$this->assertTrue( $this->fired_email_subscribers );
			$this->assertEquals( $post_id, $this->emailed_post_id );
		} else {
			$this->assertFalse( $this->fired_email_subscribers );
			$this->assertNull( $this->emailed_post_id );
		}

	}

	static function exclude_category_from_subscribers() {
		return array( 1 );
	}

	static function include_category_from_subscribers() {
		return array( 2 );
	}

	function email_subscribers( $post_id ) {
		$this->fired_email_subscribers = true;
		$this->emailed_post_id = $post_id;
	}

	function prevent_publicize_post( $should_publicize, $post ) {
		return false;
	}
}
