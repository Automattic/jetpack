<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis;

require_once __DIR__ . '/jetpack-boost-mock-api.php';

class WPCOM_API_Image_Size_Analysis {

	private $page         = 1;
	private $group        = 'all';
	private $search_query = '';

	public function get() {

		// @TODO:
		// This is going to slow down the dashboard if it's uncached and synchronous
		// because the DataSync expects this to be available
		// when the page is being loaded
		// because it's using wp_localize_script under the hood
		// so we need either a lazy DataSync option
		// at the very least, it needs to be cached.

		// Simulate a slow-ish API call
		// sleep(2);

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

	public function set_page( $page_number ) {
		$this->page = $page_number;
	}

	public function set_group( $group ) {
		$this->group = $group;
	}

	public function set_search_query( $search_query ) {
		$this->search_query = $search_query;
	}
}

