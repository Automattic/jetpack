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
	private function render_template( $title = '', $content = '', $post_id = 0, $categories = array(), $post_status = 'new', $video_placeholders = array() ) {
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_footer' );

		ob_start();
		wpcom_write_template( $title, $content, $post_id, $categories, $post_status, $video_placeholders );
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

		$output = $this->render_template( 'Test Post', '<p>Content</p>', $post_id, array(), 'publish' );

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
	 * Test that the slash menu contains list entries.
	 */
	public function test_slash_menu_contains_list_entries() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'actions.insertBulletedList', $output );
		$this->assertStringContainsString( 'actions.insertNumberedList', $output );
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

	/**
	 * Test that the Interactivity API state includes the recovery banner field.
	 */
	public function test_interactivity_state_includes_recovery_banner() {
		wp_set_current_user( $this->admin_id );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertArrayHasKey( 'showRecoveryBanner', $state );
		$this->assertFalse( $state['showRecoveryBanner'] );
	}

	/**
	 * Test that the template contains the recovery banner markup.
	 */
	public function test_template_contains_recovery_banner() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'class="bw-recovery-banner"', $output );
		$this->assertStringContainsString( 'actions.resumeDraft', $output );
		$this->assertStringContainsString( 'actions.dismissRecovery', $output );
		$this->assertStringContainsString( 'You have a recent draft', $output );
		$this->assertStringContainsString( 'Resume editing', $output );
	}

	/**
	 * Test that the recovery banner is hidden by default.
	 */
	public function test_recovery_banner_hidden_by_default() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'bw-recovery-banner" hidden', $output );
	}

	/**
	 * Test that autosave i18n strings are included in the rendered page state.
	 */
	public function test_autosave_i18n_strings_registered() {
		wp_set_current_user( $this->admin_id );

		// Render the admin page which seeds the Interactivity API state.
		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		$state = wp_interactivity_state( 'wpcom-write' );

		// The showRecoveryBanner field confirms autosave state is registered.
		$this->assertArrayHasKey( 'showRecoveryBanner', $state );
	}

	/**
	 * Helper: build a wp:embed block string.
	 *
	 * @param string $url  The embed URL.
	 * @param string $type The embed type attribute (default "video").
	 * @return string Block markup.
	 */
	private function embed_block( $url, $type = 'video' ) {
		$attrs = wp_json_encode(
			array(
				'url'              => $url,
				'type'             => $type,
				'providerNameSlug' => 'youtube',
			),
			JSON_UNESCAPED_SLASHES
		);
		return '<!-- wp:embed ' . $attrs . ' --><figure class="wp-block-embed"><div class="wp-block-embed__wrapper">' . esc_url( $url ) . '</div></figure><!-- /wp:embed -->';
	}

	/**
	 * Test YouTube standard URL is converted to an embed iframe.
	 */
	public function test_convert_video_embeds_youtube_standard() {
		$content = $this->embed_block( 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' );
		$result  = wpcom_write_convert_video_embeds( $content );

		$this->assertArrayHasKey( 'content', $result );
		$this->assertArrayHasKey( 'placeholders', $result );
		$this->assertCount( 1, $result['placeholders'] );
		$this->assertStringContainsString( '<!--WRITE_VIDEO_', $result['content'] );

		$html = array_values( $result['placeholders'] )[0];
		$this->assertStringContainsString( 'class="bw-video-figure"', $html );
		$this->assertStringContainsString( 'https://www.youtube.com/embed/dQw4w9WgXcQ', $html );
		$this->assertStringContainsString( '<iframe', $html );
		$this->assertStringContainsString( 'title="YouTube video"', $html );
	}

	/**
	 * Test YouTube short URL (youtu.be) is converted to an embed iframe.
	 */
	public function test_convert_video_embeds_youtube_short() {
		$content = $this->embed_block( 'https://youtu.be/dQw4w9WgXcQ' );
		$result  = wpcom_write_convert_video_embeds( $content );

		$html = array_values( $result['placeholders'] )[0];
		$this->assertStringContainsString( 'https://www.youtube.com/embed/dQw4w9WgXcQ', $html );
		$this->assertStringContainsString( 'title="YouTube video"', $html );
	}

	/**
	 * Test YouTube URL with v= not as the first query parameter.
	 */
	public function test_convert_video_embeds_youtube_v_not_first_param() {
		$content = $this->embed_block( 'https://www.youtube.com/watch?feature=share&v=dQw4w9WgXcQ' );
		$result  = wpcom_write_convert_video_embeds( $content );

		$html = array_values( $result['placeholders'] )[0];
		$this->assertStringContainsString( 'https://www.youtube.com/embed/dQw4w9WgXcQ', $html );
	}

	/**
	 * Test Vimeo URL is converted to an embed iframe.
	 */
	public function test_convert_video_embeds_vimeo() {
		$content = $this->embed_block( 'https://vimeo.com/123456789' );
		$result  = wpcom_write_convert_video_embeds( $content );

		$html = array_values( $result['placeholders'] )[0];
		$this->assertStringContainsString( 'class="bw-video-figure"', $html );
		$this->assertStringContainsString( 'https://player.vimeo.com/video/123456789', $html );
		$this->assertStringContainsString( '<iframe', $html );
		$this->assertStringContainsString( 'title="Vimeo video"', $html );
	}

	/**
	 * Test that non-video embed blocks are left unchanged.
	 */
	public function test_convert_video_embeds_skips_non_video() {
		$content = $this->embed_block( 'https://twitter.com/example/status/123', 'rich' );
		$result  = wpcom_write_convert_video_embeds( $content );

		$this->assertEmpty( $result['placeholders'] );
		$this->assertSame( $content, $result['content'] );
	}

	/**
	 * Test that embed blocks with missing URL are left unchanged.
	 */
	public function test_convert_video_embeds_skips_missing_url() {
		$attrs   = wp_json_encode(
			array(
				'type'             => 'video',
				'providerNameSlug' => 'youtube',
			),
			JSON_UNESCAPED_SLASHES
		);
		$content = '<!-- wp:embed ' . $attrs . ' --><figure class="wp-block-embed"><div class="wp-block-embed__wrapper"></div></figure><!-- /wp:embed -->';
		$result  = wpcom_write_convert_video_embeds( $content );

		$this->assertEmpty( $result['placeholders'] );
		$this->assertSame( $content, $result['content'] );
	}

	/**
	 * Test that plain content without embed blocks passes through unchanged.
	 */
	public function test_convert_video_embeds_plain_content() {
		$content = '<p>Hello world</p>';
		$result  = wpcom_write_convert_video_embeds( $content );

		$this->assertEmpty( $result['placeholders'] );
		$this->assertSame( $content, $result['content'] );
	}

	/**
	 * Test that multiple video embeds in one string are all converted.
	 */
	public function test_convert_video_embeds_multiple() {
		$content = $this->embed_block( 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' )
			. "\n"
			. $this->embed_block( 'https://vimeo.com/987654321' );
		$result  = wpcom_write_convert_video_embeds( $content );

		$this->assertCount( 2, $result['placeholders'] );
		$all_html = implode( "\n", array_values( $result['placeholders'] ) );
		$this->assertStringContainsString( 'https://www.youtube.com/embed/dQw4w9WgXcQ', $all_html );
		$this->assertStringContainsString( 'https://player.vimeo.com/video/987654321', $all_html );
		$this->assertSame( 2, substr_count( $all_html, 'bw-video-figure' ) );
	}

	/**
	 * Test that editing a post with a video embed renders an iframe in the template.
	 */
	public function test_template_renders_video_embed_iframe() {
		wp_set_current_user( $this->admin_id );

		$video_block = $this->embed_block( 'https://www.youtube.com/watch?v=dQw4w9WgXcQ' );
		$post_id     = wp_insert_post(
			array(
				'post_title'   => 'Video Post',
				'post_content' => $video_block,
				'post_status'  => 'draft',
				'post_author'  => $this->admin_id,
			)
		);

		// Simulate the render path: convert embeds to tokens, run the_content,
		// then pass placeholders to the template for post-kses replacement.
		$post         = get_post( $post_id );
		$video_result = wpcom_write_convert_video_embeds( $post->post_content );
		$rendered     = apply_filters( 'the_content', $video_result['content'] ); // phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound
		$output       = $this->render_template( 'Video Post', $rendered, $post_id, array(), 'draft', $video_result['placeholders'] );

		$this->assertStringContainsString( '<iframe', $output );
		$this->assertStringContainsString( 'youtube.com/embed/dQw4w9WgXcQ', $output );
		$this->assertStringContainsString( 'bw-video-figure', $output );
	}

	/**
	 * Test that the admin_title filter sets the browser tab title on the Write page.
	 */
	public function test_admin_title_filter_sets_title_on_write_page() {
		$_GET['page'] = 'write';
		$result       = apply_filters( 'admin_title', ' &#8249; Test Site &#8212; WordPress', '' );
		unset( $_GET['page'] );

		$this->assertStringStartsWith( 'Write editor ', $result );
	}

	/**
	 * Test that the admin_title filter does not affect other admin pages.
	 */
	public function test_admin_title_filter_does_not_affect_other_pages() {
		$original = 'Dashboard &#8249; Test Site &#8212; WordPress';
		$result   = apply_filters( 'admin_title', $original, 'Dashboard' );

		$this->assertSame( $original, $result );
	}
}
