<?php // phpcs:ignore WordPress.Files.FileName.InvalidClassFileName

/**
 * List dropdown pages endpoint.
 */
new WPCOM_JSON_API_List_Dropdown_Pages_Endpoint(
	array(

		'description'                          => 'Get a list of pages to be displayed as options in a select-a-page-dropdown.',
		'min_version'                          => '1.1',
		'max_version'                          => '1.1',

		'group'                                => 'posts',
		'stat'                                 => 'posts:dropdown-pages',

		'method'                               => 'GET',
		'path'                                 => '/sites/%s/dropdown-pages/',
		'path_labels'                          => array(
			'$site' => '(int|string) Site ID or domain',
		),

		'allow_fallback_to_jetpack_blog_token' => true,

		'example_request'                      => 'https://public-api.wordpress.com/rest/v1.1/sites/en.blog.wordpress.com/dropdown-pages/',
	)
);

/**
 * Endpoint class responsible for listing pages to be displayed as options in a select-a-page-dropdown.
 *
 * /sites/%s/dropdown-pages/ -> $blog_id
 */
class WPCOM_JSON_API_List_Dropdown_Pages_Endpoint extends WPCOM_JSON_API_Post_Endpoint {
	/**
	 * The response format.
	 *
	 * @var array
	 */
	public $response_format = array(
		'dropdown_pages' => '(array:page) An array of page objects.',
	);

	/**
	 * API callback.
	 *
	 * @param string $path - the path.
	 * @param string $blog_id - the blog id.
	 * @return stdClass[] $pages - array of objects containing only the ID and title fields. An empty array if no pages are found.
	 */
	public function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		$pages = self::get_pages();
		return $pages;
	}

	/**
	 * Get all pages for the current site. The results are cached.
	 *
	 * @return stdClass[] $pages - array of objects containing only the ID and title fields.
	 */
	protected static function get_pages() {
		global $wpdb;

		$last_changed = wp_cache_get_last_changed( 'posts' );
		$cache_key    = "get_pages:$last_changed";
		$pages        = wp_cache_get( $cache_key, 'dropdown_pages' );
		if ( false === $pages ) {
			$pages = $wpdb->get_results( "SELECT {$wpdb->posts}.ID, {$wpdb->posts}.post_title as title FROM {$wpdb->posts} WHERE {$wpdb->posts}.post_type = 'page' AND {$wpdb->posts}.post_status = 'publish' ORDER BY {$wpdb->posts}.post_title ASC" );
			wp_cache_set( $cache_key, $pages, 'dropdown_pages' );
		}

		return $pages;
	}
}
