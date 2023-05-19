<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\Data_Sync;

use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Lazy_Entry;
use function Automattic\Jetpack_Boost\Modules\Image_Size_Analysis\jetpack_boost_mock_api;

require_once dirname( __DIR__ ) . '/jetpack-boost-mock-api.php';

class Image_Size_Analysis_Entry implements Lazy_Entry, Entry_Can_Get, Entry_Can_Set {

	private $page         = 1;
	private $group        = 'all';
	private $search_query = '';

	public function get() {

		$results = array(
			'query' => array(
				'page'   => $this->page,
				'group'  => $this->group,
				'search' => $this->search_query,
			),
			'data'  => array(
				'last_updated' => 1682419855474,
				// This is fine 🔥- while in development only
				// phpcs:ignore
				'total_pages'  => random_int( 1, 15 ),
				'images'       => jetpack_boost_mock_api( 10, $this->group, $this->page ),
			),
		);

		// Visual indication that groups are working
		if ( $this->group !== 'all' ) {
			shuffle( $results['data']['images'] );
		}
		return $results;
	}

	public function set( $value ) {
		$this->page         = $value['query']['page'];
		$this->group        = $value['query']['group'];
		$this->search_query = $value['query']['search'];
	}
}


