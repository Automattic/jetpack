<?php

require_once dirname( __FILE__ ) . '/../../class.jetpack-options-sync.php';

// phpunit --testsuite sync
class WP_Test_Jetpack_Options_Sync extends WP_UnitTestCase {

	protected $_globals;
	protected $author;
	protected $post_id;
	protected $user_data;

	public function setUp() {
		parent::setUp();

		Jetpack_Options_Sync::init();
		self::reset_sync();

		// Set the current user to user_id 1 which is equal to admin.
		wp_set_current_user( 1 );
	}

	public function tearDown() {
		parent::tearDown();

	}

	public function test_sync_add_new_option() {
		$option = 'new_option';
		Jetpack_Options_Sync::init_option( $option );

		add_option( $option, 1 );

		$this->assertContains( $option, Jetpack_Options_Sync::options_to_sync() );
	}

	public function test_sync_update_option() {
		$option = 'new_option';
		Jetpack_Options_Sync::init_option( $option );
		add_option( $option, 1 );

		self::reset_sync();
		update_option( $option, 2 );

		$this->assertContains( $option, Jetpack_Options_Sync::options_to_sync() );
	}

	public function test_sync_delete_option() {
		$option = 'new_option';
		Jetpack_Options_Sync::init_option( $option );
		add_option( $option, 1 );

		self::reset_sync();
		delete_option( $option );

		$this->assertContains( $option, Jetpack_Options_Sync::options_to_delete() );
	}

	public function test_sync_mock_option_return_callback() {
		$option = 'new_mock_option';
		Jetpack_Options_Sync::init_mock_option( $option, array( __CLASS__, 'new_mock_option_callback' ) );

		$this->assertEquals( get_option( 'jetpack_' .$option ), self::new_mock_option_callback() );
	}

	public function test_sync_mock_option_return_callback_return_false() {
		$option = 'new_mock_option_return_false';
		Jetpack_Options_Sync::init_mock_option( $option, array( __CLASS__, 'new_mock_option_callback_return_false' ) );

		$this->assertEquals( get_option( 'jetpack_' .$option ), self::new_mock_option_callback_return_false() );
	}

	static function new_mock_option_callback() {
		return '41';
	}

	static function new_mock_option_callback_return_false() {
		return false;
	}

	private function reset_sync() {
		Jetpack_Options_Sync::$sync = array();
		Jetpack_Options_Sync::$delete = array();
	}

	private function create_user( $user_login ) {
		$user_data = array(
			'user_login'  => $user_login,
			'user_pass'   => md5( time() ),
			'user_email'  => 'email@example2.com',
			'role'		  => 'author'
		);
		return wp_insert_user( $user_data );
	}

	private function create_category() {
		$my_cat = array(
			'cat_name' => 'My Category',
			'category_description' => 'A Cool Category',
			'category_nicename' => 'category-slug',
			'category_parent' => '' );
		return wp_insert_category( $my_cat );
	}

	private function get_new_post_array() {
		return array (
			'post_title'    => 'this is the title',
			'post_content'  => 'this is the content',
			'post_status'   => 'draft',
			'post_type'     => 'post',
			'post_author'   => 1,
		);
	}

	private function get_new_comment_array( $post_id ) {
		return array (
			'comment_post_ID' => $post_id,
			'comment_author' => 'admin',
			'comment_author_email' => 'admin@admin.com',
			'comment_author_url' => 'http://',
			'comment_content' => 'content here',
			'comment_type' => '',
			'comment_parent' => 0,
			'user_id' => 1,
			'comment_author_IP' => '127.0.0.1',
			'comment_agent' => 'Mozilla/5.0 (Windows; U; Windows NT 5.1; en-US; rv:1.9.0.10) Gecko/2009042316 Firefox/3.0.10 (.NET CLR 3.5.30729)',
			'comment_date' => current_time('mysql'),
			'comment_approved' => 1,
		);
	}
}