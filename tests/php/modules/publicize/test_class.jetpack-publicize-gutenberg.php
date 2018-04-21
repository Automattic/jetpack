<?php
/**
 * Test Publicize for Gutenberg.
 *
 * Tests for Jetpack_Publicize_Gutenberg which implements
 * back end for Publicize in Gutenberg.
 *
 * @package Jetpack
 * @subpackage Publicize
 * @since 5.9.1
 */

require_once dirname( __FILE__ ) . '/../../../../modules/publicize.php';
require_once dirname( __FILE__ ) . '/../../../../modules/publicize/class-jetpack-publicize-gutenberg.php';

class WP_Test_Jetpack_Publicize_Gutenberg extends WP_UnitTestCase {
	private $in_publish_filter = false;
	private $publicized_post_id = null;
	private $post;
	private $gutenberg_publicize;

	const CONNECTION_UID = '123';

	public function setUp() {
		parent::setUp();

		$this->publicize = publicize_init();
		$this->publicized_post_id = null;
		$this->gutenberg_publicize = new Jetpack_Publicize_Gutenberg();

		$post_id = $this->factory->post->create( array( 'post_status' => 'draft' ) );
		$this->post = get_post( $post_id );

		Jetpack_Options::update_options(
			array(
				'publicize_connections' => array(
					'facebook' => array(
						'id_number' => array(
							'connection_data' => array(
								'user_id'  => 0,
								'token_id' => self::CONNECTION_UID,
							),
						),
					),
				),
			)
		);

		add_filter( 'jetpack_published_post_flags', array( $this, 'set_post_flags_check' ), 20, 2 );
	}


	/**
	 * Verifies that 'publicize' field correctly sets up
	 * a connection to be skipped if it's flagged for
	 * not sharing.
	 *
	 * @covers Jetpack_Publicize_Gutenberg::process_publicize_from_rest()
	 * @since 5.9.1
	 */
	public function test_flag_connection_for_no_share() {
		// Simulate request to publish the draft post.
		$new_post              = clone $this->post;
		$new_post->post_status = 'publish';
		// Set up request to NOT share to the connection.
		$request = array(
			'publicize' => array(
				'connections' => array(
					array(
						'unique_id'    => self::CONNECTION_UID,
						'should_share' => false,
					),
				),
			),
		);

		// Pass request to 'rest_pre_insert_post' callback.
		$this->gutenberg_publicize->process_publicize_from_rest( $new_post, $request );

		$skip_meta = get_post_meta( $this->post->ID, $this->publicize->POST_SKIP . self::CONNECTION_UID, true );
		$this->assertEquals( '1', $skip_meta, 'Post skip meta key should be true for request to NOT share post to connection.' );
	}

	/**
	 * Verifies that 'publicize' field correctly sets up
	 * a connection to be NOT be skipped if it's flagged
	 * to be shared.
	 *
	 * @covers Jetpack_Publicize_Gutenberg::process_publicize_from_rest()
	 * @since 5.9.1
	 */
	public function test_flag_connection_for_share() {
		// Simulate request to publish the draft post.
		$new_post              = clone $this->post;
		$new_post->post_status = 'publish';

		// Set up request to share to the test connection.
		$request = array(
			'publicize' => array(
				'connections' => array(
					array(
						'unique_id'    => self::CONNECTION_UID,
						'should_share' => true,
					),
				),
			),
		);

		// Pass request to 'rest_pre_insert_post' callback.
		$this->gutenberg_publicize->process_publicize_from_rest( $new_post, $request );

		$skip_meta = get_post_meta( $this->post->ID, $this->publicize->POST_SKIP . self::CONNECTION_UID, true );
		$this->assertTrue( empty( $skip_meta ), 'Post skip meta key should be empty for request to share post to connection.' );
	}

	/**
	 * Verifies that post sharing title is set
	 * if the publicize title is set in request.
	 *
	 * @covers Jetpack_Publicize_Gutenberg::process_publicize_from_rest()
	 * @since 5.9.1
	 */
	public function test_set_sharing_title() {
		$test_title = 'This title will be shared with post.';
		// Simulate request to publish the draft post.
		$new_post              = clone $this->post;
		$new_post->post_status = 'publish';

		// Set up request with title message.
		$request = array(
			'publicize' => array(
				'title' => $test_title,
			),
		);

		// Pass request to 'rest_pre_insert_post' callback.
		$this->gutenberg_publicize->process_publicize_from_rest( $new_post, $request );

		$title_meta = get_post_meta( $this->post->ID, $this->publicize->POST_MESS, true );
		$this->assertEquals( $test_title, $title_meta, 'Title should be saved to post meta.' );
	}

	/**
	 * Verifies that, if post sharing title is NOT set in
	 * request, then the publicize title meta key is not set.
	 *
	 * @covers Jetpack_Publicize_Gutenberg::process_publicize_from_rest()
	 * @since 5.9.1
	 */
	public function test_no_title_field() {
		// Simulate request to publish the draft post.
		$new_post              = clone $this->post;
		$new_post->post_status = 'publish';

		// Set up request to share to the test connection, but no title.
		$request = array(
			'publicize' => array(
				'connections' => array(
					array(
						'unique_id'    => self::CONNECTION_UID,
						'should_share' => true,
					),
				),
			),
		);

		// Pass request to 'rest_pre_insert_post' callback.
		$this->gutenberg_publicize->process_publicize_from_rest( $new_post, $request );

		$title_meta = get_post_meta( $this->post->ID, $this->publicize->POST_MESS, true );
		$this->assertTrue( empty( $title_meta ), 'Publicize title meta key should not be set if \'title\' not included in \'publicize\' request' );
	}

	/**
	 * Verifies that post is not affected if there is
	 * no publicize field in request.
	 *
	 * @covers Jetpack_Publicize_Gutenberg::process_publicize_from_rest()
	 * @since 5.9.1
	 */
	public function test_no_publicize_field() {
		// Simulate request to publish the draft post.
		$new_post              = clone $this->post;
		$new_post->post_status = 'publish';
		// Set up request with no 'publicize' field.
		$request = array();

		// Pass request to 'rest_pre_insert_post' callback.
		$this->gutenberg_publicize->process_publicize_from_rest( $new_post, $request );

		$skip_meta = get_post_meta( $this->post->ID, $this->publicize->POST_SKIP . self::CONNECTION_UID, true );
		$this->assertTrue( empty( $skip_meta ), 'Post skip meta key should be missing since the \'publicize\' field is not set in request.' );

		$title_meta = get_post_meta( $this->post->ID, $this->publicize->POST_MESS, true );
		$this->assertTrue( empty( $title_meta ), 'Title meta key should be missing since the \'publicize\' field is not set in request.' );
	}


	/**
	 * Verifies that post is not modified if
	 * the post is not transitioning to 'publish'
	 *
	 * @covers Jetpack_Publicize_Gutenberg::process_publicize_from_rest()
	 * @since 5.9.1
	 */
	public function test_not_publishing() {
		// Set up request to not share to the test connection.
		$request = array(
			'publicize' => array(
				'connections' => array(
					array(
						'unique_id'    => self::CONNECTION_UID,
						'should_share' => false,
					),
				),
			),
		);

		/**
		 * Pass request to 'rest_pre_insert_post' callback. Just pass in 'draft' post
		 * so this will look like a draft is being saved, instead of published.
		 */
		$this->gutenberg_publicize->process_publicize_from_rest( $this->post, $request );

		$skip_meta = get_post_meta( $this->post->ID, $this->publicize->POST_SKIP . self::CONNECTION_UID, true );
		$this->assertTrue( empty( $skip_meta ), 'Post skip meta key should be missing since the post is not being published.' );
	}

}
