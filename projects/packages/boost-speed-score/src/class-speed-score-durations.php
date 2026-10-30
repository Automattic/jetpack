<?php
/**
 * How long this site's recent speed score runs took.
 *
 * @package automattic/jetpack-boost-speed-score
 */

namespace Automattic\Jetpack\Boost_Speed_Score;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Speed_Score_Durations
 */
class Speed_Score_Durations {
	const OPTION_NAME = 'jetpack_boost_speed_score_durations';

	/**
	 * Number of recent runs to keep.
	 */
	const LIMIT = 5;

	/**
	 * Expected run length before this site has finished a run: the fleet average is about 36 s,
	 * plus up to one 5 s poll.
	 */
	const DEFAULT_SECONDS = 40;

	/**
	 * Longest run worth recording; the dashboard stops polling at 4 minutes, so anything longer
	 * means nobody was watching when the run finished.
	 */
	const MAX_SECONDS = 240;

	/**
	 * Record how long a finished run took.
	 *
	 * @param int|float $seconds Seconds from dispatch to the poll that saw the result.
	 */
	public static function record( $seconds ) {
		$seconds = (int) round( $seconds );
		if ( $seconds <= 0 || $seconds > self::MAX_SECONDS ) {
			return;
		}

		$durations   = self::all();
		$durations[] = $seconds;
		update_option( self::OPTION_NAME, array_slice( $durations, - self::LIMIT ), false );
	}

	/**
	 * How long the next run is likely to take, in seconds.
	 *
	 * @return int
	 */
	public static function expected() {
		$durations = self::all();
		if ( empty( $durations ) ) {
			return self::DEFAULT_SECONDS;
		}

		sort( $durations );
		$middle = intdiv( count( $durations ), 2 );
		if ( count( $durations ) % 2 ) {
			return $durations[ $middle ];
		}

		return (int) round( ( $durations[ $middle - 1 ] + $durations[ $middle ] ) / 2 );
	}

	/**
	 * Recorded durations, oldest first.
	 *
	 * @return int[]
	 */
	private static function all() {
		$durations = get_option( self::OPTION_NAME, array() );

		return is_array( $durations ) ? array_values( array_map( 'intval', $durations ) ) : array();
	}
}
