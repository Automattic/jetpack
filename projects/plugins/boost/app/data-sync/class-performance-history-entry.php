<?php
namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Graph_History_Request;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;
use Automattic\Jetpack_Boost\Admin\Admin;

class Performance_History_Entry implements Lazy_Entry, Entry_Can_Get, Entry_Can_Set {
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
		$cache_key = 'jetpack_boost_older_history_' . md5( wp_json_encode( $this->older_windows ) );
		$cached    = get_transient( $cache_key );
		if ( false !== $cached ) {
			return $cached;
		}

		$history = array(
			'startDate'   => $this->start_date,
			'endDate'     => $this->end_date,
			'periods'     => array(),
			'annotations' => array(),
		);
		foreach ( $this->older_windows as $window ) {
			$request = new Speed_Score_Graph_History_Request( $window['startDate'], $window['endDate'], array() );
			$result  = $request->execute();
			if ( is_wp_error( $result ) ) {
				throw new \RuntimeException( $result->get_error_message() );
			}
			if ( ! isset( $result['data'] ) || ! is_array( $result['data'] ) || ( array() !== $result['data'] && ! isset( $result['data']['periods'] ) ) ) {
				throw new \RuntimeException( 'Invalid performance history response.' );
			}
			$periods = $result['data']['periods'] ?? array();
			if ( ! is_array( $periods ) ) {
				throw new \RuntimeException( 'Invalid performance history periods.' );
			}
			foreach ( $periods as $period ) {
				if ( ! isset( $period['timestamp'] ) || ! is_numeric( $period['timestamp'] ) ) {
					throw new \RuntimeException( 'Invalid performance history timestamp.' );
				}
				if ( $period['timestamp'] >= $window['startDate'] && $period['timestamp'] <= $window['endDate'] ) {
					$history['periods'][] = $period;
				}
			}
			if ( $history['periods'] ) {
				break;
			}
		}

		// Cache only this exact walk; capped responses cannot establish a global earliest score.
		set_transient( $cache_key, $history, 12 * 60 * 60 );
		return $history;
	}

	public function set( $value ) {
		$this->start_date     = $value['startDate'];
		$this->end_date       = $value['endDate'];
		$this->surface_errors = true === ( $value['surfaceErrors'] ?? false );
		$this->older_windows  = $value['olderWindows'] ?? array();
		if ( count( $this->older_windows ) > 6 ) {
			throw new \InvalidArgumentException( 'At most six older history windows are supported.' );
		}
	}
}
