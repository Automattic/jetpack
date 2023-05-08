<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\WPCOM_API_Image_Size_Analysis;

class Image_Size_Analysis_Entry implements Entry_Can_Get, Entry_Can_Set {
	/**
	 * @var WPCOM_API_Image_Size_Analysis
	 */
	protected $api;

	public function __construct() {
		$this->api = new WPCOM_API_Image_Size_Analysis();
	}

	public function get() {
		return $this->api->get();
	}

	public function set( $value ) {
		$this->api->set_page( $value['query']['page'] );
		$this->api->set_group( $value['query']['group'] );
		$this->api->set_search_query( $value['query']['search'] );
	}
}

