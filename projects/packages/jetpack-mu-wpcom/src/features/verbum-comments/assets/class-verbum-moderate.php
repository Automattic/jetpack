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
		add_filter( 'wp_editor_settings', array( $this, 'disable_rich_editing' ) );
	}

	/**
	 * Disable rich editing for comments with Gutenberg blocks.
	 *
	 * @param array $settings The editor settings.
	 * @return array The modified editor settings.
	 */
	public function disable_rich_editing( $settings ) {
		$comment = $this->get_block_comment_being_edited();
		if ( $comment ) {
			$settings['tinymce']   = false;
			$settings['quicktags'] = false;
		}

		return $settings;
	}

	/**
	 * Enqueue scripts for loading Verbum
	 *
	 * @param string $hook The current admin page.
	 */
	public function enqueue_scripts( $hook ) {
		$comment = $this->get_block_comment_being_edited( $hook );
		if ( ! $comment ) {
			return;
		}

		\Verbum_Asset_Loader::load_editor();

		wp_add_inline_style(
			'verbum-gutenberg-css',
			'
			#content {
				visibility: hidden;
			}
		'
		);

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

	/**
	 * Get the block-based comment being edited if on the comment edit screen.
	 *
	 * @param string|null $hook The current admin page hook.
	 * @return \WP_Comment|false The comment object if we're editing a block-based comment, false otherwise.
	 */
	private function get_block_comment_being_edited( $hook = null ) {
		// Check if we're on the comment.php admin page
		if ( $hook === null ) {
			$screen          = get_current_screen();
			$editing_comment = $screen && 'comment' === $screen->id;
		} else {
			$editing_comment = 'comment.php' === $hook;
		}
		if ( ! $editing_comment ) {
			return false;
		}

		// Check if we have a comment ID
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		$comment_id = isset( $_GET['c'] ) ? absint( $_GET['c'] ) : 0;
		if ( ! $comment_id ) {
			return false;
		}

		$comment = get_comment( $comment_id );
		if ( ! $comment || ! has_blocks( $comment->comment_content ) ) {
			return false;
		}

		return $comment;
	}
}
