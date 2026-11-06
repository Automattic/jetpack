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
 * rewrites that meta once per reader, as Stored_Layout_Rewrite runs it: the tile leaves a
 * customized Insights and, when the reader customized Traffic too, joins its end as the default
 * places it.
 *
 * Temporary, to be removed once the move has reached the readers who customized a tab before it
 * (WOOA7S-2291).
 *
 * @since 0.13.0
 */
class Stored_Layout_Move extends Stored_Layout_Rewrite {

	const MOVE_ID = 'tags-to-traffic';

	const TYPE = 'jpa/tags';

	const FROM = 'insights';

	const TO = 'traffic';

	/**
	 * Apply the move to a reader who has stored layouts and has not had it yet.
	 *
	 * @param array $preferences The reader's persisted preferences.
	 * @return array The preferences, the same array when nothing moved.
	 */
	protected static function rewrite( array $preferences ) {
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
