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
 */
class New_Episode_Prefill {

	const QUERY_VAR = 'podcast_episode';

	/**
	 * ID of the auto-draft we've already handled this request.
	 *
	 * @var int
	 */
	private static $handled_post_id = 0;

	/**
	 * Register hooks.
	 */
	public static function init() {
		add_action( 'admin_init', array( __CLASS__, 'maybe_register_handlers' ) );
	}

	/**
	 * Bind on `admin_init` so `$pagenow` is settled.
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

		if ( (int) get_option( 'podcasting_category_id', 0 ) <= 0 ) {
			return;
		}

		add_action( 'wp_insert_post', array( __CLASS__, 'assign_category' ), 10, 3 );

		if ( Podcast_Gate::has_product_access() ) {
			add_filter( 'default_content', array( __CLASS__, 'prefill_block_content' ), 10, 2 );
		}
	}

	/**
	 * Assign the configured podcast category to the new auto-draft.
	 *
	 * Narrowed to the initial auto-draft so user-driven saves later in the
	 * session aren't re-overridden; self-unhooks so sibling auto-drafts in the
	 * same request are left alone.
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
	 * No-op if another plugin has already filled `$content`, so this composes
	 * politely.
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
	 * Whether the post is a core `post` we prefill for.
	 *
	 * @param mixed $post Candidate post object.
	 * @return bool
	 */
	private static function is_supported_post( $post ) {
		return $post instanceof \WP_Post && 'post' === $post->post_type;
	}
}
