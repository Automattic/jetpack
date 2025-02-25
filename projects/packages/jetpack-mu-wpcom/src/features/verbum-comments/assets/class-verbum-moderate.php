<?php
/**
 * Moderation feature for Verbum comments.
 *
 * @package automattic/jetpack-mu-wpcom
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack;

require_once __DIR__ . '/class-verbum-asset-loader.php';

/**
 * Verbum_Moderate is responsible for moderating Verbum comments in wp-admin.
 */
class Verbum_Moderate {

	/**
	 * Class constructor.
	 */
	public function __construct() {
		add_action( 'admin_enqueue_scripts', array( $this, 'enqueue_scripts' ) );
	}

	/**
	 * Enqueue scripts for loading Verbum
	 *
	 * @param string $hook The current admin page.
	 */
	public function enqueue_scripts( $hook ) {
		// Only load on comment.php admin page
		if ( 'comment.php' !== $hook ) {
			return;
		}

		// Check if we have a comment ID and if its content has Gutenberg blocks
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$comment_id = isset( $_GET['c'] ) ? absint( $_GET['c'] ) : 0;
		if ( ! $comment_id ) {
			return;
		}

		$comment = get_comment( $comment_id );
		if ( ! $comment || ! has_blocks( $comment->comment_content ) ) {
			return;
		}

		\Verbum_Asset_Loader::load_editor();

		Assets::register_script(
			'verbum-comments-moderation',
			'../../../build/verbum-comments/assets/comments-moderation.js',
			__FILE__,
			array(
				'strategy'  => 'defer',
				'in_footer' => true,
				'enqueue'   => true,
			)
		);

		wp_add_inline_script(
			'verbum',
			'window.VerbumComments = ' . wp_json_encode(
				array(
					'embedNonce' => wp_create_nonce( 'embed_nonce' ),
					'isRTL'      => is_rtl(),
				)
			),
			'before'
		);
	}
}
