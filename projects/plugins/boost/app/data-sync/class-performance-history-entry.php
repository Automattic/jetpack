<?php
namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\Boost_Core\Lib\Transient;
use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Graph_History_Request;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;
use Automattic\Jetpack_Boost\Admin\Admin;
use Automattic\Jetpack_Boost\Lib\Connection;

class Performance_History_Entry implements Lazy_Entry, Entry_Can_Get, Entry_Can_Set {
	/**
	 * How many older windows one request may ask about. Kept in step with
	 * olderWindowLimit in _inc/overview/lib/use-history-range.ts.
	 */
	private const OLDER_WINDOW_LIMIT = 6;

	/**
	 * Daily recording only lands scores in windows that end today, so an older window keeps
	 * whatever it holds until this expiry passes or Connection::register() clears the cache.
	 */
	private const OLDER_WINDOW_TTL = 12 * 60 * 60;

	private const CACHE_PREFIX = 'older_history_';

	private $start_date;
	private $end_date;
	private $surface_errors = false;
	private $older_windows  = array();

	public function __construct() {
		// Default to the last 30 days
		$this->start_date = ( time() - 60 * 60 * 24 * 30 ) * 1000;
		$this->end_date   = time() * 1000;
	}

	public function get( $_fallback = false ) {
		if ( $this->older_windows ) {
			return $this->get_older_history();
		}

		$request = new Speed_Score_Graph_History_Request( $this->start_date, $this->end_date, array() );
		$result  = $request->execute();

		/** This filter is documented in app/admin/class-admin.php */
		if ( is_wp_error( $result ) && $this->surface_errors && apply_filters( Admin::MODERNIZATION_FILTER, false ) ) {
			throw new \RuntimeException( $result->get_error_message() );
		}

		if ( is_wp_error( $result ) || empty( $result['data'] ) ) {
			return array(
				'startDate'   => $this->start_date,
				'endDate'     => $this->end_date,
				'periods'     => array(),
				'annotations' => array(),
			);
		}

		$annotations = $result['data']['annotations'] ?? array();
		// Sanitize the annotations
		foreach ( $annotations as $key => $annotation ) {
			$annotations[ $key ] = array(
				'timestamp' => $annotation['timestamp'],
				'text'      => wp_kses_post( $annotation['text'] ),
			);
		}

		return array(
			'startDate'   => $result['data']['_meta']['start'],
			'endDate'     => $result['data']['_meta']['end'],
			'periods'     => $result['data']['periods'],
			'annotations' => $annotations,
		);
	}

	private function get_older_history() {
		$history = array(
			'startDate'   => $this->start_date,
			'endDate'     => $this->end_date,
			'periods'     => array(),
			'annotations' => array(),
		);

		foreach ( $this->older_windows as $window ) {
			$periods = $this->get_older_window_periods( $window );
			if ( $periods ) {
				$history['periods'] = $periods;
				break;
			}
		}

		return $history;
	}

	private function get_older_window_periods( $window ) {
		$cache_key = self::CACHE_PREFIX . md5( wp_json_encode( array( Connection::wpcom_blog_id(), $window ), JSON_UNESCAPED_SLASHES ) );
		$cached    = Transient::get( $cache_key );
		if ( null !== $cached ) {
			return $cached;
		}

		$request = new Speed_Score_Graph_History_Request( $window['startDate'], $window['endDate'], array() );
		$result  = $request->execute();
		if ( is_wp_error( $result ) ) {
			throw new \RuntimeException( $result->get_error_message() );
		}

		// A response without history reads as an empty window, matching the single-window path above.
		$data = $result['data'] ?? array();
		if ( ! is_array( $data ) || ( array() !== $data && ! isset( $data['periods'] ) ) ) {
			throw new \RuntimeException( 'Invalid performance history response.' );
		}
		$periods = $data['periods'] ?? array();
		if ( ! is_array( $periods ) ) {
			throw new \RuntimeException( 'Invalid performance history periods.' );
		}

		$found = array();
		foreach ( $periods as $period ) {
			if ( ! isset( $period['timestamp'] ) || ! is_numeric( $period['timestamp'] ) ) {
				throw new \RuntimeException( 'Invalid performance history timestamp.' );
			}
			if ( $period['timestamp'] >= $window['startDate'] && $period['timestamp'] <= $window['endDate'] ) {
				$found[] = $period;
			}
		}

		Transient::set( $cache_key, $found, self::OLDER_WINDOW_TTL );
		return $found;
	}

	/**
	 * Forget every cached older window, for when registering the site alters what history exists.
	 */
	public static function clear_cache() {
		Transient::delete_by_prefix( self::CACHE_PREFIX );
	}

	public function set( $value ) {
		$older_windows = $value['olderWindows'] ?? array();
		if ( true === ( $value['checkOlderWindows'] ?? false ) && ! $older_windows ) {
			throw new \RuntimeException( 'Older history windows are missing or malformed.' );
		}
		if ( count( $older_windows ) > self::OLDER_WINDOW_LIMIT ) {
			throw new \RuntimeException( 'At most ' . self::OLDER_WINDOW_LIMIT . ' older history windows are supported.' );
		}

		$this->start_date     = $value['startDate'];
		$this->end_date       = $value['endDate'];
		$this->surface_errors = true === ( $value['surfaceErrors'] ?? false );
		$this->older_windows  = $older_windows;
	}
}
