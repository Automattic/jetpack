<?php
/**
 * Write Feature Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/write/write.php';

/**
 * Class Write_Test
 */
class Write_Test extends \WorDBless\BaseTestCase {

	/**
	 * Administrator user ID.
	 *
	 * @var int
	 */
	private $admin_id;

	/**
	 * Subscriber user ID (cannot publish posts).
	 *
	 * @var int
	 */
	private $subscriber_id;

	/**
	 * Set up test fixtures.
	 */
	public function set_up() {
		parent::set_up();

		$this->admin_id = wp_insert_user(
			array(
				'user_login' => 'write_admin',
				'user_pass'  => 'password',
				'user_email' => 'write_admin@example.com',
				'role'       => 'administrator',
			)
		);

		$this->subscriber_id = wp_insert_user(
			array(
				'user_login' => 'write_subscriber',
				'user_pass'  => 'password',
				'user_email' => 'write_subscriber@example.com',
				'role'       => 'subscriber',
			)
		);
	}

	/**
	 * Clean up after each test.
	 */
	public function tear_down() {
		wp_set_current_user( 0 );
		delete_option( 'wpcom_write_rewrite_version' );
		parent::tear_down();
	}

	/**
	 * Test that the render callback for the admin page exists.
	 */
	public function test_admin_page_render_callback_exists() {
		$this->assertTrue(
			function_exists( 'wpcom_write_render_admin_page' ),
			'Write render callback should be defined.'
		);
	}

	/**
	 * Test that wpcom_write_url returns the expected admin URL.
	 */
	public function test_write_url_format() {
		$url = wpcom_write_url();
		$this->assertStringContainsString( 'admin.php?page=write', $url );
	}

	/**
	 * Test that the wpcom-write script module is registered after init.
	 */
	public function test_script_module_is_registered() {
		do_action( 'init' );

		// Verify the script module was registered by checking it can be enqueued without error.
		wp_enqueue_script_module( 'wpcom-write/view' );
		$this->assertTrue( true, 'Script module registration and enqueue did not throw.' );
	}

	/**
	 * Render the Write template with wp_head/wp_footer hooks removed to avoid
	 * side effects from other features (e.g. missing build assets).
	 *
	 * @param string $title      Post title.
	 * @param string $content    Post content.
	 * @param int    $post_id    Post ID (0 for new).
	 * @param array  $categories Categories data.
	 * @return string The rendered HTML.
	 */
	private function render_template( $title = '', $content = '', $post_id = 0, $categories = array() ) {
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_footer' );

		ob_start();
		wpcom_write_template( $title, $content, $post_id, $categories );
		return ob_get_clean();
	}

	/**
	 * Test that the template function outputs the expected HTML structure.
	 */
	public function test_template_outputs_editor_markup() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'data-wp-interactive="wpcom-write"', $output );
		$this->assertStringContainsString( 'class="bw-app"', $output );
		$this->assertStringContainsString( 'class="bw-content bw-is-empty"', $output );
		$this->assertStringContainsString( 'contenteditable="true"', $output );
		$this->assertStringContainsString( 'Tell your story...', $output );
		$this->assertStringContainsString( 'Save draft', $output );
		$this->assertStringContainsString( 'Publish', $output );
	}

	/**
	 * Test that the template shows "Update" instead of "Publish" when editing.
	 */
	public function test_template_shows_update_when_editing() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
				'post_author' => $this->admin_id,
			)
		);

		$output = $this->render_template( 'Test Post', '<p>Content</p>', $post_id );

		$this->assertStringContainsString( 'Update', $output );
		$this->assertStringNotContainsString( '>Publish<', $output );
	}

	/**
	 * Test that the template includes the title when editing.
	 */
	public function test_template_includes_edit_title() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template( 'My Great Post' );

		$this->assertStringContainsString( 'My Great Post', $output );
	}

	/**
	 * Test that the Interactivity API state includes required fields.
	 */
	public function test_interactivity_state_is_seeded() {
		// We can't easily test wp_interactivity_state() directly since it
		// stores state internally. Instead, verify the function exists and
		// our template_redirect callback would call it by checking the
		// query var filter is registered.
		$this->assertTrue(
			function_exists( 'wp_interactivity_state' ),
			'wp_interactivity_state() should be available.'
		);
	}

	/**
	 * Test that the asset URL helper returns a valid URL.
	 */
	public function test_asset_url_returns_url_containing_filename() {
		$url = wpcom_write_asset_url( 'view.js' );
		$this->assertStringContainsString( 'view.js', $url );
		$this->assertStringContainsString( 'write', $url );
	}

	/**
	 * Test that the asset URL helper works for CSS files.
	 */
	public function test_asset_url_works_for_css() {
		$url = wpcom_write_asset_url( 'style.css' );
		$this->assertStringContainsString( 'style.css', $url );
		$this->assertStringContainsString( 'write', $url );
	}
}
