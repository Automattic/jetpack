<?php
/**
 * Tests for /sites/%s/categories/slug:%s
 *
 * @package automattic/jetpack
 */

if ( ( ! defined( 'IS_WPCOM' ) || ! IS_WPCOM ) && defined( 'JETPACK__PLUGIN_DIR' ) && JETPACK__PLUGIN_DIR ) {
	require_once JETPACK__PLUGIN_DIR . 'modules/module-extras.php';
}

require_jetpack_file( 'class.json-api-endpoints.php' );

/**
 * Tests for /sites/%s/categories/slug:%s
 */
class WP_Test_Jetpack_Json_Api_Endpoints extends WP_UnitTestCase {
	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'Get';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	/**
	 *  Called before every test.
	 */
	public function set_up() {
		parent::set_up();

		global $blog_id;

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		$this->set_globals();

		// Initialize some missing stuff for the API.
		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );
	}

	/**
	 * Creates a WPCOM_JSON_API_Get_Taxonomy_Endpoint
	 *
	 * @author nylen
	 *
	 * @return WPCOM_JSON_API_Get_Taxonomy_Endpoint
	 */
	public function create_get_category_endpoint() {
		// From json-endpoints/class.wpcom-json-api-get-taxonomy-endpoint.php :( .
		return new WPCOM_JSON_API_Get_Taxonomy_Endpoint(
			array(
				'description'     => 'Get information about a single category.',
				'group'           => 'taxonomy',
				'stat'            => 'categories:1',
				'method'          => 'GET',
				'path'            => '/sites/%s/categories/slug:%s',
				'path_labels'     => array(
					'$site'     => '(int|string) Site ID or domain',
					'$category' => '(string) The category slug',
				),
				'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/categories/slug:community',
			)
		);
	}

	/**
	 * Tests get term feed url with pretty permalinks.
	 *
	 * @author nylen
	 * @covers WPCOM_JSON_API_Get_Taxonomy_Endpoint
	 * @group json-api
	 */
	public function test_get_term_feed_url_pretty_permalinks() {
		global $blog_id;

		$this->set_permalink_structure( '/%year%/%monthnum%/%postname%/' );
		// Reset taxonomy URL structure after changing permalink structure.
		create_initial_taxonomies();

		$category = wp_insert_term( 'test_category', 'category' ); // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable

		$endpoint = $this->create_get_category_endpoint();

		$response = $endpoint->callback(
			sprintf( '/sites/%d/categories/slug:test_category', $blog_id ),
			$blog_id,
			'test_category'
		);

		$this->assertStringEndsWith(
			'/category/test_category/feed/',
			$response->feed_url
		);
	}

	/**
	 * Tests get term feed url with ugly permalinks.
	 *
	 * @author nylen
	 * @covers WPCOM_JSON_API_Get_Taxonomy_Endpoint
	 * @group json-api
	 */
	public function test_get_term_feed_url_ugly_permalinks() {
		global $blog_id;

		$this->set_permalink_structure( '' );
		// Reset taxonomy URL structure after changing permalink structure.
		create_initial_taxonomies();

		$category = wp_insert_term( 'test_category', 'category' );

		$endpoint = $this->create_get_category_endpoint();

		$response = $endpoint->callback(
			sprintf( '/sites/%d/categories/slug:test_category', $blog_id ),
			$blog_id,
			'test_category'
		);

		$this->assertStringEndsWith(
			'/?feed=rss2&amp;cat=' . $category['term_id'],
			$response->feed_url
		);
	}
}
