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
 * 5. "Restore default" hits `maybe_handle_reset_request()`, which deletes
 *    the singleton; the next request falls back to the bundled file again.
 *
 * Gated behind both `jetpack_search_blocks_enabled` AND
 * `jetpack_search_overlay_block_template_enabled` — only initialized from
 * `Search_Blocks::init()` when the overlay path is wired up.
 */
class Overlay_Template {

	// 20 char max per `register_post_type()`. `jp_` prefix instead of
	// `jetpack_` to stay under the limit while remaining greppable.
	const POST_TYPE          = 'jp_search_overlay';
	const OPTION_POST_ID     = 'jetpack_search_overlay_template_post_id';
	const EDITOR_REQUEST_KEY = 'jetpack_search_open_overlay_editor';
	const RESET_REQUEST_KEY  = 'jetpack_search_reset_overlay_template';
	const EDITOR_NONCE       = 'jetpack_search_overlay_editor';
	const RESET_NONCE        = 'jetpack_search_overlay_reset';
	const REDIRECT_QUERY_ARG = 'jetpack_search_overlay_template';

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
		add_action( 'admin_init', array( static::class, 'maybe_handle_reset_request' ) );
		add_action( 'admin_notices', array( static::class, 'maybe_render_admin_notices' ) );
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
				'rest_base'           => 'jetpack-search-overlay',
				'supports'            => array( 'editor', 'custom-fields', 'revisions' ),
				'capability_type'     => 'page',
				'map_meta_cap'        => true,
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
	 * Nonce'd admin URL that deletes the singleton (restoring the bundled
	 * template) and redirects back to the dashboard. Built raw for the
	 * same reason as `get_editor_url()`.
	 *
	 * @return string
	 */
	public static function get_reset_url(): string {
		return add_query_arg(
			array(
				static::RESET_REQUEST_KEY => '1',
				'_wpnonce'                => wp_create_nonce( static::RESET_NONCE ),
			),
			admin_url( 'admin.php?page=jetpack-search' )
		);
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
	 * Handle the "reset to default" admin request: delete the singleton
	 * (and the option pointing to it) so the next render falls back to the
	 * bundled template.
	 */
	public static function maybe_handle_reset_request() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce checked below.
		if ( empty( $_GET[ static::RESET_REQUEST_KEY ] ) ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html__( 'You do not have permission to reset the Search overlay.', 'jetpack-search-pkg' ), '', array( 'response' => 403 ) );
		}
		check_admin_referer( static::RESET_NONCE );
		$post_id = static::get_post_id();
		if ( $post_id ) {
			wp_delete_post( $post_id, true );
			delete_option( static::OPTION_POST_ID );
			self::$customized_content_cache = null;
		}
		wp_safe_redirect(
			add_query_arg( static::REDIRECT_QUERY_ARG, 'reset', admin_url( 'admin.php?page=jetpack-search' ) )
		);
		exit;
	}

	/**
	 * Surface the success / restore-default notice — but only on the
	 * Jetpack Search settings page itself. Without the screen guard the
	 * notice could surface on any admin page whose URL happens to carry
	 * the redirect query arg (anyone could land on
	 * `wp-admin/index.php?jetpack_search_overlay_template=reset`).
	 */
	public static function maybe_render_admin_notices() {
		$screen = function_exists( 'get_current_screen' ) ? get_current_screen() : null;
		if ( ! $screen || 'toplevel_page_jetpack-search' !== $screen->id ) {
			return;
		}
		// Read-only query arg used only to flip the success banner on after
		// the nonce'd reset handler redirected back. No state mutated here,
		// so nonce verification is intentionally not required.
		// phpcs:disable WordPress.Security.NonceVerification.Recommended
		$redirect_signal = isset( $_GET[ static::REDIRECT_QUERY_ARG ] )
			? sanitize_text_field( wp_unslash( $_GET[ static::REDIRECT_QUERY_ARG ] ) )
			: '';
		// phpcs:enable WordPress.Security.NonceVerification.Recommended
		if ( 'reset' !== $redirect_signal ) {
			return;
		}
		?>
		<div class="notice notice-success is-dismissible">
			<p><?php esc_html_e( 'The Search overlay template has been restored to the bundled default.', 'jetpack-search-pkg' ); ?></p>
		</div>
		<?php
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
		if ( $existing && get_post( $existing ) ) {
			return $existing;
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
		if ( $other_post_id && get_post( $other_post_id ) ) {
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
