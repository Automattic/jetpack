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
	 * Mark the raw home and site URL migration as complete. Autoloaded, so checking it costs no query.
	 */
	const LEGACY_MIGRATED_OPTION = 'jetpack_boost_speed_score_legacy_migrated';

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
		self::maybe_migrate_legacy_records();

		$this->url     = $url;
		$this->entries = get_option( $this->get_option_name(), array() );

		if ( empty( $this->entries ) ) {
			$migrated_option = $this->get_option_name() . '_legacy_migrated';
			if ( get_option( $migrated_option ) ) {
				return;
			}

			$path_length = strcspn( $url, '?#' );
			$base_url    = rtrim( substr( $url, 0, $path_length ), '/' );
			$suffix      = substr( $url, $path_length );
			$legacy_urls = array( $base_url . '/' . $suffix );

			if ( $base_url === rtrim( home_url(), '/' ) ) {
				$site_url = rtrim( get_site_url(), '/' );
				if ( $site_url !== $base_url && $site_url !== rtrim( get_option( 'home' ), '/' ) ) {
					$legacy_urls[] = $site_url . $suffix;
					$legacy_urls[] = $site_url . '/' . $suffix;
				}
			}

			self::migrate_legacy_record( $url, $legacy_urls );
			$this->entries = get_option( $this->get_option_name(), array() );
			update_option( $migrated_option, 1, true );
		}
	}

	/**
	 * Migrate older spellings of the raw home and site URLs once per site.
	 *
	 * The marker is set last, so a request arriving midway repeats the work rather than finding no
	 * scores and starting a new test.
	 */
	private static function maybe_migrate_legacy_records() {
		if ( get_option( self::LEGACY_MIGRATED_OPTION ) ) {
			return;
		}

		// The raw options, because a translation plugin's home_url filter would migrate only that language's record.
		// The first build can run under cron, where the home URL can have another scheme than in the admin.
		foreach ( array( 'http', 'https' ) as $scheme ) {
			$home_url = rtrim( set_url_scheme( get_option( 'home' ), $scheme ), '/' );

			// My Jetpack saved the home page's scores under the site URL, which differs when WordPress lives in a subdirectory.
			// Match schemes first: under cron or CLI the two can differ by scheme alone, which isn't a subdirectory install.
			$site_url = rtrim( set_url_scheme( get_option( 'siteurl' ), $scheme ), '/' );

			foreach ( array( '', '?jb-disable-modules=all' ) as $query ) {
				$legacy_urls = array( $home_url . '/' . $query );
				if ( $site_url !== $home_url ) {
					$legacy_urls[] = $site_url . $query;
					$legacy_urls[] = $site_url . '/' . $query;
				}

				self::migrate_legacy_record( $home_url . $query, $legacy_urls );
			}
		}

		update_option( self::LEGACY_MIGRATED_OPTION, 1, true );
	}

	/**
	 * Move the newest of the older records to the given URL's key, unless its own record is newer.
	 *
	 * @param string   $url         The URL as it is keyed now.
	 * @param string[] $legacy_urls The spellings its scores may have been saved under.
	 */
	private static function migrate_legacy_record( $url, $legacy_urls ) {
		$newest_entries      = array();
		$legacy_option_names = array();

		foreach ( $legacy_urls as $legacy_url ) {
			$option_name = static::OPTION_PREFIX . hash( Speed_Score_Request::CACHE_KEY_HASH_ALGO, $legacy_url );
			$entries     = get_option( $option_name, array() );

			if ( empty( $entries ) ) {
				continue;
			}

			if ( self::get_latest_timestamp( $entries ) > self::get_latest_timestamp( $newest_entries ) ) {
				$newest_entries = $entries;
			}
			$legacy_option_names[] = $option_name;
		}

		if ( empty( $legacy_option_names ) ) {
			return;
		}

		$option_name = static::OPTION_PREFIX . Speed_Score_Request::generate_cache_id_from_url( $url );
		if ( self::get_latest_timestamp( $newest_entries ) > self::get_latest_timestamp( get_option( $option_name, array() ) ) ) {
			update_option( $option_name, $newest_entries, false );
		}

		// Do not reorder: a request that finds these gone must also find the record they moved to.
		foreach ( $legacy_option_names as $legacy_option_name ) {
			delete_option( $legacy_option_name );
		}
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
