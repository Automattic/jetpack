<?php
/**
 * Rewrites the section layouts a reader stored, once per reader, on the read before the dashboard.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * A default layout change never reaches a layout the reader customized: core keeps those in the
 * `persisted_preferences` user meta. A subclass describes one such change, and this hooks the
 * meta read that precedes the dashboard, applies every registered change in registration order
 * to one raw read, and persists the result. Each change records itself in the same preferences,
 * so it runs once and a reader who undoes it afterwards is left alone.
 *
 * @since $$next-version$$
 */
abstract class Stored_Layout_Rewrite {
	const LAYOUTS_KEY = 'dashboardSectionLayouts';
	/** The applied rewrites, by id. */
	const MOVES_KEY = 'dashboardLayoutMoves';

	/**
	 * The registered rewrites, by class, in the order they apply.
	 *
	 * @var array<string, callable(array): array>
	 */
	private static $rewrites = array();

	/**
	 * Queue this rewrite and hook the preferences read. Priority 99 runs after core's own readers,
	 * as Gutenberg's default layout injection does.
	 *
	 * @return void
	 */
	public static function register() {
		if ( ! isset( self::$rewrites[ static::class ] ) ) {
			self::$rewrites[ static::class ] = static function ( array $preferences ) {
				return static::rewrite( $preferences );
			};
		}
		add_filter( 'get_user_metadata', array( self::class, 'filter_user_meta' ), 99, 3 );
	}

	/**
	 * Drop every queued rewrite and unhook the read.
	 *
	 * @return void
	 */
	public static function unregister() {
		self::$rewrites = array();
		remove_filter( 'get_user_metadata', array( self::class, 'filter_user_meta' ), 99 );
	}

	/**
	 * Rewrite the stored section layouts on read, and persist the rewrite.
	 *
	 * @param mixed  $value    The pre-fetched value, or null to let the meta API resolve normally.
	 * @param int    $user_id  User ID.
	 * @param string $meta_key Meta key being read.
	 * @return mixed The original value, or a single-element array holding the rewritten preferences.
	 */
	public static function filter_user_meta( $value, $user_id, $meta_key ) {
		global $wpdb;

		if ( $meta_key !== $wpdb->get_blog_prefix() . 'persisted_preferences' ) {
			return $value;
		}

		// The meta API runs this filter on our own read, and on the read inside the update.
		remove_filter( 'get_user_metadata', array( self::class, 'filter_user_meta' ), 99 );
		$preferences = get_user_meta( $user_id, $meta_key, true );
		$rewritten   = $preferences;
		if ( is_array( $preferences ) ) {
			foreach ( self::$rewrites as $rewrite ) {
				$rewritten = $rewrite( $rewritten );
			}
		}
		if ( $rewritten !== $preferences ) {
			$rewritten['_modified'] = self::modified_after( $preferences['_modified'] ?? null );
			// The meta API unslashes what it is handed; this came from the database, already unslashed.
			update_user_meta( $user_id, $meta_key, wp_slash( $rewritten ) );
		}
		add_filter( 'get_user_metadata', array( self::class, 'filter_user_meta' ), 99, 3 );

		return $rewritten === $preferences ? $value : array( $rewritten );
	}

	/**
	 * Apply the change to a reader who has stored layouts and has not had it yet. A subclass
	 * overrides this; the base changes nothing.
	 *
	 * @param array $preferences The reader's persisted preferences.
	 * @return array The preferences, the same array when nothing changed.
	 */
	protected static function rewrite( array $preferences ) {
		return $preferences;
	}

	/**
	 * A `_modified` stamp the client's persistence layer takes over its localStorage copy: it
	 * keeps whichever is newer, and a browser clock ahead of the server would otherwise win.
	 *
	 * @param mixed $previous The stamp the preferences carried, if any.
	 * @return string
	 */
	private static function modified_after( $previous ) {
		$now      = time();
		$previous = is_string( $previous ) ? strtotime( $previous ) : false;
		if ( $previous !== false && $previous >= $now ) {
			$now = $previous + 1;
		}

		return gmdate( 'Y-m-d\TH:i:s\Z', $now );
	}
}
