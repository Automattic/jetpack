<?php

namespace Automattic\Jetpack_Boost\Modules\Image_Size_Analysis;

require_once __DIR__ . '/jetpack-boost-mock-api.php';

class WPCOM_API_Image_Size_Analysis {


	private $page         = 1;
	private $group        = 'all';
	private $search_query = '';


	public function get() {

		//		sleep(2); // Simulate a slow-ish API call

		return array(
			'query' => array(
				'page'   => $this->page,
				'group'  => $this->group,
				'search' => $this->search_query,
			),
			'data'  => array(
				'last_updated' => 1682419855474,
				'total_pages'  => 3,
				'images'       => jetpack_boost_mock_api( 10, $this->page ),
			),
		);
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
