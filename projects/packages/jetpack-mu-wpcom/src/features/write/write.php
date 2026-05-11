<?php
/**
 * Write — A distraction-free front-end writing experience for WordPress.com.
 *
 * Based on Jamie Marsland's Write plugin (https://github.com/jamiemarsland/Write).
 * Registers a wp-admin page that serves a clean, full-screen writing surface.
 * Posts are saved as proper Gutenberg block markup via the REST API.
 *
 * @package automattic/jetpack-mu-wpcom
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

use Automattic\Jetpack\Jetpack_Mu_Wpcom\Common;

if ( ! defined( 'WPCOM_WRITE_VERSION' ) ) {
	// Use file modification time to bust CDN caches when files change.
	define( 'WPCOM_WRITE_VERSION', (string) max( filemtime( __DIR__ . '/view.js' ), filemtime( __DIR__ . '/style.css' ) ) );
}

/**
 * Get the URL for a Write feature asset file.
 *
 * Uses plugins_url() when loaded via a plugin (production). Falls back to
 * a computed URL for local development where plugins_url() can't resolve
 * the monorepo path.
 *
 * @param string $file The asset filename (e.g. 'view.js', 'style.css').
 * @return string The full URL to the asset.
 */
function wpcom_write_asset_url( $file ) {
	$url = plugins_url( $file, __FILE__ );

	// In local dev (Docker), __FILE__ resolves to an absolute monorepo path that
	// plugins_url() can't map to a web-accessible URL. Detect this and fall back
	// to the known plugin symlink path.
	if ( strpos( $url, '/plugins/usr/' ) !== false || strpos( $url, '/plugins/Users/' ) !== false ) {
		$url = content_url( 'plugins/jetpack-mu-wpcom-plugin/jetpack_vendor/automattic/jetpack-mu-wpcom/src/features/write/' . $file );
	}

	return $url;
}

/**
 * Get the URL to the Write editor.
 *
 * @return string The admin URL for the Write page.
 */
function wpcom_write_url() {
	return admin_url( 'admin.php?page=write' );
}

/**
 * Register the script module on init.
 */
add_action(
	'init',
	function () {
		wp_register_script_module(
			'wpcom-write/view',
			wpcom_write_asset_url( 'view.js' ),
			array( '@wordpress/interactivity' ),
			WPCOM_WRITE_VERSION
		);
	}
);

/**
 * Register the Write admin page.
 *
 * Uses an empty parent to create a hidden page (no menu entry) — access is
 * via the admin bar "Write" link. Renders inside wp-admin's normal page
 * lifecycle so that wp.apiFetch and its middleware are fully configured.
 */
add_action(
	'admin_menu',
	function () {
		add_submenu_page(
			'', // Hidden — no parent menu.
			__( 'Write', 'jetpack-mu-wpcom' ),
			__( 'Write', 'jetpack-mu-wpcom' ),
			'publish_posts',
			'write',
			'wpcom_write_render_admin_page'
		);
	}
);

/**
 * Enqueue Write assets only on the Write admin page.
 */
add_action(
	'admin_enqueue_scripts',
	function () {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing.
		if ( ! isset( $_GET['page'] ) || 'write' !== $_GET['page'] ) {
			return;
		}

		wp_enqueue_script_module( 'wpcom-write/view' );

		// Pass translated strings to JavaScript for dynamic messages.
		$write_strings = array(
			'alt'                  => __( 'ALT', 'jetpack-mu-wpcom' ),
			'caption'              => __( 'Caption', 'jetpack-mu-wpcom' ),
			'describeImage'        => __( 'Describe this image...', 'jetpack-mu-wpcom' ),
			'writeCaption'         => __( 'Write a caption...', 'jetpack-mu-wpcom' ),
			// translators: %s is the error message from the upload failure.
			'uploadFailed'         => __( 'Upload failed: %s', 'jetpack-mu-wpcom' ),
			'invalidVideoUrl'      => __( 'Please paste a valid YouTube or Vimeo URL', 'jetpack-mu-wpcom' ),
			'pleaseAddTitle'       => __( 'Please add a title', 'jetpack-mu-wpcom' ),
			'pleaseWriteSomething' => __( 'Please write something', 'jetpack-mu-wpcom' ),
			'savingDraft'          => __( 'Saving draft...', 'jetpack-mu-wpcom' ),
			'updating'             => __( 'Updating...', 'jetpack-mu-wpcom' ),
			'publishing'           => __( 'Publishing...', 'jetpack-mu-wpcom' ),
			'updated'              => __( 'Updated!', 'jetpack-mu-wpcom' ),
			'published'            => __( 'Published!', 'jetpack-mu-wpcom' ),
			'draftSaved'           => __( 'Draft saved', 'jetpack-mu-wpcom' ),
			'draftAutosaved'       => __( 'Draft saved', 'jetpack-mu-wpcom' ),
			// translators: %s is the error message.
			'error'                => __( 'Error: %s', 'jetpack-mu-wpcom' ),
			'normal'               => __( 'Normal', 'jetpack-mu-wpcom' ),
			'heading2'             => __( 'Heading 2', 'jetpack-mu-wpcom' ),
			'heading3'             => __( 'Heading 3', 'jetpack-mu-wpcom' ),
			'preview'              => __( 'Preview', 'jetpack-mu-wpcom' ),
		);
		wp_print_inline_script_tag(
			'window.wpcomWriteStrings = ' . wp_json_encode( $write_strings, JSON_HEX_TAG | JSON_HEX_AMP ) . ';'
		);

		wp_enqueue_style(
			'wpcom-write',
			wpcom_write_asset_url( 'style.css' ),
			array( 'dashicons' ),
			WPCOM_WRITE_VERSION
		);

		// Add CSS to hide wp-admin chrome for a full-screen writing experience.
		// This works with the platform rather than against it — wp-admin's scripts
		// (including wp-api-fetch middleware) are fully loaded and configured.
		$hide_chrome_css = '
			#wpadminbar,
			#adminmenuwrap,
			#adminmenuback,
			#adminmenumain,
			#wpfooter,
			#wpcom-help-center,
			.wp-admin-bar-fix { display: none !important; }
			#wpcontent,
			#wpbody,
			#wpbody-content { margin-left: 0 !important; padding: 0 !important; }
			.wrap { margin: 0 !important; padding: 0 !important; max-width: none !important; }
			html.wp-toolbar { padding-top: 0 !important; }
			body.admin-bar { padding-top: 0 !important; margin-top: 0 !important; }
			html { margin-top: 0 !important; }
		';
		wp_add_inline_style( 'wpcom-write', $hide_chrome_css );
	}
);

/**
 * Convert wp:embed video blocks to placeholder tokens for the Write editor.
 *
 * Video embed blocks are replaced with inert HTML comment tokens that survive
 * the_content filters, wp_kses_post(), and the pre_kses filter chain (which
 * converts YouTube iframes to shortcodes on non-frontend requests).  The
 * returned placeholders map is used to swap tokens for real iframe HTML after
 * all sanitization is complete.
 *
 * @param string $content Raw post_content (block markup).
 * @return array { content: string, placeholders: array<string,string> }
 */
function wpcom_write_convert_video_embeds( $content ) {
	$placeholders = array();

	$replaced = preg_replace_callback(
		'/<!-- wp:embed (\{[^}]*"type"\s*:\s*"video"[^}]*\}) -->.+?<!-- \/wp:embed -->/s',
		static function ( $matches ) use ( &$placeholders ) {
			$attrs = json_decode( $matches[1], true );
			if ( ! is_array( $attrs ) || empty( $attrs['url'] ) ) {
				return $matches[0];
			}
			$url       = $attrs['url'];
			$embed_url = '';

			// YouTube.
			if ( preg_match( '/(?:youtube\.com\/watch\?(?:[^&]*&)*v=|youtu\.be\/)([a-zA-Z0-9_-]{11})/', $url, $yt ) ) {
				$embed_url = 'https://www.youtube.com/embed/' . $yt[1];
			}
			// Vimeo.
			if ( ! $embed_url && preg_match( '/vimeo\.com\/(\d+)/', $url, $vim ) ) {
				$embed_url = 'https://player.vimeo.com/video/' . $vim[1];
			}

			if ( ! $embed_url ) {
				return $matches[0];
			}

			$title = $yt ? __( 'YouTube video', 'jetpack-mu-wpcom' ) : __( 'Vimeo video', 'jetpack-mu-wpcom' );
			$token = '<!--WRITE_VIDEO_' . md5( $embed_url ) . '-->';
			$html  = sprintf(
				'<figure class="bw-video-figure"><div class="bw-video-wrap"><iframe src="%s" title="%s" frameborder="0" allowfullscreen></iframe></div></figure>',
				esc_url( $embed_url ),
				esc_attr( $title )
			);

			$placeholders[ $token ] = $html;
			return $token;
		},
		$content
	);

	return array(
		'content'      => $replaced ?? $content,
		'placeholders' => $placeholders,
	);
}

/**
 * Render the Write admin page.
 *
 * Called by add_submenu_page as the page callback. Runs inside wp-admin's
 * normal page lifecycle, so wp.apiFetch is fully configured with the correct
 * REST root URL and auth middleware.
 */
function wpcom_write_render_admin_page() {
	// Check if editing an existing post.
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only GET parameter, gated by capability check via add_submenu_page.
	$edit_post_id       = isset( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
	$edit_title         = '';
	$edit_content       = '';
	$post_status        = 'new';
	$edit_featured_id   = 0;
	$video_placeholders = array();

	if ( $edit_post_id ) {
		$edit_post = get_post( $edit_post_id );
		if ( $edit_post && current_user_can( 'edit_post', $edit_post_id ) ) {
			$edit_title = $edit_post->post_title;
			// Convert video embed blocks to inert placeholder tokens before the
			// the_content + wp_kses_post pipeline runs.  Tokens survive all filters;
			// real iframe HTML is swapped in after sanitization in the template.
			$video_result = wpcom_write_convert_video_embeds( $edit_post->post_content );
			// phpcs:ignore WordPress.NamingConventions.PrefixAllGlobals.NonPrefixedHooknameFound -- Core filter needed to render blocks.
			$edit_content       = apply_filters( 'the_content', $video_result['content'] );
			$video_placeholders = $video_result['placeholders'];
			$post_status        = $edit_post->post_status;
			$edit_featured_id   = (int) get_post_thumbnail_id( $edit_post_id );
		} else {
			$edit_post_id = 0;
		}
	}

	// Determine how the user arrived at the Write editor.
	// 1. Explicit query param (highest priority).
	// 2. Infer from HTTP referer.
	// 3. Fall back to 'direct' (bookmarks, typed URLs, stripped referers).
	// Note: When the /write → wp-admin redirect is implemented, it must forward the source query param.
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only GET parameter used for analytics only.
	$source = isset( $_GET['source'] ) ? sanitize_key( $_GET['source'] ) : '';
	if ( ! $source ) {
		$referer = wp_get_referer();
		if ( $referer ) {
			$path = wp_parse_url( $referer, PHP_URL_PATH );
			if ( $path && str_contains( $path, '/wp-admin/index.php' ) ) {
				$source = 'dashboard';
			} elseif ( $path && str_contains( $path, '/wp-admin/edit.php' ) ) {
				$source = 'posts_list';
			} else {
				$source = 'referrer';
			}
		} else {
			$source = 'direct';
		}
	}

	if ( function_exists( '\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_record_tracks_event' ) ) {
		$event_props = array(
			'is_new_post' => (int) ( 0 === $edit_post_id ),
			'source'      => $source,
		);

		if ( $edit_post_id > 0 ) {
			$event_props['post_id'] = $edit_post_id;
		}

		Common\wpcom_record_tracks_event(
			'wpcom_write_editor_open',
			$event_props
		);
	}

	// Build categories list for the UI.
	$all_cats        = get_categories( array( 'hide_empty' => false ) );
	$selected_cats   = $edit_post_id ? wp_get_post_categories( $edit_post_id ) : array();
	$categories_data = array();
	foreach ( $all_cats as $cat ) {
		$categories_data[] = array(
			'id'       => $cat->term_id,
			'name'     => $cat->name,
			'selected' => in_array( $cat->term_id, $selected_cats, true ),
		);
	}

	// Seed Interactivity API state.
	wp_interactivity_state(
		'wpcom-write',
		array(
			'postsPath'           => '/wp/v2/posts',
			'mediaPath'           => '/wp/v2/media',
			'homeUrl'             => home_url( '/' ),
			'adminUrl'            => admin_url(),
			'writeUrl'            => wpcom_write_url(),
			'editPostId'          => $edit_post_id,
			'postStatus'          => $post_status,
			'isPublishedPost'     => 'publish' === $post_status,
			'title'               => $edit_title,
			'isSaving'            => false,
			'isPublished'         => false,
			'message'             => '',
			'showLinkInput'       => false,
			'linkUrl'             => '',
			'showImageModal'      => false,
			'showVideoModal'      => false,
			'videoUrl'            => '',
			'imageAlt'            => '',
			'setAsFeatured'       => false,
			'featuredMediaId'     => $edit_featured_id,
			'isUploading'         => false,
			'categories'          => $categories_data,
			'showCatPicker'       => false,
			'showHelp'            => false,
			'showSlashMenu'       => false,
			'slashActiveId'       => '',
			'slashFilter'         => '',
			'showLeaveConfirm'    => false,
			'showHeadingMenu'     => false,
			'showTextColorMenu'   => false,
			'formatStrikethrough' => false,
			'formatUnderline'     => false,
			'formatAlignLeft'     => true,
			'formatAlignCenter'   => false,
			'formatAlignRight'    => false,
			'formatOList'         => false,
			'formatUList'         => false,
			'insideList'          => false,
			'showRecoveryBanner'  => false,
		)
	);

	// Output the editor UI inside wp-admin's wrapper.
	wpcom_write_template( $edit_title, $edit_content, $edit_post_id, $categories_data, $post_status, $video_placeholders );
}

/**
 * Render the distraction-free writing UI.
 *
 * This outputs HTML inside wp-admin's page wrapper (not a standalone page).
 * The wp-admin chrome is hidden via CSS added in admin_enqueue_scripts.
 *
 * @param string $edit_title          The post title when editing.
 * @param string $edit_content        The post content when editing.
 * @param int    $edit_post_id        The post ID when editing, 0 for new posts.
 * @param array  $categories_data     Array of category data for the picker.
 * @param string $post_status         The post status ('new', 'draft', 'publish', etc.).
 * @param array  $video_placeholders  Map of comment tokens to iframe HTML for video embeds.
 */
function wpcom_write_template( $edit_title = '', $edit_content = '', $edit_post_id = 0, $categories_data = array(), $post_status = 'new', $video_placeholders = array() ) {
	?>
<div data-wp-interactive="wpcom-write" class="bw-app">

	<!-- Top bar -->
	<header class="bw-topbar">
		<a href="<?php echo esc_url( admin_url() ); ?>" class="bw-back" title="<?php echo esc_attr__( 'Back to dashboard', 'jetpack-mu-wpcom' ); ?>" aria-label="<?php echo esc_attr__( 'Back to dashboard', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.handleBack">&larr;</a>
		<div class="bw-help-wrap" data-wp-on--keydown="actions.handleHelpKeyDown" data-wp-on--focusout="actions.handleHelpFocusOut">
		<button class="bw-help-toggle" data-wp-on--click="actions.toggleHelp" title="<?php echo esc_attr__( 'Shortcuts', 'jetpack-mu-wpcom' ); ?>">?</button>
		<div class="bw-help-popover" hidden data-wp-bind--hidden="!state.showHelp">
			<div class="bw-help-title"><?php echo esc_html__( 'Tips', 'jetpack-mu-wpcom' ); ?></div>
			<div class="bw-help-row"><kbd>/</kbd><span><?php echo esc_html__( 'Insert a heading, image, video, list, quote or divider', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Ctrl+B</kbd><span><?php echo esc_html__( 'Bold', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Ctrl+I</kbd><span><?php echo esc_html__( 'Italic', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Ctrl+K</kbd><span><?php echo esc_html__( 'Insert link', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Tab</kbd><span><?php echo esc_html__( 'Navigate slash menu options', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Shift+Tab</kbd><span><?php echo esc_html__( 'Focus formatting toolbar', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		</div><!-- /.bw-help-wrap -->
		<span class="bw-status" data-wp-text="state.message"></span>
		<div class="bw-topbar-actions">
			<button
				class="bw-btn bw-btn-draft"
				data-wp-on--click="actions.saveDraft"
				data-wp-bind--disabled="state.isSaving"
				data-wp-bind--hidden="state.isPublishedPost"
				<?php echo 'publish' === $post_status ? 'hidden' : ''; ?>
			><?php echo esc_html__( 'Save draft', 'jetpack-mu-wpcom' ); ?></button>
			<button
				class="bw-btn bw-btn-publish"
				data-wp-on--click="actions.publish"
				data-wp-bind--disabled="state.isSaving"
			><?php echo 'publish' === $post_status ? esc_html__( 'Update', 'jetpack-mu-wpcom' ) : esc_html__( 'Publish', 'jetpack-mu-wpcom' ); ?></button>
		</div>
	</header>

	<!-- Recovery banner -->
	<div class="bw-recovery-banner" hidden data-wp-bind--hidden="!state.showRecoveryBanner">
		<span class="bw-recovery-text"><?php echo esc_html__( 'You have a recent draft — continue editing?', 'jetpack-mu-wpcom' ); ?></span>
		<button class="bw-recovery-btn" data-wp-on--click="actions.resumeDraft"><?php echo esc_html__( 'Resume editing', 'jetpack-mu-wpcom' ); ?></button>
		<button class="bw-recovery-dismiss" data-wp-on--click="actions.dismissRecovery" aria-label="<?php echo esc_attr__( 'Dismiss draft recovery notice', 'jetpack-mu-wpcom' ); ?>">&times;</button>
	</div>

	<!-- Persistent formatting toolbar -->
	<div
		class="bw-toolbar"
		role="toolbar"
		aria-label="<?php echo esc_attr__( 'Formatting', 'jetpack-mu-wpcom' ); ?>"
		data-wp-on--mousedown="actions.preventToolbarBlur"
		data-wp-on--keydown="actions.handleToolbarKeyDown"
	>
		<div class="bw-toolbar-scroll">
			<!-- Heading dropdown -->
			<div class="bw-tool-dropdown-wrap">
				<button class="bw-tool bw-tool-heading-toggle" aria-label="<?php echo esc_attr__( 'Text style', 'jetpack-mu-wpcom' ); ?>" aria-haspopup="menu" aria-expanded="false" tabindex="0" data-wp-bind--aria-expanded="state.showHeadingMenu" data-wp-on--click="actions.toggleHeadingMenu" data-wp-class--bw-tool-active="state.formatHeading" title="<?php echo esc_attr__( 'Text style', 'jetpack-mu-wpcom' ); ?>">
					<span class="bw-tool-label" data-wp-text="state.headingLabel"><?php echo esc_html__( 'Normal', 'jetpack-mu-wpcom' ); ?></span>
					<span class="bw-tool-caret">&#9662;</span>
				</button>
				<div class="bw-heading-menu" role="menu" aria-label="<?php echo esc_attr__( 'Text style', 'jetpack-mu-wpcom' ); ?>" hidden data-wp-bind--hidden="!state.showHeadingMenu" data-wp-on--keydown="actions.handleSubmenuKeyDown">
					<button class="bw-heading-option" role="menuitem" tabindex="-1" data-wp-on--click="actions.setHeadingNormal" data-wp-on--mousedown="actions.preventToolbarBlur"><span><?php echo esc_html__( 'Normal', 'jetpack-mu-wpcom' ); ?></span></button>
					<button class="bw-heading-option bw-heading-option-h2" role="menuitem" tabindex="-1" data-wp-on--click="actions.setHeadingH2" data-wp-on--mousedown="actions.preventToolbarBlur"><span><?php echo esc_html__( 'Heading 2', 'jetpack-mu-wpcom' ); ?></span></button>
					<button class="bw-heading-option bw-heading-option-h3" role="menuitem" tabindex="-1" data-wp-on--click="actions.setHeadingH3" data-wp-on--mousedown="actions.preventToolbarBlur"><span><?php echo esc_html__( 'Heading 3', 'jetpack-mu-wpcom' ); ?></span></button>
				</div>
			</div>
			<span class="bw-tool-divider"></span>
			<!-- Inline formatting -->
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Bold', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.formatBold" data-wp-class--bw-tool-active="state.formatBold" title="<?php echo esc_attr__( 'Bold', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-editor-bold"></span></button>
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Italic', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.formatItalic" data-wp-class--bw-tool-active="state.formatItalic" title="<?php echo esc_attr__( 'Italic', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-editor-italic"></span></button>
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Underline', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.formatUnderline" data-wp-class--bw-tool-active="state.formatUnderline" title="<?php echo esc_attr__( 'Underline', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-editor-underline"></span></button>
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Strikethrough', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.formatStrikethrough" data-wp-class--bw-tool-active="state.formatStrikethrough" title="<?php echo esc_attr__( 'Strikethrough', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-editor-strikethrough"></span></button>
			<!-- Text color -->
			<div class="bw-tool-dropdown-wrap">
				<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Text color', 'jetpack-mu-wpcom' ); ?>" aria-haspopup="menu" aria-expanded="false" tabindex="-1" data-wp-bind--aria-expanded="state.showTextColorMenu" data-wp-on--click="actions.toggleTextColorMenu" title="<?php echo esc_attr__( 'Text color', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-admin-appearance"></span></button>
				<div class="bw-color-menu" role="menu" aria-label="<?php echo esc_attr__( 'Text color', 'jetpack-mu-wpcom' ); ?>" hidden data-wp-bind--hidden="!state.showTextColorMenu" data-wp-on--mousedown="actions.preventToolbarBlur" data-wp-on--keydown="actions.handleSubmenuKeyDown">
					<button class="bw-color-swatch" role="menuitem" tabindex="-1" style="background:#1a1a1a;" aria-label="<?php echo esc_attr__( 'Default', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.setTextColorDefault" title="<?php echo esc_attr__( 'Default', 'jetpack-mu-wpcom' ); ?>"></button>
					<button class="bw-color-swatch" role="menuitem" tabindex="-1" style="background:#d63638;" aria-label="<?php echo esc_attr__( 'Red', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.setTextColorRed" title="<?php echo esc_attr__( 'Red', 'jetpack-mu-wpcom' ); ?>"></button>
					<button class="bw-color-swatch" role="menuitem" tabindex="-1" style="background:#2171b1;" aria-label="<?php echo esc_attr__( 'Blue', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.setTextColorBlue" title="<?php echo esc_attr__( 'Blue', 'jetpack-mu-wpcom' ); ?>"></button>
					<button class="bw-color-swatch" role="menuitem" tabindex="-1" style="background:#00a32a;" aria-label="<?php echo esc_attr__( 'Green', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.setTextColorGreen" title="<?php echo esc_attr__( 'Green', 'jetpack-mu-wpcom' ); ?>"></button>
					<button class="bw-color-swatch" role="menuitem" tabindex="-1" style="background:#dba617;" aria-label="<?php echo esc_attr__( 'Yellow', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.setTextColorYellow" title="<?php echo esc_attr__( 'Yellow', 'jetpack-mu-wpcom' ); ?>"></button>
					<button class="bw-color-swatch" role="menuitem" tabindex="-1" style="background:#8c5db0;" aria-label="<?php echo esc_attr__( 'Purple', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.setTextColorPurple" title="<?php echo esc_attr__( 'Purple', 'jetpack-mu-wpcom' ); ?>"></button>
				</div>
			</div>
			<span class="bw-tool-divider"></span>
			<!-- Alignment -->
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Align left', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.alignLeft" data-wp-class--bw-tool-active="state.formatAlignLeft" data-wp-bind--disabled="state.insideList" title="<?php echo esc_attr__( 'Align left', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-editor-alignleft"></span></button>
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Align center', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.alignCenter" data-wp-class--bw-tool-active="state.formatAlignCenter" data-wp-bind--disabled="state.insideList" title="<?php echo esc_attr__( 'Align center', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-editor-aligncenter"></span></button>
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Align right', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.alignRight" data-wp-class--bw-tool-active="state.formatAlignRight" data-wp-bind--disabled="state.insideList" title="<?php echo esc_attr__( 'Align right', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-editor-alignright"></span></button>
			<span class="bw-tool-divider"></span>
			<!-- Lists -->
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Bulleted list', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.formatUList" data-wp-class--bw-tool-active="state.formatUList" title="<?php echo esc_attr__( 'Bulleted list', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-editor-ul"></span></button>
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Numbered list', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.formatOList" data-wp-class--bw-tool-active="state.formatOList" title="<?php echo esc_attr__( 'Numbered list', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-editor-ol"></span></button>
			<span class="bw-tool-divider"></span>
			<!-- Block-level -->
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Link', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.toggleLinkInput" data-wp-class--bw-tool-active="state.showLinkInput" title="<?php echo esc_attr__( 'Link', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-admin-links"></span></button>
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Quote', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.formatQuote" data-wp-class--bw-tool-active="state.formatQuote" title="<?php echo esc_attr__( 'Quote', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-format-quote"></span></button>
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Image', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.openImageModal" data-wp-bind--disabled="state.insideList" title="<?php echo esc_attr__( 'Image', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-format-image"></span></button>
		</div>
	</div>

	<!-- Link input popover -->
	<div class="bw-link-popover" hidden data-wp-bind--hidden="!state.showLinkInput" data-wp-on--mousedown="actions.preventToolbarBlur">
		<input
			type="url"
			class="bw-link-input"
			placeholder="<?php echo esc_attr__( 'Paste or type a link...', 'jetpack-mu-wpcom' ); ?>"
			data-wp-bind--value="state.linkUrl"
			data-wp-on--input="actions.updateLinkUrl"
			data-wp-on--keydown="actions.handleLinkKeyDown"
		/>
		<button class="bw-link-apply" data-wp-on--click="actions.applyLink"><?php echo esc_html__( 'Apply', 'jetpack-mu-wpcom' ); ?></button>
		<button class="bw-link-remove" data-wp-on--click="actions.removeLink">&times;</button>
	</div>

	<!-- Writing area -->
	<main class="bw-main" data-wp-on--click="actions.handleMainClick">
		<div class="bw-editor">
			<textarea
				class="bw-title"
				placeholder="<?php echo esc_attr__( 'Title', 'jetpack-mu-wpcom' ); ?>"
				rows="1"
				data-wp-on--input="actions.updateTitle"
				data-wp-on--keydown="actions.handleTitleKeyDown"
				autocomplete="off"
			><?php echo esc_textarea( $edit_title ); ?></textarea>
			<div class="bw-separator"></div>
			<div
				class="bw-content<?php echo $edit_content ? '' : ' bw-is-empty'; ?>"
				contenteditable="true"
				role="combobox"
				aria-label="<?php echo esc_attr__( 'Post content', 'jetpack-mu-wpcom' ); ?>"
				aria-autocomplete="list"
				aria-haspopup="listbox"
				aria-expanded="false"
				aria-controls="bw-slash-menu"
				data-wp-bind--aria-expanded="state.showSlashMenu"
				data-wp-bind--aria-activedescendant="state.slashActiveId"
				data-wp-on--mouseup="actions.checkFormatting"
				data-wp-on--keyup="actions.checkFormatting"
				data-wp-on--click="actions.handleContentClick"
				data-wp-on--input="actions.repairStructure"
				data-wp-on--keydown="actions.handleKeyDown"
				data-wp-on--beforeinput="actions.handleBeforeInput"
				data-placeholder="<?php echo esc_attr__( 'Tell your story...', 'jetpack-mu-wpcom' ); ?>"
			>
			<?php
			if ( $edit_content ) {
				// Sanitize through wp_kses_post — video embed tokens (HTML comments)
				// pass through untouched, then we swap them for the real iframe HTML.
				// This avoids the pre_kses filter that converts iframes to shortcodes.
				$sanitized = wp_kses_post( $edit_content );
				if ( $video_placeholders ) {
					$sanitized = str_replace( array_keys( $video_placeholders ), array_values( $video_placeholders ), $sanitized );
				}
				echo $sanitized; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Sanitized by wp_kses_post; iframe HTML is self-constructed with esc_url/esc_attr.
			} else {
				echo '<p><br></p>';
			}
			?>
			</div>
		</div>
	</main>

	<!-- Image modal -->
	<div class="bw-image-overlay" hidden data-wp-bind--hidden="!state.showImageModal" data-wp-on--click="actions.closeImageModal" data-wp-on--keydown="actions.handleImageModalKeyDown" data-wp-on--dragover="actions.handleOverlayDragOver" data-wp-on--drop="actions.handleOverlayDrop">
		<div class="bw-image-modal" role="dialog" aria-modal="true" aria-label="<?php echo esc_attr__( 'Add an image', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.stopPropagation" data-wp-on--dragover="actions.handleOverlayDragOver" data-wp-on--drop="actions.handleOverlayDrop">
			<h3><?php echo esc_html__( 'Add an image', 'jetpack-mu-wpcom' ); ?></h3>
			<label class="bw-upload-zone" id="bw-upload-zone" data-wp-on--dragover="actions.handleDragOver" data-wp-on--dragleave="actions.handleDragLeave" data-wp-on--drop="actions.handleDrop">
				<span class="bw-upload-label"><?php echo esc_html__( 'Drop a file or click to upload', 'jetpack-mu-wpcom' ); ?></span>
				<span class="bw-upload-saving" style="display:none;"><?php echo esc_html__( 'Uploading...', 'jetpack-mu-wpcom' ); ?></span>
				<input type="file" accept="image/*" data-wp-on--change="actions.uploadImage" class="bw-visually-hidden" />
			</label>
			<div class="bw-image-divider"><span><?php echo esc_html__( 'or', 'jetpack-mu-wpcom' ); ?></span></div>
			<input
				type="url"
				class="bw-image-url-input"
				placeholder="<?php echo esc_attr__( 'Paste an image URL...', 'jetpack-mu-wpcom' ); ?>"
				data-wp-on--input="actions.updateImageUrl"
				data-wp-bind--value="state.imageUrl"
			/>
			<input
				type="text"
				class="bw-image-url-input"
				placeholder="<?php echo esc_attr__( 'Alt text (describe the image)...', 'jetpack-mu-wpcom' ); ?>"
				data-wp-on--input="actions.updateImageAlt"
				data-wp-bind--value="state.imageAlt"
				style="margin-top:12px;"
			/>
			<label class="bw-featured-toggle">
				<input type="checkbox" data-wp-on--change="actions.toggleFeaturedImage" data-wp-bind--checked="state.setAsFeatured" />
				<span><?php echo esc_html__( 'Set as featured image', 'jetpack-mu-wpcom' ); ?></span>
			</label>
			<button class="bw-btn bw-btn-publish" data-wp-on--click="actions.insertImageFromUrl" style="width:100%;margin-top:12px;"><?php echo esc_html__( 'Insert image', 'jetpack-mu-wpcom' ); ?></button>
		</div>
	</div>

	<!-- Leave confirmation — matches @wordpress/components ConfirmDialog -->
	<div class="bw-leave-overlay" hidden data-wp-bind--hidden="!state.showLeaveConfirm" data-wp-on--click="actions.cancelLeave" data-wp-on--keydown="actions.handleLeaveModalKeyDown">
		<div class="bw-leave-modal" role="dialog" aria-modal="true" aria-label="<?php echo esc_attr__( 'Unsaved changes', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.stopPropagation">
			<p><?php echo esc_html__( 'Do you want to save your changes?', 'jetpack-mu-wpcom' ); ?></p>
			<div class="bw-leave-actions">
				<button class="bw-leave-cancel" data-wp-on--click="actions.cancelLeave"><?php echo esc_html__( 'Cancel', 'jetpack-mu-wpcom' ); ?></button>
				<button class="bw-leave-confirm" data-wp-on--click="actions.confirmLeave"><?php echo esc_html__( "Don't save", 'jetpack-mu-wpcom' ); ?></button>
				<button class="bw-leave-save" data-wp-on--click="actions.saveAndLeave"><?php echo esc_html__( 'Save', 'jetpack-mu-wpcom' ); ?></button>
			</div>
		</div>
	</div>

	<!-- Slash command menu -->
	<div class="bw-slash-menu" id="bw-slash-menu" role="listbox" aria-label="<?php echo esc_attr__( 'Insert block', 'jetpack-mu-wpcom' ); ?>" hidden data-wp-bind--hidden="!state.showSlashMenu">
		<div class="bw-slash-item" id="bw-slash-opt-heading" role="option" aria-selected="false" data-wp-on--click="actions.insertHeading" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">H</span>
			<div><strong><?php echo esc_html__( 'Heading', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'Large section heading', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-image" role="option" aria-selected="false" data-wp-on--click="actions.insertImage" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">&#9653;</span>
			<div><strong><?php echo esc_html__( 'Image', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'Upload or embed an image', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-quote" role="option" aria-selected="false" data-wp-on--click="actions.insertQuote" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">&ldquo;</span>
			<div><strong><?php echo esc_html__( 'Quote', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'Highlight a quote', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-bulleted-list" role="option" aria-selected="false" data-wp-on--click="actions.insertBulletedList" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">&bull;</span>
			<div><strong><?php echo esc_html__( 'Bulleted list', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'An unordered list', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-numbered-list" role="option" aria-selected="false" data-wp-on--click="actions.insertNumberedList" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">1.</span>
			<div><strong><?php echo esc_html__( 'Numbered list', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'An ordered list', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-video" role="option" aria-selected="false" data-wp-on--click="actions.insertVideo" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">&#9654;</span>
			<div><strong><?php echo esc_html__( 'Video', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'Embed a YouTube or Vimeo video', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-divider" role="option" aria-selected="false" data-wp-on--click="actions.insertDivider" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">&mdash;</span>
			<div><strong><?php echo esc_html__( 'Divider', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'A horizontal separator', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
	</div>

	<!-- Video modal -->
	<div class="bw-image-overlay" hidden data-wp-bind--hidden="!state.showVideoModal" data-wp-on--click="actions.closeVideoModal" data-wp-on--keydown="actions.handleVideoModalKeyDown">
		<div class="bw-image-modal" role="dialog" aria-modal="true" aria-label="<?php echo esc_attr__( 'Embed a video', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.stopPropagation">
			<h3><?php echo esc_html__( 'Embed a video', 'jetpack-mu-wpcom' ); ?></h3>
			<input
				type="url"
				class="bw-image-url-input"
				placeholder="<?php echo esc_attr__( 'Paste a YouTube or Vimeo URL...', 'jetpack-mu-wpcom' ); ?>"
				data-wp-on--input="actions.updateVideoUrl"
				data-wp-on--keydown="actions.handleVideoKeyDown"
				data-wp-bind--value="state.videoUrl"
			/>
			<button class="bw-btn bw-btn-publish" data-wp-on--click="actions.insertVideoEmbed" style="width:100%;margin-top:12px;"><?php echo esc_html__( 'Embed video', 'jetpack-mu-wpcom' ); ?></button>
		</div>
	</div>

	<!-- Floating category picker -->
	<div class="bw-cat-wrap" data-wp-on--keydown="actions.handleCatKeyDown" data-wp-on--focusout="actions.handleCatFocusOut">
	<button class="bw-cat-fab" aria-label="<?php echo esc_attr__( 'Categories', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.toggleCatPicker">
		<span class="bw-cat-fab-icon dashicons dashicons-tag" aria-hidden="true"></span>
	</button>
	<div class="bw-cat-popover" hidden data-wp-bind--hidden="!state.showCatPicker">
		<div class="bw-cat-popover-header"><?php echo esc_html__( 'Categories', 'jetpack-mu-wpcom' ); ?></div>
		<div class="bw-cat-popover-list">
			<?php
			foreach ( $categories_data as $i => $cat ) :
				$cat_context = esc_attr(
					wp_json_encode(
						array(
							'catIndex'    => $i,
							'catSelected' => $cat['selected'],
						),
						JSON_HEX_TAG | JSON_HEX_AMP
					)
				);
				?>
			<button
				class="bw-cat<?php echo $cat['selected'] ? ' bw-cat-selected' : ''; ?>"
				data-wp-on--click="actions.toggleCategory"
				data-wp-context='<?php echo $cat_context; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Escaped above. ?>'
				data-wp-class--bw-cat-selected="context.catSelected"
			><?php echo esc_html( $cat['name'] ); ?></button>
			<?php endforeach; ?>
		</div>
	</div>
	</div><!-- /.bw-cat-wrap -->

</div>
	<?php
}
