<?php
/**
 * Singleton CPT + lifecycle for the experimental block-template overlay.
 *
 * @package automattic/jetpack-search
 */

namespace Automattic\Jetpack\Search;

/**
 * Lets admins customize the experimental Search blocks overlay template via
 * the standard block editor (post.php), which is theme-agnostic — works on
 * both block themes and classic themes, no Site Editor dependency.
 *
 * The customized markup lives in a single hidden CPT post; if the post
 * doesn't exist (admin hasn't customized), the overlay falls back to the
 * bundled `templates/jetpack-search-overlay.html` file. Deleting the
 * singleton restores the default.
 *
 * Lifecycle:
 *
 * 1. `register_post_type()` registers the CPT at `init` priority 9, before
 *    block registration, so `do_blocks()` on the post content can resolve
 *    the search blocks.
 * 2. The admin clicks "Edit the Search overlay" in the Jetpack Search
 *    dashboard — a nonce'd URL that hits `maybe_handle_editor_request()`.
 *    That handler lazy-creates the singleton (seeding it from the bundled
 *    file) on first click, then redirects to `post.php?post=<id>&action=edit`.
 * 3. The admin edits + saves; WordPress writes the new block markup to the
 *    singleton's `post_content`.
 * 4. On the front end, `Search_Blocks::get_overlay_template_content()`
 *    prefers the singleton's content when present.
 * 5. "Restore default" calls the CPT's built-in REST endpoint
 *    (`DELETE /wp/v2/jetpack-search-overlay/<id>?force=true`) via
 *    `apiFetch`; the `before_delete_post` hook here cleans up the
 *    singleton option + per-request cache so subsequent renders fall
 *    back to the bundled file.
 *
 * Gated behind both `jetpack_search_blocks_enabled` AND
 * `jetpack_search_overlay_block_template_enabled` — only initialized from
 * `Search_Blocks::init()` when the overlay path is wired up.
 */
class Overlay_Template {

	// 20 char max per `register_post_type()`. `jp_` prefix instead of
	// `jetpack_` to stay under the limit while remaining greppable.
	const POST_TYPE          = 'jp_search_overlay';
	const REST_BASE          = 'jetpack-search-overlay';
	const OPTION_POST_ID     = 'jetpack_search_overlay_template_post_id';
	const EDITOR_REQUEST_KEY = 'jetpack_search_open_overlay_editor';
	const EDITOR_NONCE       = 'jetpack_search_overlay_editor';

	/**
	 * Per-request memo backing `get_customized_content()`. `null` means the
	 * cache hasn't been populated yet for this request; an empty string or
	 * a string with content is a real lookup result.
	 *
	 * @var string|null|false `false` = no customization (use bundled file).
	 */
	private static $customized_content_cache = null;

	/**
	 * Wire the hooks. Called from `Search_Blocks::init()` only when the
	 * overlay gate is on.
	 */
	public static function init() {
		// Priority 9: register the CPT just before `Search_Blocks::register_blocks()`
		// (also on `init`, default priority 10) so the search blocks are
		// registered against a known CPT when `do_blocks()` runs on the
		// singleton's content.
		add_action( 'init', array( static::class, 'register_post_type' ), 9 );
		add_action( 'admin_init', array( static::class, 'maybe_handle_editor_request' ) );
		// Keep the singleton option + per-request cache consistent regardless
		// of which delete path is taken: the dashboard's AJAX reset, the
		// REST endpoint, or an admin trashing then permanently deleting via
		// post.php. `before_delete_post` fires for force-delete too, which
		// is what wp_delete_post( $id, true ) and REST DELETE ?force=true do.
		add_action( 'before_delete_post', array( static::class, 'maybe_cleanup_on_singleton_delete' ) );
	}

	/**
	 * Reset the option + per-request cache when our singleton post is
	 * deleted, regardless of which delete path the admin took. Catches
	 * deletions from any source — REST, post.php, our own dashboard flow
	 * — so the state never drifts (option still pointing at a deleted
	 * post would otherwise hide "Restore default" while the front end
	 * already serves the bundled template).
	 *
	 * @param int $post_id The post being deleted.
	 */
	public static function maybe_cleanup_on_singleton_delete( $post_id ) {
		$post = get_post( $post_id );
		if ( ! $post || static::POST_TYPE !== $post->post_type ) {
			return;
		}
		if ( (int) get_option( static::OPTION_POST_ID, 0 ) === (int) $post_id ) {
			delete_option( static::OPTION_POST_ID );
		}
		self::$customized_content_cache = null;
	}

	/**
	 * Register the hidden singleton CPT. No menu, no UI surface of its own;
	 * the only way to land in the block editor on this post is via the
	 * dashboard's "Edit the Search overlay" link.
	 */
	public static function register_post_type() {
		register_post_type(
			static::POST_TYPE,
			array(
				'labels'              => array(
					'name'          => __( 'Search overlay template', 'jetpack-search-pkg' ),
					'singular_name' => __( 'Search overlay template', 'jetpack-search-pkg' ),
				),
				'public'              => false,
				'show_ui'             => true, // post.php / edit.php need the UI machinery even though we hide the menu.
				'show_in_menu'        => false,
				'show_in_admin_bar'   => false,
				'show_in_nav_menus'   => false,
				'show_in_rest'        => true,
				'rest_base'           => static::REST_BASE,
				'supports'            => array( 'editor', 'custom-fields', 'revisions' ),
				// Lock every relevant capability to `manage_options` so editing
				// requires admin, regardless of which entry point (post.php
				// direct URL, REST API at /wp/v2/jetpack-search-overlay, the
				// dashboard link) the user takes. The dashboard handlers
				// already gate on `manage_options` themselves; this prevents
				// an Editor-role user who happens to know the singleton's
				// post ID from bypassing that gate via post.php or REST.
				// `map_meta_cap: false` makes the literal capability names
				// below the ones WordPress actually checks.
				'capabilities'        => array(
					'edit_post'              => 'manage_options',
					'read_post'              => 'manage_options',
					'delete_post'            => 'manage_options',
					'edit_posts'             => 'manage_options',
					'edit_others_posts'      => 'manage_options',
					'delete_posts'           => 'manage_options',
					'delete_others_posts'    => 'manage_options',
					'publish_posts'          => 'manage_options',
					'read_private_posts'     => 'manage_options',
					'delete_private_posts'   => 'manage_options',
					'delete_published_posts' => 'manage_options',
					'edit_private_posts'     => 'manage_options',
					'edit_published_posts'   => 'manage_options',
					'create_posts'           => 'manage_options',
				),
				'map_meta_cap'        => false,
				'has_archive'         => false,
				'exclude_from_search' => true,
				'rewrite'             => false,
				'can_export'          => false,
				'delete_with_user'    => false,
				'template_lock'       => false,
			)
		);
	}

	/**
	 * Return the singleton post's content if present. `null` means there's
	 * no customization on file and callers should fall back to the bundled
	 * template. Memoized per-request.
	 *
	 * @return string|null
	 */
	public static function get_customized_content(): ?string {
		if ( null !== self::$customized_content_cache ) {
			return false === self::$customized_content_cache ? null : self::$customized_content_cache;
		}
		$post_id = static::get_post_id();
		if ( ! $post_id ) {
			self::$customized_content_cache = false;
			return null;
		}
		$post = get_post( $post_id );
		if ( ! $post || static::POST_TYPE !== $post->post_type || 'trash' === $post->post_status ) {
			self::$customized_content_cache = false;
			return null;
		}
		// Empty post content means the admin saved a blank canvas — honor
		// that explicitly rather than silently falling back to the bundled
		// default (the editor would loop with the bundled content on every
		// save otherwise).
		self::$customized_content_cache = (string) $post->post_content;
		return self::$customized_content_cache;
	}

	/**
	 * Singleton post ID, or 0 if no customization exists yet.
	 *
	 * @return int
	 */
	public static function get_post_id(): int {
		return (int) get_option( static::OPTION_POST_ID, 0 );
	}

	/**
	 * Whether a live customization exists — the singleton post is set AND
	 * not in the trash. The trash check matters because `show_ui` is on,
	 * so an admin could navigate to the post-list and trash the singleton
	 * directly; the option would still point at the (trashed) post, but
	 * `get_customized_content()` already returns null for trashed rows so
	 * the front end falls back to the bundled template. Reflecting that
	 * in the dashboard means "Restore default" disappears when there's
	 * nothing the user would perceive as customized.
	 *
	 * @return bool
	 */
	public static function is_customized(): bool {
		$post_id = static::get_post_id();
		if ( ! $post_id ) {
			return false;
		}
		$post = get_post( $post_id );
		return $post && static::POST_TYPE === $post->post_type && 'trash' !== $post->post_status;
	}

	/**
	 * Nonce'd admin URL that lazy-creates the singleton (if missing) and
	 * redirects the admin into the block editor on it. Used by the
	 * dashboard "Edit the Search overlay" link.
	 *
	 * Built with `add_query_arg` + `wp_create_nonce` (not `wp_nonce_url`)
	 * so the returned string contains raw `&` separators, not the HTML-
	 * encoded `&amp;` that `wp_nonce_url` emits. The URL is JSON-serialized
	 * to the React dashboard's initial state and then set as an `<a href>`
	 * value — React/JSX doesn't HTML-decode attribute values, so encoded
	 * amps would round-trip into the browser's URL bar verbatim and break
	 * the `$_GET` parse.
	 *
	 * @return string
	 */
	public static function get_editor_url(): string {
		return add_query_arg(
			array(
				static::EDITOR_REQUEST_KEY => '1',
				'_wpnonce'                 => wp_create_nonce( static::EDITOR_NONCE ),
			),
			admin_url( 'admin.php?page=jetpack-search' )
		);
	}

	/**
	 * REST path used by the dashboard's "Restore default" link to delete
	 * the singleton via the CPT's built-in REST endpoint
	 * (`/wp/v2/jetpack-search-overlay/<id>?force=true`). The dashboard
	 * calls this with `apiFetch({ method: 'DELETE', path: <…> })`; the
	 * `before_delete_post` cleanup keeps the option + cache in sync.
	 *
	 * Returns `null` when no singleton exists — the React link is hidden
	 * by `isCustomized` in that state, so this should never be hit, but
	 * returning null keeps the type honest.
	 *
	 * @return string|null
	 */
	public static function get_reset_rest_path(): ?string {
		if ( ! static::is_customized() ) {
			return null;
		}
		return '/wp/v2/' . static::REST_BASE . '/' . static::get_post_id() . '?force=true';
	}

	/**
	 * Handle the "open editor" admin request: create the singleton on first
	 * click (seeded from the bundled template), then redirect to the block
	 * editor on it.
	 */
	public static function maybe_handle_editor_request() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce checked below.
		if ( empty( $_GET[ static::EDITOR_REQUEST_KEY ] ) ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to customize the Search overlay.', 'jetpack-search-pkg' ), '', array( 'response' => 403 ) );
		}
		check_admin_referer( static::EDITOR_NONCE );
		$post_id = static::ensure_post_exists();
		if ( ! $post_id ) {
			wp_die( esc_html__( 'Could not create the Search overlay template.', 'jetpack-search-pkg' ), '', array( 'response' => 500 ) );
		}
		wp_safe_redirect( admin_url( 'post.php?post=' . $post_id . '&action=edit' ) );
		exit;
	}

	/**
	 * Ensure the singleton post exists. Returns its ID. If it doesn't
	 * exist yet, creates it with the bundled-template content as the seed
	 * (so the editor opens populated rather than empty).
	 *
	 * @return int Post ID on success, 0 on failure.
	 */
	protected static function ensure_post_exists(): int {
		$existing = static::get_post_id();
		if ( $existing ) {
			$existing_post = get_post( $existing );
			// Only reuse live singleton posts. If the option points to a trashed
			// row (or a stale/mismatched ID), treat it as missing so clicking
			// "Edit the Search overlay" recreates a fresh editable singleton.
			if ( $existing_post && static::POST_TYPE === $existing_post->post_type && 'trash' !== $existing_post->post_status ) {
				return $existing;
			}
			// Force-delete the stale post (typically trashed) before recreating,
			// so admins who repeatedly trash the singleton don't accumulate
			// orphan rows. before_delete_post will null the option + cache.
			if ( $existing_post && static::POST_TYPE === $existing_post->post_type ) {
				wp_delete_post( $existing, true );
			} else {
				delete_option( static::OPTION_POST_ID );
				self::$customized_content_cache = null;
			}
		}
		$seed_content = static::read_bundled_template();
		$post_id      = wp_insert_post(
			array(
				'post_type'    => static::POST_TYPE,
				'post_status'  => 'publish',
				'post_title'   => __( 'Jetpack Search overlay', 'jetpack-search-pkg' ),
				'post_content' => $seed_content,
				'meta_input'   => array(
					'_jetpack_search_overlay_seeded_version' => '1',
				),
			),
			true
		);
		if ( is_wp_error( $post_id ) || ! $post_id ) {
			return 0;
		}
		// Race-safe option write: if a parallel request also raced past
		// the early `get_post_id()` check and inserted its own singleton +
		// claimed the option in between, drop ours and adopt theirs. The
		// orphaned post would otherwise never be deleted by the reset
		// flow because that only follows the option pointer.
		$other_post_id = (int) get_option( static::OPTION_POST_ID, 0 );
		$other_post    = $other_post_id ? get_post( $other_post_id ) : null;
		if ( $other_post && static::POST_TYPE === $other_post->post_type && 'trash' !== $other_post->post_status ) {
			wp_delete_post( $post_id, true );
			self::$customized_content_cache = null;
			return $other_post_id;
		}
		update_option( static::OPTION_POST_ID, $post_id, false );
		self::$customized_content_cache = $seed_content;
		return (int) $post_id;
	}

	/**
	 * Read the bundled overlay template file. Exposed for the seed path —
	 * the equivalent read in `Search_Blocks::get_overlay_template_content()`
	 * cannot be reused without introducing a circular dependency.
	 *
	 * @return string
	 */
	protected static function read_bundled_template(): string {
		$path = __DIR__ . '/templates/jetpack-search-overlay.html';
		if ( ! is_readable( $path ) ) {
			return '';
		}
		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local, bundled template file.
		return (string) file_get_contents( $path );
	}

	/**
	 * Reset the per-request content memo. Tests only.
	 */
	public static function reset_customized_content_cache() {
		self::$customized_content_cache = null;
	}
}
