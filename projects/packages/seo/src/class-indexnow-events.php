<?php
/**
 * Notification candidates derived from actual public content transitions.
 *
 * @package automattic/jetpack-seo
 */

namespace Automattic\Jetpack\SEO;

/**
 * Privacy changes suppress discovery; permanent deletion retains the former URL.
 */
class Indexnow_Events {
	const PUBLIC_URL_META = '_jetpack_seo_indexnow_public_url';

	/**
	 * URLs captured before a permalink-changing update.
	 *
	 * @var array<int,string>
	 */
	private static $previous_urls = array();

	/**
	 * Posts whose metadata is being removed by core.
	 *
	 * @var array<int,bool>
	 */
	private static $deleting = array();

	/** Register write hooks independently of dashboard rendering. */
	public static function init() {
		add_action( 'pre_post_update', array( __CLASS__, 'capture_previous_url' ), 10, 2 );
		add_action( 'wp_after_insert_post', array( __CLASS__, 'saved' ), 10, 4 );
		add_action( 'wp_trash_post', array( __CLASS__, 'trashing' ) );
		add_action( 'before_delete_post', array( __CLASS__, 'deleted' ), 10, 2 );
		add_action( 'deleted_post', array( __CLASS__, 'forget_deleted' ) );
		add_filter( 'add_post_metadata', array( __CLASS__, 'remember_before_meta_change' ), 10, 3 );
		add_filter( 'update_post_metadata', array( __CLASS__, 'remember_before_meta_change' ), 10, 3 );
		add_action( 'updated_post_meta', array( __CLASS__, 'meta_changed' ), 10, 3 );
		add_action( 'added_post_meta', array( __CLASS__, 'meta_changed' ), 10, 3 );
		add_action( 'deleted_post_meta', array( __CLASS__, 'meta_changed' ), 10, 3 );
	}

	/**
	 * Capture the public permalink before the database row changes.
	 *
	 * @param int   $id Post ID.
	 * @param array $data Updated post fields.
	 */
	public static function capture_previous_url( $id, $data ) {
		if ( ! get_option( Indexnow_Client::ENABLED_OPTION, false ) ) {
			return;
		}
		$post = get_post( $id );
		if ( ! isset( self::$previous_urls[ $id ] ) && self::eligible( $post ) ) {
			$known = get_post_meta( $id, self::PUBLIC_URL_META, true );
			// Core may already have appended __trashed before this hook; use the saved public URL or post-before snapshot.
			if ( $known || 'trash' !== ( $data['post_status'] ?? '' ) ) {
				self::$previous_urls[ $id ] = $known ? $known : get_permalink( $post );
			}
		}
	}

	/**
	 * Reuse SEO's content and access restrictions before exposing a URL.
	 *
	 * @param \WP_Post|null $post Current content.
	 * @param string        $url Expected canonical URL, when required.
	 * @return bool
	 */
	public static function eligible( $post, $url = '' ) {
		return $post instanceof \WP_Post && Indexnow_Client::enabled()
			&& in_array( $post->post_type, Post_Types::get_supported_content_types(), true )
			&& is_post_publicly_viewable( $post ) && ! Content_Gate::is_gated( $post )
			&& ! get_post_meta( $post->ID, Content_Coverage::META_NOINDEX, true )
			&& ( '' === $url || get_permalink( $post ) === $url );
	}

	/**
	 * Capture eligible saves and the previous URL on a permalink change.
	 *
	 * @param int           $id Post ID.
	 * @param \WP_Post      $post Saved post.
	 * @param bool          $updated Whether this was an update.
	 * @param \WP_Post|null $before Previous post.
	 */
	public static function saved( $id, $post, $updated, $before ) {
		if ( ! get_option( Indexnow_Client::ENABLED_OPTION, false ) ) {
			unset( self::$previous_urls[ $id ] );
			return;
		}
		$old = self::$previous_urls[ $id ] ?? '';
		unset( self::$previous_urls[ $id ] );
		if ( ! $old && $before instanceof \WP_Post && self::eligible( $before ) ) {
			$old = get_permalink( $before );
		}
		if ( wp_is_post_revision( $id ) || wp_is_post_autosave( $id ) ) {
			return;
		}
		if ( ! self::eligible( $post ) ) {
			if ( ! self::removal_allowed( $post ) ) {
				self::notify_restriction( $id );
			}
			if ( $old && self::removal_allowed( $post ) ) {
				self::notify( $old, $id, true );
			}
			delete_post_meta( $id, self::PUBLIC_URL_META );
			return;
		}
		$current = get_permalink( $post );
		if ( $old && $old !== $current ) {
			self::notify( $old, $id, true );
		}
		if ( $updated && $before instanceof \WP_Post && $old === $current ) {
			$changed = false;
			foreach ( array( 'post_title', 'post_content', 'post_excerpt', 'post_status', 'post_name', 'post_parent', 'post_author', 'post_date' ) as $field ) {
				$changed = $changed || $before->$field !== $post->$field;
			}
			if ( ! $changed ) {
				return;
			}
		}
		update_post_meta( $id, self::PUBLIC_URL_META, $current );
		self::notify( $current, $id );
	}

	/**
	 * Recheck a previously public URL without revealing private or protected content.
	 *
	 * @param \WP_Post|null $post Current content, or null after permanent deletion.
	 * @return bool
	 */
	public static function removal_allowed( $post ) {
		return ! $post || ( $post instanceof \WP_Post
			&& in_array( $post->post_status, array( 'publish', 'trash', 'draft', 'pending', 'future' ), true )
			&& ! Content_Gate::is_gated( $post )
			&& in_array( $post->post_type, Post_Types::get_supported_content_types(), true ) );
	}

	/**
	 * Capture the public URL before WordPress changes its status to trash.
	 *
	 * @param int $id Post ID.
	 */
	public static function trashing( $id ) {
		if ( ! get_option( Indexnow_Client::ENABLED_OPTION, false ) ) {
			return;
		}
		$post = get_post( $id );
		if ( self::eligible( $post ) ) {
			self::$previous_urls[ $id ] = get_permalink( $post );
			self::notify( self::$previous_urls[ $id ], $id, true );
		}
	}

	/**
	 * Retain a public URL before permanent removal destroys the post record.
	 *
	 * @param int      $id Post ID.
	 * @param \WP_Post $post Previous post.
	 */
	public static function deleted( $id, $post ) {
		if ( ! get_option( Indexnow_Client::ENABLED_OPTION, false ) ) {
			return;
		}
		self::$deleting[ $id ] = true;
		if ( ! self::removal_allowed( $post ) ) {
			self::notify_restriction( $id );
			return;
		}
		if ( self::eligible( $post ) || ( $post instanceof \WP_Post && 'trash' === $post->post_status ) ) {
			$url = self::eligible( $post ) ? get_permalink( $post ) : get_post_meta( $id, self::PUBLIC_URL_META, true );
			if ( $url ) {
				self::notify( $url, $id, true );
			}
		}
	}

	/**
	 * Release request-local deletion state once core has finished.
	 *
	 * @param int $id Deleted post ID.
	 */
	public static function forget_deleted( $id ) {
		unset( self::$deleting[ $id ], self::$previous_urls[ $id ] );
	}

	/**
	 * Snapshot public visibility before a first noindex write changes it.
	 *
	 * @param mixed  $check Metadata short-circuit result.
	 * @param int    $post_id Source post ID.
	 * @param string $key Meta key.
	 * @return mixed
	 */
	public static function remember_before_meta_change( $check, $post_id, $key ) {
		if ( ! get_option( Indexnow_Client::ENABLED_OPTION, false ) ) {
			return $check;
		}
		if ( Content_Coverage::META_NOINDEX === $key && ! isset( self::$deleting[ $post_id ] ) ) {
			$post = get_post( $post_id );
			if ( self::eligible( $post ) ) {
				update_post_meta( $post_id, self::PUBLIC_URL_META, get_permalink( $post ) );
			}
		}
		return $check;
	}

	/**
	 * Reconsider public visibility after relevant metadata changes.
	 *
	 * @param mixed  $meta_id Meta row ID.
	 * @param int    $post_id Post ID.
	 * @param string $key Meta key.
	 */
	public static function meta_changed( $meta_id, $post_id, $key ) {
		if ( ! get_option( Indexnow_Client::ENABLED_OPTION, false ) ) {
			return;
		}
		if ( isset( self::$deleting[ $post_id ] ) ) {
			return;
		}
		if ( ! in_array(
			$key,
			array(
				Content_Coverage::META_NOINDEX,
				Content_Coverage::META_TITLE,
				Content_Coverage::META_DESCRIPTION,
				Content_Coverage::META_SCHEMA_TYPE,
				'_thumbnail_id',
				Content_Gate::META_NEWSLETTER_ACCESS,
				Content_Gate::META_CONTAINS_PAID_CONTENT,
				Content_Gate::META_CONTAINS_PAYWALLED_CONTENT,
			),
			true
		) ) {
			return;
		}
		$post = get_post( $post_id );
		if ( ! self::removal_allowed( $post ) ) {
			self::notify_restriction( $post_id );
			delete_post_meta( $post_id, self::PUBLIC_URL_META );
			return;
		}
		if ( self::eligible( $post ) ) {
			update_post_meta( $post_id, self::PUBLIC_URL_META, get_permalink( $post ) );
			self::notify( get_permalink( $post ), $post_id );
		} elseif ( Content_Coverage::META_NOINDEX === $key ) {
			$url = get_post_meta( $post_id, self::PUBLIC_URL_META, true );
			if ( $url ) {
				self::notify( $url, $post_id, true );
			}
		}
	}

	/**
	 * Stop older notifications before deletion can erase a restriction.
	 *
	 * @param int $post_id Restricted content ID.
	 */
	private static function notify_restriction( $post_id ) {
		/**
		 * Fires when queued URLs must be forgotten for restricted content.
		 *
		 * @since $$next-version$$
		 * @param int $post_id Restricted content ID.
		 */
		do_action( 'jetpack_seo_indexnow_post_restricted', $post_id );
	}

	/**
	 * Publish an eligible change without requiring a delivery implementation.
	 *
	 * @param string $url Known public URL.
	 * @param int    $post_id Source post ID.
	 * @param bool   $removed Whether this refers to the previous public representation.
	 */
	private static function notify( $url, $post_id, $removed = false ) {
		/**
		 * Fires when a public URL has a change eligible for IndexNow.
		 *
		 * @since $$next-version$$
		 * @param string $url Known public URL.
		 * @param int    $post_id Source post ID.
		 * @param bool   $removed Whether the previous public representation was removed.
		 */
		do_action( 'jetpack_seo_indexnow_url_changed', $url, $post_id, $removed );
	}
}
