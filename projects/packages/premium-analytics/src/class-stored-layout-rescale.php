<?php
/**
 * Rescales the tile heights a reader stored on 200px rows to the dashboard's 40px rows, once.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * The dashboard rows went from 200px to 40px so a tile can take the height its content needs.
 * A stored layout counts its heights in rows, so one saved on the old rows would render at a
 * fifth of its height. This re-expresses every stored height in the new rows, keeping the tile's
 * pixels, as Stored_Layout_Rewrite runs it. Rounding goes up, so no list loses a line.
 *
 * Temporary, to be removed once the rescale has reached the readers who customized a tab before
 * the rows changed (STATS-484).
 *
 * @since $$next-version$$
 */
class Stored_Layout_Rescale extends Stored_Layout_Rewrite {

	const MOVE_ID = 'rows-to-40px';

	/** The grid settings the removed Layout settings drawer persisted; its `rowHeight` is the row the heights counted. */
	const GRID_SETTINGS_KEY = 'dashboardGridSettings';

	const PREVIOUS_ROW_HEIGHT = 200;

	const ROW_HEIGHT = 40;

	const ROW_GAP = 16;

	/**
	 * Rescale every stored height for a reader who has stored layouts and has not had it yet.
	 *
	 * @param array $preferences The reader's persisted preferences.
	 * @return array The preferences, the same array when nothing changed.
	 */
	protected static function rewrite( array $preferences ) {
		$scope   = $preferences[ Enablement_Setting::PREFERENCES_SCOPE ] ?? array();
		$layouts = $scope[ self::LAYOUTS_KEY ] ?? null;
		$applied = is_array( $scope[ self::MOVES_KEY ] ?? null ) ? $scope[ self::MOVES_KEY ] : array();

		if ( ! is_array( $layouts ) || in_array( self::MOVE_ID, $applied, true ) ) {
			return $preferences;
		}

		$row_height = self::stored_row_height( $scope[ self::GRID_SETTINGS_KEY ] ?? null );

		foreach ( $layouts as $slug => $layout ) {
			if ( ! is_array( $layout ) ) {
				continue;
			}
			foreach ( $layout as $index => $widget ) {
				$height = is_array( $widget ) ? ( $widget['placement']['height'] ?? null ) : null;
				if ( is_int( $height ) || is_float( $height ) ) {
					$layouts[ $slug ][ $index ]['placement']['height'] = self::rescale_height( $height, $row_height );
				}
			}
		}

		$applied[] = self::MOVE_ID;

		$preferences[ Enablement_Setting::PREFERENCES_SCOPE ][ self::LAYOUTS_KEY ] = $layouts;
		$preferences[ Enablement_Setting::PREFERENCES_SCOPE ][ self::MOVES_KEY ]   = $applied;
		// Consumed here; the client stopped reading it when the drawer went.
		unset( $preferences[ Enablement_Setting::PREFERENCES_SCOPE ][ self::GRID_SETTINGS_KEY ] );

		return $preferences;
	}

	/**
	 * The rows a tile of `$rows` old rows takes on the new rows, its pixels kept and rounded up.
	 *
	 * @param int|float $rows       Stored height, in rows of `$row_height`.
	 * @param int|float $row_height Row height the stored height counted, in pixels.
	 * @return int
	 */
	public static function rescale_height( $rows, $row_height ) {
		$pixels = $rows * ( $row_height + self::ROW_GAP ) - self::ROW_GAP;

		return max( 1, (int) ceil( ( $pixels + self::ROW_GAP ) / ( self::ROW_HEIGHT + self::ROW_GAP ) ) );
	}

	/**
	 * The row height a reader's stored heights counted: the one the drawer persisted, else the default.
	 *
	 * @param mixed $grid_settings The stored grid settings, if any.
	 * @return int|float
	 */
	private static function stored_row_height( $grid_settings ) {
		$row_height = is_array( $grid_settings ) ? ( $grid_settings['rowHeight'] ?? null ) : null;

		return ( is_int( $row_height ) || is_float( $row_height ) ) && $row_height > 0 ? $row_height : self::PREVIOUS_ROW_HEIGHT;
	}
}
