<?php
/**
 * Speed score history after Jetpack Boost
 *
 * @package automattic/jetpack-boost-speed-score
 */

namespace Automattic\Jetpack\Boost_Speed_Score;

use Automattic\Jetpack\Boost_Core\Lib\Transient;

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
		$this->entries = $this->read_entries();
	}

	/**
	 * Read the stored entries, taking the newest of this URL's record and its older spellings.
	 *
	 * This can't stop at a non-empty record: the canonical spelling is the one My Jetpack used to
	 * write to, so it can hold scores older than the ones the Boost dashboard showed.
	 *
	 * @return array
	 */
	private function read_entries() {
		$entries = get_option( $this->get_option_name(), array() );

		foreach ( $this->get_legacy_urls() as $legacy_url ) {
			$legacy_entries = get_option( static::OPTION_PREFIX . hash( Speed_Score_Request::CACHE_KEY_HASH_ALGO, $legacy_url ), array() );

			if ( self::get_latest_timestamp( $legacy_entries ) > self::get_latest_timestamp( $entries ) ) {
				$entries = $legacy_entries;
			}
		}

		return $entries;
	}

	/**
	 * List the spellings this URL's scores were saved under before they shared one record.
	 *
	 * @return string[]
	 */
	private function get_legacy_urls() {
		$canonical_url = Speed_Score_Request::canonicalize_url( $this->url );
		$path_length   = strcspn( $canonical_url, '?#' );
		$path          = substr( $canonical_url, 0, $path_length );
		$rest          = substr( $canonical_url, $path_length );
		$legacy_urls   = array( $path . '/' . $rest );

		// My Jetpack saved the home page's scores under the site URL, which differs when WordPress lives in a subdirectory.
		$site_url = rtrim( get_site_url(), '/' );
		if ( rtrim( home_url(), '/' ) === $path && $site_url !== $path ) {
			$legacy_urls[] = $site_url . $rest;
			$legacy_urls[] = $site_url . '/' . $rest;
		}

		return $legacy_urls;
	}

	/**
	 * Get the timestamp of the last of the given history entries.
	 *
	 * @param array $entries History entries, oldest first.
	 *
	 * @return int
	 */
	private static function get_latest_timestamp( $entries ) {
		$latest = end( $entries );

		return (int) ( $latest['timestamp'] ?? 0 );
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
	 * @return int
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

	/**
	 * Move the latest entry's timestamp to now without changing its scores.
	 *
	 * Used when a run completes with the same scores as before: no new entry is pushed, but
	 * staleness is measured by the timestamp, so it has to move or repeating scores look stale
	 * forever.
	 *
	 * @since 0.6.0
	 */
	public function touch_latest() {
		$index = $this->count() - 1;

		if ( $index < 0 ) {
			return;
		}

		$this->entries[ $index ]['timestamp'] = time();
		update_option( $this->get_option_name(), $this->entries, false );
	}
}
