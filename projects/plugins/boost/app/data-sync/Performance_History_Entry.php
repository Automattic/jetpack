<?php

use Automattic\Jetpack\Boost_Speed_Score\Speed_Score_Graph_History_Request;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;

class Performance_History_Entry implements Entry_Can_Get, Entry_Can_Set {
	private $start_date;
	private $end_date;

	public function __construct() {
		// Default to the last 30 days
		$this->start_date = ( time() - 60 * 60 * 24 * 300 ) * 1000;
		$this->end_date   = time() * 1000;
	}

	public function get() {
		$request = new Speed_Score_Graph_History_Request( $this->start_date, $this->end_date, array() );
		$result  = $request->execute();

		return array(
			'startDate' => $result->data->_meta->start,
			'endDate'   => $result->data->_meta->end,
			'periods'   => $result->data->periods,
		);
	}

	public function set( $value ) {
		$this->start_date = $value['startDate'];
		$this->end_date   = $value['endDate'];
	}
}
