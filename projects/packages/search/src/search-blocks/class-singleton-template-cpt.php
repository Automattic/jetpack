<?php
/**
 * Abstract scaffolding for the bundled-template singleton-CPT editor flow.
 *
 * @package automattic/jetpack-search
 *
 * Every `static::abstract_method()` call here is reached only through
 * `Overlay_Template::init()` / `Search_Template::init()`, so the abstract is
 * resolved at runtime. The Phan warning is a false positive.
 *
 * @phan-file-suppress PhanAbstractStaticMethodCallInStatic
 */

namespace Automattic\Jetpack\Search;

/**
 * Shared machinery for "edit a bundled block template via the standard editor
 * on a hidden CPT" — a theme-agnostic customization surface that subclasses
 * ({@see Overlay_Template}, {@see Search_Template}) specialize via constants
 * and abstract hooks.
 *
 * Lifecycle: admin clicks "Edit…" → nonce'd handler lazy-creates a singleton
 * from the bundled markup → admin lands in `post.php?post=<id>&action=edit` →
 * front-end renderers prefer the customization → "Restore default" deletes the
 * singleton via REST → `before_delete_post` clears the option + cache.
 *
 * Subclasses MUST override every const + abstract method. Defaults are
 * intentionally empty so a misconfigured subclass surfaces at registration
 * time. Per-class cache is keyed by `static::class` so subclasses can't
 * cross-contaminate.
 */
abstract class Singleton_Template_Cpt {

	/**
	 * Hidden CPT slug. Max 20 chars; use a `jp_` prefix to stay greppable.
	 */
	const POST_TYPE = '';

	/**
	 * REST base for the core CPT controller (`/wp/v2/<rest_base>`) the block
	 * editor uses to load + save the singleton. The "Restore default" path
	 * lives on jetpack/v4 instead, registered by `REST_Controller`.
	 */
	const REST_BASE = '';

	/**
	 * Option storing the singleton post ID (0/absent ⇒ no customization).
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
	 * Post-meta key stamped on seeded singletons so a future re-seed pass
	 * can find rows it created.
	 */
	const SEED_META_KEY = '';

	/**
	 * Per-request memo backing `get_customized_content()`, keyed by subclass.
	 * Values: missing = uncached; `false` = no customization; `string` = content
	 * (including the empty string when the admin saved a blank canvas).
	 *
	 * @var array<class-string, string|false>
	 */
	private static $caches = array();

	/**
	 * Labels for `register_post_type()`.
	 *
	 * @return array{name:string,singular_name:string}
	 */
	abstract protected static function labels(): array;

	/**
	 * Default title for the singleton on first creation.
	 *
	 * @return string
	 */
	abstract protected static function post_title(): string;

	/**
	 * Initial `post_content` for the singleton. Called only during lazy creation.
	 *
	 * @return string
	 */
	abstract protected static function read_seed_content(): string;

	/**
	 * `wp_die()` copy for non-admin editor-URL attempts.
	 *
	 * @return string
	 */
	abstract protected static function forbidden_message(): string;

	/**
	 * `wp_die()` copy when singleton creation fails (e.g. `wp_insert_post()` WP_Error).
	 *
	 * @return string
	 */
	abstract protected static function create_failure_message(): string;

	/**
	 * Wire the hooks. Called from the subclass's `init()` invocation.
	 */
	public static function init() {
		// Self-healing CPT registration: a downstream consumer may hook
		// `Search_Blocks::init()` onto `init:N` itself, in which case queuing
		// `register_post_type` onto `init:9` from inside that callback lands on
		// a priority WordPress is already iterating — PHP's `foreach` snapshot
		// drops it. Register synchronously when we're already inside (or past)
		// `init`; queue on `init:9` otherwise to preserve the standard
		// `plugins_loaded` → `init:9` → `register_blocks` at `init:10` ordering.
		if ( did_action( 'init' ) || doing_action( 'init' ) ) {
			static::register_post_type();
		} else {
			add_action( 'init', array( static::class, 'register_post_type' ), 9 );
		}
		add_action( 'admin_init', array( static::class, 'maybe_handle_editor_request' ) );
		// `before_delete_post` fires for force-delete too, so it catches every
		// delete path: AJAX reset, REST DELETE, post.php trash-then-delete.
		add_action( 'before_delete_post', array( static::class, 'maybe_cleanup_on_singleton_delete' ) );
	}

	/**
	 * Clear the option + cache when our singleton is deleted via any path.
	 * Without this, a stale option pointer would hide "Restore default" while
	 * the front end already served the bundled template.
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
	 * Register the hidden singleton CPT. No menu, no UI of its own; the only
	 * way into the block editor is via the dashboard's nonce'd edit link.
	 */
	public static function register_post_type() {
		register_post_type(
			static::POST_TYPE,
			array(
				'labels'              => static::labels(),
				'public'              => false,
				'show_ui'             => true, // post.php / edit.php need the UI machinery.
				'show_in_menu'        => false,
				'show_in_admin_bar'   => false,
				'show_in_nav_menus'   => false,
				'show_in_rest'        => true,
				'rest_base'           => static::REST_BASE,
				'supports'            => array( 'editor', 'custom-fields', 'revisions' ),
				// Every cap → `manage_options` so an Editor-role user can't bypass
				// the dashboard gate via post.php or REST. `map_meta_cap: false`
				// makes the literal cap names the ones WP checks.
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
	 * Singleton post content, or `null` if no customization exists (callers
	 * fall back to the bundled template). Memoized per-request.
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
		// Empty content = admin saved a blank canvas. Honor it explicitly so
		// the editor doesn't loop with the bundled content on every save.
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
	 * Whether a live customization exists — option set AND not trashed. The
	 * trash check matters because `show_ui` is on, so an admin could trash
	 * the singleton from the post-list while the option still points at it.
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
	 * Nonce'd admin URL that lazy-creates the singleton and redirects to the
	 * block editor on it.
	 *
	 * Built with `add_query_arg` + `wp_create_nonce` (not `wp_nonce_url`) so
	 * the returned string has raw `&` separators, not `&amp;`. React/JSX
	 * doesn't HTML-decode attribute values, so encoded amps would round-trip
	 * into the URL bar verbatim and break `$_GET` parsing.
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
	 * Handle the "open editor" admin request: lazy-create the singleton seeded
	 * from the bundled template, then redirect to the block editor on it.
	 */
	public static function maybe_handle_editor_request() {
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
	 * Ensure the singleton exists. Returns its ID; creates one seeded from
	 * `read_seed_content()` if missing.
	 *
	 * @return int Post ID on success, 0 on failure.
	 */
	protected static function ensure_post_exists(): int {
		$existing = static::get_post_id();
		if ( $existing ) {
			$existing_post = get_post( $existing );
			// Only reuse live singletons — a stale/trashed pointer recreates
			// a fresh editable row.
			if ( $existing_post && static::POST_TYPE === $existing_post->post_type && 'trash' !== $existing_post->post_status ) {
				return $existing;
			}
			// Force-delete the stale post so repeated trashings don't orphan rows.
			// `before_delete_post` nulls the option + cache.
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
		// Race-safe option write: if a parallel request inserted its own
		// singleton + claimed the option in between, drop ours and adopt theirs
		// — the orphan would never be cleaned up otherwise (reset only follows
		// the option pointer).
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
