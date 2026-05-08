<?php
/**
 * Tracks instrumentation for Jetpack Podcast.
 *
 * @package automattic/jetpack-podcast
 */

declare( strict_types = 1 );

namespace Automattic\Jetpack\Podcast;

use Automattic\Jetpack\Podcast\Feed\Customize_Feed;
use Throwable;
use WP_Post;
use WP_Query;
use WP_REST_Request;
use WP_REST_Response;
use WP_User;

/**
 * Records podcast lifecycle events. Event names stay `wpcom_*` so analytics
 * queries cover Simple, Atomic, and self-hosted Jetpack feeds without a rewrite.
 * Dispatch tries `tracks_record_event` (Simple) and falls back to
 * `\Automattic\Jetpack\Tracking::tracks_record_event` (Atomic). Neither is a
 * hard dep — silently no-ops when neither is reachable.
 */
class Tracks {

	private static $registered = false;

	/**
	 * @var \Automattic\Jetpack\Tracking|null
	 */
	private static $jetpack_tracking = null;

	/**
	 * Per-request snapshot taken before a `/wp/v2/settings` write so the
	 * emitted event can include `previous_*` keys. Keyed by request hash.
	 *
	 * @var array<string, array<string, mixed>>
	 */
	private static $settings_snapshots = array();

	public static function init(): void {
		if ( self::$registered ) {
			return;
		}
		self::$registered = true;

		// `wp_after_insert_post` runs after terms + meta are saved — required
		// because Gutenberg/REST publishes set terms after `transition_post_status`.
		add_action( 'wp_after_insert_post', array( __CLASS__, 'record_episode_published' ), 10, 4 );

		add_action( 'add_attachment', array( __CLASS__, 'record_media_uploaded' ) );

		add_action( 'add_option_podcasting_category_id', array( __CLASS__, 'record_category_added' ), 10, 2 );
		add_action( 'update_option_podcasting_category_id', array( __CLASS__, 'record_category_updated' ), 10, 3 );

		add_action( 'add_option_podcasting_show_urls', array( __CLASS__, 'record_show_url_addition' ), 10, 2 );
		add_action( 'update_option_podcasting_show_urls', array( __CLASS__, 'record_show_url_addition' ), 10, 2 );

		add_filter( 'rest_request_before_callbacks', array( __CLASS__, 'snapshot_settings_before_write' ), 10, 3 );
		add_filter( 'rest_request_after_callbacks', array( __CLASS__, 'record_settings_saved' ), 10, 3 );
	}

	public static function reset_for_tests(): void {
		self::$registered         = false;
		self::$jetpack_tracking   = null;
		self::$settings_snapshots = array();
	}

	/**
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
			// site-hosted audio, not just sit in the podcast category.
			if ( ! self::has_podcast_media( $post ) ) {
				return;
			}

			$is_first = self::is_first_episode_for_site( $category_id, (int) $post->ID );
			$identity = self::identity_for_post( $post );

			self::record_event(
				$identity,
				'wpcom_podcast_episode_published',
				array(
					'blog_id'                   => (int) get_current_blog_id(),
					'post_id'                   => (int) $post->ID,
					'is_first_episode_for_site' => (bool) $is_first,
				)
			);

			// Atomic INSERT — only one concurrent caller per site wins, so
			// `show_launched` fires exactly once per site.
			if ( $is_first && add_option( 'podcast_show_launched_tracked', time(), '', false ) ) {
				self::record_event(
					$identity,
					'wpcom_podcast_show_launched',
					array(
						'blog_id' => (int) get_current_blog_id(),
						'post_id' => (int) $post->ID,
					)
				);
			}
		} catch ( Throwable $e ) {
			self::log_failure( 'episode-published-failed', $e );
		}
	}

	/**
	 * @param int $attachment_id Attachment post ID.
	 */
	public static function record_media_uploaded( $attachment_id ): void {
		try {
			if ( defined( 'WP_IMPORTING' ) && WP_IMPORTING ) {
				return;
			}

			$attachment = get_post( (int) $attachment_id );
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
				wp_get_current_user(),
				'wpcom_podcast_media_uploaded',
				array(
					'blog_id'       => (int) get_current_blog_id(),
					'attachment_id' => (int) $attachment_id,
					'mime_type'     => $mime_type,
				)
			);
		} catch ( Throwable $e ) {
			self::log_failure( 'media-uploaded-failed', $e );
		}
	}

	/**
	 * @param string $option Option name.
	 * @param mixed  $value  Newly stored value.
	 */
	public static function record_category_added( $option, $value ): void {
		unset( $option );

		try {
			self::maybe_record_status_change( 0, (int) $value );
		} catch ( Throwable $e ) {
			self::log_failure( 'category-added-failed', $e );
		}
	}

	/**
	 * @param mixed  $old_value Previous stored value.
	 * @param mixed  $value     Newly stored value.
	 * @param string $option    Option name.
	 */
	public static function record_category_updated( $old_value, $value, $option ): void {
		unset( $option );

		try {
			self::maybe_record_status_change( (int) $old_value, (int) $value );
		} catch ( Throwable $e ) {
			self::log_failure( 'category-updated-failed', $e );
		}
	}

	/**
	 * Bound to both `add_option_*` (signature: option, value) and
	 * `update_option_*` (signature: old_value, value, option). The first arg
	 * is either the option name or the previous array; `is_array()` picks
	 * them apart.
	 *
	 * @param mixed $first_arg Option name or previous value.
	 * @param mixed $new_value Newly stored value.
	 */
	public static function record_show_url_addition( $first_arg, $new_value ): void {
		try {
			$old_value = is_array( $first_arg ) ? $first_arg : array();

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
					wp_get_current_user(),
					'wpcom_podcasting_show_url_saved',
					array(
						'blog_id' => (int) get_current_blog_id(),
						'app'     => (string) $app,
					)
				);
				return;
			}
		} catch ( Throwable $e ) {
			self::log_failure( 'show-url-record-failed', $e );
		}
	}

	/**
	 * @param mixed                 $response Pass-through.
	 * @param array                 $handler  Route handler.
	 * @param WP_REST_Request|mixed $request  Request object.
	 * @return mixed
	 */
	public static function snapshot_settings_before_write( $response, $handler, $request ) {
		unset( $handler );

		try {
			if ( ! self::is_settings_write( $request ) ) {
				return $response;
			}

			$params = $request->get_params();
			if ( ! is_array( $params ) ) {
				return $response;
			}

			$touched = array_intersect_key( $params, array_flip( Settings::OPTION_NAMES ) );
			if ( empty( $touched ) ) {
				return $response;
			}

			self::$settings_snapshots[ spl_object_hash( $request ) ] = self::read_settings_state();
		} catch ( Throwable $e ) {
			self::log_failure( 'settings-snapshot-failed', $e );
		}

		return $response;
	}

	/**
	 * @param mixed                 $response Pass-through.
	 * @param array                 $handler  Route handler.
	 * @param WP_REST_Request|mixed $request  Request object.
	 * @return mixed
	 */
	public static function record_settings_saved( $response, $handler, $request ) {
		unset( $handler );

		try {
			if ( ! $request instanceof WP_REST_Request ) {
				return $response;
			}

			$key = spl_object_hash( $request );
			if ( ! isset( self::$settings_snapshots[ $key ] ) ) {
				return $response;
			}

			$previous = self::$settings_snapshots[ $key ];
			unset( self::$settings_snapshots[ $key ] );

			if ( $response instanceof WP_REST_Response && $response->is_error() ) {
				return $response;
			}

			$event_props = self::read_settings_state();
			foreach ( $previous as $field => $value ) {
				$event_props[ 'previous_' . $field ] = $value;
			}

			self::record_event(
				wp_get_current_user(),
				'wpcom_podcasting_settings_saved',
				$event_props
			);
		} catch ( Throwable $e ) {
			self::log_failure( 'settings-saved-failed', $e );
		}

		return $response;
	}

	/**
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

		// `WPCOM_Store_API` on Simple, `Current_Plan` on Atomic.
		$plan = class_exists( '\WPCOM_Store_API' )
			? \WPCOM_Store_API::get_current_plan( (int) get_current_blog_id() )
			: ( class_exists( '\Automattic\Jetpack\Current_Plan' ) ? \Automattic\Jetpack\Current_Plan::get() : array() );
		$plan_slug = (string) ( $plan['product_slug'] ?? '' );

		self::record_event(
			wp_get_current_user(),
			'wpcom_podcasting_status_changed',
			array(
				'blog_id'              => (int) get_current_blog_id(),
				'status'               => $status,
				'surface'              => 'option_write',
				'previous_category_id' => (int) $old_value,
				'new_category_id'      => (int) $new_value,
				'user_id'              => (int) get_current_user_id(),
				'product_slug'         => $plan_slug,
			)
		);

		if ( function_exists( 'bump_stats_extras' ) ) {
			// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by `function_exists` above.
			bump_stats_extras( 'wpcom-podcasting-status', $status );
		}
	}

	/**
	 * @param mixed $request Request object.
	 */
	private static function is_settings_write( $request ): bool {
		if ( ! $request instanceof WP_REST_Request ) {
			return false;
		}
		if ( '/wp/v2/settings' !== $request->get_route() ) {
			return false;
		}
		return in_array( $request->get_method(), array( 'POST', 'PUT', 'PATCH' ), true );
	}

	/**
	 * @return array<string, mixed>
	 */
	private static function read_settings_state(): array {
		$state = array();
		foreach ( Settings::OPTION_NAMES as $name ) {
			$state[ $name ] = get_option( $name, '' );
		}
		return $state;
	}

	/**
	 * Scheduled/cron publishes have no logged-in user — fall back to author.
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
	 * Filters out posts that sit in the podcast category but aren't
	 * actually episodes — block-editor `core/audio` and classic-editor
	 * attached audio cover the supported authoring paths.
	 */
	private static function has_podcast_media( WP_Post $post ): bool {
		return has_block( 'core/audio', $post )
			|| ! empty( get_attached_media( 'audio', $post->ID ) );
	}

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
	 * @param mixed  $user       Username, user ID, or `WP_User` object.
	 * @param string $event_name Tracks event name.
	 * @param array  $properties Event properties.
	 * @return mixed
	 */
	private static function record_event( $user, string $event_name, array $properties ) {
		try {
			if ( is_numeric( $user ) ) {
				$user = get_userdata( (int) $user );
			}

			if ( ! $user instanceof WP_User ) {
				$user = wp_get_current_user();
			}

			if ( ! function_exists( 'tracks_record_event' ) && function_exists( 'require_lib' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by `function_exists` above.
				require_lib( 'tracks/client' );
			}

			if ( function_exists( 'tracks_record_event' ) ) {
				// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by `function_exists` above.
				return tracks_record_event( $user, $event_name, $properties );
			}

			if ( class_exists( '\Automattic\Jetpack\Tracking' ) ) {
				if ( null === self::$jetpack_tracking ) {
					self::$jetpack_tracking = new \Automattic\Jetpack\Tracking();
				}
				return self::$jetpack_tracking->tracks_record_event( $user, $event_name, $properties );
			}
		} catch ( Throwable $e ) {
			self::log_failure( 'dispatcher-failed', $e, array( 'event_name' => $event_name ) );
		}

		return null;
	}

	/**
	 * @param string    $message    Short failure tag.
	 * @param Throwable $error      Throwable that triggered the log.
	 * @param array     $properties Extra context.
	 */
	private static function log_failure( string $message, Throwable $error, array $properties = array() ): void {
		if ( ! function_exists( 'log2logstash' ) ) {
			return;
		}

		// @phan-suppress-next-line PhanUndeclaredFunction -- Guarded by `function_exists` above.
		log2logstash(
			array(
				'feature'  => 'jetpack-podcast-tracks',
				'message'  => $message,
				'severity' => 'error',
				'blog_id'  => (int) get_current_blog_id(),
				'extra'    => array(
					'error_message' => $error->getMessage(),
					'error_file'    => $error->getFile() . ':' . $error->getLine(),
					'properties'    => $properties,
				),
			)
		);
	}
}
