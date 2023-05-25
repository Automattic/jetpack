<?php
/**
 * Speed score history after Jetpack Boost
 *
 * @package automattic/jetpack-boost-speed-score
 */

namespace Automattic\Jetpack\Boost_Speed_Score;

use Automattic\Jetpack\Boost_Speed_Score\Lib\Transient;

/**
 * Class Speed_Score_History
 *
 * @package Automattic\Jetpack\Boost_Speed_Score\Lib
 */
class Speed_Score_History {
	const OPTION_PREFIX       = 'jetpack_boost_speed_score_history_';
	const STALE_TRANSIENT_KEY = 'speed_score_stale_marker';

	/**
	 * Limit the number of recent records to keep.
	 */
	const LIMIT = 20;

	/**
	 * The list of history entries.
	 *
	 * @var array
	 */
	private $entries;

	/**
	 * URL of the site the speed score belongs to.
	 *
	 * @var string
	 */
	private $url;

	/**
	 * Speed_Score_History constructor.
	 *
	 * @param string $url URL of the site the speed scores belong to.
	 */
	public function __construct( $url ) {
		$this->url     = $url;
		$this->entries = get_option( $this->get_option_name(), array() );
	}

	/**
	 * Determine the option_name used to store the speed score data in options table.
	 *
	 * @return string
	 */
	private function get_option_name() {
		return static::OPTION_PREFIX . Speed_Score_Request::generate_cache_id_from_url( $this->url );
	}

	/**
	 * Get the number of history records currently stored.
	 *
	 * @return int
	 */
	public function count() {
		return count( $this->entries );
	}

	/**
	 * Find the latest available speed score history record.
	 *
	 * @param int $offset Instead of receiving the last one, you can use offset to receive a slightly older speed score.
	 *
	 * @return array|null
	 */
	public function latest( $offset = 0 ) {
		$index = $this->count() - ( $offset + 1 );

		if ( $index >= 0 ) {
			return $this->entries[ $index ];
		}

		return null;
	}

	/**
	 * Find the latest available speed scores.
	 *
	 * @param int $offset Instead of receiving the last one, you can use offset to receive a slightly older speed score.
	 *
	 * @return array|null
	 */
	public function latest_scores( $offset = 0 ) {
		$index = $this->count() - ( $offset + 1 );

		if ( $index >= 0 ) {
			return $this->entries[ $index ]['scores'];
		}

		return null;
	}

	/**
	 * Get a timestamp that marks previous history stale.
	 *
	 * All speed score before this timestamp are considered stale.
	 *
	 * @return array
	 */
	public static function get_stale_timestamp() {
		$last_stale_marker = Transient::get( static::STALE_TRANSIENT_KEY, 0 );

		// Any score that is older than 24 hours or before the last stale marker is considered stale.
		return max( $last_stale_marker, time() - DAY_IN_SECONDS );
	}

	/**
	 * Mark previous speed score as stale.
	 *
	 * If a there were significant changes to the site, we want to mark prior speed scores as stale.
	 */
	public static function mark_stale() {
		Transient::set( static::STALE_TRANSIENT_KEY, time() );
	}

	/**
	 * Check if the last item in history is stale.
	 */
	public function is_stale() {
		$last_entry = $this->latest();

		if ( ! $last_entry ) {
			return true;
		}

		return $last_entry['timestamp'] < self::get_stale_timestamp();
	}

	/**
	 * Record a new history entry for speed scores.
	 *
	 * @param array $entry The new entry to save.
	 */
	public function push( $entry ) {
		$this->entries[] = $entry;
		$this->entries   = array_slice( $this->entries, - static::LIMIT );
		update_option( $this->get_option_name(), $this->entries, false );
	}
}
