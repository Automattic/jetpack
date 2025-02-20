<?php
namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Graph_History_Request;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;

class Performance_History_Entry implements Lazy_Entry, Entry_Can_Get, Entry_Can_Set {
	private $start_date;
	private $end_date;

	public function __construct() {
		// Default to the last 30 days
		$this->start_date = ( time() - 60 * 60 * 24 * 30 ) * 1000;
		$this->end_date   = time() * 1000;
	}

	public function get( $_fallback = false ) {
		$request = new Speed_Score_Graph_History_Request( $this->start_date, $this->end_date, array() );
		$result  = $request->execute();

		if ( is_wp_error( $result ) || empty( $result['data'] ) ) {
			return array(
				'startDate'   => $this->start_date,
				'endDate'     => $this->end_date,
				'periods'     => array(),
				'annotations' => array(),
			);
		}

		$annotations = isset( $result['data']['annotations'] ) ? $result['data']['annotations'] : array();
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

	public function set( $value ) {
		$this->start_date = $value['startDate'];
		$this->end_date   = $value['endDate'];
	}
}
