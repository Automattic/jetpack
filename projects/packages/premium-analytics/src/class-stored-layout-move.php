<?php
/**
 * Moves the Top tags & categories tile a reader placed on a customized Insights to Traffic, once.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Top tags & categories moved from the Insights default layout to Traffic, which never reaches a
 * layout the reader customized: core keeps those in the `persisted_preferences` user meta. This
 * rewrites that meta once per reader, on the read that precedes the dashboard: the tile leaves a
 * customized Insights and, when the reader customized Traffic too, joins its end as the default
 * places it. The move is recorded in the same preferences, so a reader who removes the tile from
 * Traffic afterwards is left alone.
 *
 * Temporary, to be removed once the move has reached the readers who customized a tab before it
 * (WOOA7S-2291). The next layout change is a separate discussion, not a second entry here.
 *
 * @since 0.13.0
 */
class Stored_Layout_Move {

	const LAYOUTS_KEY = 'dashboardSectionLayouts';

	/** The applied moves, by id, so a tile removed after its move stays removed. */
	const MOVES_KEY = 'dashboardLayoutMoves';

	const MOVE_ID = 'tags-to-traffic';

	const TYPE = 'jpa/tags';

	const FROM = 'insights';

	const TO = 'traffic';

	/**
	 * Hook the preferences read. Priority 99 runs after core's own readers, as Gutenberg's default
	 * layout injection does.
	 *
	 * @return void
	 */
	public static function register() {
		add_filter( 'get_user_metadata', array( __CLASS__, 'filter_user_meta' ), 99, 3 );
	}

	/**
	 * Rewrite the stored section layouts on read, and persist the rewrite.
	 *
	 * @param mixed  $value    The pre-fetched value, or null to let the meta API resolve normally.
	 * @param int    $user_id  User ID.
	 * @param string $meta_key Meta key being read.
	 * @return mixed The original value, or a single-element array holding the moved preferences.
	 */
	public static function filter_user_meta( $value, $user_id, $meta_key ) {
		global $wpdb;

		if ( $meta_key !== $wpdb->get_blog_prefix() . 'persisted_preferences' ) {
			return $value;
		}

		// The meta API runs this filter on our own read, and on the read inside the update.
		remove_filter( 'get_user_metadata', array( __CLASS__, 'filter_user_meta' ), 99 );
		$preferences = get_user_meta( $user_id, $meta_key, true );
		$moved       = is_array( $preferences ) ? self::move( $preferences ) : $preferences;
		if ( $moved !== $preferences ) {
			$moved['_modified'] = self::modified_after( $preferences['_modified'] ?? null );
			// The meta API unslashes what it is handed; this came from the database, already unslashed.
			update_user_meta( $user_id, $meta_key, wp_slash( $moved ) );
		}
		add_filter( 'get_user_metadata', array( __CLASS__, 'filter_user_meta' ), 99, 3 );

		return $moved === $preferences ? $value : array( $moved );
	}

	/**
	 * Apply the move to a reader who has stored layouts and has not had it yet.
	 *
	 * @param array $preferences The reader's persisted preferences.
	 * @return array The preferences, the same array when nothing moved.
	 */
	private static function move( array $preferences ) {
		$scope   = $preferences[ Enablement_Setting::PREFERENCES_SCOPE ] ?? array();
		$layouts = $scope[ self::LAYOUTS_KEY ] ?? null;
		$applied = is_array( $scope[ self::MOVES_KEY ] ?? null ) ? $scope[ self::MOVES_KEY ] : array();

		if ( ! is_array( $layouts ) || in_array( self::MOVE_ID, $applied, true ) ) {
			return $preferences;
		}

		// Without the destination's default there is nowhere to move the tile to, so nothing
		// is touched or recorded, and a later read tries again.
		$instance = self::default_instance( self::TO, self::TYPE );
		if ( ! $instance ) {
			return $preferences;
		}

		if ( is_array( $layouts[ self::FROM ] ?? null ) ) {
			$layouts[ self::FROM ] = array_values(
				array_filter(
					$layouts[ self::FROM ],
					function ( $widget ) {
						return ! is_array( $widget ) || ( $widget['type'] ?? null ) !== self::TYPE;
					}
				)
			);
		}

		if ( is_array( $layouts[ self::TO ] ?? null ) && ! self::layout_has( $layouts[ self::TO ], self::TYPE ) ) {
			$layouts[ self::TO ][] = $instance;
		}

		$applied[] = self::MOVE_ID;

		$preferences[ Enablement_Setting::PREFERENCES_SCOPE ][ self::LAYOUTS_KEY ] = $layouts;
		$preferences[ Enablement_Setting::PREFERENCES_SCOPE ][ self::MOVES_KEY ]   = $applied;

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

	/**
	 * Whether a stored layout lists a widget type.
	 *
	 * @param mixed  $layout The stored layout, if any.
	 * @param string $type   Widget type.
	 * @return bool
	 */
	private static function layout_has( $layout, $type ) {
		if ( ! is_array( $layout ) ) {
			return false;
		}
		foreach ( $layout as $widget ) {
			if ( is_array( $widget ) && ( $widget['type'] ?? null ) === $type ) {
				return true;
			}
		}
		return false;
	}

	/**
	 * The instance a section's default layout carries for a type, without the default's `order`:
	 * a stored layout is positional, so the order would rank the widget ahead of the end.
	 *
	 * @param string $slug Section slug.
	 * @param string $type Widget type.
	 * @return array|null
	 */
	private static function default_instance( $slug, $type ) {
		if ( ! defined( __NAMESPACE__ . '\\DASHBOARD_NAME' ) ) {
			return null;
		}

		$section = Dashboard_Section_Registry::get_instance()->get_registered_by_slug( DASHBOARD_NAME, $slug );
		if ( ! $section ) {
			return null;
		}

		foreach ( $section->get_default_layout() as $widget ) {
			if ( is_array( $widget ) && ( $widget['type'] ?? null ) === $type ) {
				if ( isset( $widget['placement'] ) && is_array( $widget['placement'] ) ) {
					unset( $widget['placement']['order'] );
				}
				return $widget;
			}
		}

		return null;
	}
}
