<?php
/**
 * Tracks instrumentation for Jetpack Podcast.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use Throwable;
use WP_Post;
use WP_Query;
use WP_User;

/**
 * Records podcast lifecycle events. Event names stay `wpcom_*` so analytics
 * queries cover Simple, Atomic, and self-hosted Jetpack feeds without a rewrite.
 * Dispatch tries `tracks_record_event` (Simple) and falls back to
 * `\Automattic\Jetpack\Tracking::tracks_record_event` (Atomic). Neither is a
 * hard dep — silently no-ops when neither is reachable.
 */
class Tracks {

	/**
	 * Wire the recorder hooks.
	 */
	public static function init(): void {
		// `wp_after_insert_post` runs after terms + meta are saved — required
		// because Gutenberg/REST publishes set terms after `transition_post_status`.
		add_action( 'wp_after_insert_post', array( __CLASS__, 'record_episode_published' ), 10, 4 );

		add_action( 'add_attachment', array( __CLASS__, 'record_media_uploaded' ) );

		add_action( 'add_option_podcasting_category_id', array( __CLASS__, 'record_category_added' ), 10, 2 );
		add_action( 'update_option_podcasting_category_id', array( __CLASS__, 'record_category_updated' ), 10, 3 );

		add_action( 'add_option_podcasting_show_urls', array( __CLASS__, 'record_show_url_added' ), 10, 2 );
		add_action( 'update_option_podcasting_show_urls', array( __CLASS__, 'record_show_url_updated' ), 10, 3 );

		add_action( 'jetpack_podcast_settings_saved', array( __CLASS__, 'record_settings_saved' ) );
	}

	/**
	 * Emit `wpcom_podcast_episode_published` (and `wpcom_podcast_show_launched`
	 * once per site) when a podcast-category post enters `publish`.
	 *
	 * @param int          $post_id     Post ID.
	 * @param WP_Post|null $post        Post object.
	 * @param bool         $update      Whether this is an update.
	 * @param WP_Post|null $post_before Previous post state.
	 */
	public static function record_episode_published( $post_id, $post, $update, $post_before ): void {
		unset( $post_id, $update );

		try {
			if ( ! $post instanceof WP_Post ) {
				return;
			}

			if ( 'publish' !== $post->post_status ) {
				return;
			}

			if ( $post_before instanceof WP_Post && 'publish' === $post_before->post_status ) {
				return;
			}

			if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
				return;
			}

			// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom Simple-only; guarded above.
			if ( function_exists( 'is_headstart_post' ) && is_headstart_post( $post ) ) {
				return;
			}

			if ( in_array( $post->post_type, array( 'attachment', 'revision', 'nav_menu_item' ), true ) ) {
				return;
			}

			$category_id = Customize_Feed::resolve_category_id();
			if ( 0 === $category_id ) {
				return;
			}

			if ( ! in_category( $category_id, $post ) ) {
				return;
			}

			// Match the RSS feed's definition of an episode — must carry
			// audio, not just sit in the podcast category.
			if ( ! self::has_podcast_media( $post ) ) {
				return;
			}

			$is_first = self::is_first_episode_for_site( $category_id, (int) $post->ID );

			self::record_event(
				'wpcom_podcast_episode_published',
				array(
					'post_id'                   => (int) $post->ID,
					'is_first_episode_for_site' => $is_first,
				),
				self::identity_for_post( $post )
			);

			// Atomic INSERT — only one concurrent caller per site wins, so
			// `show_launched` fires exactly once per site.
			if ( $is_first && add_option( 'podcast_show_launched_tracked', time(), '', false ) ) {
				self::record_event(
					'wpcom_podcast_show_launched',
					array( 'post_id' => (int) $post->ID ),
					self::identity_for_post( $post )
				);
			}
		} catch ( Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Tracks is best-effort — never break a publish.
		}
	}

	/**
	 * Emit `wpcom_podcast_media_uploaded` for audio/video attachments on a
	 * podcasting-enabled site.
	 *
	 * @param int $attachment_id Attachment post ID.
	 */
	public static function record_media_uploaded( $attachment_id ): void {
		try {
			if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
				return;
			}

			$attachment = get_post( (int) $attachment_id );
			// @phan-suppress-next-line PhanUndeclaredFunction -- wpcom Simple-only; guarded above.
			if ( $attachment && function_exists( 'is_headstart_post' ) && is_headstart_post( $attachment ) ) {
				return;
			}

			if ( 0 === Customize_Feed::resolve_category_id() ) {
				return;
			}

			$mime_type = (string) get_post_mime_type( (int) $attachment_id );
			if ( '' === $mime_type ) {
				return;
			}
			if ( 0 !== strpos( $mime_type, 'audio/' ) && 0 !== strpos( $mime_type, 'video/' ) ) {
				return;
			}

			self::record_event(
				'wpcom_podcast_media_uploaded',
				array(
					'attachment_id' => (int) $attachment_id,
					'mime_type'     => $mime_type,
				)
			);
		} catch ( Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Tracks is best-effort.
		}
	}

	/**
	 * `add_option_podcasting_category_id` callback — first-ever write of the
	 * option (previous value treated as 0).
	 *
	 * @param string $option Option name.
	 * @param mixed  $value  Newly stored value.
	 */
	public static function record_category_added( $option, $value ): void {
		unset( $option );

		try {
			self::maybe_record_status_change( 0, (int) $value );
		} catch ( Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Tracks is best-effort.
		}
	}

	/**
	 * `update_option_podcasting_category_id` callback — every change to an
	 * existing row.
	 *
	 * @param mixed  $old_value Previous stored value.
	 * @param mixed  $value     Newly stored value.
	 * @param string $option    Option name.
	 */
	public static function record_category_updated( $old_value, $value, $option ): void {
		unset( $option );

		try {
			self::maybe_record_status_change( (int) $old_value, (int) $value );
		} catch ( Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Tracks is best-effort.
		}
	}

	/**
	 * `add_option_podcasting_show_urls` callback. No prior row exists, so
	 * every entry is a first-time entry.
	 *
	 * @param string $option    Option name.
	 * @param mixed  $new_value Newly stored value.
	 */
	public static function record_show_url_added( $option, $new_value ): void {
		unset( $option );
		self::maybe_record_show_url_addition( array(), $new_value );
	}

	/**
	 * `update_option_podcasting_show_urls` callback. Compare the new value
	 * against the prior array to find the first directory that transitioned
	 * from absent/empty to a non-empty URL.
	 *
	 * @param mixed  $old_value Previous stored value (expected: array).
	 * @param mixed  $new_value Newly stored value.
	 * @param string $option    Option name.
	 */
	public static function record_show_url_updated( $old_value, $new_value, $option ): void {
		unset( $option );
		self::maybe_record_show_url_addition( is_array( $old_value ) ? $old_value : array(), $new_value );
	}

	/**
	 * Emit `wpcom_podcasting_show_url_saved` for the first podcatcher key
	 * that transitions from absent/empty to a non-empty string.
	 *
	 * @param array $old_value Previous map of directory => url.
	 * @param mixed $new_value Newly stored value.
	 */
	private static function maybe_record_show_url_addition( array $old_value, $new_value ): void {
		try {
			if ( ! is_array( $new_value ) ) {
				return;
			}

			foreach ( $new_value as $app => $url ) {
				if ( ! is_string( $url ) || '' === $url ) {
					continue;
				}

				$previous = isset( $old_value[ $app ] ) && is_string( $old_value[ $app ] ) ? $old_value[ $app ] : '';
				if ( '' !== $previous ) {
					continue;
				}

				self::record_event(
					'wpcom_podcasting_show_url_saved',
					array( 'app' => (string) $app )
				);
				return;
			}
		} catch ( Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Tracks is best-effort.
		}
	}

	/**
	 * Emit `wpcom_podcasting_settings_saved` after a podcast settings write.
	 *
	 * Fired off the `jetpack_podcast_settings_saved` action that
	 * {@see Podcast_Settings_Endpoint::update_item()} triggers, so it's agnostic
	 * to the REST transport — the endpoint already gates on a saved option.
	 */
	public static function record_settings_saved(): void {
		try {
			// Skip user-supplied free-text fields — keep PII out of tracks.
			$pii   = array( 'podcasting_email', 'podcasting_talent_name' );
			$state = array();
			foreach ( Settings::OPTION_NAMES as $name ) {
				if ( in_array( $name, $pii, true ) ) {
					continue;
				}
				$state[ $name ] = get_option( $name, '' );
			}
			self::record_event( 'wpcom_podcasting_settings_saved', $state );
		} catch ( Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Tracks is best-effort.
		}
	}

	/**
	 * Emit `wpcom_podcasting_status_changed` (enabled / disabled / changed)
	 * when the `podcasting_category_id` option transitions.
	 *
	 * @param int $old_value Previous category ID (0 == disabled).
	 * @param int $new_value New category ID (0 == disabled).
	 */
	private static function maybe_record_status_change( int $old_value, int $new_value ): void {
		if ( $old_value === $new_value ) {
			return;
		}

		if ( 0 === $old_value && 0 !== $new_value ) {
			$status = 'enabled';
		} elseif ( 0 !== $old_value && 0 === $new_value ) {
			$status = 'disabled';
		} else {
			$status = 'changed';
		}

		// `WPCOM_Store_API` on Simple, `Current_Plan` on Atomic — same dual
		// pattern as `Masterbar\Dashboard_Switcher_Tracking::get_plan()`.
		$plan = class_exists( '\WPCOM_Store_API' )
			? \WPCOM_Store_API::get_current_plan( (int) get_current_blog_id() )
			: ( class_exists( '\Automattic\Jetpack\Current_Plan' ) ? \Automattic\Jetpack\Current_Plan::get() : array() );

		self::record_event(
			'wpcom_podcasting_status_changed',
			array(
				'status'               => $status,
				'surface'              => 'option_write',
				'previous_category_id' => $old_value,
				'new_category_id'      => $new_value,
				'user_id'              => (int) get_current_user_id(),
				'product_slug'         => (string) ( $plan['product_slug'] ?? '' ),
			)
		);

		/** This action is documented in projects/packages/forms/src/contact-form/class-util.php */
		do_action( 'jetpack_bump_stats_extras', 'wpcom-podcasting-status', $status );
	}

	/**
	 * Identity for the publish event. Scheduled/cron publishes have no
	 * logged-in user — fall back to the post author.
	 *
	 * @param WP_Post $post Post being published.
	 */
	private static function identity_for_post( WP_Post $post ): WP_User {
		if ( ! empty( $post->post_author ) ) {
			$user = get_userdata( (int) $post->post_author );
			if ( $user instanceof WP_User ) {
				return $user;
			}
		}
		return wp_get_current_user();
	}

	/**
	 * Filters out posts in the podcast category that aren't actually episodes.
	 * `core/audio` block + classic-editor attached audio cover the supported
	 * authoring paths.
	 *
	 * @param WP_Post $post Post being checked.
	 */
	private static function has_podcast_media( WP_Post $post ): bool {
		return has_block( 'core/audio', $post )
			|| ! empty( get_attached_media( 'audio', $post->ID ) );
	}

	/**
	 * True when no other published post exists in the podcast category.
	 *
	 * @param int $category_id     Configured podcast category ID.
	 * @param int $current_post_id Post being published (excluded from the check).
	 */
	private static function is_first_episode_for_site( int $category_id, int $current_post_id ): bool {
		$existing = new WP_Query(
			array(
				'post_status'      => 'publish',
				'post_type'        => 'post',
				'cat'              => $category_id,
				'post__not_in'     => array( $current_post_id ),
				'posts_per_page'   => 1,
				'fields'           => 'ids',
				'no_found_rows'    => true,
				'suppress_filters' => true,
			)
		);

		return empty( $existing->posts );
	}

	/**
	 * Dispatch a tracks event. Auto-injects `blog_id` and defaults `$user`
	 * to the current user.
	 *
	 * @param string       $event_name Tracks event name.
	 * @param array        $properties Event properties.
	 * @param WP_User|null $user       Identity override; defaults to current user.
	 * @return mixed
	 */
	private static function record_event( string $event_name, array $properties, ?WP_User $user = null ) {
		try {
			$user                  = $user ?? wp_get_current_user();
			$properties['blog_id'] = (int) Connection_Manager::get_site_id( true );

			if ( ! function_exists( 'tracks_record_event' ) && function_exists( 'require_lib' ) ) {
				require_lib( 'tracks/client' );
			}

			if ( function_exists( 'tracks_record_event' ) ) {
				return tracks_record_event( $user, $event_name, $properties );
			}

			if ( class_exists( '\Automattic\Jetpack\Tracking' ) ) {
				return ( new \Automattic\Jetpack\Tracking() )->tracks_record_event( $user, $event_name, $properties );
			}
		} catch ( Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Tracks is best-effort.
		}

		return null;
	}
}
