<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * Measure the performance of Jetpack Search queries.
 */
class Jetpack_Search_Performance_Logger {
	/**
	 * Jetpack_Search_Performance_Logger instance.
	 *
	 * @var null|Jetpack_Search_Performance_Logger
	 */
	private static $instance = null;

	/**
	 * WP_Query instance.
	 *
	 * @var null|WP_Query
	 */
	private $current_query = null;

	/**
	 * Time when the query was started.
	 *
	 * @var null|float
	 */
	private $query_started = null;

	/**
	 * Performance results.
	 *
	 * @var null|array
	 */
	private $stats = null;

	/**
	 * Initialize the class.
	 */
	public static function init() {
		if ( self::$instance === null ) {
			self::$instance = new Jetpack_Search_Performance_Logger();
		}

		return self::$instance;
	}

	/**
	 * The constructor.
	 */
	private function __construct() {
		$this->stats = array();
		add_action( 'pre_get_posts', array( $this, 'begin_log_query' ), 10, 1 );
		add_action( 'did_jetpack_search_query', array( $this, 'log_jetpack_search_query' ) );
		add_filter( 'found_posts', array( $this, 'log_mysql_query' ), 10, 2 );
		add_action( 'wp_footer', array( $this, 'print_stats' ) );
	}

	/**
	 * Log the time when the query was started.
	 *
	 * @param WP_Query $query The query.
	 */
	public function begin_log_query( $query ) {
		if ( $this->should_log_query( $query ) ) {
			$this->query_started = microtime( true );
			$this->current_query = $query;
		}
	}

	/**
	 * Record the time when an SQL query was completed.
	 *
	 * @param int      $found_posts The number of posts found.
	 * @param WP_Query $query       The WP_Query instance (passed by reference).
	 */
	public function log_mysql_query( $found_posts, $query ) {
		if ( $this->current_query === $query ) {
			$duration = microtime( true ) - $this->query_started;
			if ( $duration < 60 ) { // eliminate outliers, likely tracking errors.
				$this->record_query_time( $duration, false );
			}
			$this->reset_query_state();
		}

		return $found_posts;
	}

	/**
	 * Log Jetpack Search query.
	 */
	public function log_jetpack_search_query() {
		$duration = microtime( true ) - $this->query_started;
		if ( $duration < 60 ) { // eliminate outliers, likely tracking errors.
			$this->record_query_time( $duration, true );
		}
		$this->reset_query_state();
	}

	/**
	 * Reset data after each log.
	 */
	private function reset_query_state() {
		$this->query_started = null;
		$this->current_query = null;
	}

	/**
	 * Check if a query should be logged (a main query, or a jetpack search query).
	 *
	 * @param WP_Query $query The WP_Query instance.
	 */
	private function should_log_query( $query ) {
		return $query->is_main_query() && $query->is_search();
	}

	/**
	 * Record the time of a query.
	 *
	 * @param float $duration           The duration of the query.
	 * @param bool  $was_jetpack_search Was this a Jetpack Search query.
	 */
	private function record_query_time( $duration, $was_jetpack_search ) {
		$this->stats[] = array( $was_jetpack_search, (int) ( $duration * 1000 ) );
	}

	/**
	 * Print performance stats in the footer.
	 */
	public function print_stats() {
		$beacons = array();
		if ( ! empty( $this->stats ) ) {
			foreach ( $this->stats as $stat ) {
				$search_type = $stat[0] ? 'es' : 'mysql';
				$beacons[]   = "%22jetpack.search.{$search_type}.duration:{$stat[1]}|ms%22";
			}

			$encoded_json     = '{%22beacons%22:[' . implode( ',', $beacons ) . ']}';
			$encoded_site_url = rawurlencode( site_url() );
			$url              = "https://pixel.wp.com/boom.gif?v=0.9&u={$encoded_site_url}&json={$encoded_json}";
			echo '<img src="' . esc_url( $url ) . '" width="1" height="1" style="display:none;" alt=""/>';
		}
	}
}
