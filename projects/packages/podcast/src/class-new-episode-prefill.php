<?php
/**
 * Server-side prefill for `post-new.php?podcast_episode=1`.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

/**
 * Prefills the new-post screen with the configured podcast category and, on
 * Premium, an inserted Podcast Episode block.
 *
 * The dashboard's "Create episode" button (header on every tab, CTA on the
 * empty Episodes state) routes through `post-new.php?podcast_episode=1`. This
 * class catches that flag during auto-draft creation and:
 *
 * - Assigns the configured `podcasting_category_id` to the new post (all plans).
 * - Prefills the post content with the Podcast Episode block (Premium only,
 *   via `Podcast_Gate::has_product_access()` when that class is available).
 *
 * Free users get a plain new post and add a core Audio block themselves with
 * an externally hosted URL.
 */
class New_Episode_Prefill {

	const QUERY_VAR = 'podcast_episode';

	/**
	 * Post type supported by this prefill flow.
	 */
	const POST_TYPE = 'post';

	/**
	 * Tracks the first auto-draft we touch so we can self-unhook and avoid
	 * acting on any sibling auto-draft created later in the same request.
	 *
	 * @var int
	 */
	private static $handled_post_id = 0;

	/**
	 * Register hooks.
	 *
	 * Called from `Podcast::init()` inside the `is_admin()` branch.
	 */
	public static function init() {
		add_action( 'admin_init', array( __CLASS__, 'maybe_register_handlers' ) );
	}

	/**
	 * Wire the auto-draft / default-content filters only on
	 * `post-new.php?podcast_episode=1` with a configured podcast category.
	 *
	 * We bind on `admin_init` rather than at load time so `$pagenow` is
	 * settled.
	 */
	public static function maybe_register_handlers() {
		global $pagenow;
		if ( 'post-new.php' !== $pagenow ) {
			return;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( ! isset( $_GET[ self::QUERY_VAR ] ) ) {
			return;
		}
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( '1' !== sanitize_text_field( wp_unslash( $_GET[ self::QUERY_VAR ] ) ) ) {
			return;
		}

		// Direct URLs can hit this even when the dashboard CTA isn't visible.
		// If no category is configured, the prefill is meaningless and the
		// block prefill below would land on an unconfigured site; bail.
		if ( (int) get_option( 'podcasting_category_id', 0 ) <= 0 ) {
			return;
		}

		add_action( 'wp_insert_post', array( __CLASS__, 'assign_category' ), 10, 3 );

		// `Podcast_Gate` is a future package; fail closed (no block prefill)
		// until it exists so an unqualified call doesn't fatal.
		if ( self::has_product_access() ) {
			add_filter( 'default_content', array( __CLASS__, 'prefill_block_content' ), 10, 2 );
		}
	}

	/**
	 * Assign the configured podcast category to the new auto-draft.
	 *
	 * Fires on `wp_insert_post` once for the auto-draft `post-new.php` creates;
	 * we filter to that single insert (new, not update; post post-type;
	 * auto-draft status) so user-driven saves later in the editor session
	 * aren't re-overridden. After the first match we self-unhook so any
	 * sibling auto-draft created later in the same request is left alone.
	 *
	 * @param int      $post_id Post ID.
	 * @param \WP_Post $post    Post object.
	 * @param bool     $update  True for updates, false for inserts.
	 */
	public static function assign_category( $post_id, $post, $update ) {
		if ( $update ) {
			return;
		}
		if ( ! ( $post instanceof \WP_Post ) ) {
			return;
		}
		if ( ! self::is_supported_post( $post ) || 'auto-draft' !== $post->post_status ) {
			return;
		}
		if ( ! current_user_can( 'edit_post', $post_id ) ) {
			return;
		}

		$category_id = (int) get_option( 'podcasting_category_id', 0 );
		if ( $category_id <= 0 ) {
			return;
		}

		wp_set_post_categories( $post_id, array( $category_id ) );

		self::$handled_post_id = (int) $post_id;
		remove_action( 'wp_insert_post', array( __CLASS__, 'assign_category' ), 10 );
	}

	/**
	 * Inject a Podcast Episode block as the new post's initial content.
	 *
	 * The `default_content` filter runs once when the editor loads the
	 * auto-draft. If a previous filter (or another plugin) has already filled
	 * `$content`, leave it alone. Scoped to the post we already category-tagged
	 * so a sibling auto-draft in the same request doesn't inherit the block,
	 * then self-unhooks.
	 *
	 * @param string   $content Default post content.
	 * @param \WP_Post $post    Post object.
	 * @return string
	 */
	public static function prefill_block_content( $content, $post ) {
		if ( ! self::is_supported_post( $post ) ) {
			return $content;
		}
		if ( self::$handled_post_id > 0 && (int) $post->ID !== self::$handled_post_id ) {
			return $content;
		}
		if ( '' !== trim( (string) $content ) ) {
			return $content;
		}

		remove_filter( 'default_content', array( __CLASS__, 'prefill_block_content' ), 10 );

		return "<!-- wp:jetpack/podcast-episode /-->\n";
	}

	/**
	 * Whether the post is a core post object we support for new-episode prefill.
	 *
	 * @param mixed $post Candidate post object.
	 * @return bool
	 */
	private static function is_supported_post( $post ) {
		return $post instanceof \WP_Post && self::POST_TYPE === $post->post_type;
	}

	/**
	 * Whether Podcast_Gate is available and grants podcast product access.
	 *
	 * @return bool
	 */
	private static function has_product_access() {
		$callback = array( __NAMESPACE__ . '\\Podcast_Gate', 'has_product_access' );
		// @phan-suppress-next-line PhanUndeclaredClassInCallable -- Podcast_Gate is a future class; guarded by is_callable().
		return is_callable( $callback ) && call_user_func( $callback );
	}
}
