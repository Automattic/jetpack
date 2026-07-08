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
	define( 'WPCOM_WRITE_VERSION', (string) max( filemtime( __DIR__ . '/view.js' ), filemtime( __DIR__ . '/style.css' ), filemtime( __DIR__ . '/undo-history.js' ), filemtime( __DIR__ . '/post-publish-checklist.js' ), filemtime( __DIR__ . '/post-publish-checklist.css' ) ) );
}

// Post-publish next-steps checklist, shown on the published post after a
// Write-editor publish on a Coming Soon site.
require_once __DIR__ . '/post-publish-checklist.php';

// Email-verification launch gate backing the checklist's inline confirm-email step.
require_once __DIR__ . '/email-verification.php';

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
 * Resolve the editor's back/close destination from the source the user arrived from.
 *
 * Maps a short allowlist of known source tokens to known internal destinations.
 * Anything not in the allowlist (including an empty or inferred source) falls back
 * to the default destination — the site dashboard — so behavior is unchanged.
 *
 * This is the single lookup point for back-button destinations: never echo an
 * arbitrary return URL from the query string, only map to vetted destinations.
 *
 * @param string $source Sanitized source token (see wpcom_write_render_admin_page()).
 * @return string The destination URL for the back/close button.
 */
function wpcom_write_resolve_back_url( $source ) {
	$destinations = array(
		'reader' => 'https://wordpress.com/reader',
	);

	return $destinations[ $source ] ?? admin_url();
}

/**
 * Translated UI strings consumed by view.js as `window.wpcomWriteStrings`.
 *
 * Exposed as a helper so callers that render the Write editor outside the
 * wp-admin page lifecycle (and therefore never hit the admin_enqueue_scripts
 * hook below) can print the same strings without duplicating the list.
 *
 * @return array<string, string> Map of i18n key -> translated string.
 */
function wpcom_write_get_editor_strings() {
	return array(
		'caption'              => __( 'Caption', 'jetpack-mu-wpcom' ),
		'editImage'            => __( 'Edit image', 'jetpack-mu-wpcom' ),
		'writeCaption'         => __( 'Write a caption...', 'jetpack-mu-wpcom' ),
		// translators: %s is the error message from the upload failure.
		'uploadFailed'         => __( 'Upload failed: %s', 'jetpack-mu-wpcom' ),
		'libraryLoading'       => __( 'Loading your library…', 'jetpack-mu-wpcom' ),
		'libraryEmpty'         => __( 'No images in your library yet.', 'jetpack-mu-wpcom' ),
		'libraryNoResults'     => __( 'No matching images.', 'jetpack-mu-wpcom' ),
		'libraryLoadFailed'    => __( "Couldn't load your library.", 'jetpack-mu-wpcom' ),
		// translators: %s is the alt text or filename of the selected library image.
		'librarySelected'      => __( 'Selected %s', 'jetpack-mu-wpcom' ),
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
		// translators: %s is a comma-separated list of category names, e.g. "Travel, Food".
		'writingIn'            => __( 'Writing in %s', 'jetpack-mu-wpcom' ),
		'untitled'             => __( 'Untitled', 'jetpack-mu-wpcom' ),
		'addCitation'          => __( 'Add citation…', 'jetpack-mu-wpcom' ),
		'citation'             => __( 'Citation', 'jetpack-mu-wpcom' ),
		'postNotFound'         => __( 'Post not found. Check the URL or ID and try again.', 'jetpack-mu-wpcom' ),
		'postNoPermission'     => __( 'You don\'t have permission to edit this post.', 'jetpack-mu-wpcom' ),
		// Labels used only when the editor is rendered for a logged-out
		// visitor (window.wpcomWriteIsAnon). "WordPress.com" is a product
		// mark and stays untranslated; only the feature name is localised.
		'anonBrand'            => 'WordPress.com · ' . _x( 'Write', 'editor name in the anonymous brand label', 'jetpack-mu-wpcom' ),
		'anonStatus'           => __( 'Not signed in', 'jetpack-mu-wpcom' ),
	);
}

/**
 * Register the script module on init.
 */
add_action(
	'init',
	function () {
		wp_register_script_module(
			'wpcom-write/undo-history',
			wpcom_write_asset_url( 'undo-history.js' ),
			array(),
			WPCOM_WRITE_VERSION
		);
		wp_register_script_module(
			'wpcom-write/view',
			wpcom_write_asset_url( 'view.js' ),
			array( '@wordpress/interactivity', 'wpcom-write/undo-history' ),
			WPCOM_WRITE_VERSION
		);
	}
);

// Hidden submenu pages (empty parent slug) are not found by get_admin_page_title(),
// so the browser tab shows only the site name. Fix via the admin_title filter.
add_filter(
	'admin_title',
	function ( $admin_title, $title ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only page routing.
		if ( empty( $title ) && isset( $_GET['page'] ) && 'write' === $_GET['page'] ) {
			return __( 'Write editor', 'jetpack-mu-wpcom' ) . $admin_title;
		}
		return $admin_title;
	},
	10,
	2
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
		wp_print_inline_script_tag(
			'window.wpcomWriteStrings = ' . wp_json_encode( wpcom_write_get_editor_strings(), JSON_HEX_TAG | JSON_HEX_AMP ) . ';'
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
 * Return the per-block-type attribute allowlist for Write.
 *
 * Attributes listed here are safe for Write to handle — either preserved by
 * convertToBlocks() in view.js or metadata that doesn't affect visible
 * content.  Keep this in sync with convertToBlocks(); a PHPUnit test
 * cross-checks that both sides list the same block types.
 *
 * @return array<string, string[]> Block type → allowed attribute keys.
 */
function wpcom_write_allowed_block_attrs() {
	return array(
		'paragraph' => array( 'align' ),
		'heading'   => array( 'level', 'align' ),
		// id: media-library metadata, not visible formatting.
		// alt: preserved via HTML element, not block JSON.
		// sizeSlug: thumbnail/medium/large/full size presets.
		// align: left/center/right via the image properties panel.  Wide and
		// full alignment values are rejected by wpcom_write_has_unsupported_blocks
		// further down (the same value check used for paragraph/heading),
		// so posts using those bounce to the block editor.
		'image'     => array( 'id', 'sizeSlug', 'alt', 'align' ),
		'embed'     => array( 'url', 'type', 'providerNameSlug', 'responsive' ),
		'quote'     => array( 'align', 'citation' ),
		'list'      => array( 'ordered' ),
		'list-item' => array(),
		'separator' => array(),
	);
}

/**
 * Detect whether a post contains features the Write editor cannot preserve.
 *
 * Uses parse_blocks() to inspect block types and attributes against an
 * allowlist derived from what convertToBlocks() in view.js can round-trip.
 * Any block type or attribute not in the allowlist will trigger a warning.
 *
 * @param string $content Raw post_content (block markup).
 * @return string|false 'classic-editor' or 'block-editor' indicating the warning
 *                      type, or false when no warning is needed.
 */
function wpcom_write_detect_unsupported_content( $content ) {
	if ( empty( $content ) ) {
		return false;
	}

	if ( ! has_blocks( $content ) ) {
		return 'classic-editor';
	}

	$allowed_attrs = wpcom_write_allowed_block_attrs();

	$blocks = parse_blocks( $content );

	if ( wpcom_write_has_unsupported_blocks( $blocks, $allowed_attrs ) ) {
		return 'block-editor';
	}

	// Write supports inline custom text colors only.
	// Palette colors and highlights stay block-editor-only.
	// has-text-align-* is not checked — it's converted to inline styles on load.
	if ( wpcom_write_has_unsupported_color_class( $content ) ) {
		return 'block-editor';
	}

	if ( wpcom_write_has_unsupported_mark( $content ) ) {
		return 'block-editor';
	}

	return false;
}

/**
 * Check whether a CSS background-color value is transparent.
 *
 * Matches "transparent", "rgba(0, 0, 0, 0)", and whitespace/case variants.
 *
 * @param string $value A CSS background-color value.
 * @return bool True if the value is transparent.
 */
function wpcom_write_is_transparent_background( $value ) {
	$value = strtolower( trim( $value ) );
	if ( 'transparent' === $value ) {
		return true;
	}
	// Normalize whitespace so rgba(0,0,0,0) and rgba( 0, 0, 0, 0 ) both match.
	$value = preg_replace( '/\s+/', '', $value );
	return 'rgba(0,0,0,0)' === $value;
}

/**
 * Check whether content has color classes that Write can't preserve.
 *
 * Palette classes (has-vivid-red-color, etc.) and has-text-color indicate
 * block editor content.  has-inline-color alone is fine — Write produces it.
 * Only matches inside class attributes to avoid false positives from plain text.
 *
 * @param string $content Raw post_content.
 * @return bool True if unsupported color classes are found.
 */
function wpcom_write_has_unsupported_color_class( $content ) {
	return preg_match( '/class="[^"]*\bhas-(?!inline-color\b)[\w-]+-color\b[^"]*"/', $content ) ||
		preg_match( "/class='[^']*\bhas-(?!inline-color\b)[\w-]+-color\b[^']*'/", $content );
}

/**
 * Check whether content has <mark> elements that Write can't round-trip.
 *
 * Catches two cases:
 * - <mark> without has-inline-color (block editor highlights).
 * - <mark> with has-inline-color AND a non-transparent background
 *   (combined text color + highlight from the block editor).
 *
 * @param string $content Raw post_content.
 * @return bool True if unsupported marks are found.
 */
function wpcom_write_has_unsupported_mark( $content ) {
	// Highlights: <mark> without has-inline-color.
	if ( preg_match( '/<mark\b(?![^>]*\bclass="[^"]*has-inline-color)/', $content ) ) {
		return true;
	}

	// Combined text color + highlight: has-inline-color with a real background.
	if ( preg_match_all( '/<mark\b[^>]*\bclass="[^"]*has-inline-color[^"]*"[^>]*>/', $content, $marks ) ) {
		foreach ( $marks[0] as $tag ) {
			if ( preg_match( '/background-color\s*:\s*([^;"]+)/', $tag, $bg ) ) {
				if ( ! wpcom_write_is_transparent_background( $bg[1] ) ) {
					return true;
				}
			}
		}
	}

	return false;
}

/**
 * Check whether any block in the tree has an unsupported type or attributes.
 *
 * @param array $blocks        Parsed block array from parse_blocks().
 * @param array $allowed_attrs Per-block-type allowed attribute keys.
 * @return bool True if any block is unsupported.
 */
function wpcom_write_has_unsupported_blocks( $blocks, $allowed_attrs ) {
	foreach ( $blocks as $block ) {
		// Skip freeform HTML / whitespace between blocks.
		if ( empty( $block['blockName'] ) ) {
			continue;
		}

		// Normalize: strip 'core/' namespace prefix.
		$name = $block['blockName'];
		if ( strpos( $name, 'core/' ) === 0 ) {
			$name = substr( $name, 5 );
		}

		// Unknown block type (including third-party namespaced blocks).
		if ( ! isset( $allowed_attrs[ $name ] ) ) {
			return true;
		}

		// Attributes beyond what Write handles for this block type.
		$attrs = $block['attrs'] ?? array();

		// The block editor stores alignment in two ways:
		// 1. Top-level: {"align":"center"}
		// 2. Nested style: {"style":{"typography":{"textAlign":"center"}}}
		// Both are converted to inline styles on load, so they round-trip.
		// Strip the style attr if it only contains typography.textAlign
		// with a supported value, so it doesn't trigger the extra-attrs check.
		// Justify is paragraph-only.
		$supported_text_aligns = 'paragraph' === $name
			? array( 'left', 'center', 'right', 'justify' )
			: array( 'left', 'center', 'right' );
		$style_align           = $attrs['style']['typography']['textAlign'] ?? '';
		if (
			isset( $attrs['style'] ) &&
			$style_align &&
			in_array( $style_align, $supported_text_aligns, true ) &&
			array( 'typography' => array( 'textAlign' => $style_align ) ) === $attrs['style']
		) {
			unset( $attrs['style'] );
		}

		// Justify uses the canonical class "has-text-align-justify" on paragraph.
		// Strip it before the extra-attrs check so the paragraph round-trips.
		if ( 'paragraph' === $name && ( $attrs['className'] ?? '' ) === 'has-text-align-justify' ) {
			unset( $attrs['className'] );
		}

		// The block editor stamps `linkDestination: "none"` onto image
		// blocks by default, even when the user never set a link.  Strip
		// that no-op value so block-editor-created images round-trip into
		// Write.  Actual link configurations (media / attachment / custom)
		// still flag as unsupported below since Write has no image-link UI.
		if ( 'image' === $name && ( $attrs['linkDestination'] ?? '' ) === 'none' ) {
			unset( $attrs['linkDestination'] );
		}

		$extra = array_diff( array_keys( $attrs ), $allowed_attrs[ $name ] );
		if ( ! empty( $extra ) ) {
			return true;
		}

		// Alignment: convertToBlocks() only preserves center and right
		// (read from style.textAlign). Block-level values like wide/full
		// are CSS-class-based and silently lost. Left is the default and
		// renders identically to no alignment, so allow it too. Justify
		// is paragraph-only (display type and narrow quotes look poor).
		if ( isset( $attrs['align'] ) && ! in_array( $attrs['align'], $supported_text_aligns, true ) ) {
			return true;
		}

		// Image sizeSlug: convertToBlocks() only emits the four standard
		// presets. Custom or theme-registered slugs (e.g. "hero") would be
		// silently stripped on save, so bounce them to the block editor.
		if ( 'image' === $name && isset( $attrs['sizeSlug'] ) && ! in_array( $attrs['sizeSlug'], array( 'thumbnail', 'medium', 'large', 'full' ), true ) ) {
			return true;
		}

		// Embed-specific: only YouTube and Vimeo video embeds round-trip.
		if ( 'embed' === $name ) {
			$type     = $attrs['type'] ?? '';
			$provider = $attrs['providerNameSlug'] ?? '';
			if ( 'video' !== $type || ! in_array( $provider, array( 'youtube', 'vimeo' ), true ) ) {
				return true;
			}
		}

		// Recurse into inner blocks (e.g. list → list-item).
		if ( ! empty( $block['innerBlocks'] ) ) {
			if ( wpcom_write_has_unsupported_blocks( $block['innerBlocks'], $allowed_attrs ) ) {
				return true;
			}
		}
	}

	return false;
}

/**
 * Convert block-editor alignment CSS classes to inline styles.
 *
 * The block editor uses `has-text-align-{left,center,right}` classes for
 * alignment, but Write's convertToBlocks() reads alignment from
 * node.style.textAlign.  This converts the classes to inline styles so
 * alignment round-trips through Write.
 *
 * @param string $html Rendered HTML content.
 * @return string HTML with alignment classes replaced by inline styles.
 */
function wpcom_write_alignment_classes_to_inline( $html ) {
	return preg_replace_callback(
		'/(<(?:p|h[1-6]|blockquote)\b[^>]*?)class="([^"]*has-text-align-(left|center|right|justify)[^"]*)"([^>]*?>)/',
		function ( $m ) {
			$before  = $m[1];
			$classes = $m[2];
			$align   = $m[3];
			$after   = $m[4];

			// Remove the has-text-align-* class.
			$classes = trim( preg_replace( '/\bhas-text-align-(?:left|center|right|justify)\b/', '', $classes ) );
			$classes = preg_replace( '/  +/', ' ', $classes );

			// Build the new tag, merging alignment into any existing style
			// attribute to avoid producing invalid duplicate style attrs.
			$class_attr = $classes ? ' class="' . $classes . '"' : '';
			$tag        = rtrim( $before ) . $class_attr . $after;

			if ( preg_match( '/style="([^"]*)"/', $tag, $sm ) ) {
				// Skip prepending if the existing style attr already declares
				// the same text-align (avoids duplicate text-align declarations
				// when the saved HTML carries both class and inline style).
				if ( strpos( $sm[1], 'text-align:' . $align ) === false ) {
					$tag = preg_replace( '/style="/', 'style="text-align:' . $align . ';', $tag, 1 );
				}
			} else {
				$tag = preg_replace( '/>$/', ' style="text-align:' . $align . '">', $tag );
			}

			return $tag;
		},
		$html
	);
}

/**
 * Convert Gutenberg inline-color marks to spans for contentEditable.
 *
 * Write edits colors as spans, saves colors as Gutenberg marks.
 * On load, marks are converted back to spans so foreColor can interact
 * with existing colors. normalizeColorMarkup() in view.js reverses this.
 *
 * @param string $html Rendered HTML content.
 * @return string HTML with inline-color marks replaced by color spans.
 */
function wpcom_write_inline_color_marks_to_spans( $html ) {
	return preg_replace_callback(
		'/<mark\b([^>]*\bclass="[^"]*has-inline-color[^"]*"[^>]*)>(.*?)<\/mark>/s',
		function ( $m ) {
			$attrs = $m[1];
			$inner = $m[2];
			// Extract the color value from the style attribute.
			// Use (?<!-) to match the `color` property but not `background-color`.
			if ( preg_match( '/(?<!-)color\s*:\s*([^;"]+)/', $attrs, $cm ) ) {
				return '<span style="color:' . $cm[1] . '">' . $inner . '</span>';
			}
			// No color found — just unwrap to a plain span.
			return '<span>' . $inner . '</span>';
		},
		$html
	);
}

/**
 * Get the current user's recent Write-compatible drafts.
 *
 * Queries up to 20 drafts by post_modified desc, filters out posts with
 * unsupported content, and returns the first 5 that pass.
 *
 * @param int $exclude_post_id Post ID to exclude (the currently-edited post), or 0.
 * @return array Array of { id: int, title: string, modified: string } objects.
 */
function wpcom_write_get_recent_drafts( $exclude_post_id = 0 ) {
	// Drafts always belong to the current user; without one there is nothing to
	// return, and querying with author=0 would otherwise match orphaned drafts.
	if ( ! is_user_logged_in() ) {
		return array();
	}

	$args = array(
		'post_type'      => 'post',
		'post_status'    => 'draft',
		'author'         => get_current_user_id(),
		'orderby'        => 'modified',
		'order'          => 'DESC',
		'posts_per_page' => 20,
		'no_found_rows'  => true,
	);

	if ( $exclude_post_id ) {
		$args['post__not_in'] = array( $exclude_post_id );
	}

	$query  = new WP_Query( $args );
	$drafts = array();

	foreach ( $query->posts as $post ) {
		if ( count( $drafts ) >= 5 ) {
			break;
		}

		if ( wpcom_write_detect_unsupported_content( $post->post_content ) ) {
			continue;
		}

		$gmt = $post->post_modified_gmt;
		if ( '0000-00-00 00:00:00' !== $gmt ) {
			$mod = str_replace( ' ', 'T', $gmt ) . 'Z';
		} else {
			// Convert local time to UTC using the site's timezone setting
			// so the browser can compute an accurate relative time.
			$tz = wp_timezone();
			$dt = new \DateTime( $post->post_modified, $tz );
			$dt->setTimezone( new \DateTimeZone( 'UTC' ) );
			$mod = $dt->format( 'Y-m-d\TH:i:s' ) . 'Z';
		}

		$drafts[] = array(
			'id'       => $post->ID,
			'title'    => $post->post_title,
			'modified' => $mod,
		);
	}

	return $drafts;
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
	$edit_post_id       = isset( $_GET['post'] ) && is_scalar( $_GET['post'] ) ? absint( $_GET['post'] ) : 0;
	$edit_title         = '';
	$edit_content       = '';
	$post_status        = 'new';
	$edit_featured_id   = 0;
	$video_placeholders = array();
	$unsupported_type   = false;
	$open_post_error    = '';

	// Resolve a ?url= param to a post ID.
	// For same-host URLs, extract ?p= or ?post= query params directly
	// (covers admin URLs and shortlinks like /?p=123). Then fall back
	// to url_to_postid() for pretty permalinks — core checks the host
	// against home_url() internally.
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only GET parameter for permalink resolution.
	if ( ! $edit_post_id && ! empty( $_GET['url'] ) && is_scalar( $_GET['url'] ) ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$input_url = esc_url_raw( wp_unslash( $_GET['url'] ) );
		$url_host  = wp_parse_url( $input_url, PHP_URL_HOST );
		$home_host = wp_parse_url( home_url(), PHP_URL_HOST );

		// Extract ?p= / ?post= only from same-host URLs to avoid
		// treating foreign post IDs as local ones.
		if ( $url_host && $url_host === $home_host ) {
			$query_str = wp_parse_url( $input_url, PHP_URL_QUERY );
			if ( $query_str ) {
				parse_str( $query_str, $query_params );
				$param_id = 0;
				if ( ! empty( $query_params['p'] ) && is_scalar( $query_params['p'] ) ) {
					$param_id = absint( $query_params['p'] );
				} elseif ( ! empty( $query_params['post'] ) && is_scalar( $query_params['post'] ) ) {
					$param_id = absint( $query_params['post'] );
				}
				if ( $param_id ) {
					$edit_post_id = $param_id;
				}
			}
		}
		if ( ! $edit_post_id ) {
			$resolved_id = url_to_postid( $input_url );
			if ( $resolved_id ) {
				$edit_post_id = $resolved_id;
			} else {
				$open_post_error = __( 'Post not found. Check the URL or ID and try again.', 'jetpack-mu-wpcom' );
			}
		}
	}

	if ( $edit_post_id ) {
		$edit_post = get_post( $edit_post_id );
		if ( ! $edit_post ) {
			$open_post_error = __( 'Post not found. Check the URL or ID and try again.', 'jetpack-mu-wpcom' );
			$edit_post_id    = 0;
		} elseif ( ! current_user_can( 'edit_post', $edit_post_id ) ) {
			$open_post_error = __( 'You don\'t have permission to edit this post.', 'jetpack-mu-wpcom' );
			$edit_post_id    = 0;
		} elseif ( 'post' !== $edit_post->post_type ) {
			$open_post_error = __( 'Only posts can be opened in Write.', 'jetpack-mu-wpcom' );
			$edit_post_id    = 0;
		} else {
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
			$unsupported_type   = wpcom_write_detect_unsupported_content( $edit_post->post_content );

			// Only track the last editor when the post is actually editable
			// in Write. Posts with unsupported content show a warning modal
			// and are never editable, so recording Write as the last editor
			// would be misleading.
			if ( ! $unsupported_type ) {
				\Automattic\Jetpack\Jetpack_Mu_Wpcom\WPCOM_Block_Editor\EditorType\remember_editor( $edit_post_id, 'write-editor' );
			}
		}
	}

	if ( 'classic-editor' === $unsupported_type ) {
		$editor_url = admin_url( 'post.php?post=' . $edit_post_id . '&action=edit&classic-editor' );
	} elseif ( 'block-editor' === $unsupported_type ) {
		$editor_url = admin_url( 'post.php?post=' . $edit_post_id . '&action=edit&classic-editor__forget' );
	} else {
		$editor_url = '';
	}

	// URLs for the topbar "more" menu (Open in block editor / Preview).
	// Always available when editing an existing post — independent of the
	// unsupported-content warning's $editor_url which only triggers on load.
	$block_editor_url = $edit_post_id
		? admin_url( 'post.php?post=' . $edit_post_id . '&action=edit&classic-editor__forget' )
		: '';
	$preview_url      = '';
	if ( $edit_post_id ) {
		$preview_url = 'publish' === $post_status
			? (string) get_permalink( $edit_post_id )
			: (string) get_preview_post_link( $edit_post_id );
	}

	// Determine how the user arrived at the Write editor.
	// 1. Explicit query param (highest priority).
	// 2. Infer from HTTP referer.
	// 3. Fall back to 'direct' (bookmarks, typed URLs, stripped referers).
	// The /write-editor redirect forwards this param into wp-admin, so an explicit
	// source (e.g. 'reader') survives the hop and drives the back-button destination.
	// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Read-only GET parameter, no state change.
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

	// Resolve where the back/close button should return the user, based on source.
	$back_url = wpcom_write_resolve_back_url( $source );

	if ( function_exists( '\Automattic\Jetpack\Jetpack_Mu_Wpcom\Common\wpcom_record_tracks_event' ) ) {
		$event_props = array(
			'is_new_post' => (int) ( 0 === $edit_post_id ),
			'source'      => $source,
			// Anon entry is the only logged-out render of this editor (the wp-admin
			// page requires auth), so logged-out is a reliable proxy for the anon
			// fake-door funnel. Lets the funnel scope its top-of-funnel denominator
			// to anon traffic without depending on the client-only wpcomWriteIsAnon flag.
			'is_anon'     => (int) ! is_user_logged_in(),
		);

		if ( $edit_post_id > 0 ) {
			$event_props['post_id'] = $edit_post_id;
		}

		Common\wpcom_record_tracks_event(
			'wpcom_write_editor_open',
			$event_props
		);
	}

	// Fetch existing tag IDs so JS can merge them with any #hashtag-extracted tags on save.
	$existing_tag_ids = $edit_post_id ? wp_get_post_tags( $edit_post_id, array( 'fields' => 'ids' ) ) : array();

	// Build categories list for the UI (only categories that have posts).
	$all_cats        = get_categories( array( 'hide_empty' => true ) );
	$selected_cats   = $edit_post_id ? wp_get_post_categories( $edit_post_id ) : array();
	$categories_data = array();
	foreach ( $all_cats as $cat ) {
		$categories_data[] = array(
			'id'       => $cat->term_id,
			'name'     => $cat->name,
			'selected' => in_array( $cat->term_id, $selected_cats, true ),
		);
	}

	// For new posts, pre-select the default category if it's in the used-categories list,
	// otherwise the first available used category, so the label is never empty.
	if ( ! $edit_post_id && ! empty( $categories_data ) ) {
		$has_selection = ! empty( array_filter( $categories_data, fn( $c ) => $c['selected'] ) );
		if ( ! $has_selection ) {
			$default_id                                 = (int) get_option( 'default_category' );
			$default_idx                                = array_search( $default_id, array_column( $categories_data, 'id' ), true );
			$select_idx                                 = false !== $default_idx ? $default_idx : 0;
			$categories_data[ $select_idx ]['selected'] = true;
		}
	}

	// Show the category row only when the site has 2+ used categories.
	$show_cat_row = count( $categories_data ) >= 2;

	// Compute the initial "Writing in …" label from any pre-selected categories.
	$selected_cat_names = array_values(
		array_map(
			fn( $c ) => $c['name'],
			array_filter( $categories_data, fn( $c ) => $c['selected'] )
		)
	);
	// translators: %s is a comma-separated list of category names, e.g. "Travel, Food".
	$writing_in_fmt = __( 'Writing in %s', 'jetpack-mu-wpcom' );
	$cat_label      = empty( $selected_cat_names )
		? ''
		: sprintf( $writing_in_fmt, implode( ', ', $selected_cat_names ) );

	// Query recent compatible drafts for the post picker.
	$recent_drafts = wpcom_write_get_recent_drafts( $edit_post_id );

	// Seed Interactivity API state.
	wp_interactivity_state(
		'wpcom-write',
		array(
			'postsPath'              => '/wp/v2/posts',
			'mediaPath'              => '/wp/v2/media',
			'homeUrl'                => home_url( '/' ),
			'adminUrl'               => admin_url(),
			'backUrl'                => $back_url,
			'writeUrl'               => wpcom_write_url(),
			'editPostId'             => $edit_post_id,
			'postStatus'             => $post_status,
			'isPublishedPost'        => 'publish' === $post_status,
			// When the site is still Coming Soon (private by default), publishing
			// lands a private post. The publish redirect tags the post URL so the
			// post-publish next-steps checklist can surface there.
			'isComingSoon'           => 1 === (int) get_option( 'wpcom_public_coming_soon' ),
			// The query arg the redirect tags onto the post URL, kept in sync with
			// the server-side gate by sharing WPCOM_WRITE_PUBLISHED_MARKER (defined
			// in post-publish-checklist.php) rather than hardcoding it in view.js.
			'publishedMarker'        => WPCOM_WRITE_PUBLISHED_MARKER,
			'title'                  => $edit_title,
			'isSaving'               => false,
			'isPublished'            => false,
			'message'                => '',
			'showLinkInput'          => false,
			'linkUrl'                => '',
			'showImageModal'         => false,
			'showVideoModal'         => false,
			'videoUrl'               => '',
			'imageAlt'               => '',
			'setAsFeatured'          => false,
			'featuredMediaId'        => $edit_featured_id,
			'isEditMode'             => false,
			'editingImageAlign'      => 'center',
			'editingImageSize'       => '',
			'editingImageHasMediaId' => false,
			'isUploading'            => false,
			'showLibraryPicker'      => false,
			'showUrlInput'           => false,
			'librarySearch'          => '',
			'libraryStatus'          => '',
			'categories'             => $categories_data,
			'catLabel'               => $cat_label,
			'existingTagIds'         => $existing_tag_ids,
			'showCatDropdown'        => false,
			'showHelp'               => false,
			'showSlashMenu'          => false,
			'slashActiveId'          => '',
			'slashFilter'            => '',
			'showLeaveConfirm'       => false,
			'showHeadingMenu'        => false,
			'showTextColorMenu'      => false,
			'formatStrikethrough'    => false,
			'formatUnderline'        => false,
			'formatAlignLeft'        => false,
			'formatAlignCenter'      => false,
			'formatAlignRight'       => false,
			'formatAlignJustify'     => false,
			'cannotJustify'          => false,
			'formatOList'            => false,
			'formatUList'            => false,
			'insideList'             => false,
			'showRecoveryBanner'     => false,
			'unsupportedWarning'     => $unsupported_type,
			'editorUrl'              => $editor_url,
			'blockEditorUrl'         => $block_editor_url,
			'previewUrl'             => $preview_url,
			'showMoreMenu'           => false,
			'recentDrafts'           => $recent_drafts,
			'openPostError'          => $open_post_error,
			'showPostPicker'         => '' !== $open_post_error,
			'postPickerUrl'          => '',
			'pendingOpenPost'        => false,
		)
	);

	// Output the editor UI inside wp-admin's wrapper.
	wpcom_write_template( $edit_title, $edit_content, $edit_post_id, $categories_data, $post_status, $video_placeholders, $show_cat_row, $cat_label, $recent_drafts, $open_post_error, $back_url );
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
 * @param bool   $show_cat_row        Whether to show the category row (2+ used categories).
 * @param string $cat_label           Full "Writing in X, Y" label text; empty string if none selected.
 * @param array  $recent_drafts       Array of recent draft objects for the post picker.
 * @param string $open_post_error     Error message for post picker, empty if no error.
 * @param string $back_url            Destination for the back/close button; defaults to the dashboard.
 */
function wpcom_write_template( $edit_title = '', $edit_content = '', $edit_post_id = 0, $categories_data = array(), $post_status = 'new', $video_placeholders = array(), $show_cat_row = false, $cat_label = '', $recent_drafts = array(), $open_post_error = '', $back_url = '' ) {
	if ( '' === $back_url ) {
		$back_url = admin_url();
	}
	?>
<div data-wp-interactive="wpcom-write" class="bw-app">

	<!-- Top bar -->
	<header class="bw-topbar">
		<a href="<?php echo esc_url( $back_url ); ?>" class="bw-back" title="<?php echo esc_attr__( 'Back', 'jetpack-mu-wpcom' ); ?>" aria-label="<?php echo esc_attr__( 'Back', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.handleBack">&larr;</a>
		<div class="bw-help-wrap" data-wp-on--keydown="actions.handleHelpKeyDown" data-wp-on--focusout="actions.handleHelpFocusOut">
		<button class="bw-help-toggle" data-wp-on--click="actions.toggleHelp" title="<?php echo esc_attr__( 'Tips', 'jetpack-mu-wpcom' ); ?>" aria-label="<?php echo esc_attr__( 'Tips', 'jetpack-mu-wpcom' ); ?>"><span class="bw-help-i" aria-hidden="true">i</span></button>
		<div class="bw-help-popover" hidden data-wp-bind--hidden="!state.showHelp">
			<div class="bw-help-title"><?php echo esc_html__( 'Tips', 'jetpack-mu-wpcom' ); ?></div>
			<div class="bw-help-row"><kbd>/</kbd><span><?php echo esc_html__( 'Insert a heading, image, video, list, quote or divider', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Ctrl+B</kbd><span><?php echo esc_html__( 'Bold', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Ctrl+I</kbd><span><?php echo esc_html__( 'Italic', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Ctrl+K</kbd><span><?php echo esc_html__( 'Insert link', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Ctrl+S</kbd><span><?php echo esc_html__( 'Save', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Tab</kbd><span><?php echo esc_html__( 'Navigate slash menu options', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>Shift+Tab</kbd><span><?php echo esc_html__( 'Focus formatting toolbar', 'jetpack-mu-wpcom' ); ?></span></div>
			<div class="bw-help-row"><kbd>#tag</kbd><span><?php echo esc_html__( 'A line containing only #tags assigns them to the post on save', 'jetpack-mu-wpcom' ); ?></span></div>
			<a class="bw-help-link" data-target="wpcom-help-center" href="https://wordpress.com/support/editors/write-editor/" target="_blank" rel="noopener noreferrer"><?php echo esc_html__( 'Read the Write editor guide', 'jetpack-mu-wpcom' ); ?> <span aria-hidden="true">&#8599;</span></a>
		</div>
		</div><!-- /.bw-help-wrap -->
		<span class="bw-status" data-wp-text="state.displayStatus"></span>
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
			<div class="bw-more-wrap" data-wp-on--keydown="actions.handleMoreMenuKeyDown" data-wp-on--focusout="actions.handleMoreMenuFocusOut">
				<button
					class="bw-more-toggle"
					aria-haspopup="menu"
					aria-expanded="false"
					data-wp-bind--aria-expanded="state.showMoreMenu"
					data-wp-on--click="actions.toggleMoreMenu"
					title="<?php echo esc_attr__( 'More options', 'jetpack-mu-wpcom' ); ?>"
					aria-label="<?php echo esc_attr__( 'More options', 'jetpack-mu-wpcom' ); ?>"
				><span class="bw-more-dots" aria-hidden="true">&#x22EE;</span></button>
				<div class="bw-more-menu" role="menu" aria-label="<?php echo esc_attr__( 'More options', 'jetpack-mu-wpcom' ); ?>" hidden data-wp-bind--hidden="!state.showMoreMenu">
					<button
						class="bw-more-menu-item bw-more-save-draft"
						role="menuitem"
						tabindex="-1"
						data-wp-on--click="actions.saveDraftFromMenu"
						data-wp-bind--hidden="state.isPublishedPost"
						<?php echo 'publish' === $post_status ? 'hidden' : ''; ?>
					><?php echo esc_html__( 'Save draft', 'jetpack-mu-wpcom' ); ?></button>
					<button
						class="bw-more-menu-item"
						role="menuitem"
						tabindex="-1"
						data-wp-on--click="actions.openInBlockEditor"
					><?php echo esc_html__( 'Open in block editor', 'jetpack-mu-wpcom' ); ?></button>
					<button
						class="bw-more-menu-item"
						role="menuitem"
						tabindex="-1"
						data-wp-on--click="actions.previewPost"
					><?php echo esc_html__( 'Preview', 'jetpack-mu-wpcom' ); ?></button>
					<button
						class="bw-more-menu-item"
						role="menuitem"
						tabindex="-1"
						data-wp-on--click="actions.openPostPicker"
					><?php echo esc_html__( 'Open post', 'jetpack-mu-wpcom' ); ?></button>
				</div>
			</div>
		</div>
	</header>

	<!-- Beta disclaimer banner -->
	<div class="bw-disclaimer-banner" hidden data-wp-bind--hidden="!state.showDisclaimer">
		<span class="bw-disclaimer-text"><?php echo esc_html__( 'Beta: This is an early-access feature. Data loss is possible.', 'jetpack-mu-wpcom' ); ?></span>
		<button class="bw-disclaimer-dismiss" data-wp-on--click="actions.dismissDisclaimer" aria-label="<?php echo esc_attr__( 'Dismiss beta disclaimer', 'jetpack-mu-wpcom' ); ?>">&times;</button>
	</div>

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
			<!-- Undo / Redo -->
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Undo', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.undo" data-wp-bind--disabled="!state.canUndo" title="<?php echo esc_attr__( 'Undo', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-undo"></span></button>
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Redo', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.redo" data-wp-bind--disabled="!state.canRedo" title="<?php echo esc_attr__( 'Redo', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-redo"></span></button>
			<span class="bw-tool-divider"></span>
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
			<button class="bw-tool" aria-label="<?php echo esc_attr__( 'Justify', 'jetpack-mu-wpcom' ); ?>" tabindex="-1" data-wp-on--click="actions.alignJustify" data-wp-class--bw-tool-active="state.formatAlignJustify" data-wp-bind--disabled="state.cannotJustify" title="<?php echo esc_attr__( 'Justify', 'jetpack-mu-wpcom' ); ?>"><span class="dashicons dashicons-editor-justify"></span></button>
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
		<div class="bw-editor" data-wp-bind--inert="state.unsupportedWarning">

			<?php if ( $show_cat_row ) : ?>
			<!-- Category selector — only shown when site has 2+ used categories -->
			<div class="bw-meta" data-wp-on--focusout="actions.handleCatFocusOut">
				<button
					class="bw-meta-cat-btn"
					aria-haspopup="listbox"
					aria-expanded="false"
					aria-controls="bw-cat-dropdown"
					data-wp-bind--aria-expanded="state.showCatDropdown"
					data-wp-on--click="actions.toggleCatDropdown"
					data-wp-on--keydown="actions.handleCatBtnKeyDown"
				>
					<span
						class="bw-meta-cat-label"
						data-placeholder="<?php echo esc_attr__( 'Select a category', 'jetpack-mu-wpcom' ); ?>"
						data-wp-text="state.catLabel"
					><?php echo esc_html( $cat_label ); ?></span>
					<span class="bw-meta-cat-caret" aria-hidden="true">&#9662;</span>
				</button>
				<div
					class="bw-meta-dropdown"
					id="bw-cat-dropdown"
					role="listbox"
					aria-multiselectable="true"
					hidden
					data-wp-bind--hidden="!state.showCatDropdown"
					data-wp-on--keydown="actions.handleCatDropdownKeyDown"
				>
					<?php foreach ( $categories_data as $i => $cat ) : ?>
					<button
						class="bw-meta-dropdown-item<?php echo $cat['selected'] ? ' bw-meta-dropdown-item--selected' : ''; ?>"
						role="option"
						aria-selected="<?php echo $cat['selected'] ? 'true' : 'false'; ?>"
						tabindex="-1"
						data-cat-index="<?php echo (int) $i; ?>"
						data-cat-name="<?php echo esc_attr( $cat['name'] ); ?>"
						data-wp-on--click="actions.handleCatDropdownClick"
					><?php echo esc_html( $cat['name'] ); ?></button>
					<?php endforeach; ?>
				</div>
			</div><!-- /.bw-meta -->
			<?php endif; ?>

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
				data-wp-watch="callbacks.syncComboboxAria"
				data-wp-on--mouseup="actions.checkFormatting"
				data-wp-on--keyup="actions.checkFormatting"
				data-wp-on--click="actions.handleContentClick"
				data-wp-on--input="actions.repairStructure"
				data-wp-on--keydown="actions.handleKeyDown"
				data-wp-on--beforeinput="actions.handleBeforeInput"
				data-wp-on--dragstart="actions.handleEditorDragStart"
				data-wp-on--dragover="actions.handleEditorDragOver"
				data-wp-on--dragleave="actions.handleEditorDragLeave"
				data-wp-on--drop="actions.handleEditorDrop"
				data-wp-on--dragend="actions.handleEditorDragEnd"
				data-placeholder="<?php echo esc_attr__( 'Tell your story...', 'jetpack-mu-wpcom' ); ?>"
			><div
				class="bw-content-inner"
				contenteditable="true"
				role="combobox"
				aria-label="<?php echo esc_attr__( 'Post content', 'jetpack-mu-wpcom' ); ?>"
				aria-autocomplete="list"
				aria-haspopup="listbox"
				aria-expanded="false"
				aria-controls="bw-slash-menu"
				data-wp-ignore
			>
			<?php
			if ( $edit_content ) {
				// Convert block-editor alignment classes to inline styles so
				// convertToBlocks() can read them via node.style.textAlign.
				$edit_content = wpcom_write_alignment_classes_to_inline( $edit_content );
				// Convert Gutenberg <mark class="has-inline-color"> to
				// <span style="color:#hex"> so foreColor can interact with
				// existing colors.  Done before kses so the simpler span+hex
				// format passes through without needing a custom kses filter.
				$edit_content = wpcom_write_inline_color_marks_to_spans( $edit_content );
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
			</div></div>
		</div>
	</main>

	<!-- Image insert modal: centered, blocking overlay for picking a new image. -->
	<div class="bw-image-overlay" hidden data-wp-bind--hidden="!state.showImageInsertOverlay" data-wp-on--pointerdown="actions.handleOverlayPointerDown" data-wp-on--keydown="actions.handleImageModalKeyDown" data-wp-on--dragover="actions.handleOverlayDragOver" data-wp-on--drop="actions.handleOverlayDrop">
		<div class="bw-image-modal" role="dialog" aria-modal="true" aria-label="<?php echo esc_attr__( 'Add an image', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.stopPropagation" data-wp-on--dragover="actions.handleOverlayDragOver" data-wp-on--drop="actions.handleOverlayDrop">
			<h3><?php echo esc_html__( 'Add an image', 'jetpack-mu-wpcom' ); ?></h3>
			<label class="bw-upload-zone" id="bw-upload-zone" data-wp-on--dragover="actions.handleDragOver" data-wp-on--dragleave="actions.handleDragLeave" data-wp-on--drop="actions.handleDrop">
				<span class="bw-upload-label"><?php echo esc_html__( 'Drop a file or click to upload', 'jetpack-mu-wpcom' ); ?></span>
				<span class="bw-upload-saving" style="display:none;"><?php echo esc_html__( 'Uploading...', 'jetpack-mu-wpcom' ); ?></span>
				<input type="file" accept="image/*" data-wp-on--change="actions.uploadImage" class="bw-visually-hidden" />
			</label>
			<input
				type="text"
				class="bw-image-url-input bw-image-alt-input"
				placeholder="<?php echo esc_attr__( 'Alt text (describe the image)...', 'jetpack-mu-wpcom' ); ?>"
				data-wp-on--input="actions.updateImageAlt"
				data-wp-bind--value="state.imageAlt"
			/>
			<label class="bw-featured-toggle">
				<input type="checkbox" data-wp-on--change="actions.toggleFeaturedImage" data-wp-bind--checked="state.setAsFeatured" />
				<span><?php echo esc_html__( 'Set as featured image', 'jetpack-mu-wpcom' ); ?></span>
			</label>
			<button class="bw-btn bw-btn-publish bw-insert-image-btn" data-wp-on--click="actions.insertImageFromUrl"><?php echo esc_html__( 'Insert image', 'jetpack-mu-wpcom' ); ?></button>

			<!-- Secondary sources: collapsed by default. -->
			<div class="bw-source-expanders">
				<div class="bw-source-expander">
					<button
						type="button"
						class="bw-source-trigger"
						aria-controls="bw-library-section"
						data-wp-bind--aria-expanded="state.showLibraryPicker"
						data-wp-on--click="actions.toggleLibraryPicker"
					>
						<span class="bw-source-chevron" aria-hidden="true"></span>
						<?php echo esc_html__( 'From your library', 'jetpack-mu-wpcom' ); ?>
					</button>
					<div id="bw-library-section" class="bw-library-section" hidden data-wp-bind--hidden="!state.showLibraryPicker">
						<label class="bw-visually-hidden" for="bw-library-search"><?php echo esc_html__( 'Search your media library', 'jetpack-mu-wpcom' ); ?></label>
						<input
							id="bw-library-search"
							type="search"
							class="bw-library-search"
							placeholder="<?php echo esc_attr__( 'Search your library…', 'jetpack-mu-wpcom' ); ?>"
							autocomplete="off"
							data-wp-on--input="actions.searchLibrary"
							data-wp-bind--value="state.librarySearch"
						/>
						<div
							id="bw-library-grid"
							class="bw-library-strip"
							role="group"
							aria-label="<?php echo esc_attr__( 'Your media library', 'jetpack-mu-wpcom' ); ?>"
							data-wp-on--click="actions.selectLibraryImage"
						></div>
						<div class="bw-library-status" role="status" aria-live="polite" data-wp-text="state.libraryStatus"></div>
					</div>
				</div>
				<div class="bw-source-expander">
					<button
						type="button"
						class="bw-source-trigger"
						aria-controls="bw-url-section"
						data-wp-bind--aria-expanded="state.showUrlInput"
						data-wp-on--click="actions.toggleUrlInput"
					>
						<span class="bw-source-chevron" aria-hidden="true"></span>
						<?php echo esc_html__( 'Paste an image URL', 'jetpack-mu-wpcom' ); ?>
					</button>
					<div id="bw-url-section" class="bw-url-section" hidden data-wp-bind--hidden="!state.showUrlInput">
						<input
							type="url"
							class="bw-image-url-input"
							placeholder="<?php echo esc_attr__( 'https://…', 'jetpack-mu-wpcom' ); ?>"
							data-wp-on--input="actions.updateImageUrl"
							data-wp-bind--value="state.imageUrl"
						/>
					</div>
				</div>
			</div>

		</div>
	</div>

	<!-- Image edit panel: non-modal, docked bottom-right. Changes apply
		live to the figure so the rest of the editor stays visible. -->
	<div
		class="bw-image-edit-panel"
		hidden
		data-wp-bind--hidden="!state.isEditMode"
		role="dialog"
		aria-modal="false"
		aria-labelledby="bw-edit-panel-title"
		data-wp-watch="callbacks.syncEditImageModalRadios"
	>
		<div class="bw-edit-panel-header">
			<h3 id="bw-edit-panel-title" class="bw-edit-panel-title"><?php echo esc_html__( 'Edit image', 'jetpack-mu-wpcom' ); ?></h3>
			<button class="bw-edit-panel-close" type="button" data-wp-on--click="actions.closeImageModal" aria-label="<?php echo esc_attr__( 'Close', 'jetpack-mu-wpcom' ); ?>" title="<?php echo esc_attr__( 'Close', 'jetpack-mu-wpcom' ); ?>">&times;</button>
		</div>

		<label class="bw-edit-label" for="bw-edit-alt"><?php echo esc_html__( 'Alt text', 'jetpack-mu-wpcom' ); ?></label>
		<input
			id="bw-edit-alt"
			type="text"
			class="bw-image-url-input"
			placeholder="<?php echo esc_attr__( 'Describe this image…', 'jetpack-mu-wpcom' ); ?>"
			data-wp-on--input="actions.updateImageAlt"
			data-wp-bind--value="state.imageAlt"
		/>

		<div class="bw-edit-section" hidden data-wp-bind--hidden="!state.editingImageHasMediaId">
			<div class="bw-edit-label"><?php echo esc_html__( 'Size', 'jetpack-mu-wpcom' ); ?></div>
			<div class="bw-edit-radios" role="radiogroup" aria-label="<?php echo esc_attr__( 'Image size', 'jetpack-mu-wpcom' ); ?>" data-wp-on--keydown="actions.handleEditRadiogroupKeyDown">
				<button type="button" class="bw-edit-size-option" role="radio" aria-checked="false" tabindex="-1" value="thumbnail" data-wp-on--click="actions.setEditImageSize"><?php echo esc_html__( 'Thumbnail', 'jetpack-mu-wpcom' ); ?></button>
				<button type="button" class="bw-edit-size-option" role="radio" aria-checked="false" tabindex="-1" value="medium" data-wp-on--click="actions.setEditImageSize"><?php echo esc_html__( 'Medium', 'jetpack-mu-wpcom' ); ?></button>
				<button type="button" class="bw-edit-size-option" role="radio" aria-checked="false" tabindex="-1" value="large" data-wp-on--click="actions.setEditImageSize"><?php echo esc_html__( 'Large', 'jetpack-mu-wpcom' ); ?></button>
				<button type="button" class="bw-edit-size-option" role="radio" aria-checked="false" tabindex="-1" value="full" data-wp-on--click="actions.setEditImageSize"><?php echo esc_html__( 'Full', 'jetpack-mu-wpcom' ); ?></button>
			</div>
		</div>

		<div class="bw-edit-section">
			<div class="bw-edit-label"><?php echo esc_html__( 'Alignment', 'jetpack-mu-wpcom' ); ?></div>
			<div class="bw-edit-radios" role="radiogroup" aria-label="<?php echo esc_attr__( 'Image alignment', 'jetpack-mu-wpcom' ); ?>" data-wp-on--keydown="actions.handleEditRadiogroupKeyDown">
				<button type="button" class="bw-edit-align-option" role="radio" aria-checked="false" tabindex="-1" value="left" data-wp-on--click="actions.setEditImageAlign"><?php echo esc_html__( 'Left', 'jetpack-mu-wpcom' ); ?></button>
				<button type="button" class="bw-edit-align-option" role="radio" aria-checked="false" tabindex="-1" value="center" data-wp-on--click="actions.setEditImageAlign"><?php echo esc_html__( 'Center', 'jetpack-mu-wpcom' ); ?></button>
				<button type="button" class="bw-edit-align-option" role="radio" aria-checked="false" tabindex="-1" value="right" data-wp-on--click="actions.setEditImageAlign"><?php echo esc_html__( 'Right', 'jetpack-mu-wpcom' ); ?></button>
			</div>
		</div>

		<label class="bw-featured-toggle" hidden data-wp-bind--hidden="!state.editingImageHasMediaId">
			<input type="checkbox" data-wp-on--change="actions.toggleFeaturedImage" data-wp-bind--checked="state.setAsFeatured" />
			<span><?php echo esc_html__( 'Set as featured image', 'jetpack-mu-wpcom' ); ?></span>
		</label>

		<button class="bw-btn bw-btn-publish bw-edit-panel-done" type="button" data-wp-on--click="actions.closeImageModal"><?php echo esc_html__( 'Done', 'jetpack-mu-wpcom' ); ?></button>
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

	<!-- Unsupported content warning -->
	<div class="bw-unsupported-overlay" hidden data-wp-bind--hidden="!state.unsupportedWarning" data-wp-on--keydown="actions.handleUnsupportedKeyDown">
		<div class="bw-unsupported-modal" role="dialog" aria-modal="true" aria-label="<?php echo esc_attr__( 'Unsupported formatting', 'jetpack-mu-wpcom' ); ?>" data-wp-bind--aria-describedby="state.unsupportedDescId" data-wp-on--click="actions.stopPropagation">
			<p class="bw-unsupported-title"><?php echo esc_html__( 'This post has formatting that Write can\'t preserve', 'jetpack-mu-wpcom' ); ?></p>
			<p class="bw-unsupported-desc" id="bw-unsupported-desc-classic" hidden data-wp-bind--hidden="!state.isClassicWarning"><?php echo esc_html__( 'This post was created in the classic editor. Editing in Write would convert it to the block format, which may change some formatting.', 'jetpack-mu-wpcom' ); ?></p>
			<p class="bw-unsupported-desc" id="bw-unsupported-desc-block" hidden data-wp-bind--hidden="!state.isBlockEditorWarning"><?php echo esc_html__( 'This post uses block editor features that the Write editor doesn\'t support. Editing here could lose some of that formatting.', 'jetpack-mu-wpcom' ); ?></p>
			<div class="bw-unsupported-actions">
				<button class="bw-unsupported-back" data-wp-on--click="actions.goBack"><?php echo esc_html__( 'Go back', 'jetpack-mu-wpcom' ); ?></button>
				<button class="bw-unsupported-open-editor" hidden data-wp-bind--hidden="!state.isClassicWarning" data-wp-on--click="actions.openEditor"><?php echo esc_html__( 'Open in Classic Editor', 'jetpack-mu-wpcom' ); ?></button>
				<button class="bw-unsupported-open-editor" hidden data-wp-bind--hidden="!state.isBlockEditorWarning" data-wp-on--click="actions.openEditor"><?php echo esc_html__( 'Open in Block Editor', 'jetpack-mu-wpcom' ); ?></button>
			</div>
		</div>
	</div>

	<!-- Slash command menu -->
	<div class="bw-slash-menu" id="bw-slash-menu" role="listbox" aria-label="<?php echo esc_attr__( 'Insert block', 'jetpack-mu-wpcom' ); ?>" hidden data-wp-bind--hidden="!state.showSlashMenu">
		<div class="bw-slash-item" id="bw-slash-opt-heading" role="option" aria-selected="false" data-action="heading" data-wp-on--click="actions.insertHeading" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">H</span>
			<div><strong><?php echo esc_html__( 'Heading', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'Large section heading', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-image" role="option" aria-selected="false" data-action="image" data-wp-on--click="actions.insertImage" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">&#9653;</span>
			<div><strong><?php echo esc_html__( 'Image', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'Upload or embed an image', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-quote" role="option" aria-selected="false" data-action="quote" data-wp-on--click="actions.insertQuote" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">&ldquo;</span>
			<div><strong><?php echo esc_html__( 'Quote', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'Highlight a quote', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-bulleted-list" role="option" aria-selected="false" data-action="bulleted-list" data-wp-on--click="actions.insertBulletedList" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">&bull;</span>
			<div><strong><?php echo esc_html__( 'Bulleted list', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'An unordered list', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-numbered-list" role="option" aria-selected="false" data-action="numbered-list" data-wp-on--click="actions.insertNumberedList" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">1.</span>
			<div><strong><?php echo esc_html__( 'Numbered list', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'An ordered list', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-video" role="option" aria-selected="false" data-action="video" data-wp-on--click="actions.insertVideo" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">&#9654;</span>
			<div><strong><?php echo esc_html__( 'Video', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'Embed a YouTube or Vimeo video', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
		<div class="bw-slash-item" id="bw-slash-opt-divider" role="option" aria-selected="false" data-action="divider" data-wp-on--click="actions.insertDivider" data-wp-on--mousedown="actions.preventToolbarBlur">
			<span class="bw-slash-icon" aria-hidden="true">&mdash;</span>
			<div><strong><?php echo esc_html__( 'Divider', 'jetpack-mu-wpcom' ); ?></strong><span class="bw-slash-desc"><?php echo esc_html__( 'A horizontal separator', 'jetpack-mu-wpcom' ); ?></span></div>
		</div>
	</div>

	<!-- Video modal -->
	<div class="bw-image-overlay" hidden data-wp-bind--hidden="!state.showVideoModal" data-wp-on--pointerdown="actions.handleOverlayPointerDown" data-wp-on--keydown="actions.handleVideoModalKeyDown">
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

	<!-- Post picker modal -->
	<div class="bw-postpicker-overlay" hidden data-wp-bind--hidden="!state.showPostPicker" data-wp-on--pointerdown="actions.handlePostPickerOverlayClick" data-wp-on--keydown="actions.handlePostPickerKeyDown">
		<div class="bw-postpicker-modal" role="dialog" aria-modal="true" aria-label="<?php echo esc_attr__( 'Open post', 'jetpack-mu-wpcom' ); ?>" data-wp-on--click="actions.stopPropagation">
			<h3 class="bw-postpicker-title"><?php echo esc_html__( 'Open post', 'jetpack-mu-wpcom' ); ?></h3>

			<p class="bw-postpicker-error" <?php echo $open_post_error ? '' : 'hidden'; ?> data-wp-bind--hidden="!state.openPostError" data-wp-text="state.openPostError"><?php echo esc_html( $open_post_error ); ?></p>

			<?php if ( ! empty( $recent_drafts ) ) : ?>
			<p class="bw-postpicker-label"><?php echo esc_html__( 'Last edited', 'jetpack-mu-wpcom' ); ?></p>
			<div class="bw-postpicker-list" role="listbox" aria-label="<?php echo esc_attr__( 'Recent drafts', 'jetpack-mu-wpcom' ); ?>">
				<?php foreach ( $recent_drafts as $idx => $draft ) : ?>
				<button
					class="bw-postpicker-item"
					role="option"
					tabindex="<?php echo 0 === $idx ? '0' : '-1'; ?>"
					data-post-id="<?php echo (int) $draft['id']; ?>"
					data-wp-on--click="actions.openPickedPost"
				>
					<span class="bw-postpicker-item-title<?php echo empty( $draft['title'] ) ? ' bw-postpicker-item-untitled' : ''; ?>"><?php echo esc_html( $draft['title'] ? $draft['title'] : __( 'Untitled', 'jetpack-mu-wpcom' ) ); ?></span>
					<span class="bw-postpicker-item-date" data-modified="<?php echo esc_attr( $draft['modified'] ); ?>"></span>
				</button>
				<?php endforeach; ?>
			</div>
			<div class="bw-image-divider"><span><?php echo esc_html__( 'or', 'jetpack-mu-wpcom' ); ?></span></div>
			<?php else : ?>
			<p class="bw-postpicker-empty"><?php echo esc_html__( 'No recent drafts', 'jetpack-mu-wpcom' ); ?></p>
			<?php endif; ?>

			<div class="bw-postpicker-input-row">
				<label for="bw-postpicker-url-input" class="bw-visually-hidden"><?php echo esc_html__( 'Post URL or ID', 'jetpack-mu-wpcom' ); ?></label>
				<input
					id="bw-postpicker-url-input"
					type="text"
					class="bw-image-url-input"
					placeholder="<?php echo esc_attr__( 'Paste a post URL or enter a post ID', 'jetpack-mu-wpcom' ); ?>"
					data-wp-bind--value="state.postPickerUrl"
					data-wp-on--input="actions.updatePostPickerUrl"
					data-wp-on--keydown="actions.handlePostPickerInputKeyDown"
				/>
				<button class="bw-btn bw-btn-publish bw-postpicker-go" data-wp-on--click="actions.submitPostPickerUrl"><?php echo esc_html__( 'Go', 'jetpack-mu-wpcom' ); ?></button>
			</div>
		</div>
	</div>

</div>
	<?php
}
