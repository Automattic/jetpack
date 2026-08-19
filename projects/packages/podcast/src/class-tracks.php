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
use Automattic\Jetpack\Podcast\Feed\Episode_Block_Tags;
use Automattic\Jetpack\Status\Host;
use Throwable;
use WP_Post;
use WP_Query;
use WP_REST_Request;
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
	 * Mirrors `getValidationIssues()` in
	 * `src/dashboard/hooks/use-validation-issues.ts` — keep the two in step.
	 * Not the directory-submission bar, which also wants an episode and a
	 * conforming cover.
	 *
	 * @var string[]
	 */
	private const SETUP_OPTIONS = array(
		'podcasting_category_id',
		'podcasting_title',
		'podcasting_summary',
		'podcasting_talent_name',
		'podcasting_email',
		'podcasting_category_1',
		'podcasting_image',
	);

	/**
	 * What is driving the option write in flight. Option hooks fire
	 * synchronously inside `update_option()`, so the value set for the
	 * dispatching route is the one the recorder reads.
	 *
	 * @var string
	 */
	private static $surface = 'programmatic';

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

		// The options rather than the endpoint's `jetpack_podcast_settings_saved`,
		// so setup lands whichever path writes it. `podcasting_category_id`
		// intentionally overlaps `status_changed` above, which stays canonical
		// for "site enabled podcasting".
		foreach ( self::SETUP_OPTIONS as $option ) {
			add_action( "add_option_{$option}", array( __CLASS__, 'record_setting_added' ), 10, 2 );
			add_action( "update_option_{$option}", array( __CLASS__, 'record_setting_updated' ), 10, 3 );
		}

		add_filter( 'rest_request_before_callbacks', array( __CLASS__, 'set_surface_from_route' ), 10, 3 );
		add_filter( 'rest_request_after_callbacks', array( __CLASS__, 'clear_surface' ) );
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
					array(
						'app'     => (string) $app,
						'surface' => self::$surface,
					)
				);
				return;
			}
		} catch ( Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Tracks is best-effort.
		}
	}

	/**
	 * `add_option_{$option}` callback for a required setting. No prior row, so
	 * the previous value is empty by definition.
	 *
	 * @param string $option Option name.
	 * @param mixed  $value  Stored value.
	 */
	public static function record_setting_added( $option, $value ): void {
		self::maybe_record_setting_first_saved( (string) $option, '', $value );
	}

	/**
	 * `update_option_{$option}` callback for a required setting. Seldom the live
	 * path: `update_option()` defers to `add_option()` while the stored value
	 * still equals the registered empty default.
	 *
	 * @param mixed  $old_value Previous stored value.
	 * @param mixed  $new_value Newly stored value.
	 * @param string $option    Option name.
	 */
	public static function record_setting_updated( $old_value, $new_value, $option ): void {
		self::maybe_record_setting_first_saved( (string) $option, $old_value, $new_value );
	}

	/**
	 * Emit `wpcom_podcast_setting_first_saved` when a required setting picks up
	 * a value for the first time.
	 *
	 * Recording only the empty → filled transition bounds this at one event per
	 * setting instead of one per save, and keeps sites configured before it
	 * shipped silent rather than reporting a false completion. `is_complete`
	 * marks the transition that finished the set.
	 *
	 * @param string $option    Option name.
	 * @param mixed  $old_value Previous stored value.
	 * @param mixed  $new_value Newly stored value.
	 */
	private static function maybe_record_setting_first_saved( string $option, $old_value, $new_value ): void {
		try {
			if ( self::has_value( $old_value ) || ! self::has_value( $new_value ) ) {
				return;
			}

			// Both hooks fire after the write, so this counts the new value too.
			$filled_count = self::filled_setting_count();

			self::record_event(
				'wpcom_podcast_setting_first_saved',
				array(
					'setting'      => $option,
					'filled_count' => $filled_count,
					'is_complete'  => count( self::SETUP_OPTIONS ) === $filled_count,
					'surface'      => self::$surface,
					'user_id'      => (int) get_current_user_id(),
					'product_slug' => self::current_product_slug(),
				)
			);
		} catch ( Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch
			// Tracks is best-effort — never break a settings save.
		}
	}

	/**
	 * How many required settings currently hold a value.
	 */
	private static function filled_setting_count(): int {
		$filled = 0;

		foreach ( self::SETUP_OPTIONS as $option ) {
			if ( self::has_value( get_option( $option, '' ) ) ) {
				++$filled;
			}
		}

		return $filled;
	}

	/**
	 * Whether a required setting counts as filled in. Options read back as
	 * strings, so one rule covers both shapes: blank for the text fields, `'0'`
	 * for `podcasting_category_id`, where 0 is the disabled sentinel.
	 *
	 * @param mixed $value Value to test.
	 */
	private static function has_value( $value ): bool {
		$value = is_scalar( $value ) ? trim( (string) $value ) : '';

		return '' !== $value && '0' !== $value;
	}

	/**
	 * Label writes made by the dashboard's own REST routes. Derived from the
	 * route rather than set by the endpoints, so nothing outside this class
	 * sits in a save path holding a reference to it.
	 *
	 * @param mixed $response Passed through untouched.
	 * @param array $handler  Unused.
	 * @param mixed $request  Request being dispatched.
	 * @return mixed
	 */
	public static function set_surface_from_route( $response, $handler, $request ) {
		unset( $handler );

		if ( ! $request instanceof WP_REST_Request ) {
			return $response;
		}

		$route = (string) $request->get_route();

		if ( 0 === strpos( $route, '/wpcom/v2/podcast/settings' ) ) {
			self::$surface = 'settings_rest';
		} elseif ( 0 === strpos( $route, '/wpcom/v2/podcast-distribution/' ) ) {
			self::$surface = 'distribution_rest';
		}

		return $response;
	}

	/**
	 * Reset once the route's callback is done, so a nested subrequest doesn't
	 * leave its surface set for the rest of the request.
	 *
	 * @param mixed $response Passed through untouched.
	 * @return mixed
	 */
	public static function clear_surface( $response ) {
		self::$surface = 'programmatic';

		return $response;
	}

	/**
	 * Host the event came from. Plan slug is a lossy proxy — Atomic reports a
	 * WordPress.com plan server-side and a Jetpack one client-side.
	 */
	private static function platform(): string {
		$host = new Host();

		if ( $host->is_wpcom_simple() ) {
			return 'simple';
		}

		return $host->is_woa_site() ? 'atomic' : 'self_hosted';
	}

	/**
	 * Current plan slug. `WPCOM_Store_API` on Simple, `Current_Plan` on Atomic
	 * and self-hosted — same dual pattern as
	 * `Masterbar\Dashboard_Switcher_Tracking::get_plan()`.
	 */
	private static function current_product_slug(): string {
		$plan = class_exists( '\WPCOM_Store_API' )
			? \WPCOM_Store_API::get_current_plan( (int) get_current_blog_id() )
			: ( class_exists( '\Automattic\Jetpack\Current_Plan' ) ? \Automattic\Jetpack\Current_Plan::get() : array() );

		return (string) ( $plan['product_slug'] ?? '' );
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

		self::record_event(
			'wpcom_podcasting_status_changed',
			array(
				'status'               => $status,
				'surface'              => self::$surface,
				'previous_category_id' => $old_value,
				'new_category_id'      => $new_value,
				'user_id'              => (int) get_current_user_id(),
				'product_slug'         => self::current_product_slug(),
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
	 * Covers all three authoring paths: the `jetpack/podcast-episode` block
	 * (the paid path — media lives in its `mediaUrl` attr, often an external or
	 * unattached URL that the two checks below miss), the `core/audio` block,
	 * and classic-editor attached audio.
	 *
	 * @param WP_Post $post Post being checked.
	 */
	private static function has_podcast_media( WP_Post $post ): bool {
		$attrs = Episode_Block_Tags::get_block_attrs( $post );
		if ( ! empty( $attrs['mediaUrl'] ) ) {
			return true;
		}

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
			$user                   = $user ?? wp_get_current_user();
			$properties['blog_id']  = (int) Connection_Manager::get_site_id( true );
			$properties['platform'] = self::platform();

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
