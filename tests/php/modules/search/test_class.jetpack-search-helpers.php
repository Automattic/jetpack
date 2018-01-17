<?php


require dirname( __FILE__ ) . '/../../../../modules/search/class.jetpack-search-helpers.php';

class WP_Test_Jetpack_Search_Helpers extends WP_UnitTestCase {
	protected $request_uri;
	protected $get;

	function setup() {
		$this->request_uri = $_SERVER['REQUEST_URI'];
		$this->get = $_GET;
	}

	function tearDown() {
		$_SERVER['REQUEST_URI'] = $this->request_uri;
		$_GET = $this->get;
	}

	function test_get_search_url_removes_page_when_no_query_s() {
		$_SERVER['REQUEST_URI'] = "http://example.com/search/test/page/2/";
		set_query_var( 's', 'test' );

		$url = Jetpack_Search_Helpers::get_search_url();

		$this->assertNotContains( '/search/test/', $url );
		$this->assertNotContains( '/page/', $url );
		$this->assertContains( 's=test', $url );
	}

	function test_get_search_url_removes_page() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::get_search_url();

		$this->assertNotContains( '/page/', $url );
		$this->assertContains( 's=test', $url );
	}

	function test_get_search_url_removes_paged_query_arg() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test&paged=2";
		$_GET['s'] = 'test';
		$_GET['paged'] = '2';

		$url = Jetpack_Search_Helpers::get_search_url();

		$this->assertNotContains( 'paged=', $url );
		$this->assertContains( 's=test', $url );
	}

	function test_add_query_arg_works_when_sending_array_of_args() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test&post_type=page";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::add_query_arg( array(
			'post_type' => 'page',
			'category' => 'uncategorized',
		) );

		$this->assertContains( 's=test', $url );
		$this->assertContains( 'post_type=page', $url );
		$this->assertContains( 'category=uncategorized', $url );
	}

	function test_add_query_arg_does_not_persist_page() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test&post_type=page";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::add_query_arg( 'post_type', 'page' );

		$this->assertNotContains( '/page/', $url );
		$this->assertContains( 's=test', $url );
	}

	function test_remove_query_arg_does_not_persist_page() {
		$_SERVER['REQUEST_URI'] = "http://example.com/page/2/?s=test";
		$_GET['s'] = 'test';

		$url = Jetpack_Search_Helpers::remove_query_arg( 'post_type' );

		$this->assertNotContains( '/page/', $url );
		$this->assertContains( 's=test', $url );
		$this->assertNotContains( 'post_type=', $url );
	}
}
