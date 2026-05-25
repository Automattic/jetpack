<?php
/**
 * Abstract scaffolding for the bundled-template singleton-CPT editor flow.
 *
 * @package automattic/jetpack-search
 *
 * Phan can't statically prove our late-static-binding callers always
 * resolve to a concrete subclass — every `static::abstract_method()`
 * site in here is reached only through `Overlay_Template::init()` or
 * `Search_Template::init()` (which forward `static::class` to the
 * registered actions/filters), so the abstract methods are always
 * resolved at runtime. The warning is a false positive for this file.
 *
 * @phan-file-suppress PhanAbstractStaticMethodCallInStatic
 */

namespace Automattic\Jetpack\Search;

/**
 * Shared machinery for "edit a bundled block template via the standard block
 * editor on a hidden CPT" — a theme-agnostic customization surface that
 * concrete subclasses ({@see Overlay_Template}, {@see Search_Template})
 * specialize by declaring the post-type / option / nonce / REST identifiers
 * and providing the seed content + admin-facing copy.
 *
 * The lifecycle (admin clicks "Edit …" → nonce'd handler lazy-creates a
 * singleton seeded from the bundled markup → admin redirected to
 * `post.php?post=<id>&action=edit` → front-end renderers prefer the
 * customization → "Restore default" force-deletes the singleton via REST →
 * `before_delete_post` clears the option + per-request cache) is identical
 * across both subclasses. Keeping the variations to a handful of constants
 * and abstract hooks lets a third bundled template (search-product, future
 * variants) opt in with ~50 lines instead of a 350-line copy.
 *
 * Subclasses **must** override every const + abstract method below. The
 * defaults are intentionally empty / unsatisfiable so a misconfigured
 * subclass surfaces at registration time rather than silently broken at
 * delete-cleanup time. Per-class state (the customization cache) is keyed
 * by `static::class` so two subclasses can't cross-contaminate each
 * other's memoized lookup within a request.
 */
abstract class Singleton_Template_Cpt {

	/**
	 * Hidden CPT slug. 20 char max per `register_post_type()`. Use a
	 * `jp_` prefix to stay under the limit while remaining greppable.
	 */
	const POST_TYPE = '';

	/**
	 * REST base for the CPT — appears in `/wp/v2/<rest_base>/<id>` and
	 * in `get_reset_rest_path()`.
	 */
	const REST_BASE = '';

	/**
	 * Option name that stores the singleton post ID (0 / absent ⇒
	 * "no customization").
	 */
	const OPTION_POST_ID = '';

	/**
	 * `$_GET` key the nonce'd "open editor" URL sets.
	 */
	const EDITOR_REQUEST_KEY = '';

	/**
	 * Nonce action paired with EDITOR_REQUEST_KEY.
	 */
	const EDITOR_NONCE = '';

	/**
	 * Post-meta key stamped on freshly-seeded singletons so a future
	 * re-seed pass (if the bundled markup evolves) can find rows it
	 * created.
	 */
	const SEED_META_KEY = '';

	/**
	 * Per-request memo backing `get_customized_content()`, keyed by
	 * subclass name so concrete subclasses can't cross-contaminate each
	 * other's lookups.
	 *
	 * Values: missing key = uncached; `false` = "no customization on
	 * file"; `string` = the customization's content (including the
	 * empty string when the admin saved a blank canvas).
	 *
	 * @var array<class-string, string|false>
	 */
	private static $caches = array();

	/**
	 * Labels for `register_post_type()` — translation-aware so subclass
	 * copy stays consistent with the rest of the admin UI.
	 *
	 * @return array{name:string,singular_name:string}
	 */
	abstract protected static function labels(): array;

	/**
	 * Default title for the singleton on first creation. Translation-
	 * aware.
	 *
	 * @return string
	 */
	abstract protected static function post_title(): string;

	/**
	 * Initial `post_content` for the singleton. Called only during
	 * lazy-creation in `ensure_post_exists()`.
	 *
	 * @return string
	 */
	abstract protected static function read_seed_content(): string;

	/**
	 * Copy used in `wp_die()` when a non-admin tries to trigger the
	 * editor URL. Translation-aware.
	 *
	 * @return string
	 */
	abstract protected static function forbidden_message(): string;

	/**
	 * Copy used in `wp_die()` when the singleton creation fails (e.g.
	 * `wp_insert_post()` returns a WP_Error). Translation-aware.
	 *
	 * @return string
	 */
	abstract protected static function create_failure_message(): string;

	/**
	 * Wire the hooks. Called from the subclass's own `init()` invocation
	 * in `Search_Blocks::init()`.
	 */
	public static function init() {
		// Priority 9: register the CPT just before
		// `Search_Blocks::register_blocks()` (also on `init`, default
		// priority 10) so the Search blocks are registered against a
		// known CPT when `do_blocks()` runs on the singleton's content.
		add_action( 'init', array( static::class, 'register_post_type' ), 9 );
		add_action( 'admin_init', array( static::class, 'maybe_handle_editor_request' ) );
		// Keep the singleton option + per-request cache consistent
		// regardless of which delete path is taken: the dashboard's
		// AJAX reset, the REST endpoint, or an admin trashing then
		// permanently deleting via post.php. `before_delete_post` fires
		// for force-delete too, which is what `wp_delete_post( $id, true )`
		// and REST DELETE `?force=true` do.
		add_action( 'before_delete_post', array( static::class, 'maybe_cleanup_on_singleton_delete' ) );
	}

	/**
	 * Reset the option + per-request cache when our singleton post is
	 * deleted, regardless of which delete path the admin took. Catches
	 * deletions from any source — REST, post.php, our own dashboard
	 * flow — so the state never drifts (option still pointing at a
	 * deleted post would otherwise hide "Restore default" while the
	 * front end already serves the bundled template).
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
		unset( self::$caches[ static::class ] );
	}

	/**
	 * Register the hidden singleton CPT. No menu, no UI surface of its
	 * own; the only way to land in the block editor on this post is via
	 * the dashboard's edit link.
	 */
	public static function register_post_type() {
		register_post_type(
			static::POST_TYPE,
			array(
				'labels'              => static::labels(),
				'public'              => false,
				'show_ui'             => true, // post.php / edit.php need the UI machinery even though we hide the menu.
				'show_in_menu'        => false,
				'show_in_admin_bar'   => false,
				'show_in_nav_menus'   => false,
				'show_in_rest'        => true,
				'rest_base'           => static::REST_BASE,
				'supports'            => array( 'editor', 'custom-fields', 'revisions' ),
				// Lock every relevant capability to `manage_options` so
				// editing requires admin, regardless of which entry
				// point (post.php direct URL, REST API, the dashboard
				// link) the user takes. The dashboard handlers already
				// gate on `manage_options` themselves; this prevents an
				// Editor-role user who happens to know the singleton's
				// post ID from bypassing that gate via post.php or REST.
				// `map_meta_cap: false` makes the literal capability
				// names below the ones WordPress actually checks.
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
	 * Return the singleton post's content if present. `null` means
	 * there's no customization on file and callers should fall back to
	 * the bundled template. Memoized per-request.
	 *
	 * @return string|null
	 */
	public static function get_customized_content(): ?string {
		if ( array_key_exists( static::class, self::$caches ) ) {
			$cached = self::$caches[ static::class ];
			return false === $cached ? null : $cached;
		}
		$post_id = static::get_post_id();
		if ( ! $post_id ) {
			self::$caches[ static::class ] = false;
			return null;
		}
		$post = get_post( $post_id );
		if ( ! $post || static::POST_TYPE !== $post->post_type || 'trash' === $post->post_status ) {
			self::$caches[ static::class ] = false;
			return null;
		}
		// Empty post content means the admin saved a blank canvas —
		// honor that explicitly rather than silently falling back to the
		// bundled default (the editor would loop with the bundled
		// content on every save otherwise).
		self::$caches[ static::class ] = (string) $post->post_content;
		return self::$caches[ static::class ];
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
	 * Whether a live customization exists — the singleton post is set
	 * AND not in the trash. The trash check matters because `show_ui`
	 * is on, so an admin could navigate to the post-list and trash the
	 * singleton directly; the option would still point at the
	 * (trashed) post, but `get_customized_content()` already returns
	 * null for trashed rows so the front end falls back to the bundled
	 * template. Reflecting that in the dashboard means "Restore default"
	 * disappears when there's nothing the user would perceive as
	 * customized.
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
	 * Nonce'd admin URL that lazy-creates the singleton (if missing)
	 * and redirects the admin into the block editor on it. Used by the
	 * dashboard edit links.
	 *
	 * Built with `add_query_arg` + `wp_create_nonce` (not
	 * `wp_nonce_url`) so the returned string contains raw `&`
	 * separators, not the HTML-encoded `&amp;` that `wp_nonce_url`
	 * emits. The URL is JSON-serialized to the React dashboard's
	 * initial state and then set as an `<a href>` value — React/JSX
	 * doesn't HTML-decode attribute values, so encoded amps would
	 * round-trip into the browser's URL bar verbatim and break the
	 * `$_GET` parse.
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
	 * REST path used by the dashboard's "Restore default" link to
	 * delete the singleton via the CPT's built-in REST endpoint
	 * (`/wp/v2/<rest_base>/<id>?force=true`). The dashboard calls this
	 * with `apiFetch({ method: 'DELETE', path: <…> })`; the
	 * `before_delete_post` cleanup keeps the option + cache in sync.
	 *
	 * Returns `null` when no singleton exists — the React link is
	 * hidden by `isCustomized` in that state, so this should never be
	 * hit, but returning null keeps the type honest.
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
	 * Handle the "open editor" admin request: create the singleton on
	 * first click (seeded from the bundled template), then redirect to
	 * the block editor on it.
	 */
	public static function maybe_handle_editor_request() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- nonce checked below.
		if ( empty( $_GET[ static::EDITOR_REQUEST_KEY ] ) ) {
			return;
		}
		if ( ! current_user_can( 'manage_options' ) ) {
			wp_die( esc_html( static::forbidden_message() ), '', array( 'response' => 403 ) );
		}
		check_admin_referer( static::EDITOR_NONCE );
		$post_id = static::ensure_post_exists();
		if ( ! $post_id ) {
			wp_die( esc_html( static::create_failure_message() ), '', array( 'response' => 500 ) );
		}
		wp_safe_redirect( admin_url( 'post.php?post=' . $post_id . '&action=edit' ) );
		exit;
	}

	/**
	 * Ensure the singleton post exists. Returns its ID. If it doesn't
	 * exist yet, creates it seeded with `read_seed_content()` so the
	 * editor opens populated rather than empty.
	 *
	 * @return int Post ID on success, 0 on failure.
	 */
	protected static function ensure_post_exists(): int {
		$existing = static::get_post_id();
		if ( $existing ) {
			$existing_post = get_post( $existing );
			// Only reuse live singleton posts. If the option points to
			// a trashed row (or a stale/mismatched ID), treat it as
			// missing so clicking the edit link recreates a fresh
			// editable singleton.
			if ( $existing_post && static::POST_TYPE === $existing_post->post_type && 'trash' !== $existing_post->post_status ) {
				return $existing;
			}
			// Force-delete the stale post (typically trashed) before
			// recreating, so admins who repeatedly trash the singleton
			// don't accumulate orphan rows. `before_delete_post` will
			// null the option + cache.
			if ( $existing_post && static::POST_TYPE === $existing_post->post_type ) {
				wp_delete_post( $existing, true );
			} else {
				delete_option( static::OPTION_POST_ID );
				unset( self::$caches[ static::class ] );
			}
		}
		$seed_content = static::read_seed_content();
		$post_id      = wp_insert_post(
			array(
				'post_type'    => static::POST_TYPE,
				'post_status'  => 'publish',
				'post_title'   => static::post_title(),
				'post_content' => $seed_content,
				'meta_input'   => array(
					static::SEED_META_KEY => '1',
				),
			),
			true
		);
		if ( is_wp_error( $post_id ) || ! $post_id ) {
			return 0;
		}
		// Race-safe option write: if a parallel request also raced
		// past the early `get_post_id()` check and inserted its own
		// singleton + claimed the option in between, drop ours and
		// adopt theirs. The orphaned post would otherwise never be
		// deleted by the reset flow because that only follows the
		// option pointer.
		$other_post_id = (int) get_option( static::OPTION_POST_ID, 0 );
		$other_post    = $other_post_id ? get_post( $other_post_id ) : null;
		if ( $other_post && static::POST_TYPE === $other_post->post_type && 'trash' !== $other_post->post_status ) {
			wp_delete_post( $post_id, true );
			unset( self::$caches[ static::class ] );
			return $other_post_id;
		}
		update_option( static::OPTION_POST_ID, $post_id, false );
		self::$caches[ static::class ] = $seed_content;
		return (int) $post_id;
	}

	/**
	 * Reset the per-request content memo. Tests only.
	 */
	public static function reset_customized_content_cache() {
		unset( self::$caches[ static::class ] );
	}
}
