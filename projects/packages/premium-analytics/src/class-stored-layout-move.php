<?php
/**
 * Moves a widget a reader placed on a customized tab when the default moved it to another.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * A default layout change never reaches a layout the reader customized, which core keeps in the
 * `persisted_preferences` user meta. This rewrites that meta once per reader, on the read that
 * precedes the dashboard, for the moves listed in MOVES: the widget leaves the tab it was on and,
 * when the reader also customized the destination, joins its end as the default places it.
 *
 * Temporary, to be removed once the moves have reached the readers who customized a tab before
 * them (WOOA7S-2291). Nothing is recorded: a widget still on its old tab is the only trigger, so a
 * reader who removes it from the new tab afterwards is left alone.
 *
 * @since $$next-version$$
 */
class Stored_Layout_Move {

	const LAYOUTS_KEY = 'dashboardSectionLayouts';

	/**
	 * Widget type => [ from section slug, to section slug ].
	 */
	const MOVES = array(
		'jpa/tags' => array( 'insights', 'traffic' ),
	);

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
			update_user_meta( $user_id, $meta_key, $moved );
		}
		add_filter( 'get_user_metadata', array( __CLASS__, 'filter_user_meta' ), 99, 3 );

		return $moved === $preferences ? $value : array( $moved );
	}

	/**
	 * Apply every move whose widget is still on its old tab.
	 *
	 * @param array $preferences The reader's persisted preferences.
	 * @return array The preferences, the same array when nothing moved.
	 */
	public static function move( array $preferences ) {
		$layouts = $preferences[ Enablement_Setting::PREFERENCES_SCOPE ][ self::LAYOUTS_KEY ] ?? null;
		if ( ! is_array( $layouts ) ) {
			return $preferences;
		}

		foreach ( self::MOVES as $type => $move ) {
			list( $from, $to ) = $move;

			if ( ! self::layout_has( $layouts[ $from ] ?? null, $type ) ) {
				continue;
			}

			// Without the destination's default there is nowhere to move the widget to, so the
			// old tab keeps it, and the trigger, for a later read.
			$instance = self::default_instance( $to, $type );
			if ( ! $instance ) {
				continue;
			}

			$layouts[ $from ] = array_values(
				array_filter(
					$layouts[ $from ],
					function ( $widget ) use ( $type ) {
						return ! is_array( $widget ) || ( $widget['type'] ?? null ) !== $type;
					}
				)
			);

			if ( is_array( $layouts[ $to ] ?? null ) && ! self::layout_has( $layouts[ $to ], $type ) ) {
				$layouts[ $to ][] = $instance;
			}
		}

		$preferences[ Enablement_Setting::PREFERENCES_SCOPE ][ self::LAYOUTS_KEY ] = $layouts;

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
