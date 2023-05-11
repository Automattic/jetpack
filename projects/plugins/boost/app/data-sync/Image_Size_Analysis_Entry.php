<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;
use Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\WPCOM_API_Image_Size_Analysis;

class Image_Size_Analysis_Entry implements Lazy_Entry, Entry_Can_Get, Entry_Can_Set {
	/**
	 * @var WPCOM_API_Image_Size_Analysis
	 */
	protected $api;

	public function __construct() {
		$this->api = new WPCOM_API_Image_Size_Analysis();
	}

	public function get() {
		// phpcs:ignore
		// sleep( 3 ); // to test out a slow API call.
		return $this->api->get();
	}

	public function set( $value ) {
		$this->api->set_page( $value['query']['page'] );
		$this->api->set_group( $value['query']['group'] );
		$this->api->set_search_query( $value['query']['search'] );
	}
}


