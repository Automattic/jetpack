<?php

class Jetpack_Search_Performance_Logger {
	/**
	 * @var Jetpack_Search_Performance_Logger
	 **/
	private static $instance = null;

	private $current_query = null;
	private $query_started = null;
	private $stats = null;

	static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new Jetpack_Search_Performance_Logger;
		}

		return self::$instance;
	}

	private function __construct() {
		$this->stats = array();
		add_action( 'pre_get_posts', array( $this, 'begin_log_query' ), 10, 1 );
		add_action( 'did_jetpack_search_query', array( $this, 'log_jetpack_search_query' ) );
		add_filter( 'found_posts', array( $this, 'log_mysql_query' ), 10, 2 );
		add_action( 'wp_footer', array( $this, 'print_stats' ) );
	}

	public function begin_log_query( $query  ) {
		if ( $this->should_log_query( $query ) ) {
			$this->query_started = microtime( true );
			$this->current_query = $query;
		}
	}

	public function log_mysql_query( $found_posts, $query ) {
		if ( $this->current_query === $query ) {
			$duration = microtime( true ) - $this->query_started;
			if ( $duration < 60 ) { // eliminate outliers, likely tracking errors
				$this->record_query_time( $duration, false );
			}
			$this->reset_query_state();
		}

		return $found_posts;
	}

	public function log_jetpack_search_query() {
		$duration = microtime( true ) - $this->query_started;
		if ( $duration < 60 ) { // eliminate outliers, likely tracking errors
			$this->record_query_time( $duration, true );
		}
		$this->reset_query_state();
	}

	private function reset_query_state() {
		$this->query_started = null;
		$this->current_query = null;
	}

	private function should_log_query( $query ) {
		return $query->is_main_query() && $query->is_search();
	}

	private function record_query_time( $duration, $was_jetpack_search ) {
		$this->stats[] = array( $was_jetpack_search, (int) ( $duration * 1000 ) );
	}

	public function print_stats() {
		$beacons = array();
		if ( ! empty( $this->stats ) ) {
			foreach( $this->stats as $stat ) {
				$search_type = $stat[0] ? 'es' : 'mysql';
				$beacons[] = "%22jetpack.search.{$search_type}.duration:{$stat[1]}|ms%22";
			}

			$encoded_json = '{%22beacons%22:[' . implode(',', $beacons ) . ']}';
			$encoded_site_url = urlencode( site_url() );
			$url = "https://pixel.wp.com/boom.gif?v=0.9&u={$encoded_site_url}&json={$encoded_json}";
			echo '<img src="' . $url . '" width="1" height="1" style="display:none;" alt=":)"/>';
		}
	}
}
