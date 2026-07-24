<?php
/**
 * Server-side prefill for `post-new.php?podcast_episode=1`.
 *
 * @package automattic/jetpack-podcast
 */

namespace Automattic\Jetpack\Podcast;

/**
 * Prefills the new-post screen with the configured podcast category and a media
 * block: the Podcast Episode block on qualifying plans, a core Audio block otherwise.
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
		add_filter( 'default_content', array( __CLASS__, 'prefill_block_content' ), 10, 2 );
	}

	/**
	 * Assign the configured podcast category to the initial auto-draft only, so
	 * later user saves aren't overridden. Self-unhooks after handling one draft.
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
	 * Inject the new post's initial media block: the Podcast Episode block with
	 * product access, else a core Audio block. No-op if `$content` is already set.
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

		return Podcast_Gate::has_product_access()
			? "<!-- wp:jetpack/podcast-episode /-->\n"
			: "<!-- wp:audio /-->\n";
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
