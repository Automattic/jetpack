<?php
/**
 * Personal-data export and erasure for the checkpoint's comment meta.
 *
 * @package automattic/jetpack-comments
 */

namespace Automattic\Jetpack\Comments\Identity;

/**
 * Core's comment exporter and eraser are keyed on the author's email and cover
 * the comment row, not custom meta. These add the checkpoint's identity meta to both,
 * alongside core's, rather than replacing them.
 */
class Privacy {

	/**
	 * Personal-data group the identity meta is reported under.
	 */
	const GROUP_ID = 'jetpack-comment-identity';

	/**
	 * Comments handled per export or erasure page.
	 */
	const PER_PAGE = 100;

	/**
	 * Register the exporter and eraser.
	 *
	 * @return void
	 */
	public static function init() {
		add_filter( 'wp_privacy_personal_data_exporters', array( __CLASS__, 'register_exporter' ) );
		add_filter( 'wp_privacy_personal_data_erasers', array( __CLASS__, 'register_eraser' ) );
	}

	/**
	 * Add the identity exporter.
	 *
	 * @param array $exporters Registered exporters.
	 * @return array
	 */
	public static function register_exporter( $exporters ) {
		$exporters[ self::GROUP_ID ] = array(
			'exporter_friendly_name' => __( 'Comment sign-in identity', 'jetpack-comments' ),
			'callback'               => array( __CLASS__, 'export' ),
		);

		return $exporters;
	}

	/**
	 * Add the identity eraser.
	 *
	 * @param array $erasers Registered erasers.
	 * @return array
	 */
	public static function register_eraser( $erasers ) {
		$erasers[ self::GROUP_ID ] = array(
			'eraser_friendly_name' => __( 'Comment sign-in identity', 'jetpack-comments' ),
			'callback'             => array( __CLASS__, 'erase' ),
		);

		return $erasers;
	}

	/**
	 * Export the identity meta on a commenter's comments.
	 *
	 * @param string $email_address The commenter's email.
	 * @param int    $page          One-based page number.
	 * @return array
	 */
	public static function export( $email_address, $page = 1 ) {
		$comments = self::comments_for( $email_address, (int) $page );
		$data     = array();

		foreach ( $comments as $comment ) {
			$fields = self::fields_for( (int) $comment->comment_ID );
			if ( ! empty( $fields ) ) {
				$data[] = array(
					'group_id'    => self::GROUP_ID,
					'group_label' => __( 'Comment sign-in identity', 'jetpack-comments' ),
					'item_id'     => 'comment-' . (int) $comment->comment_ID,
					'data'        => $fields,
				);
			}
		}

		return array(
			'data' => $data,
			'done' => count( $comments ) < self::PER_PAGE,
		);
	}

	/**
	 * Erase the identity meta on a commenter's comments.
	 *
	 * @param string $email_address The commenter's email.
	 * @param int    $page          One-based page number.
	 * @return array
	 */
	public static function erase( $email_address, $page = 1 ) {
		$comments      = self::comments_for( $email_address, (int) $page );
		$items_removed = false;

		$keys = array( Checkpoint::META_SUB, Checkpoint::META_PROVIDER, Checkpoint::META_AVATAR );

		foreach ( $comments as $comment ) {
			foreach ( $keys as $key ) {
				if ( metadata_exists( 'comment', (int) $comment->comment_ID, $key ) ) {
					delete_comment_meta( (int) $comment->comment_ID, $key );
					$items_removed = true;
				}
			}
		}

		return array(
			'items_removed'  => $items_removed,
			'items_retained' => false,
			'messages'       => array(),
			'done'           => count( $comments ) < self::PER_PAGE,
		);
	}

	/**
	 * A page of a commenter's comments.
	 *
	 * @param string $email_address The commenter's email.
	 * @param int    $page          One-based page number.
	 * @return \WP_Comment[]
	 */
	private static function comments_for( $email_address, $page ) {
		if ( '' === (string) $email_address ) {
			return array();
		}

		return get_comments(
			array(
				'author_email' => $email_address,
				'number'       => self::PER_PAGE,
				'paged'        => max( 1, $page ),
				'order_by'     => 'comment_ID',
				'order'        => 'ASC',
			)
		);
	}

	/**
	 * The identity fields stored on a comment, new keys first, old as fallback.
	 *
	 * @param int $comment_id The comment.
	 * @return array List of name/value pairs.
	 */
	private static function fields_for( $comment_id ) {
		$fields = array();

		$sub = get_comment_meta( $comment_id, Checkpoint::META_SUB, true );
		if ( is_string( $sub ) && '' !== $sub ) {
			$fields[] = array(
				'name'  => __( 'Identifier', 'jetpack-comments' ),
				'value' => $sub,
			);
		}

		$provider = get_comment_meta( $comment_id, Checkpoint::META_PROVIDER, true );
		if ( ! is_string( $provider ) || '' === $provider ) {
			$provider = get_comment_meta( $comment_id, Checkpoint::OLD_META_PROVIDER, true );
		}
		if ( is_string( $provider ) && '' !== $provider ) {
			$fields[] = array(
				'name'  => __( 'Signed in with', 'jetpack-comments' ),
				'value' => $provider,
			);
		}

		$avatar = get_comment_meta( $comment_id, Checkpoint::META_AVATAR, true );
		if ( ! is_string( $avatar ) || '' === $avatar ) {
			$avatar = get_comment_meta( $comment_id, Checkpoint::OLD_META_AVATAR, true );
		}
		if ( is_string( $avatar ) && '' !== $avatar ) {
			$fields[] = array(
				'name'  => __( 'Avatar', 'jetpack-comments' ),
				'value' => $avatar,
			);
		}

		return $fields;
	}
}
