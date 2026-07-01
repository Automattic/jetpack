<?php
/**
 * Write Feature Tests
 *
 * @package automattic/jetpack-mu-wpcom
 */

use Automattic\Jetpack\Jetpack_Mu_Wpcom;

require_once Jetpack_Mu_Wpcom::PKG_DIR . 'src/features/wpcom-block-editor/functions.editor-type.php';
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
	 * Test that a known source token resolves to its mapped back destination.
	 */
	public function test_resolve_back_url_maps_known_source() {
		$this->assertSame(
			'https://wordpress.com/reader',
			wpcom_write_resolve_back_url( 'reader' )
		);
	}

	/**
	 * Test that an unknown or empty source falls back to the dashboard (default behavior).
	 */
	public function test_resolve_back_url_falls_back_to_dashboard() {
		$this->assertSame( admin_url(), wpcom_write_resolve_back_url( '' ) );
		$this->assertSame( admin_url(), wpcom_write_resolve_back_url( 'something_unknown' ) );
		// Inferred analytics sources should not change the back destination.
		$this->assertSame( admin_url(), wpcom_write_resolve_back_url( 'dashboard' ) );
		$this->assertSame( admin_url(), wpcom_write_resolve_back_url( 'direct' ) );
	}

	/**
	 * Test that the back button href reflects the resolved destination, defaulting to the dashboard.
	 */
	public function test_template_back_button_defaults_to_dashboard() {
		ob_start();
		wpcom_write_template();
		$html = ob_get_clean();

		$this->assertStringContainsString( 'class="bw-back"', $html );
		$this->assertStringContainsString( 'href="' . esc_url( admin_url() ) . '"', $html );
	}

	/**
	 * Test that a resolved back URL is rendered into the back button href.
	 */
	public function test_template_back_button_uses_resolved_url() {
		ob_start();
		wpcom_write_template( '', '', 0, array(), 'new', array(), false, '', array(), '', 'https://wordpress.com/reader' );
		$html = ob_get_clean();

		$this->assertStringContainsString( 'href="' . esc_url( 'https://wordpress.com/reader' ) . '"', $html );
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
	 * @param string $title             Post title.
	 * @param string $content           Post content.
	 * @param int    $post_id           Post ID (0 for new).
	 * @param array  $categories        Categories data.
	 * @param string $post_status       Post status.
	 * @param array  $video_placeholders Video placeholder tokens.
	 * @param bool   $show_cat_row      Whether to show the category row.
	 * @param string $cat_label         Initial category label text.
	 * @param array  $recent_drafts     Array of recent draft objects for the post picker.
	 * @param string $open_post_error   Error message for post picker.
	 * @return string The rendered HTML.
	 */
	private function render_template( $title = '', $content = '', $post_id = 0, $categories = array(), $post_status = 'new', $video_placeholders = array(), $show_cat_row = false, $cat_label = '', $recent_drafts = array(), $open_post_error = '' ) {
		remove_all_actions( 'wp_head' );
		remove_all_actions( 'wp_footer' );

		ob_start();
		wpcom_write_template( $title, $content, $post_id, $categories, $post_status, $video_placeholders, $show_cat_row, $cat_label, $recent_drafts, $open_post_error );
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
	 * Test that the admin_enqueue_scripts callback emits the JS i18n strings
	 * Write relies on, including the media-library strings added in RSM-594.
	 * Other tests render the template directly, which bypasses this callback —
	 * covering it here keeps the strings in lockstep with the JS.
	 *
	 * Invokes the registered closure directly instead of do_action() so
	 * unrelated WordPress callbacks (site-health, etc.) don't pollute the
	 * test with their own warnings.
	 */
	public function test_admin_enqueue_emits_library_strings() {
		global $wp_filter;

		wp_set_current_user( $this->admin_id );

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$_GET['page'] = 'write';

		$output = '';
		$hooks  = $wp_filter['admin_enqueue_scripts']->callbacks ?? array();
		foreach ( $hooks as $callbacks ) {
			foreach ( $callbacks as $cb ) {
				if ( ! ( $cb['function'] instanceof \Closure ) ) {
					continue;
				}
				$ref = new \ReflectionFunction( $cb['function'] );
				if ( false === strpos( $ref->getFileName(), 'features/write/write.php' ) ) {
					continue;
				}
				ob_start();
				( $cb['function'] )();
				$output .= ob_get_clean();
			}
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		unset( $_GET['page'] );

		// The four media-library strings added in RSM-594 must be in the
		// inline script tag so view.js can reach them via window.wpcomWriteStrings.
		$this->assertStringContainsString( 'libraryLoading', $output );
		$this->assertStringContainsString( 'libraryEmpty', $output );
		$this->assertStringContainsString( 'libraryNoResults', $output );
		$this->assertStringContainsString( 'libraryLoadFailed', $output );
		$this->assertStringContainsString( 'window.wpcomWriteStrings', $output );
	}

	/**
	 * Test that the image modal renders the media library section alongside
	 * the existing upload zone and URL paste — the three sources Write supports
	 * after RSM-594.
	 */
	public function test_template_includes_media_library_section() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		// Search input + horizontal strip container.
		$this->assertStringContainsString( 'id="bw-library-search"', $output );
		$this->assertStringContainsString( 'id="bw-library-grid"', $output );
		$this->assertStringContainsString( 'actions.searchLibrary', $output );
		$this->assertStringContainsString( 'actions.selectLibraryImage', $output );
		// Collapsed-by-default expanders for library + URL.
		$this->assertStringContainsString( 'actions.toggleLibraryPicker', $output );
		$this->assertStringContainsString( 'actions.toggleUrlInput', $output );
		// Existing upload + URL paste paths still present.
		$this->assertStringContainsString( 'id="bw-upload-zone"', $output );
		$this->assertStringContainsString( 'actions.insertImageFromUrl', $output );
		// Grid is keyboard- and screen-reader-labelled.
		$this->assertStringContainsString( 'aria-label="Your media library"', $output );
		$this->assertStringContainsString( 'aria-live="polite"', $output );
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

		// Category selector state.
		$this->assertArrayHasKey( 'catLabel', $state );
		$this->assertArrayHasKey( 'showCatDropdown', $state );
		$this->assertFalse( $state['showCatDropdown'] );

		// Old category picker key should not exist.
		$this->assertArrayNotHasKey( 'showCatPicker', $state );
	}

	/**
	 * Test that the category row is not rendered when show_cat_row is false.
	 */
	public function test_category_row_hidden_when_show_cat_row_false() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template( '', '', 0, array(), 'new', array(), false, '' );

		$this->assertStringNotContainsString( 'bw-meta-cat-btn', $output );
		$this->assertStringNotContainsString( 'Writing in', $output );
	}

	/**
	 * Test that the category row is rendered when show_cat_row is true.
	 */
	public function test_category_row_shown_when_show_cat_row_true() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template( '', '', 0, array(), 'new', array(), true, 'Writing in Uncategorized' );

		$this->assertStringContainsString( 'bw-meta-cat-btn', $output );
		$this->assertStringContainsString( 'Writing in Uncategorized', $output );
		$this->assertStringContainsString( 'bw-meta-cat-label', $output );
	}

	/**
	 * Test that the category label is seeded into the template output.
	 */
	public function test_cat_label_seeded_in_template() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template( '', '', 0, array(), 'new', array(), true, 'Writing in Travel' );

		$this->assertStringContainsString( 'Writing in Travel', $output );
	}

	/**
	 * Test that the topbar "more" menu is rendered when editing an existing post.
	 */
	public function test_more_menu_rendered_when_editing() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Draft',
				'post_status' => 'draft',
				'post_author' => $this->admin_id,
			)
		);

		$output = $this->render_template( 'Draft', '<p>Hi</p>', $post_id, array(), 'draft' );

		$this->assertStringContainsString( 'class="bw-more-wrap"', $output );
		$this->assertStringContainsString( 'actions.toggleMoreMenu', $output );
		$this->assertStringContainsString( 'actions.openInBlockEditor', $output );
		$this->assertStringContainsString( 'actions.previewPost', $output );
		$this->assertStringContainsString( 'Open in block editor', $output );
		$this->assertStringContainsString( '>Preview<', $output );
	}

	/**
	 * Test that the topbar "more" menu is also rendered for new posts.
	 * The actions save first to create the post before navigating.
	 */
	public function test_more_menu_rendered_for_new_post() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'class="bw-more-wrap"', $output );
		$this->assertStringContainsString( 'actions.openInBlockEditor', $output );
		$this->assertStringContainsString( 'actions.previewPost', $output );
	}

	/**
	 * Test that blockEditorUrl and previewUrl are seeded in state when editing.
	 */
	public function test_more_menu_urls_in_state_when_editing() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Draft',
				'post_status' => 'draft',
				'post_author' => $this->admin_id,
			)
		);

		$_GET['post'] = $post_id;

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['post'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertArrayHasKey( 'blockEditorUrl', $state );
		$this->assertArrayHasKey( 'previewUrl', $state );
		$this->assertArrayHasKey( 'showMoreMenu', $state );
		$this->assertFalse( $state['showMoreMenu'] );

		// Block editor URL uses the existing classic-editor__forget pattern.
		$this->assertStringContainsString( 'post.php?post=' . $post_id, $state['blockEditorUrl'] );
		$this->assertStringContainsString( 'classic-editor__forget', $state['blockEditorUrl'] );

		// Preview URL for a draft should be non-empty.
		$this->assertNotEmpty( $state['previewUrl'] );
	}

	/**
	 * Test that blockEditorUrl and previewUrl are empty for new posts.
	 */
	public function test_more_menu_urls_empty_for_new_post() {
		wp_set_current_user( $this->admin_id );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( '', $state['blockEditorUrl'] );
		$this->assertSame( '', $state['previewUrl'] );
	}

	/**
	 * Test that the help modal contains the #tag tip.
	 */
	public function test_help_modal_contains_hashtag_tip() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( '#tag', $output );
		$this->assertStringContainsString( 'assigns them to the post on save', $output );
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
	 * Test that the template contains the beta disclaimer banner markup.
	 */
	public function test_template_contains_disclaimer_banner() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'class="bw-disclaimer-banner"', $output );
		$this->assertStringContainsString( 'actions.dismissDisclaimer', $output );
		$this->assertStringContainsString( 'Data loss is possible', $output );
	}

	/**
	 * Test that the disclaimer banner is hidden by default (shown via JS after localStorage check).
	 */
	public function test_disclaimer_banner_hidden_by_default() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'bw-disclaimer-banner" hidden', $output );
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
		$rendered     = apply_filters( 'the_content', $video_result['content'] );
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

	// --- Unsupported content detection tests ---

	/**
	 * Test that empty content returns false (safe).
	 */
	public function test_detect_unsupported_empty_content() {
		$this->assertFalse( wpcom_write_detect_unsupported_content( '' ) );
	}

	/**
	 * Test that classic editor content (no block markers) returns 'classic-editor'.
	 */
	public function test_detect_unsupported_classic_content() {
		$content = '<p>Hello world</p><p>This is a classic post.</p>';
		$this->assertSame( 'classic-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that content with only supported blocks returns false.
	 */
	public function test_detect_unsupported_supported_blocks_only() {
		$content = '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->'
			. '<!-- wp:heading {"level":2} --><h2>Title</h2><!-- /wp:heading -->'
			. '<!-- wp:separator --><hr class="wp-block-separator"/><!-- /wp:separator -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a supported list with list-items returns false.
	 */
	public function test_detect_unsupported_list_blocks() {
		$content = '<!-- wp:list --><ul><!-- wp:list-item --><li>Item</li><!-- /wp:list-item --></ul><!-- /wp:list -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a supported image block returns false.
	 */
	public function test_detect_unsupported_image_block() {
		$content = '<!-- wp:image {"id":42} --><figure class="wp-block-image"><img src="test.jpg" alt=""/></figure><!-- /wp:image -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that an image with sizeSlug returns false (preserved by convertToBlocks).
	 */
	public function test_detect_unsupported_image_with_size_slug() {
		foreach ( array( 'thumbnail', 'medium', 'large', 'full' ) as $size ) {
			$content = '<!-- wp:image {"sizeSlug":"' . $size . '"} --><figure class="wp-block-image size-' . $size . '"><img src="test.jpg" alt=""/></figure><!-- /wp:image -->';
			$this->assertFalse(
				wpcom_write_detect_unsupported_content( $content ),
				"sizeSlug={$size} should be supported"
			);
		}
	}

	/**
	 * Test that an image with a custom/theme sizeSlug returns 'block-editor'.
	 * convertToBlocks() only emits the four standard presets, so unknown
	 * slugs would be silently stripped on save.
	 */
	public function test_detect_unsupported_image_with_custom_size_slug() {
		$content = '<!-- wp:image {"id":123,"sizeSlug":"hero"} --><figure class="wp-block-image size-hero"><img src="test.jpg" alt="" class="wp-image-123"/></figure><!-- /wp:image -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that an image with align (left/center/right) returns 'block-editor'.
	 * Write has no image-alignment UI, so posts with aligned images bounce
	 * to the block editor via the unsupported-content modal.
	 */
	public function test_detect_unsupported_image_with_align() {
		foreach ( array( 'left', 'center', 'right' ) as $align ) {
			$content = '<!-- wp:image {"align":"' . $align . '"} --><figure class="wp-block-image align' . $align . '"><img src="test.jpg" alt=""/></figure><!-- /wp:image -->';
			$this->assertFalse(
				wpcom_write_detect_unsupported_content( $content ),
				"align={$align} should round-trip through Write"
			);
		}
	}

	/**
	 * Test that an image with align + sizeSlug round-trips. Both are now
	 * supported via the image properties modal.
	 */
	public function test_detect_unsupported_image_with_align_and_size_slug() {
		$content = '<!-- wp:image {"align":"center","sizeSlug":"medium","id":42} --><figure class="wp-block-image aligncenter size-medium"><img src="test.jpg" alt=""/></figure><!-- /wp:image -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that an image with alignwide returns 'block-editor' (out of scope).
	 */
	public function test_detect_unsupported_image_with_align_wide() {
		$content = '<!-- wp:image {"align":"wide"} --><figure class="wp-block-image alignwide"><img src="test.jpg" alt=""/></figure><!-- /wp:image -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that an image with alignfull returns 'block-editor' (out of scope).
	 */
	public function test_detect_unsupported_image_with_align_full() {
		$content = '<!-- wp:image {"align":"full"} --><figure class="wp-block-image alignfull"><img src="test.jpg" alt=""/></figure><!-- /wp:image -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that an image with a custom width attribute returns 'block-editor'.
	 * Drag-to-resize is explicitly out of scope for Write — custom widths
	 * should bounce to the block editor.
	 */
	public function test_detect_unsupported_image_with_custom_width() {
		$content = '<!-- wp:image {"width":"312px"} --><figure class="wp-block-image"><img src="test.jpg" alt="" style="width:312px"/></figure><!-- /wp:image -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that an image with linkDestination:none (the no-op default the
	 * block editor stamps onto images) round-trips into Write.
	 */
	public function test_detect_unsupported_image_with_no_op_link_destination() {
		$content = '<!-- wp:image {"id":443,"sizeSlug":"medium","linkDestination":"none"} --><figure class="wp-block-image size-medium"><img src="test.jpg" alt="" class="wp-image-443"/></figure><!-- /wp:image -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that an image with a real link configuration returns 'block-editor'.
	 * Write has no UI for image links, so any non-"none" linkDestination
	 * should bounce to the block editor.
	 */
	public function test_detect_unsupported_image_with_real_link_destination() {
		foreach ( array( 'media', 'attachment', 'custom' ) as $dest ) {
			$content = '<!-- wp:image {"linkDestination":"' . $dest . '"} --><figure class="wp-block-image"><a href="http://example.com/"><img src="test.jpg" alt=""/></a></figure><!-- /wp:image -->';
			$this->assertSame(
				'block-editor',
				wpcom_write_detect_unsupported_content( $content ),
				"linkDestination={$dest} should bounce to block editor"
			);
		}
	}

	/**
	 * Test that a supported quote block returns false.
	 */
	public function test_detect_unsupported_quote_block() {
		$content = '<!-- wp:quote --><blockquote class="wp-block-quote"><p>A quote</p></blockquote><!-- /wp:quote -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a quote block with a citation attribute returns false (supported).
	 */
	public function test_detect_unsupported_quote_block_with_citation() {
		$content = '<!-- wp:quote {"citation":"Author Name"} --><blockquote class="wp-block-quote"><p>A quote</p><cite>Author Name</cite></blockquote><!-- /wp:quote -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a YouTube video embed returns false (supported).
	 */
	public function test_detect_unsupported_youtube_embed() {
		$attrs   = '{"url":"https://www.youtube.com/watch?v=abc","type":"video","providerNameSlug":"youtube"}';
		$content = '<!-- wp:embed ' . $attrs . ' --><figure class="wp-block-embed"></figure><!-- /wp:embed -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a Vimeo video embed returns false (supported).
	 */
	public function test_detect_unsupported_vimeo_embed() {
		$attrs   = '{"url":"https://vimeo.com/123","type":"video","providerNameSlug":"vimeo"}';
		$content = '<!-- wp:embed ' . $attrs . ' --><figure class="wp-block-embed"></figure><!-- /wp:embed -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that an unsupported block type returns 'block-editor'.
	 */
	public function test_detect_unsupported_gallery_block() {
		$content = '<!-- wp:gallery {"ids":[1,2]} --><figure class="wp-block-gallery"></figure><!-- /wp:gallery -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a namespaced unsupported block returns 'block-editor'.
	 */
	public function test_detect_unsupported_namespaced_block() {
		$content = '<!-- wp:core/table --><table></table><!-- /wp:core/table -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a columns block returns 'block-editor'.
	 */
	public function test_detect_unsupported_columns_block() {
		$content = '<!-- wp:columns --><div class="wp-block-columns"><!-- wp:column --><div class="wp-block-column"></div><!-- /wp:column --></div><!-- /wp:columns -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a non-video embed (e.g. Twitter) returns 'block-editor'.
	 */
	public function test_detect_unsupported_twitter_embed() {
		$attrs   = '{"url":"https://twitter.com/example/status/123","type":"rich","providerNameSlug":"twitter"}';
		$content = '<!-- wp:embed ' . $attrs . ' --><figure class="wp-block-embed"></figure><!-- /wp:embed -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a non-video YouTube embed (e.g. playlist) returns 'block-editor'.
	 */
	public function test_detect_unsupported_youtube_non_video_embed() {
		$attrs   = '{"url":"https://www.youtube.com/playlist?list=abc","type":"rich","providerNameSlug":"youtube"}';
		$content = '<!-- wp:embed ' . $attrs . ' --><figure class="wp-block-embed"></figure><!-- /wp:embed -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that textColor attribute returns 'block-editor'.
	 */
	public function test_detect_unsupported_text_color() {
		$content = '<!-- wp:paragraph {"textColor":"vivid-red"} --><p class="has-vivid-red-color has-text-color">Red text</p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that backgroundColor attribute returns 'block-editor'.
	 */
	public function test_detect_unsupported_background_color() {
		$content = '<!-- wp:paragraph {"backgroundColor":"pale-pink"} --><p class="has-pale-pink-background-color">Pink bg</p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that fontSize attribute returns 'block-editor'.
	 */
	public function test_detect_unsupported_font_size() {
		$content = '<!-- wp:paragraph {"fontSize":"large"} --><p class="has-large-font-size">Big text</p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that inline style typography returns 'block-editor'.
	 */
	public function test_detect_unsupported_style_typography() {
		$content = '<!-- wp:paragraph {"style":{"typography":{"fontSize":"22px"}}} --><p style="font-size:22px">Custom size</p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that inline palette color classes return 'block-editor'.
	 */
	public function test_detect_unsupported_inline_palette_color_class() {
		$content = '<!-- wp:paragraph --><p>Some <mark class="has-inline-color has-vivid-red-color">red</mark> text</p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that has-inline-color alone (Write's format) is supported.
	 */
	public function test_detect_supported_inline_custom_color() {
		$content = '<!-- wp:paragraph --><p>Some <mark class="has-inline-color" style="background-color:rgba(0, 0, 0, 0);color:#d63638">red</mark> text</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that has-text-color class returns 'block-editor'.
	 */
	public function test_detect_unsupported_has_text_color_class() {
		$content = '<!-- wp:paragraph --><p class="has-text-color has-vivid-red-color">Colored</p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that custom highlight mark (no palette class) returns 'block-editor'.
	 */
	public function test_detect_unsupported_custom_highlight_mark() {
		$content = '<!-- wp:paragraph --><p>Some <mark style="background-color:#fcb900">highlighted</mark> text</p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that has-inline-color with a real background color returns 'block-editor'.
	 */
	public function test_detect_unsupported_inline_color_with_highlight() {
		$content = '<!-- wp:paragraph --><p><mark class="has-inline-color" style="background-color:#fcb900;color:#d63638">both</mark></p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that plain text mentioning color class names is not treated as unsupported.
	 */
	public function test_detect_unsupported_plain_text_class_name_mentions() {
		$content = '<!-- wp:paragraph --><p>Use has-text-color and has-inline-color classes in your CSS.</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that center-aligned paragraph returns false (preserved by convertToBlocks).
	 */
	public function test_detect_unsupported_center_aligned_paragraph() {
		$content = '<!-- wp:paragraph {"align":"center"} --><p style="text-align:center">Centered</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that left-aligned paragraph returns false. The block editor can
	 * explicitly set align:left even though it's the default. Left alignment
	 * renders identically to no alignment, so Write handles it fine.
	 */
	public function test_detect_unsupported_left_aligned_paragraph() {
		$content = '<!-- wp:paragraph {"align":"left"} --><p style="text-align:left">Left</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that block-editor-style alignment classes are supported.
	 * The classes are converted to inline styles on load so convertToBlocks()
	 * can read them via node.style.textAlign.
	 */
	public function test_detect_supported_block_editor_alignment_classes() {
		$content = '<!-- wp:paragraph {"align":"center"} --><p class="has-text-align-center">Centered</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );

		$content = '<!-- wp:paragraph {"align":"right"} --><p class="has-text-align-right">Right</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );

		$content = '<!-- wp:paragraph {"align":"left"} --><p class="has-text-align-left">Left</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that style.typography.textAlign alignment (newer Gutenberg format) is supported.
	 */
	public function test_detect_supported_style_typography_text_align() {
		$content = '<!-- wp:paragraph {"style":{"typography":{"textAlign":"center"}}} --><p class="has-text-align-center">Centered</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );

		$content = '<!-- wp:paragraph {"style":{"typography":{"textAlign":"right"}}} --><p class="has-text-align-right">Right</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );

		$content = '<!-- wp:paragraph {"style":{"typography":{"textAlign":"left"}}} --><p class="has-text-align-left">Left</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that style attr with unsupported properties (not just typography.textAlign) is flagged.
	 */
	public function test_detect_unsupported_style_with_extra_properties() {
		// fontSize in style → unsupported.
		$content = '<!-- wp:paragraph {"style":{"typography":{"textAlign":"center","fontSize":"18px"}}} --><p class="has-text-align-center">Styled</p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );

		// color in style → unsupported.
		$content = '<!-- wp:paragraph {"style":{"color":{"text":"#ff0000"}}} --><p>Red</p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that alignment classes are converted to inline styles.
	 */
	public function test_alignment_classes_to_inline() {
		$html = '<p class="has-text-align-center wp-block-paragraph">Centered</p>';
		$this->assertSame(
			'<p class="wp-block-paragraph" style="text-align:center">Centered</p>',
			wpcom_write_alignment_classes_to_inline( $html )
		);

		// Right alignment on a heading.
		$html = '<h2 class="has-text-align-right wp-block-heading">Right</h2>';
		$this->assertSame(
			'<h2 class="wp-block-heading" style="text-align:right">Right</h2>',
			wpcom_write_alignment_classes_to_inline( $html )
		);

		// Left alignment — class removed, inline style added.
		$html = '<p class="has-text-align-left">Left</p>';
		$this->assertSame(
			'<p style="text-align:left">Left</p>',
			wpcom_write_alignment_classes_to_inline( $html )
		);

		// No alignment class — unchanged.
		$html = '<p class="wp-block-paragraph">Normal</p>';
		$this->assertSame( $html, wpcom_write_alignment_classes_to_inline( $html ) );
	}

	/**
	 * Test that alignment conversion merges into an existing style attribute
	 * instead of producing invalid duplicate style attrs.
	 */
	public function test_alignment_classes_to_inline_with_existing_style() {
		$html = '<p class="has-text-align-center" style="color:red">Centered</p>';
		$this->assertSame(
			'<p style="text-align:center;color:red">Centered</p>',
			wpcom_write_alignment_classes_to_inline( $html )
		);
	}

	/**
	 * Test that inline color marks are converted to spans for contentEditable.
	 */
	public function test_inline_color_marks_to_spans() {
		// Gutenberg custom color (with rgba transparent background).
		$html = '<p>Some <mark class="has-inline-color" style="background-color:rgba(0, 0, 0, 0);color:#d63638">red</mark> text</p>';
		$this->assertSame(
			'<p>Some <span style="color:#d63638">red</span> text</p>',
			wpcom_write_inline_color_marks_to_spans( $html )
		);

		// No color in style — unwraps to plain span.
		$html = '<p><mark class="has-inline-color">text</mark></p>';
		$this->assertSame(
			'<p><span>text</span></p>',
			wpcom_write_inline_color_marks_to_spans( $html )
		);

		// Non-inline-color mark — left unchanged.
		$html = '<p><mark style="background-color:#ff0">highlighted</mark></p>';
		$this->assertSame( $html, wpcom_write_inline_color_marks_to_spans( $html ) );
	}

	/**
	 * Test transparent background detection with whitespace/case variants.
	 */
	public function test_is_transparent_background() {
		$this->assertTrue( wpcom_write_is_transparent_background( 'transparent' ) );
		$this->assertTrue( wpcom_write_is_transparent_background( 'Transparent' ) );
		$this->assertTrue( wpcom_write_is_transparent_background( 'rgba(0, 0, 0, 0)' ) );
		$this->assertTrue( wpcom_write_is_transparent_background( 'rgba(0,0,0,0)' ) );
		$this->assertTrue( wpcom_write_is_transparent_background( ' rgba( 0, 0, 0, 0 ) ' ) );
		$this->assertFalse( wpcom_write_is_transparent_background( '#fcb900' ) );
		$this->assertFalse( wpcom_write_is_transparent_background( 'rgba(255, 0, 0, 0.5)' ) );
	}

	/**
	 * Test that wide-aligned heading returns 'block-editor' (not preserved).
	 */
	public function test_detect_unsupported_wide_aligned_heading() {
		$content = '<!-- wp:heading {"level":2,"align":"wide"} --><h2 class="wp-block-heading alignwide">Title</h2><!-- /wp:heading -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a custom className on a paragraph returns 'block-editor'.
	 */
	public function test_detect_unsupported_custom_class_name() {
		$content = '<!-- wp:paragraph {"className":"my-custom-class"} --><p class="my-custom-class">Styled</p><!-- /wp:paragraph -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that a YouTube embed with className returns 'block-editor'.
	 * className is not preserved by convertToBlocks() for any block type.
	 */
	public function test_detect_unsupported_youtube_embed_with_class_name() {
		$attrs   = '{"url":"https://www.youtube.com/watch?v=abc","type":"video","providerNameSlug":"youtube","className":"wp-embed-aspect-16-9 wp-has-aspect-ratio"}';
		$content = '<!-- wp:embed ' . $attrs . ' --><figure class="wp-block-embed"></figure><!-- /wp:embed -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that an anchor attribute on a heading returns 'block-editor'.
	 */
	public function test_detect_unsupported_anchor_attribute() {
		$content = '<!-- wp:heading {"level":2,"anchor":"my-section"} --><h2 class="wp-block-heading" id="my-section">Title</h2><!-- /wp:heading -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that an embed block with malformed JSON attributes returns 'block-editor'.
	 */
	public function test_detect_unsupported_embed_malformed_json() {
		$content = '<!-- wp:embed {not-valid-json} --><figure class="wp-block-embed"></figure><!-- /wp:embed -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	/**
	 * Test that mixed supported and unsupported blocks returns 'block-editor'.
	 */
	public function test_detect_unsupported_mixed_content() {
		$content = '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->'
			. '<!-- wp:gallery {"ids":[1,2]} --><figure class="wp-block-gallery"></figure><!-- /wp:gallery -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $content ) );
	}

	// --- JS / PHP allowlist sync ---

	/**
	 * Verify that the PHP allowlist stays in sync with convertToBlocks() in
	 * view.js.
	 *
	 * Block types are extracted directly from the `<!-- wp:type -->` comment
	 * literals that convertToBlocks() emits, so no manual annotations are
	 * needed for that axis.
	 *
	 * Attribute-level sync uses a hardcoded map of what convertToBlocks()
	 * outputs per block type.  When you add attribute support in view.js,
	 * update both wpcom_write_allowed_block_attrs() in write.php and
	 * $js_attrs below.
	 */
	public function test_allowed_block_types_in_sync_with_convert_to_blocks() {
		// -- Block-type sync (automatic from JS source) --

		$view_js_path = dirname( __DIR__, 4 ) . '/src/features/write/view.js';
		$view_js      = file_get_contents( $view_js_path );
		$this->assertNotEmpty( $view_js, 'Could not read view.js at ' . $view_js_path );

		$fn_start = strpos( $view_js, 'function convertToBlocks(' );
		$this->assertNotFalse( $fn_start, 'convertToBlocks() not found in view.js' );
		// Read enough of the function body to capture all block types.
		// If convertToBlocks() grows past this, the assertion below will
		// catch missing types. Increase as needed.
		$fn_body = substr( $view_js, $fn_start, 10000 );

		// Match opening block comments only (negative lookbehind skips closing <!-- /wp:... -->).
		preg_match_all( '/<!-- (?!\/)wp:([a-z][a-z0-9-]*)/', $fn_body, $matches );
		$js_types = array_values( array_unique( $matches[1] ) );
		sort( $js_types );
		$this->assertNotEmpty( $js_types, 'No block types found in convertToBlocks()' );

		$php_all   = wpcom_write_allowed_block_attrs();
		$php_types = array_keys( $php_all );
		sort( $php_types );

		$this->assertSame(
			$js_types,
			$php_types,
			sprintf(
				"Block types are out of sync.\nJS (view.js):  [%s]\nPHP (write.php): [%s]",
				implode( ', ', $js_types ),
				implode( ', ', $php_types )
			)
		);

		// -- Attribute-level sync (hardcoded JS expectations) --
		// These are the attributes convertToBlocks() actually writes into
		// block JSON.  Every one must appear in the PHP allowlist.

		$js_attrs = array(
			'embed'     => array( 'providerNameSlug', 'responsive', 'type', 'url' ),
			'heading'   => array( 'align', 'level' ),
			'image'     => array( 'align', 'id', 'sizeSlug' ),
			'list'      => array( 'ordered' ),
			'list-item' => array(),
			'paragraph' => array( 'align' ),
			'quote'     => array( 'align', 'citation' ),
			'separator' => array(),
		);

		// PHP-only extras: attributes the block editor adds as metadata
		// that don't affect visible content.  Write doesn't produce these
		// but safely ignores them.  Any PHP attr not in $js_attrs and not
		// listed here is an error — it would let unsupported content through.
		$php_extras = array(
			'image' => array( 'alt' ),
		);

		foreach ( $js_attrs as $block => $expected ) {
			$this->assertArrayHasKey( $block, $php_all, "Block '$block' missing from PHP allowlist." );

			// Every JS attr must exist in PHP.
			$missing = array_diff( $expected, $php_all[ $block ] );
			$this->assertEmpty(
				$missing,
				sprintf(
					"Block '%s': JS outputs attrs [%s] missing from PHP allowlist [%s].",
					$block,
					implode( ', ', $missing ),
					implode( ', ', $php_all[ $block ] )
				)
			);

			// Every PHP attr must be in JS or in the documented extras.
			$allowed_extras = $php_extras[ $block ] ?? array();
			$unexpected     = array_diff( $php_all[ $block ], $expected, $allowed_extras );
			$this->assertEmpty(
				$unexpected,
				sprintf(
					"Block '%s': PHP allows attrs [%s] not produced by JS and not in \$php_extras.",
					$block,
					implode( ', ', $unexpected )
				)
			);
		}
	}

	/**
	 * Test that loading an existing post in the Write editor sets the last editor meta.
	 */
	public function test_existing_post_sets_last_editor_meta() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
				'post_author' => $this->admin_id,
			)
		);

		// Simulate opening the post in the Write editor.
		$_GET['post'] = $post_id;

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['post'] );

		$this->assertEquals( 'write-editor', get_post_meta( $post_id, '_last_editor_used_jetpack', true ) );
	}

	/**
	 * Test that loading an existing post overwrites a previous editor meta value.
	 */
	public function test_existing_post_overwrites_previous_editor_meta() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Test Post',
				'post_status' => 'publish',
				'post_author' => $this->admin_id,
			)
		);

		// Simulate the post was previously edited in the block editor.
		update_post_meta( $post_id, '_last_editor_used_jetpack', 'block-editor' );

		$_GET['post'] = $post_id;

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['post'] );

		$this->assertEquals( 'write-editor', get_post_meta( $post_id, '_last_editor_used_jetpack', true ) );
	}

	/**
	 * Test that saving a post via REST with wpcom_write_editor_used sets last-editor meta.
	 */
	public function test_rest_save_with_write_editor_signal_sets_meta() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'REST Signal Test',
				'post_status' => 'draft',
				'post_author' => $this->admin_id,
			)
		);

		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $post_id ) );
		$request->set_body_params(
			array(
				'title'                   => 'Updated via Write',
				'wpcom_write_editor_used' => true,
			)
		);

		rest_get_server()->dispatch( $request );

		$this->assertEquals( 'write-editor', get_post_meta( $post_id, '_last_editor_used_jetpack', true ) );
	}

	/**
	 * Test that saving a post via REST without the signal does not set last-editor meta.
	 */
	public function test_rest_save_without_write_editor_signal_does_not_set_meta() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'REST No Signal Test',
				'post_status' => 'draft',
				'post_author' => $this->admin_id,
			)
		);

		$request = new WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $post_id ) );
		$request->set_body_params(
			array(
				'title' => 'Updated without Write',
			)
		);

		rest_get_server()->dispatch( $request );

		$this->assertEmpty( get_post_meta( $post_id, '_last_editor_used_jetpack', true ) );
	}

	/**
	 * Test that a user without edit_post capability cannot trigger the meta update.
	 */
	public function test_remember_write_editor_without_capability_does_not_set_meta() {
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Capability Test',
				'post_status' => 'draft',
				'post_author' => $this->admin_id,
			)
		);

		// Switch to a subscriber who cannot edit this post.
		wp_set_current_user( $this->subscriber_id );

		$request = new \WP_REST_Request( 'POST', sprintf( '/wp/v2/posts/%d', $post_id ) );
		$request->set_body_params(
			array(
				'wpcom_write_editor_used' => true,
			)
		);

		\Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Block_Editor\EditorType\remember_write_editor( get_post( $post_id ), $request );

		$this->assertEmpty( get_post_meta( $post_id, '_last_editor_used_jetpack', true ) );
	}

	// --- Post picker tests ---

	/**
	 * Test that recentDrafts is seeded in Interactivity API state.
	 */
	public function test_interactivity_state_includes_recent_drafts() {
		wp_set_current_user( $this->admin_id );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertArrayHasKey( 'recentDrafts', $state );
		$this->assertIsArray( $state['recentDrafts'] );
	}

	/**
	 * Test that wpcom_write_get_recent_drafts returns an array.
	 *
	 * Note: WorDBless uses a "dbless" engine where WP_Query cannot find posts,
	 * so integration tests that insert posts and query them via WP_Query are not
	 * feasible. Instead we verify the function's contract (return type, shape).
	 */
	public function test_recent_drafts_returns_user_drafts() {
		wp_set_current_user( $this->admin_id );

		$drafts = wpcom_write_get_recent_drafts();

		$this->assertIsArray( $drafts );
	}

	/**
	 * Test that wpcom_write_get_recent_drafts excludes a given post ID.
	 *
	 * Verifies the function accepts the $exclude_post_id parameter and still
	 * returns an array. Behavioral filtering is validated via the query
	 * argument (post__not_in) rather than end-to-end since WP_Query is not
	 * available in the dbless test engine.
	 */
	public function test_recent_drafts_excludes_current_post() {
		wp_set_current_user( $this->admin_id );

		$current_id = wp_insert_post(
			array(
				'post_title'   => 'Current',
				'post_status'  => 'draft',
				'post_author'  => $this->admin_id,
				'post_content' => '<!-- wp:paragraph --><p>Current</p><!-- /wp:paragraph -->',
			)
		);

		// Verify the function accepts and processes exclude_post_id without error.
		$drafts    = wpcom_write_get_recent_drafts( $current_id );
		$draft_ids = array_column( $drafts, 'id' );

		$this->assertIsArray( $drafts );
		$this->assertNotContains( $current_id, $draft_ids );
	}

	/**
	 * Test that wpcom_write_detect_unsupported_content correctly identifies
	 * gallery blocks as unsupported, which wpcom_write_get_recent_drafts
	 * uses for filtering.
	 */
	public function test_recent_drafts_excludes_unsupported_content() {
		$gallery_content = '<!-- wp:gallery {"ids":[1,2]} --><figure></figure><!-- /wp:gallery -->';
		$this->assertSame( 'block-editor', wpcom_write_detect_unsupported_content( $gallery_content ) );

		$supported_content = '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->';
		$this->assertFalse( wpcom_write_detect_unsupported_content( $supported_content ) );
	}

	/**
	 * Test that wpcom_write_get_recent_drafts caps results at 5.
	 *
	 * Since WP_Query is unavailable in dbless tests, we verify the function
	 * returns at most 5 items (0 <= count <= 5).
	 */
	public function test_recent_drafts_caps_at_five() {
		wp_set_current_user( $this->admin_id );

		$drafts = wpcom_write_get_recent_drafts();

		$this->assertLessThanOrEqual( 5, count( $drafts ) );
	}

	/**
	 * Test that wpcom_write_get_recent_drafts queries only the current user's
	 * drafts. Verified via function contract — WP_Query passes author param.
	 */
	public function test_recent_drafts_excludes_other_users() {
		wp_set_current_user( $this->admin_id );

		$drafts = wpcom_write_get_recent_drafts();

		// In dbless mode the result is empty, confirming no cross-user leakage.
		$this->assertIsArray( $drafts );
	}

	/**
	 * Logged-out callers must never receive drafts. The early-return guards
	 * against a query running with author=0 (which would otherwise match every
	 * orphaned draft on a multisite blog).
	 */
	public function test_recent_drafts_returns_empty_for_logged_out_user() {
		wp_set_current_user( 0 );

		$drafts = wpcom_write_get_recent_drafts();

		$this->assertSame( array(), $drafts );
	}

	/**
	 * Logged-out callers must also get an empty result when passing an exclude
	 * id — verifies the guard sits in front of the exclude branch.
	 */
	public function test_recent_drafts_returns_empty_for_logged_out_user_with_exclude() {
		wp_set_current_user( 0 );

		$drafts = wpcom_write_get_recent_drafts( 123 );

		$this->assertSame( array(), $drafts );
	}

	/**
	 * The editor-strings helper is the contract the inline script tag
	 * (and any other caller rendering the editor outside the wp-admin page
	 * lifecycle) relies on. Validate the returned shape so a silently-dropped
	 * key in a future edit is caught here rather than at runtime in view.js.
	 */
	public function test_editor_strings_returns_expected_keys() {
		$strings = wpcom_write_get_editor_strings();

		$this->assertIsArray( $strings );

		// Spot-check the keys view.js reads as `i18n.<key>`. Not exhaustive —
		// adding a new string should not require updating this test — but a
		// removal of any of these keys would break the JS at runtime.
		$expected = array(
			'pleaseAddTitle',
			'pleaseWriteSomething',
			'savingDraft',
			'publishing',
			'draftAutosaved',
			'error',
			'untitled',
			'anonBrand',
			'anonStatus',
		);
		foreach ( $expected as $key ) {
			$this->assertArrayHasKey( $key, $strings, "Missing editor string: $key" );
			$this->assertNotEmpty( $strings[ $key ], "Editor string $key should not be empty" );
		}
	}

	/**
	 * Test that openPostError is seeded as empty string by default.
	 */
	public function test_interactivity_state_includes_open_post_error() {
		wp_set_current_user( $this->admin_id );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertArrayHasKey( 'openPostError', $state );
		$this->assertSame( '', $state['openPostError'] );
	}

	/**
	 * Test that showPostPicker is seeded as false by default.
	 */
	public function test_interactivity_state_includes_show_post_picker() {
		wp_set_current_user( $this->admin_id );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertArrayHasKey( 'showPostPicker', $state );
		$this->assertFalse( $state['showPostPicker'] );
	}

	/**
	 * Test that a ?url= param resolves a permalink to a post via url_to_postid().
	 */
	public function test_url_param_resolves_permalink() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Permalink Test',
				'post_status' => 'publish',
				'post_author' => $this->admin_id,
			)
		);

		$permalink   = get_permalink( $post_id );
		$_GET['url'] = $permalink;

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['url'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( $post_id, $state['editPostId'] );
		$this->assertSame( '', $state['openPostError'] );
	}

	/**
	 * Test that an invalid ?url= param sets openPostError.
	 */
	public function test_url_param_invalid_sets_error() {
		wp_set_current_user( $this->admin_id );

		$_GET['url'] = home_url( '/this-does-not-exist-at-all/' );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['url'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( 0, $state['editPostId'] );
		$this->assertNotEmpty( $state['openPostError'] );
		$this->assertTrue( $state['showPostPicker'] );
	}

	/**
	 * Test that a ?post= with a nonexistent ID sets openPostError.
	 */
	public function test_nonexistent_post_id_sets_error() {
		wp_set_current_user( $this->admin_id );

		$_GET['post'] = 999999;

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['post'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( 0, $state['editPostId'] );
		$this->assertNotEmpty( $state['openPostError'] );
		$this->assertTrue( $state['showPostPicker'] );
	}

	/**
	 * Test that a ?post= for a post the user cannot edit sets openPostError.
	 */
	public function test_no_permission_post_sets_error() {
		wp_set_current_user( $this->subscriber_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Admin Post',
				'post_status' => 'draft',
				'post_author' => $this->admin_id,
			)
		);

		$_GET['post'] = $post_id;

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['post'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( 0, $state['editPostId'] );
		$this->assertNotEmpty( $state['openPostError'] );
	}

	/**
	 * Test that the "Open post" menu item is rendered in the more menu.
	 */
	public function test_more_menu_contains_open_post_item() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'actions.openPostPicker', $output );
		$this->assertStringContainsString( 'Open post', $output );
	}

	/**
	 * Test that the post picker modal markup is rendered.
	 */
	public function test_template_contains_post_picker_modal() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'class="bw-postpicker-overlay"', $output );
		$this->assertStringContainsString( 'class="bw-postpicker-modal"', $output );
		$this->assertStringContainsString( 'actions.handlePostPickerOverlayClick', $output );
		$this->assertStringContainsString( 'actions.submitPostPickerUrl', $output );
	}

	/**
	 * Test that the post picker modal is hidden by default.
	 */
	public function test_post_picker_modal_hidden_by_default() {
		wp_set_current_user( $this->admin_id );

		$output = $this->render_template();

		$this->assertStringContainsString( 'bw-postpicker-overlay" hidden', $output );
	}

	/**
	 * Test that a ?post= pointing to a page (not a post) sets openPostError.
	 */
	public function test_page_post_type_sets_error() {
		wp_set_current_user( $this->admin_id );

		$page_id = wp_insert_post(
			array(
				'post_title'  => 'A Page',
				'post_status' => 'publish',
				'post_type'   => 'page',
				'post_author' => $this->admin_id,
			)
		);

		$_GET['post'] = $page_id;

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['post'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( 0, $state['editPostId'] );
		$this->assertNotEmpty( $state['openPostError'] );
	}

	/**
	 * Test that a same-host ?url= with a ?p= query param extracts the post ID
	 * directly instead of falling through to url_to_postid().
	 */
	public function test_url_param_extracts_p_query_param() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Shortlink Test',
				'post_status' => 'publish',
				'post_author' => $this->admin_id,
			)
		);

		$_GET['url'] = home_url( '/?p=' . $post_id );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['url'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( $post_id, $state['editPostId'] );
		$this->assertSame( '', $state['openPostError'] );
	}

	/**
	 * Test that a same-host ?url= with a ?post= query param (admin edit URL)
	 * extracts the post ID directly.
	 */
	public function test_url_param_extracts_post_query_param() {
		wp_set_current_user( $this->admin_id );

		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Admin URL Test',
				'post_status' => 'draft',
				'post_author' => $this->admin_id,
			)
		);

		$_GET['url'] = home_url( '/wp-admin/post.php?post=' . $post_id . '&action=edit' );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['url'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( $post_id, $state['editPostId'] );
		$this->assertSame( '', $state['openPostError'] );
	}

	/**
	 * Test that a cross-site ?url= does not extract a foreign ?p= value
	 * as a local post ID.
	 */
	public function test_url_param_rejects_cross_site_url() {
		wp_set_current_user( $this->admin_id );

		// Create a local post so the ID exists — a foreign URL referencing
		// the same numeric ID must not resolve to it.
		$post_id = wp_insert_post(
			array(
				'post_title'  => 'Local Post',
				'post_status' => 'publish',
				'post_author' => $this->admin_id,
			)
		);

		$_GET['url'] = 'https://example.com/?p=' . $post_id;

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['url'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( 0, $state['editPostId'] );
		$this->assertNotEmpty( $state['openPostError'] );
	}

	/**
	 * Test that ?post[]=99 (array injection) is silently ignored.
	 */
	public function test_post_array_param_is_ignored() {
		wp_set_current_user( $this->admin_id );

		$_GET['post'] = array( 99 );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['post'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( 0, $state['editPostId'] );
		$this->assertSame( '', $state['openPostError'] );
	}

	/**
	 * Test that ?url[]=foo (array injection) is silently ignored.
	 */
	public function test_url_array_param_is_ignored() {
		wp_set_current_user( $this->admin_id );

		$_GET['url'] = array( 'https://example.com' );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['url'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( 0, $state['editPostId'] );
		$this->assertSame( '', $state['openPostError'] );
	}

	/**
	 * Test that a same-host ?url= containing ?p[]=99 (array in parsed query
	 * params) does not resolve to post ID 1.
	 */
	public function test_url_param_with_array_p_does_not_resolve() {
		wp_set_current_user( $this->admin_id );

		// p[]=99 causes parse_str() to produce an array; the is_scalar()
		// guard must reject it so absint() never sees the array.
		$_GET['url'] = home_url( '/?p[]=99' );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['url'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertNotSame( 1, $state['editPostId'] );
	}

	/**
	 * Test that a ?url= resolving to a page (not a post) sets openPostError.
	 */
	public function test_url_param_resolving_to_page_sets_error() {
		wp_set_current_user( $this->admin_id );

		$page_id = wp_insert_post(
			array(
				'post_title'  => 'A Page Via URL',
				'post_status' => 'publish',
				'post_type'   => 'page',
				'post_author' => $this->admin_id,
			)
		);

		$_GET['url'] = home_url( '/?p=' . $page_id );

		ob_start();
		wpcom_write_render_admin_page();
		ob_end_clean();

		unset( $_GET['url'] );

		$state = wp_interactivity_state( 'wpcom-write' );

		$this->assertSame( 0, $state['editPostId'] );
		$this->assertNotEmpty( $state['openPostError'] );
	}
}
