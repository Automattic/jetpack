<?php
/**
 * Speed score history after Jetpack Boost
 *
 * @link       https://automattic.com
 * @package    automattic/jetpack-boost
 */

namespace Automattic\Jetpack_Boost\Lib;

/**
 * Class Speed_Score_History
 *
 * @package Automattic\Jetpack_Boost\Lib
 */
class Speed_Score_History {
	const OPTION_PREFIX = 'jetpack_boost_speed_score_history_';

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
	 * Record a new history entry for speed scores.
	 *
	 * @param array $entry The new entry to save.
	 */
	public function push( $entry ) {
		$this->entries[] = $entry;
		$this->entries   = array_slice( $this->entries, - static::LIMIT );
		update_option( $this->get_option_name(), $this->entries );
	}

	/**
	 * Remove all speed score history.
	 */
	public static function clear_all() {
		global $wpdb;

		/**
		 * The prefix used in option_name.
		 */
		$option_prefix = static::OPTION_PREFIX;

		/**
		 * LIKE search pattern for the delete query.
		 */
		$prefix_search_pattern = $wpdb->esc_like( $option_prefix ) . '%';

		$wpdb->query(
			$wpdb->prepare(
				"
					DELETE
					FROM    $wpdb->options
					WHERE   `option_name` LIKE %s
				",
				$prefix_search_pattern
			)
		);
	}
}
