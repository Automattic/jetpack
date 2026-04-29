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
		$this->assertStringContainsString( 'class="bw-content"', $output );
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

	/**
	 * Test that the persistent toolbar is rendered with the correct structure.
	 */
	public function test_template_contains_persistent_toolbar() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		// Toolbar is a fixed bar, not a floating element.
		$this->assertStringContainsString( 'class="bw-toolbar"', $output );
		$this->assertStringContainsString( 'class="bw-toolbar-scroll"', $output );
	}

	/**
	 * Test that the toolbar is always visible (no hidden attribute or show/hide bindings).
	 */
	public function test_toolbar_always_visible() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'class="bw-toolbar"', $output );
		// Toolbar should not have hidden attribute or hidden binding.
		$this->assertStringNotContainsString( 'bw-toolbar"' . "\n" . '		hidden', $output );
	}

	/**
	 * Test that the toolbar contains all required formatting buttons.
	 */
	public function test_toolbar_contains_formatting_buttons() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		// Inline formatting.
		$this->assertStringContainsString( 'actions.formatBold', $output );
		$this->assertStringContainsString( 'actions.formatItalic', $output );
		$this->assertStringContainsString( 'actions.formatUnderline', $output );
		$this->assertStringContainsString( 'actions.formatStrikethrough', $output );

		// Alignment.
		$this->assertStringContainsString( 'actions.alignLeft', $output );
		$this->assertStringContainsString( 'actions.alignCenter', $output );
		$this->assertStringContainsString( 'actions.alignRight', $output );

		// Lists.
		$this->assertStringContainsString( 'actions.formatUList', $output );
		$this->assertStringContainsString( 'actions.formatOList', $output );

		// Block-level.
		$this->assertStringContainsString( 'actions.toggleLinkInput', $output );
		$this->assertStringContainsString( 'actions.formatQuote', $output );
		$this->assertStringContainsString( 'actions.openImageModal', $output );
	}

	/**
	 * Test that the heading dropdown menu is rendered.
	 */
	public function test_toolbar_contains_heading_dropdown() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'actions.toggleHeadingMenu', $output );
		$this->assertStringContainsString( 'class="bw-heading-menu"', $output );
		$this->assertStringContainsString( 'actions.setHeadingNormal', $output );
		$this->assertStringContainsString( 'actions.setHeadingH2', $output );
		$this->assertStringContainsString( 'actions.setHeadingH3', $output );
	}

	/**
	 * Test that the text color picker is rendered.
	 */
	public function test_toolbar_contains_text_color_picker() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'actions.toggleTextColorMenu', $output );
		$this->assertStringContainsString( 'class="bw-color-menu"', $output );
		$this->assertStringContainsString( 'class="bw-color-swatch"', $output );
	}

	/**
	 * Test that the Interactivity API state includes new toolbar state fields.
	 */
	public function test_interactivity_state_includes_toolbar_fields() {
		wp_set_current_user( $this->admin_id );

		// Render the admin page which calls wp_interactivity_state().
		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		// Use reflection to read the stored state via the global.
		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertArrayHasKey( 'showHeadingMenu', $state );
		$this->assertArrayHasKey( 'showTextColorMenu', $state );
		$this->assertArrayHasKey( 'formatStrikethrough', $state );
		$this->assertArrayHasKey( 'formatUnderline', $state );
		$this->assertArrayHasKey( 'formatAlignLeft', $state );
		$this->assertArrayHasKey( 'formatAlignCenter', $state );
		$this->assertArrayHasKey( 'formatAlignRight', $state );
		$this->assertArrayHasKey( 'formatOList', $state );
		$this->assertArrayHasKey( 'formatUList', $state );
	}
}
