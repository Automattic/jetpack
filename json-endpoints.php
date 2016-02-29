<?php

/*
 * Endpoint class definitions. Only instantiations should be in this file
 *   file ordering matters
 */

$json_endpoints_dir = dirname( __FILE__ ) . '/json-endpoints/';

//abstract endpoints
require_once( $json_endpoints_dir . 'class.wpcom-json-api-post-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-post-v1-1-endpoint.php' ); // v1.1
require_once( $json_endpoints_dir . 'class.wpcom-json-api-comment-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-taxonomy-endpoint.php' );


// **********
// v1
// **********

require_once( $json_endpoints_dir . 'class.wpcom-json-api-delete-media-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-comment-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-media-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-post-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-render-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-render-shortcode-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-shortcodes-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-render-embed-reversal-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-render-embed-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-embeds-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-site-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-taxonomies-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-taxonomy-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-comments-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-media-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-post-types-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-posts-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-roles-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-users-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-site-user-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-comment-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-media-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-post-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-taxonomy-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-user-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-upload-media-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-site-settings-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-sharing-buttons-endpoint.php' );

// **********
// v1.1
// **********

// Media
require_once( $json_endpoints_dir . 'class.wpcom-json-api-delete-media-v1-1-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-media-v1-1-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-media-v1-1-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-media-v1-1-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-upload-media-v1-1-endpoint.php' );

// Posts
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-post-v1-1-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-posts-v1-1-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-post-v1-1-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-autosave-v1-1-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-autosave-post-v1-1-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-post-counts-v1-1-endpoint.php' );

// Custom Menus
require_once( $json_endpoints_dir . 'class.wpcom-json-api-menus-v1-1-endpoint.php' );

// Users
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-invites-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-invites-endpoint.php' );

// Custom CSS
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-customcss.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-customcss.php' );

// **********
// v1.2
// **********
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-post-v1-2-endpoint.php' );

// Jetpack Only Endpoints
$json_jetpack_endpoints_dir = dirname( __FILE__ ) . '/json-endpoints/jetpack/';

// This files instantiates the endpoints
require_once( $json_jetpack_endpoints_dir . 'json-api-jetpack-endpoints.php' );

/*
 * Endpoint instantiations
 */

new WPCOM_JSON_API_GET_Site_Endpoint( array(
	'description' => 'Get information about a site.',
	'group'	      => 'sites',
	'stat'        => 'sites:X',
	'allowed_if_flagged' => true,
	'method'      => 'GET',
	'path'        => '/sites/%s',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'context' => false,
	),

	'response_format' => WPCOM_JSON_API_GET_Site_Endpoint::$site_format,

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/',
) );

new WPCOM_JSON_API_GET_Post_Counts_V1_1_Endpoint( array(
	'description'   => 'Get number of posts in the post type groups by post status',
	'group'         => 'sites',
	'stat'          => 'sites:X:post-counts:X',
	'force'         => 'wpcom',
	'method'        => 'GET',
	'min_version'   => '1.1',
	'max_version'   => '1.2',
	'path'          => '/sites/%s/post-counts/%s',
	'path_labels'   => array(
		'$site'       => '(int|string) Site ID or domain',
		'$post_type'  => '(string) Post Type',
	),

	'query_parameters' => array(
		'context' => false,
		'author' => '(int) author ID',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1.2/sites/en.blog.wordpress.com/post-counts/page',

	'response_format' => array(
		'counts' => array(
			'all' => '(array) Number of posts by any author in the post type grouped by post status',
			'mine' => '(array) Number of posts by the current user in the post type grouped by post status'
		)
	)
) );


new WPCOM_JSON_API_List_Post_Formats_Endpoint( array(
	'description' => 'Get a list of post formats supported by a site.',
	'group'       => '__do_not_document',
	'stat'        => 'sites:X:post-formats',

	'method'      => 'GET',
	'path'        => '/sites/%s/post-formats',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'context' => false,
	),

	'response_format' => array(
		'formats' => '(array) A list of supported post formats. id => label.',
	)
) );

new WPCOM_JSON_API_List_Page_Templates_Endpoint( array(
	'description' => 'Get a list of page templates supported by a site.',
	'group'       => 'sites',
	'stat'        => 'sites:X:post-templates',

	'method'      => 'GET',
	'path'        => '/sites/%s/page-templates',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),
	'query_parameters' => array(
		'context' => false,
	),
	'response_format' => array(
		'templates' => '(array) A list of supported page templates. Contains label and file.',
	)
) );

new WPCOM_JSON_API_List_Post_Types_Endpoint( array (
	'description' => 'Get a list of post types available for a site.',
	'group'       => 'sites',
	'stat'        => 'sites:X:post-types',

	'method'      => 'GET',
	'path'        => '/sites/%s/post-types',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'api_queryable' => '(bool) If true, only queryable post types are returned',
	),

	'response_format' => array(
		'found'      => '(int) The number of post types found',
		'post_types' => '(array) A list of available post types',
	)
) );

/*
 * Shortcode endpoints
 */

new WPCOM_JSON_API_List_Shortcodes_Endpoint( array(
	'description' => "Get a list of shortcodes available on a site. Note: The current user must have publishing access.",
	'group'       => 'sites',
	'stat'        => 'shortcodes',
	'method'      => 'GET',
	'path'        => '/sites/%s/shortcodes',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
	),
	'response_format' => array(
		'shortcodes' => '(array) A list of supported shortcodes by their handle.',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/82974409/shortcodes',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	)
) );

new WPCOM_JSON_API_Render_Shortcode_Endpoint( array(
	'description' => "Get a rendered shortcode for a site. Note: The current user must have publishing access.",
	'group'       => 'sites',
	'stat'        => 'shortcodes:render',
	'method'      => 'GET',
	'path'        => '/sites/%s/shortcodes/render',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
	),
	'query_parameters' => array(
		'shortcode'     => '(string) The query-string encoded shortcode string to render. Required. Only accepts one at a time.',
	),
	'response_format' => array(
		'shortcode' => '(string) The shortcode that was passed in for rendering.',
		'result'    => '(html) The rendered HTML result of the shortcode.',
		'scripts'   => '(array) An array of JavaScript files needed to render the shortcode. Returned in the format of <code>{ "script-slug" : { "src": "http://example.com/file.js", "extra" : "" } }</code> where extra contains any neccessary extra JS for initializing the source file and src contains the script to load. Omitted if no scripts are neccessary.',
		'styles'    => '(array) An array of CSS files needed to render the shortcode. Returned in the format of <code>{ "style-slug" : { "src": "http://example.com/file.css", "media" : "all" } }</code>. Omitted if no styles are neccessary.',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/82974409/shortcodes/render?shortcode=%5Bgallery%20ids%3D%22729%2C732%2C731%2C720%22%5D',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	)
) );

/*
 * embed endpoints
 */
new WPCOM_JSON_API_List_Embeds_Endpoint( array(
	'description' => "Get a list of embeds available on a site. Note: The current user must have publishing access.",
	'group'       => 'sites',
	'stat'        => 'embeds',
	'method'      => 'GET',
	'path'        => '/sites/%s/embeds',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
	),
	'response_format' => array(
		'embeds' => '(array) A list of supported embeds by their regex pattern.',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/82974409/embeds',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	)
) );

new WPCOM_JSON_API_Render_Embed_Endpoint( array(
	'description' => "Get a rendered embed for a site. Note: The current user must have publishing access.",
	'group'       => 'sites',
	'stat'        => 'embeds:render',
	'method'      => 'GET',
	'path'        => '/sites/%s/embeds/render',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
	),
	'query_parameters' => array(
		'embed_url'     => '(string) The query-string encoded embed URL to render. Required. Only accepts one at a time.',
	),
	'response_format' => array(
		'embed_url' => '(string) The embed_url that was passed in for rendering.',
		'result'    => '(html) The rendered HTML result of the embed.',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/apiexamples.wordpress.com/embeds/render?embed_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DSQEQr7c0-dw',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	)
) );

new WPCOM_JSON_API_Render_Embed_Reversal_Endpoint( array(
	'description' => "Determines if the given embed code can be reversed into a single line embed or a shortcode, and if so returns the embed or shortcode. Note: The current user must have publishing access.",
	//'group'       => 'sites',
	'group'       => '__do_not_document',
	'stat'        => 'embeds:reversal',
	'method'      => 'POST',
	'path'        => '/sites/%s/embeds/reversal',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
	),
	'request_format' => array(
		'maybe_embed' => '(string) The embed code to reverse. Required. Only accepts one at a time.',
	),
	'response_format' => array(
		'maybe_embed' => '(string) The original embed code that was passed in for rendering.',
		'reversal_type' => '(string) The type of reversal. Either an embed or a shortcode.',
		'render_result' => '(html) The rendered HTML result of the embed or shortcode.',
		'result' => '(string) The reversed content. Either a single line embed or a shortcode.',
		'scripts'   => '(array) An array of JavaScript files needed to render the embed or shortcode. Returned in the format of <code>{ "script-slug" : { "src": "http://example.com/file.js", "extra" : "" } }</code> where extra contains any neccessary extra JS for initializing the source file and src contains the script to load. Omitted if no scripts are neccessary.',
		'styles'    => '(array) An array of CSS files needed to render the embed or shortcode. Returned in the format of <code>{ "style-slug" : { "src": "http://example.com/file.css", "media" : "all" } }</code>. Omitted if no styles are neccessary.',
	),
	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/shortcode-reversals/render/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'maybe_embed' => '<iframe width="480" height="302" src="http://www.ustream.tv/embed/recorded/26370522/highlight/299667?v=3&amp;wmode=direct" scrolling="no" frameborder="0"></iframe>',
		)
	),
) );


/*
 * Post endpoints
 */
new WPCOM_JSON_API_List_Posts_Endpoint( array(
	'description' => 'Get a list of matching posts.',
	'new_version' => '1.1',
	'max_version' => '1',
	'group'       => 'posts',
	'stat'        => 'posts',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'number'   => '(int=20) The number of posts to return. Limit: 100.',
		'offset'   => '(int=0) 0-indexed offset.',
		'page'     => '(int) Return the Nth 1-indexed page of posts. Takes precedence over the <code>offset</code> parameter.',
		'order'    => array(
			'DESC' => 'Return posts in descending order. For dates, that means newest to oldest.',
			'ASC'  => 'Return posts in ascending order. For dates, that means oldest to newest.',
		),
		'order_by' => array(
			'date'          => 'Order by the created time of each post.',
			'modified'      => 'Order by the modified time of each post.',
			'title'         => "Order lexicographically by the posts' titles.",
			'comment_count' => 'Order by the number of comments for each post.',
			'ID'            => 'Order by post ID.',
		),
		'after'    => '(ISO 8601 datetime) Return posts dated on or after the specified datetime.',
		'before'   => '(ISO 8601 datetime) Return posts dated on or before the specified datetime.',
		'tag'      => '(string) Specify the tag name or slug.',
		'category' => '(string) Specify the category name or slug.',
		'type'     => "(string) Specify the post type. Defaults to 'post', use 'any' to query for both posts and pages. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
		'parent_id' => '(int) Returns only posts which are children of the specified post. Applies only to hierarchical post types.',
		'exclude'  => '(array:int|int) Excludes the specified post ID(s) from the response',
		'exclude_tree' => '(int) Excludes the specified post and all of its descendants from the response. Applies only to hierarchical post types.',
		'status'   => array(
			'publish' => 'Return only published posts.',
			'private' => 'Return only private posts.',
			'draft'   => 'Return only draft posts.',
			'pending' => 'Return only posts pending editorial approval.',
			'future'  => 'Return only posts scheduled for future publishing.',
			'trash'   => 'Return only posts in the trash.',
			'any'     => 'Return all posts regardless of status.',
		),
		'sticky'    => array(
			'false'   => 'Post is not marked as sticky.',
			'true'    => 'Stick the post to the front page.',
		),
		'author'   => "(int) Author's user ID",
		'search'   => '(string) Search query',
		'meta_key'   => '(string) Metadata key that the post should contain',
		'meta_value'   => '(string) Metadata value that the post should contain. Will only be applied if a `meta_key` is also given',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/?number=5'
) );

new WPCOM_JSON_API_List_Posts_v1_1_Endpoint( array(
	'description' => 'Get a list of matching posts.',
	'min_version' => '1.1',
	'max_version' => '1.1',

	'group'       => 'posts',
	'stat'        => 'posts',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'number'   => '(int=20) The number of posts to return. Limit: 100.',
		'offset'   => '(int=0) 0-indexed offset.',
		'page'     => '(int) Return the Nth 1-indexed page of posts. Takes precedence over the <code>offset</code> parameter.',
		'page_handle' => '(string) A page handle, returned from a previous API call as a <code>meta.next_page</code> property. This is the most efficient way to fetch the next page of results.',
		'order'    => array(
			'DESC' => 'Return posts in descending order. For dates, that means newest to oldest.',
			'ASC'  => 'Return posts in ascending order. For dates, that means oldest to newest.',
		),
		'order_by' => array(
			'date'          => 'Order by the created time of each post.',
			'modified'      => 'Order by the modified time of each post.',
			'title'         => "Order lexicographically by the posts' titles.",
			'comment_count' => 'Order by the number of comments for each post.',
			'ID'            => 'Order by post ID.',
		),
		'after'    => '(ISO 8601 datetime) Return posts dated after the specified datetime.',
		'before'   => '(ISO 8601 datetime) Return posts dated before the specified datetime.',
		'modified_after'    => '(ISO 8601 datetime) Return posts modified after the specified datetime.',
		'modified_before'   => '(ISO 8601 datetime) Return posts modified before the specified datetime.',
		'tag'      => '(string) Specify the tag name or slug.',
		'category' => '(string) Specify the category name or slug.',
		'type'     => "(string) Specify the post type. Defaults to 'post', use 'any' to query for both posts and pages. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
		'parent_id' => '(int) Returns only posts which are children of the specified post. Applies only to hierarchical post types.',
		'exclude'  => '(array:int|int) Excludes the specified post ID(s) from the response',
		'exclude_tree' => '(int) Excludes the specified post and all of its descendants from the response. Applies only to hierarchical post types.',
		'status'   => '(string) Comma-separated list of statuses for which to query, including any of: "publish", "private", "draft", "pending", "future", and "trash", or simply "any". Defaults to "publish"',
		'sticky'    => array(
			'include'   => 'Sticky posts are not excluded from the list.',
			'exclude'   => 'Sticky posts are excluded from the list.',
			'require'   => 'Only include sticky posts',
		),
		'author'   => "(int) Author's user ID",
		'search'   => '(string) Search query',
		'meta_key'   => '(string) Metadata key that the post should contain',
		'meta_value'   => '(string) Metadata value that the post should contain. Will only be applied if a `meta_key` is also given',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/en.blog.wordpress.com/posts/?number=2'
) );

new WPCOM_JSON_API_Get_Post_Endpoint( array(
	'description' => 'Get a single post (by ID).',
	'group'       => 'posts',
	'stat'        => 'posts:1',
	'new_version' => '1.1',
	'max_version' => '1',
	'method'      => 'GET',
	'path'        => '/sites/%s/posts/%d',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/7'
) );

new WPCOM_JSON_API_Get_Post_v1_1_Endpoint( array(
	'description' => 'Get a single post (by ID).',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'group'       => 'posts',
	'stat'        => 'posts:1',
	'method'      => 'GET',
	'path'        => '/sites/%s/posts/%d',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),
	'example_request'  => 'https://public-api.wordpress.com/rest/v1.1/sites/en.blog.wordpress.com/posts/7'
) );

new WPCOM_JSON_API_Get_Post_Endpoint( array(
	'description' => 'Get a single post (by name)',
	'group'       => '__do_not_document',
	'stat'        => 'posts:name',
	'method'      => 'GET',
	'path'        => '/sites/%s/posts/name:%s',
	'path_labels' => array(
		'$site'      => '(int|string) Site ID or domain',
		'$post_name' => '(string) The post name (a.k.a. slug)',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/name:blogging-and-stuff?pretty=1',
) );

new WPCOM_JSON_API_Get_Post_Endpoint( array(
	'description' => 'Get a single post (by slug).',
	'group'       => 'posts',
	'stat'        => 'posts:slug',
	'new_version' => '1.1',
	'max_version' => '1',
	'method'      => 'GET',
	'path'        => '/sites/%s/posts/slug:%s',
	'path_labels' => array(
		'$site'      => '(int|string) Site ID or domain',
		'$post_slug' => '(string) The post slug (a.k.a. sanitized name)',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/slug:blogging-and-stuff',
) );

new WPCOM_JSON_API_Get_Post_v1_1_Endpoint( array(
	'description' => 'Get a single post (by slug).',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'group'       => 'posts',
	'stat'        => 'posts:slug',
	'method'      => 'GET',
	'path'        => '/sites/%s/posts/slug:%s',
	'path_labels' => array(
		'$site'      => '(int|string) Site ID or domain',
		'$post_slug' => '(string) The post slug (a.k.a. sanitized name)',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/en.blog.wordpress.com/posts/slug:blogging-and-stuff',
) );

new WPCOM_JSON_API_Update_Post_Endpoint( array(
	'description' => 'Create a post.',
	'group'       => 'posts',
	'stat'        => 'posts:new',
	'new_version' => '1.1',
	'max_version' => '1',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/new',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'request_format' => array(
		// explicitly document all input
		'date'      => "(ISO 8601 datetime) The post's creation time.",
		'title'     => '(HTML) The post title.',
		'content'   => '(HTML) The post content.',
		'excerpt'   => '(HTML) An optional post excerpt.',
		'slug'      => '(string) The name (slug) for the post, used in URLs.',
		'author'    => '(string) The username or ID for the user to assign the post to.',
		'publicize' => '(array|bool) True or false if the post be publicized to external services. An array of services if we only want to publicize to a select few. Defaults to true.',
		'publicize_message' => '(string) Custom message to be publicized to external services.',
		'status'    => array(
			'publish' => 'Publish the post.',
			'private' => 'Privately publish the post.',
			'draft'   => 'Save the post as a draft.',
			'pending' => 'Mark the post as pending editorial approval.',
			'auto-draft' => 'Save a placeholder for a newly created post, with no content.',
		),
		'sticky'    => array(
			'false'   => 'Post is not marked as sticky.',
			'true'    => 'Stick the post to the front page.',
		),
		'password'  => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'    => "(int) The post ID of the new post's parent.",
		'type'      => "(string) The post type. Defaults to 'post'. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
		'categories' => "(array|string) Comma-separated list or array of categories (name or id)",
		'tags'       => "(array|string) Comma-separated list or array of tags (name or id)",
		'format'     => array_merge( array( 'default' => 'Use default post format' ), get_post_format_strings() ),
		'featured_image' => "(string) The post ID of an existing attachment to set as the featured image. Pass an empty string to delete the existing image.",
		'media'      => "(media) An array of files to attach to the post. To upload media, the entire request should be multipart/form-data encoded. Multiple media items will be displayed in a gallery. Accepts  jpg, jpeg, png, gif, pdf, doc, ppt, odt, pptx, docx, pps, ppsx, xls, xlsx, key. Audio and Video may also be available. See <code>allowed_file_types</code> in the options response of the site endpoint. <br /><br /><strong>Example</strong>:<br />" .
		 				"<code>curl \<br />--form 'title=Image' \<br />--form 'media[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'media_urls' => "(array) An array of URLs for images to attach to a post. Sideloads the media in for a post.",
		'metadata'      => "(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are avaiable for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.",
		'comments_open' => "(bool) Should the post be open to comments? Defaults to the blog's preference.",
		'pings_open'    => "(bool) Should the post be open to comments? Defaults to the blog's preference.",
		'likes_enabled' => "(bool) Should the post be open to likes? Defaults to the blog's preference.",
		'sharing_enabled' => "(bool) Should sharing buttons show on this post? Defaults to true.",
		'menu_order'    => "(int) (Pages Only) the order pages should appear in. Use 0 to maintain alphabetical order.",
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/posts/new/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'title'      => 'Hello World',
			'content'    => 'Hello. I am a test post. I was created by the API',
			'tags'       => 'tests',
			'categories' => 'API'
		)
	)
) );

new WPCOM_JSON_API_Update_Post_v1_1_Endpoint( array(
	'description' => 'Create a post.',
	'group'       => 'posts',
	'stat'        => 'posts:new',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/new',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'request_format' => array(
		// explicitly document all input
		'date'      => "(ISO 8601 datetime) The post's creation time.",
		'title'     => '(HTML) The post title.',
		'content'   => '(HTML) The post content.',
		'excerpt'   => '(HTML) An optional post excerpt.',
		'slug'      => '(string) The name (slug) for the post, used in URLs.',
		'author'    => '(string) The username or ID for the user to assign the post to.',
		'publicize' => '(array|bool) True or false if the post be publicized to external services. An array of services if we only want to publicize to a select few. Defaults to true.',
		'publicize_message' => '(string) Custom message to be publicized to external services.',
		'status'    => array(
			'publish' => 'Publish the post.',
			'private' => 'Privately publish the post.',
			'draft'   => 'Save the post as a draft.',
			'pending' => 'Mark the post as pending editorial approval.',
			'future'  => 'Schedule the post (alias for publish; you must also set a future date).',
			'auto-draft' => 'Save a placeholder for a newly created post, with no content.',
		),
		'sticky'    => array(
			'false'   => 'Post is not marked as sticky.',
			'true'    => 'Stick the post to the front page.',
		),
		'password'  => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'    => "(int) The post ID of the new post's parent.",
		'type'      => "(string) The post type. Defaults to 'post'. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
		'categories' => "(array|string) Comma-separated list or array of categories (name or id)",
		'tags'       => "(array|string) Comma-separated list or array of tags (name or id)",
		'format'     => array_merge( array( 'default' => 'Use default post format' ), get_post_format_strings() ),
		'featured_image' => "(string) The post ID of an existing attachment to set as the featured image. Pass an empty string to delete the existing image.",
		'media'      => "(media) An array of files to attach to the post. To upload media, the entire request should be multipart/form-data encoded. Multiple media items will be displayed in a gallery. Accepts  jpg, jpeg, png, gif, pdf, doc, ppt, odt, pptx, docx, pps, ppsx, xls, xlsx, key. Audio and Video may also be available. See <code>allowed_file_types</code> in the options response of the site endpoint. Errors produced by media uploads, if any, will be in `media_errors` in the response. <br /><br /><strong>Example</strong>:<br />" .
		 				"<code>curl \<br />--form 'title=Image Post' \<br />--form 'media[0]=@/path/to/file.jpg' \<br />--form 'media_attrs[0][caption]=My Great Photo' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'media_urls' => "(array) An array of URLs for images to attach to a post. Sideloads the media in for a post. Errors produced by media sideloading, if any, will be in `media_errors` in the response.",
		'media_attrs' => "(array) An array of attributes (`title`, `description` and `caption`) are supported to assign to the media uploaded via the `media` or `media_urls` properties. You must use a numeric index for the keys of `media_attrs` which follow the same sequence as `media` and `media_urls`. <br /><br /><strong>Example</strong>:<br />" .
		                 "<code>curl \<br />--form 'title=Gallery Post' \<br />--form 'media[]=@/path/to/file1.jpg' \<br />--form 'media_urls[]=http://exapmple.com/file2.jpg' \<br /> \<br />--form 'media_attrs[0][caption]=This will be the caption for file1.jpg' \<br />--form 'media_attrs[1][title]=This will be the title for file2.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'metadata'      => "(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are avaiable for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.",
		'discussion'    => '(object) A hash containing one or more of the following boolean values, which default to the blog\'s discussion preferences: `comments_open`, `pings_open`',
		'likes_enabled' => "(bool) Should the post be open to likes? Defaults to the blog's preference.",
		'sharing_enabled' => "(bool) Should sharing buttons show on this post? Defaults to true.",
		'menu_order'    => "(int) (Pages Only) the order pages should appear in. Use 0 to maintain alphabetical order.",
		'page_template' => '(string) (Pages Only) The page template this page should use.',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/posts/new/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'title'      => 'Hello World',
			'content'    => 'Hello. I am a test post. I was created by the API',
			'tags'       => 'tests',
			'categories' => 'API'
		)
	)
) );

new WPCOM_JSON_API_Update_Post_v1_2_Endpoint( array(
	'description' => 'Create a post.',
	'group'       => 'posts',
	'stat'        => 'posts:new',
	'min_version' => '1.2',
	'max_version' => '1.2',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/new',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'request_format' => array(
		// explicitly document all input
		'date'      => "(ISO 8601 datetime) The post's creation time.",
		'title'     => '(HTML) The post title.',
		'content'   => '(HTML) The post content.',
		'excerpt'   => '(HTML) An optional post excerpt.',
		'slug'      => '(string) The name (slug) for the post, used in URLs.',
		'author'    => '(string) The username or ID for the user to assign the post to.',
		'publicize' => '(array|bool) True or false if the post be publicized to external services. An array of services if we only want to publicize to a select few. Defaults to true.',
		'publicize_message' => '(string) Custom message to be publicized to external services.',
		'status'    => array(
			'publish' => 'Publish the post.',
			'private' => 'Privately publish the post.',
			'draft'   => 'Save the post as a draft.',
			'pending' => 'Mark the post as pending editorial approval.',
			'future'  => 'Schedule the post (alias for publish; you must also set a future date).',
			'auto-draft' => 'Save a placeholder for a newly created post, with no content.',
		),
		'sticky'    => array(
			'false'   => 'Post is not marked as sticky.',
			'true'    => 'Stick the post to the front page.',
		),
		'password'  => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'    => "(int) The post ID of the new post's parent.",
		'type'      => "(string) The post type. Defaults to 'post'. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
		'categories' => "(array|string) Comma-separated list or array of category names",
		'tags'       => "(array|string) Comma-separated list or array of tag names",
		'categories_by_id' => "(array|string) Comma-separated list or array of category IDs",
		'tags_by_id'       => "(array|string) Comma-separated list or array of tag IDs",
		'format'     => array_merge( array( 'default' => 'Use default post format' ), get_post_format_strings() ),
		'featured_image' => "(string) The post ID of an existing attachment to set as the featured image. Pass an empty string to delete the existing image.",
		'media'      => "(media) An array of files to attach to the post. To upload media, the entire request should be multipart/form-data encoded. Multiple media items will be displayed in a gallery. Accepts  jpg, jpeg, png, gif, pdf, doc, ppt, odt, pptx, docx, pps, ppsx, xls, xlsx, key. Audio and Video may also be available. See <code>allowed_file_types</code> in the options response of the site endpoint. Errors produced by media uploads, if any, will be in `media_errors` in the response. <br /><br /><strong>Example</strong>:<br />" .
		 				"<code>curl \<br />--form 'title=Image Post' \<br />--form 'media[0]=@/path/to/file.jpg' \<br />--form 'media_attrs[0][caption]=My Great Photo' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'media_urls' => "(array) An array of URLs for images to attach to a post. Sideloads the media in for a post. Errors produced by media sideloading, if any, will be in `media_errors` in the response.",
		'media_attrs' => "(array) An array of attributes (`title`, `description` and `caption`) are supported to assign to the media uploaded via the `media` or `media_urls` properties. You must use a numeric index for the keys of `media_attrs` which follow the same sequence as `media` and `media_urls`. <br /><br /><strong>Example</strong>:<br />" .
		                 "<code>curl \<br />--form 'title=Gallery Post' \<br />--form 'media[]=@/path/to/file1.jpg' \<br />--form 'media_urls[]=http://exapmple.com/file2.jpg' \<br /> \<br />--form 'media_attrs[0][caption]=This will be the caption for file1.jpg' \<br />--form 'media_attrs[1][title]=This will be the title for file2.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'metadata'      => "(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are avaiable for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.",
		'discussion'    => '(object) A hash containing one or more of the following boolean values, which default to the blog\'s discussion preferences: `comments_open`, `pings_open`',
		'likes_enabled' => "(bool) Should the post be open to likes? Defaults to the blog's preference.",
		'sharing_enabled' => "(bool) Should sharing buttons show on this post? Defaults to true.",
		'menu_order'    => "(int) (Pages Only) the order pages should appear in. Use 0 to maintain alphabetical order.",
		'page_template' => '(string) (Pages Only) The page template this page should use.',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/82974409/posts/new/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'title'      => 'Hello World',
			'content'    => 'Hello. I am a test post. I was created by the API',
			'tags'       => 'tests',
			'categories' => 'API'
		)
	)
) );

new WPCOM_JSON_API_Update_Post_Endpoint( array(
	'description' => 'Edit a post.',
	'group'       => 'posts',
	'stat'        => 'posts:1:POST',
	'new_version' => '1.1',
	'max_version' => '1',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),

	'request_format' => array(
		'date'      => "(ISO 8601 datetime) The post's creation time.",
		'title'     => '(HTML) The post title.',
		'content'   => '(HTML) The post content.',
		'excerpt'   => '(HTML) An optional post excerpt.',
		'slug'      => '(string) The name (slug) for the post, used in URLs.',
		'author'    => '(string) The username or ID for the user to assign the post to.',
		'publicize' => '(array|bool) True or false if the post be publicized to external services. An array of services if we only want to publicize to a select few. Defaults to true.',
		'publicize_message' => '(string) Custom message to be publicized to external services.',
		'status'    => array(
			'publish' => 'Publish the post.',
			'private' => 'Privately publish the post.',
			'draft'   => 'Save the post as a draft.',
			'pending' => 'Mark the post as pending editorial approval.',
		),
		'sticky'    => array(
			'false'   => 'Post is not marked as sticky.',
			'true'    => 'Stick the post to the front page.',
		),
		'password'   => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'     => "(int) The post ID of the new post's parent.",
		'categories' => "(array|string) Comma-separated list or array of categories (name or id)",
		'tags'       => "(array|string) Comma-separated list or array of tags (name or id)",
		'format'     => array_merge( array( 'default' => 'Use default post format' ), get_post_format_strings() ),
		'comments_open' => '(bool) Should the post be open to comments?',
		'pings_open'    => '(bool) Should the post be open to comments?',
		'likes_enabled' => "(bool) Should the post be open to likes?",
		'menu_order'    => "(int) (Pages Only) the order pages should appear in. Use 0 to maintain alphabetical order.",
		'sharing_enabled' => "(bool) Should sharing buttons show on this post?",
		'featured_image' => "(string) The post ID of an existing attachment to set as the featured image. Pass an empty string to delete the existing image.",
		'media'      => "(media) An array of files to attach to the post. To upload media, the entire request should be multipart/form-data encoded. Multiple media items will be displayed in a gallery. Accepts  jpg, jpeg, png, gif, pdf, doc, ppt, odt, pptx, docx, pps, ppsx, xls, xlsx, key. Audio and Video may also be available. See <code>allowed_file_types</code> in the options resposne of the site endpoint. <br /><br /><strong>Example</strong>:<br />" .
		 				"<code>curl \<br />--form 'title=Image' \<br />--form 'media[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'media_urls' => "(array) An array of URLs for images to attach to a post. Sideloads the media in for a post.",
		'metadata'      => "(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are available for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.",
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/posts/881',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'title'      => 'Hello World (Again)',
			'content'    => 'Hello. I am an edited post. I was edited by the API',
			'tags'       => 'tests',
			'categories' => 'API'
		)
	)
) );

new WPCOM_JSON_API_Update_Post_v1_1_Endpoint( array(
	'description' => 'Edit a post.',
	'group'       => 'posts',
	'stat'        => 'posts:1:POST',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),

	'request_format' => array(
		'date'      => "(ISO 8601 datetime) The post's creation time.",
		'title'     => '(HTML) The post title.',
		'content'   => '(HTML) The post content.',
		'excerpt'   => '(HTML) An optional post excerpt.',
		'slug'      => '(string) The name (slug) for the post, used in URLs.',
		'author'    => '(string) The username or ID for the user to assign the post to.',
		'publicize' => '(array|bool) True or false if the post be publicized to external services. An array of services if we only want to publicize to a select few. Defaults to true.',
		'publicize_message' => '(string) Custom message to be publicized to external services.',
		'status'    => array(
			'publish' => 'Publish the post.',
			'private' => 'Privately publish the post.',
			'draft'   => 'Save the post as a draft.',
			'future'  => 'Schedule the post (alias for publish; you must also set a future date).',
			'pending' => 'Mark the post as pending editorial approval.',
		),
		'sticky'    => array(
			'false'   => 'Post is not marked as sticky.',
			'true'    => 'Stick the post to the front page.',
		),
		'password'   => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'     => "(int) The post ID of the new post's parent.",
		'categories' => "(array|string) Comma-separated list or array of categories (name or id)",
		'tags'       => "(array|string) Comma-separated list or array of tags (name or id)",
		'format'     => array_merge( array( 'default' => 'Use default post format' ), get_post_format_strings() ),
		'discussion' => '(object) A hash containing one or more of the following boolean values, which default to the blog\'s discussion preferences: `comments_open`, `pings_open`',
		'likes_enabled' => "(bool) Should the post be open to likes?",
		'menu_order'    => "(int) (Pages only) the order pages should appear in. Use 0 to maintain alphabetical order.",
		'page_template' => '(string) (Pages Only) The page template this page should use.',
		'sharing_enabled' => "(bool) Should sharing buttons show on this post?",
		'featured_image' => "(string) The post ID of an existing attachment to set as the featured image. Pass an empty string to delete the existing image.",
		'media'      => "(media) An array of files to attach to the post. To upload media, the entire request should be multipart/form-data encoded. Multiple media items will be displayed in a gallery. Accepts  jpg, jpeg, png, gif, pdf, doc, ppt, odt, pptx, docx, pps, ppsx, xls, xlsx, key. Audio and Video may also be available. See <code>allowed_file_types</code> in the options resposne of the site endpoint. <br /><br /><strong>Example</strong>:<br />" .
		 				"<code>curl \<br />--form 'title=Image' \<br />--form 'media[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'media_urls' => "(array) An array of URLs for images to attach to a post. Sideloads the media in for a post.",
		'metadata'      => "(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are available for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.",
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/posts/881',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'title'      => 'Hello World (Again)',
			'content'    => 'Hello. I am an edited post. I was edited by the API',
			'tags'       => 'tests',
			'categories' => 'API'
		)
	)
) );

new WPCOM_JSON_API_Update_Post_v1_2_Endpoint( array(
	'description' => 'Edit a post.',
	'group'       => 'posts',
	'stat'        => 'posts:1:POST',
	'min_version' => '1.2',
	'max_version' => '1.2',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),

	'request_format' => array(
		'date'      => "(ISO 8601 datetime) The post's creation time.",
		'title'     => '(HTML) The post title.',
		'content'   => '(HTML) The post content.',
		'excerpt'   => '(HTML) An optional post excerpt.',
		'slug'      => '(string) The name (slug) for the post, used in URLs.',
		'author'    => '(string) The username or ID for the user to assign the post to.',
		'publicize' => '(array|bool) True or false if the post be publicized to external services. An array of services if we only want to publicize to a select few. Defaults to true.',
		'publicize_message' => '(string) Custom message to be publicized to external services.',
		'status'    => array(
			'publish' => 'Publish the post.',
			'private' => 'Privately publish the post.',
			'draft'   => 'Save the post as a draft.',
			'future'  => 'Schedule the post (alias for publish; you must also set a future date).',
			'pending' => 'Mark the post as pending editorial approval.',
		),
		'sticky'    => array(
			'false'   => 'Post is not marked as sticky.',
			'true'    => 'Stick the post to the front page.',
		),
		'password'   => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'     => "(int) The post ID of the new post's parent.",
		'categories' => "(array|string) Comma-separated list or array of category names",
		'categories_by_id' => "(array|string) Comma-separated list or array of category IDs",
		'tags'       => "(array|string) Comma-separated list or array of tag names",
		'tags_by_id'       => "(array|string) Comma-separated list or array of tag IDs",
		'format'     => array_merge( array( 'default' => 'Use default post format' ), get_post_format_strings() ),
		'discussion' => '(object) A hash containing one or more of the following boolean values, which default to the blog\'s discussion preferences: `comments_open`, `pings_open`',
		'likes_enabled' => "(bool) Should the post be open to likes?",
		'menu_order'    => "(int) (Pages only) the order pages should appear in. Use 0 to maintain alphabetical order.",
		'page_template' => '(string) (Pages Only) The page template this page should use.',
		'sharing_enabled' => "(bool) Should sharing buttons show on this post?",
		'featured_image' => "(string) The post ID of an existing attachment to set as the featured image. Pass an empty string to delete the existing image.",
		'media'      => "(media) An array of files to attach to the post. To upload media, the entire request should be multipart/form-data encoded. Multiple media items will be displayed in a gallery. Accepts  jpg, jpeg, png, gif, pdf, doc, ppt, odt, pptx, docx, pps, ppsx, xls, xlsx, key. Audio and Video may also be available. See <code>allowed_file_types</code> in the options resposne of the site endpoint. <br /><br /><strong>Example</strong>:<br />" .
		 				"<code>curl \<br />--form 'title=Image' \<br />--form 'media[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'media_urls' => "(array) An array of URLs for images to attach to a post. Sideloads the media in for a post.",
		'metadata'      => "(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are available for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.",
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.2/sites/82974409/posts/881',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'title'      => 'Hello World (Again)',
			'content'    => 'Hello. I am an edited post. I was edited by the API',
			'tags'       => 'tests',
			'categories' => 'API'
		)
	)
) );

new WPCOM_JSON_API_Update_Post_Endpoint( array(
	'description' => 'Delete a post. Note: If the post object is of type post or page and the trash is enabled, this request will send the post to the trash. A second request will permanently delete the post.',
	'group'       => 'posts',
	'stat'        => 'posts:1:delete',
	'new_version' => '1.1',
	'max_version' => '1',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d/delete',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/posts/$post_ID/delete/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

new WPCOM_JSON_API_Update_Post_v1_1_Endpoint( array(
	'description' => 'Delete a post. Note: If the post object is of type post or page and the trash is enabled, this request will send the post to the trash. A second request will permanently delete the post.',
	'group'       => 'posts',
	'stat'        => 'posts:1:delete',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d/delete',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/posts/$post_ID/delete/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

new WPCOM_JSON_API_Update_Post_Endpoint( array(
	'description' => 'Restore a post or page from the trash to its previous status.',
	'group'       => 'posts',
	'stat'        => 'posts:1:restore',

	'method'      => 'POST',
	'new_version' => '1.1',
	'max_version' => '1',
	'path'        => '/sites/%s/posts/%d/restore',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/posts/$post_ID/restore/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

new WPCOM_JSON_API_Update_Post_v1_1_Endpoint( array(
	'description' => 'Restore a post or page from the trash to its previous status.',
	'group'       => 'posts',
	'stat'        => 'posts:1:restore',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d/restore',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/posts/$post_ID/restore/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

new WPCOM_JSON_API_Get_Autosave_v1_1_Endpoint( array(
	'description' => 'Get the most recent autosave for a post.',
	'group'       => '__do_not_document',
	'stat'        => 'posts:autosave',
	'min_version' => '1.1',
	'method'      => 'GET',
	'path'        => '/sites/%s/posts/%d/autosave',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),
	'response_format' => array(
		'ID'          => '(int) autodraft post ID',
		'post_ID'     => '(int) post ID',
		'author_ID'   => '(int) author ID',
		'title'       => '(HTML) The post title.',
		'content'     => '(HTML) The post content.',
		'excerpt'     => '(HTML) The post excerpt.',
		'preview_URL' => '(string) preview URL for the post',
		'modified'    => '(ISO 8601 datetime) modified time',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/posts/1/autosave',
) );

new WPCOM_JSON_API_Autosave_Post_v1_1_Endpoint( array(
	'description' => 'Create a post autosave.',
	'group'       => '__do_not_document',
	'stat'        => 'posts:autosave',
	'min_version' => '1.1',
	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d/autosave',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),
	'request_format' => array(
		'content' => '(HTML) The post content.',
		'title'   => '(HTML) The post title.',
		'excerpt' => '(HTML) The post excerpt.',
	),
	'response_format' => array(
		'ID'          => '(int) autodraft post ID',
		'post_ID'     => '(int) post ID',
		'preview_URL' => '(string) preview URL for the post',
		'modified'    => '(ISO 8601 datetime) modified time',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/posts/1/autosave',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),

		'body' => array(
			'title'    => 'Howdy',
			'content'    => 'Hello. I am a test post. I was created by the API',
		)
	)
) );

/*
 * Media Endpoints
 */
new WPCOM_JSON_API_List_Media_Endpoint( array(
	'description' => 'Get a list of items in the media library.',
	'group'       => 'media',
	'stat'        => 'media',

	'method'      => 'GET',
	'path'        => '/sites/%s/media/',
	'deprecated'  => true,
	'new_version' => '1.1',
	'max_version' => '1',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'number'    => '(int=20) The number of media items to return. Limit: 100.',
		'offset'    => '(int=0) 0-indexed offset.',
		'parent_id' => '(int) Default is showing all items. The post where the media item is attached. 0 shows unattached media items.',
		'mime_type' => "(string) Default is empty. Filter by mime type (e.g., 'image/jpeg', 'application/pdf'). Partial searches also work (e.g. passing 'image' will search for all image files).",
	),

	'response_format' => array(
		'media' => '(array) Array of media',
		'found' => '(int) The number of total results found'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/media/?number=2',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

new WPCOM_JSON_API_List_Media_v1_1_Endpoint( array(
	'description' => 'Get a list of items in the media library.',
	'group'       => 'media',
	'stat'        => 'media',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'GET',
	'path'        => '/sites/%s/media/',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'number'    => '(int=20) The number of media items to return. Limit: 100.',
		'offset'    => '(int=0) 0-indexed offset.',
		'page'     => '(int) Return the Nth 1-indexed page of posts. Takes precedence over the <code>offset</code> parameter.',
		'page_handle' => '(string) A page handle, returned from a previous API call as a <code>meta.next_page</code> property. This is the most efficient way to fetch the next page of results.',
		'order'    => array(
			'DESC' => 'Return files in descending order. For dates, that means newest to oldest.',
			'ASC'  => 'Return files in ascending order. For dates, that means oldest to newest.',
		),
		'order_by' => array(
			'date'          => 'Order by the uploaded time of each file.',
			'title'         => "Order lexicographically by file titles.",
			'ID'            => 'Order by media ID.',
		),
		'search'    => '(string) Search query.',
		'post_ID'   => '(int) Default is showing all items. The post where the media item is attached. 0 shows unattached media items.',
		'mime_type' => "(string) Default is empty. Filter by mime type (e.g., 'image/jpeg', 'application/pdf'). Partial searches also work (e.g. passing 'image' will search for all image files).",
		'after'     => '(ISO 8601 datetime) Return media items uploaded after the specified datetime.',
		'before'    => '(ISO 8601 datetime) Return media items uploaded before the specified datetime.',
	),

	'response_format' => array(
		'media' => '(array) Array of media objects',
		'found' => '(int) The number of total results found'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/media',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

new WPCOM_JSON_API_Get_Media_Endpoint( array(
	'description' => 'Get a single media item (by ID).',
	'group'       => 'media',
	'stat'        => 'media:1',
	'method'      => 'GET',
	'path'        => '/sites/%s/media/%d',
	'deprecated'  => true,
	'new_version' => '1.1',
	'max_version' => '1',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$media_ID' => '(int) The ID of the media item',
	),
	'response_format' => array(
		'id'    => '(int) The ID of the media item',
		'date' =>  '(ISO 8601 datetime) The date the media was uploaded',
		'parent'           => '(int) ID of the post this media is attached to',
		'link'             => '(string) URL to the file',
		'title'            => '(string) Filename',
		'caption'          => '(string) User-provided caption of the file',
		'description'      => '(string) Description of the file',
		'metadata'         => '(array) Array of metadata about the file, such as Exif data or sizes',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/media/934',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

new WPCOM_JSON_API_Get_Media_v1_1_Endpoint( array(
	'description' => 'Get a single media item (by ID).',
	'group'       => 'media',
	'stat'        => 'media:1',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'GET',
	'path'        => '/sites/%s/media/%d',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$media_ID' => '(int) The ID of the media item',
	),
	'response_format' => array(
		'ID'               => '(int) The ID of the media item',
		'date'             => '(ISO 8601 datetime) The date the media was uploaded',
		'post_ID'          => '(int) ID of the post this media is attached to',
		'author_ID'        => '(int) ID of the user who uploaded the media',
		'URL'              => '(string) URL to the file',
		'guid'             => '(string) Unique identifier',
		'file'			   => '(string) Filename',
		'extension'        => '(string) File extension',
		'mime_type'        => '(string) File MIME type',
		'title'            => '(string) Filename',
		'caption'          => '(string) User-provided caption of the file',
		'description'      => '(string) Description of the file',
		'alt'              => '(string)  Alternative text for image files.',
		'thumbnails'       => '(object) Media item thumbnail URL options',
		'height'           => '(int) (Image & video only) Height of the media item',
		'width'            => '(int) (Image & video only) Width of the media item',
		'length'           => '(int) (Video & audio only) Duration of the media item, in seconds',
		'exif'             => '(array) (Image & audio only) Exif (meta) information about the media item',
		'videopress_guid'  => '(string) (Video only) VideoPress GUID of the video when uploaded on a blog with VideoPress',
		'videopress_processing_done'  => '(bool) (Video only) If the video is uploaded on a blog with VideoPress, this will return the status of processing on the video.'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/media/934',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

new WPCOM_JSON_API_Upload_Media_Endpoint( array(
	'description' => 'Upload a new media item.',
	'group'       => 'media',
	'stat'        => 'media:new',
	'method'      => 'POST',
	'path'        => '/sites/%s/media/new',
	'deprecated'  => true,
	'new_version' => '1.1',
	'max_version' => '1',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'request_format' => array(
		'media'      => "(media) An array of media to attach to the post. To upload media, the entire request should be multipart/form-data encoded. Accepts images (image/gif, image/jpeg, image/png) only at this time.<br /><br /><strong>Example</strong>:<br />" .
		                "<code>curl \<br />--form 'media[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/media/new'</code>",
		'media_urls' => "(array) An array of URLs to upload to the post."
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/media/new/',

	'response_format' => array(
		'media' => '(array) Array of uploaded media',
		'errors' => '(array) Array of error messages of uploading media failures'
	),
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'media_urls' => "https://s.w.org/about/images/logos/codeispoetry-rgb.png"
		)
	)
) );

new WPCOM_JSON_API_Upload_Media_v1_1_Endpoint( array(
	'description' => 'Upload a new piece of media.',
	'group'       => 'media',
	'stat'        => 'media:new',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'POST',
	'path'        => '/sites/%s/media/new',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'request_format' => array(
		'media'      => "(media) An array of media to attach to the post. To upload media, the entire request should be multipart/form-data encoded. Accepts  jpg, jpeg, png, gif, pdf, doc, ppt, odt, pptx, docx, pps, ppsx, xls, xlsx, key. Audio and Video may also be available. See <code>allowed_file_types</code> in the options response of the site endpoint.<br /><br /><strong>Example</strong>:<br />" .
		                "<code>curl \<br />--form 'media[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/media/new'</code>",
		'media_urls' => "(array) An array of URLs to upload to the post. Errors produced by media uploads, if any, will be in `media_errors` in the response.",
		'attrs' => "(array) An array of attributes (`title`, `description`, `caption` `alt` for images, `artist` for audio, `album` for audio, and `parent_id`) are supported to assign to the media uploaded via the `media` or `media_urls` properties. You must use a numeric index for the keys of `attrs` which follows the same sequence as `media` and `media_urls`. <br /><br /><strong>Example</strong>:<br />" .
		                 "<code>curl \<br />--form 'media[]=@/path/to/file1.jpg' \<br />--form 'media_urls[]=http://example.com/file2.jpg' \<br /> \<br />--form 'attrs[0][caption]=This will be the caption for file1.jpg' \<br />--form 'attrs[1][title]=This will be the title for file2.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
	),

	'response_format' => array(
		'media' => '(array) Array of uploaded media objects',
		'errors' => '(array) Array of error messages of uploading media failures'
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/media/new',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'media_urls' => "https://s.w.org/about/images/logos/codeispoetry-rgb.png"
		)
	)
) );

new WPCOM_JSON_API_Update_Media_Endpoint( array(
	'description' => 'Edit basic information about a media item.',
	'group'       => 'media',
	'stat'        => 'media:1:POST',
	'method'      => 'POST',
	'path'        => '/sites/%s/media/%d',
	'deprecated'  => true,
	'new_version' => '1.1',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$media_ID' => '(int) The ID of the media item',
	),

	'request_format' => array(
		'title'       => '(string) The file name.',
		'caption'     => '(string) File caption.',
		'description' => '(HTML) Description of the file.',
	),

	'response_format' => array(
		'id'          => '(int) The ID of the media item',
		'date'        =>  '(ISO 8601 datetime) The date the media was uploaded',
		'parent'      => '(int) ID of the post this media is attached to',
		'link'        => '(string) URL to the file',
		'title'       => '(string) File name',
		'caption'     => '(string) User provided caption of the file',
		'description' => '(string) Description of the file',
		'metadata'    => '(array) Array of metadata about the file, such as Exif data or sizes',
	),
	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/media/446',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'title' => 'Updated Title'
		)
	)
) );

new WPCOM_JSON_API_Update_Media_v1_1_Endpoint( array(
	'description' => 'Edit basic information about a media item.',
	'group'       => 'media',
	'stat'        => 'media:1:POST',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'POST',
	'path'        => '/sites/%s/media/%d',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$media_ID' => '(int) The ID of the media item',
	),

	'request_format' => array(
		'parent_id'   => '(int) ID of the post this media is attached to',
		'title'       => '(string) The file name.',
		'caption'     => '(string) File caption.',
		'description' => '(HTML) Description of the file.',
		'alt'         => "(string) Alternative text for image files.",
		'artist'      => "(string) Audio Only. Artist metadata for the audio track.",
		'album'       => "(string) Audio Only. Album metadata for the audio track.",
	),

	'response_format' => array(
		'ID'               => '(int) The ID of the media item',
		'date'             => '(ISO 8601 datetime) The date the media was uploaded',
		'post_ID'          => '(int) ID of the post this media is attached to',
		'author_ID'        => '(int) ID of the user who uploaded the media',
		'URL'              => '(string) URL to the file',
		'guid'             => '(string) Unique identifier',
		'file'			   => '(string) File name',
		'extension'        => '(string) File extension',
		'mime_type'        => '(string) File mime type',
		'title'            => '(string) File name',
		'caption'          => '(string) User provided caption of the file',
		'description'      => '(string) Description of the file',
		'alt'              => '(string)  Alternative text for image files.',
		'thumbnails'       => '(object) Media item thumbnail URL options',
		'height'           => '(int) (Image & video only) Height of the media item',
		'width'            => '(int) (Image & video only) Width of the media item',
		'length'           => '(int) (Video & audio only) Duration of the media item, in seconds',
		'exif'             => '(array) (Image & audio only) Exif (meta) information about the media item',
		'videopress_guid'  => '(string) (Video only) VideoPress GUID of the video when uploaded on a blog with VideoPress',
		'videopress_processing_done'  => '(bool) (Video only) If the video is uploaded on a blog with VideoPress, this will return the status of processing on the video.'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/media/446',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'title' => 'Updated Title'
		)
	)
) );


new WPCOM_JSON_API_Delete_Media_Endpoint( array(
	'description' => 'Delete a piece of media.',
	'group'       => 'media',
	'stat'        => 'media:1:delete',
	'method'      => 'POST',
	'path'        => '/sites/%s/media/%d/delete',
	'deprecated'  => true,
	'new_version' => '1.1',
	'max_version' => '1',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$media_ID' => '(int) The media ID',
	),

	'response_format' => array(
		'status' => '(string) Returns deleted if the media was successfully deleted',
		'id'    => '(int) The ID of the media item',
		'date' =>  '(ISO 8601 datetime) The date the media was uploaded',
		'parent'           => '(int) ID of the post this media is attached to',
		'link'             => '(string) URL to the file',
		'title'            => '(string) File name',
		'caption'          => '(string) User provided caption of the file',
		'description'      => '(string) Description of the file',
		'metadata'         => '(array) Misc array of information about the file, such as exif data or sizes',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/media/$media_ID/delete',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

new WPCOM_JSON_API_Delete_Media_v1_1_Endpoint( array(
	'description' => 'Delete a piece of media. Note: Media is deleted and not trashed.',
	'group'       => 'media',
	'stat'        => 'media:1:delete',
	'min_version' => '1.1',
	'max_version' => '1.1',
	'method'      => 'POST',
	'path'        => '/sites/%s/media/%d/delete',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$media_ID' => '(int) The media ID',
	),

	'response_format' => array(
		'status'           => '(string) Returns deleted if the media was successfully deleted',
		'ID'               => '(int) The ID of the media item',
		'date'             => '(ISO 8601 datetime) The date the media was uploaded',
		'post_ID'          => '(int) ID of the post this media is attached to',
		'author_ID'        => '(int) ID of the user who uploaded the media',
		'URL'              => '(string) URL to the file',
		'guid'             => '(string) Unique identifier',
		'file'			   => '(string) File name',
		'extension'        => '(string) File extension',
		'mime_type'        => '(string) File mime type',
		'title'            => '(string) File name',
		'caption'          => '(string) User-provided caption of the file',
		'description'      => '(string) Description of the file',
		'alt'              => '(string)  Alternative text for image files.',
		'thumbnails'       => '(object) Media item thumbnail URL options',
		'height'           => '(int) (Image & video only) Height of the media item',
		'width'            => '(int) (Image & video only) Width of the media item',
		'length'           => '(int) (Video & audio only) Duration of the media item, in seconds',
		'exif'             => '(array) (Image & audio only) Exif (meta) information about the media item',
		'videopress_guid'  => '(string) (Video only) VideoPress GUID of the video when uploaded on a blog with VideoPress',
		'videopress_processing_done'  => '(bool) (Video only) If the video is Uuploaded on a blog with VideoPress, this will return the status of processing on the Video'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/media/$media_ID/delete',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

/*
 * Comment endpoints
 */
new WPCOM_JSON_API_List_Comments_Endpoint( array(
	'description' => 'Get a list of recent comments.',
	'group'       => 'comments',
	'stat'        => 'comments',

	'method'      => 'GET',
	'path'        => '/sites/%s/comments/',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/comments/?number=2'
) );

new WPCOM_JSON_API_List_Comments_Endpoint( array(
	'description' => 'Get a list of recent comments on a post.',
	'group'       => 'comments',
	'stat'        => 'posts:1:replies',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/%d/replies/',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/7/replies/?number=2'
) );

new WPCOM_JSON_API_Get_Comment_Endpoint( array(
	'description' => 'Get a single comment.',
	'group'       => 'comments',
	'stat'        => 'comments:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/comments/%d',
	'path_labels' => array(
		'$site'       => '(int|string) Site ID or domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/comments/147564'
) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Create a comment on a post.',
	'group'       => 'comments',
	'stat'        => 'posts:1:replies:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d/replies/new',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$post_ID' => '(int) The post ID'
	),

	'request_format' => array(
		// explicitly document all input
		'content'   => '(HTML) The comment text.',
//		@todo Should we open this up to unauthenticated requests too?
//		'author'    => '(author object) The author of the comment.',
	),

	'pass_wpcom_user_details' => true,

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/posts/843/replies/new/',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'content' => 'Your reply is very interesting. This is a reply.'
		)
	)
) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Create a comment as a reply to another comment.',
	'group'       => 'comments',
	'stat'        => 'comments:1:replies:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/comments/%d/replies/new',
	'path_labels' => array(
		'$site'       => '(int|string) Site ID or domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'request_format' => array(
		'content'   => '(HTML) The comment text.',
//		@todo Should we open this up to unauthenticated requests too?
//		'author'    => '(author object) The author of the comment.',
	),

	'pass_wpcom_user_details' => true,

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/comments/29/replies/new',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'content' => 'This reply is very interesting. This is editing a comment reply via the API.',
		)
	)
) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Edit a comment.',
	'group'       => 'comments',
	'stat'        => 'comments:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/comments/%d',
	'path_labels' => array(
		'$site'       => '(int|string) Site ID or domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'request_format' => array(
		'date'    => "(ISO 8601 datetime) The comment's creation time.",
		'content' => '(HTML) The comment text.',
		'status'  => array(
			'approved'   => 'Approve the comment.',
			'unapproved' => 'Remove the comment from public view and send it to the moderation queue.',
			'spam'       => 'Mark the comment as spam.',
			'unspam'     => 'Unmark the comment as spam. Will attempt to set it to the previous status.',
			'trash'      => 'Send a comment to the trash if trashing is enabled (see constant: EMPTY_TRASH_DAYS).',
			'untrash'    => 'Untrash a comment. Only works when the comment is in the trash.',
		),
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/comments/29',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'content' => 'This reply is now edited via the API.',
			'status'  => 'approved',
		)
	)
) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Delete a comment.',
	'group'       => 'comments',
	'stat'        => 'comments:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/comments/%d/delete',
	'path_labels' => array(
		'$site'       => '(int|string) Site ID or domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/comments/$comment_ID/delete',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	)
) );

/**
 * Taxonomy Management Endpoints
 */
new WPCOM_JSON_API_Get_Taxonomy_Endpoint( array(
	'description' => 'Get information about a single category.',
	'group'       => 'taxonomy',
	'stat'        => 'categories:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/categories/slug:%s',
	'path_labels' => array(
		'$site'     => '(int|string) Site ID or domain',
		'$category' => '(string) The category slug'
	),

	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/categories/slug:community'
) );

new WPCOM_JSON_API_Get_Taxonomies_Endpoint( array(
	'description' => "Get a list of a site's categories.",
	'group'       => 'taxonomy',
	'stat'        => 'categories',
	'method'      => 'GET',
	'path'        => '/sites/%s/categories',
	'path_labels' => array(
		'$site'     => '(int|string) Site ID or domain'
	),
	'query_parameters' => array(
		'number'   => '(int=100) The number of categories to return. Limit: 1000.',
		'offset'   => '(int=0) 0-indexed offset.',
		'page'     => '(int) Return the Nth 1-indexed page of categories. Takes precedence over the <code>offset</code> parameter.',
		'search'   => '(string) Limit response to include only categories whose names or slugs match the provided search query.',
		'order'    => array(
			'ASC'  => 'Return categories in ascending order.',
			'DESC' => 'Return categories in descending order.',
		),
		'order_by' => array(
			'name'  => 'Order by the name of each category.',
			'count' => 'Order by the number of posts in each category.',
		),
	),
	'response_format' => array(
		'found'      => '(int) The number of categories returned.',
		'categories' => '(array) Array of category objects.',
	),
	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/categories/?number=5'
) );

new WPCOM_JSON_API_Get_Taxonomies_Endpoint( array(
	'description' => "Get a list of a site's tags.",
	'group'       => 'taxonomy',
	'stat'        => 'tags',
	'method'      => 'GET',
	'path'        => '/sites/%s/tags',
	'path_labels' => array(
		'$site'     => '(int|string) Site ID or domain'
	),
	'query_parameters' => array(
		'number'   => '(int=100) The number of tags to return. Limit: 1000.',
		'offset'   => '(int=0) 0-indexed offset.',
		'page'     => '(int) Return the Nth 1-indexed page of tags. Takes precedence over the <code>offset</code> parameter.',
		'search'   => '(string) Limit response to include only tags whose names or slugs match the provided search query.',
		'order'    => array(
			'ASC'  => 'Return tags in ascending order.',
			'DESC' => 'Return tags in descending order.',
		),
		'order_by' => array(
			'name'  => 'Order by the name of each tag.',
			'count' => 'Order by the number of posts in each tag.',
		),
	),
	'response_format' => array(
		'found'    => '(int) The number of tags returned.',
		'tags'     => '(array) Array of tag objects.',
	),
	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/tags/?number=5'
) );

new WPCOM_JSON_API_Get_Taxonomy_Endpoint( array(
	'description' => 'Get information about a single tag.',
	'group'       => 'taxonomy',
	'stat'        => 'tags:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/tags/slug:%s',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
		'$tag'  => '(string) The tag slug'
	),

	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/tags/slug:wordpresscom'
) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Create a new category.',
	'group'       => 'taxonomy',
	'stat'        => 'categories:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/categories/new',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'request_format' => array(
		'name'        => '(string) Name of the category',
		'description' => '(string) A description of the category',
		'parent'      => '(int) ID of the parent category',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/categories/new/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'name' => 'Puppies',
		)
	)
) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Create a new tag.',
	'group'       => 'taxonomy',
	'stat'        => 'tags:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/tags/new',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'request_format' => array(
		'name'        => '(string) Name of the tag',
		'description' => '(string) A description of the tag',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/tags/new/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'name' => 'Kitties'
		)
	)
) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Edit a tag.',
	'group'       => 'taxonomy',
	'stat'        => 'tags:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/tags/slug:%s',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
		'$tag'  => '(string) The tag slug',
	),

	'request_format' => array(
		'name'        => '(string) Name of the tag',
		'description' => '(string) A description of the tag',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/tags/slug:testing-tag',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'description' => 'Kitties are awesome!'
		)
	)
) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Edit a category.',
	'group'       => 'taxonomy',
	'stat'        => 'categories:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/categories/slug:%s',
	'path_labels' => array(
		'$site'     => '(int|string) Site ID or domain',
		'$category' => '(string) The category slug',
	),

	'request_format' => array(
		'name'        => '(string) Name of the category',
		'description' => '(string) A description of the category',
		'parent'      => '(int) ID of the parent category',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/categories/slug:testing-category',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'description' => 'Puppies are great!'
		)
	)
) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Delete a category.',
	'group'       => 'taxonomy',
	'stat'        => 'categories:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/categories/slug:%s/delete',
	'path_labels' => array(
		'$site'     => '(int|string) Site ID or domain',
		'$category' => '(string) The category slug',
	),
	'response_format' => array(
		'slug'    => '(string) The slug of the deleted category',
		'success' => '(bool) Was the operation successful?',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/categories/slug:$category/delete',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	)
) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Delete a tag.',
	'group'       => 'taxonomy',
	'stat'        => 'tags:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/tags/slug:%s/delete',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
		'$tag'  => '(string) The tag slug',
	),
	'response_format' => array(
		'slug'    => '(string) The slug of the deleted tag',
		'success' => '(bool) Was the operation successful?',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/tags/slug:$tag/delete',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	)
) );

new WPCOM_JSON_API_List_Roles_Endpoint( array(
	'description' => 'List the user roles of a site.',
	'group'       => '__do_not_document',
	'stat'        => 'roles:list',

	'method'      => 'GET',
	'path'        => '/sites/%s/roles',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
	),

	'response_format' => array(
		'roles'  => '(array:role) Array of role objects.',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/roles',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	)
) );

new WPCOM_JSON_API_List_Users_Endpoint( array(
	'description' => 'List the users of a site.',
	'group'       => 'users',
	'stat'        => 'users:list',

	'method'      => 'GET',
	'path'        => '/sites/%s/users',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'number'   => '(int=20) Limit the total number of authors returned.',
		'offset'   => '(int=0) The first n authors to be skipped in the returned array.',
		'order'    => array(
			'DESC' => 'Return authors in descending order.',
			'ASC'  => 'Return authors in ascending order.',
		),
		'order_by' => array(
			'ID'            => 'Order by ID (default).',
			'login'         => 'Order by username.',
			'nicename'      => "Order by nicename.",
			'email'         => 'Order by author email address.',
			'url'           => 'Order by author URL.',
			'registered'    => 'Order by registered date.',
			'display_name'  => 'Order by display name.',
			'post_count'    => 'Order by number of posts published.',
		),
		'authors_only'      => '(bool) Set to true to fetch authors only',
		'type'              => "(string) Specify the post type to query authors for. Only works when combined with the `authors_only` flag. Defaults to 'post'. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
		'search'            => '(string) Find matching users.',
		'search_columns'    => "(array) Specify which columns to check for matching users. Can be any of 'ID', 'user_login', 'user_email', 'user_url', 'user_nicename', and 'display_name'. Only works when combined with `search` parameter.",
		'role'              => '(string) Specify a specific user role to fetch.'
	),

	'response_format' => array(
		'found'    => '(int) The total number of authors found that match the request (ignoring limits and offsets).',
		'authors'  => '(array:author) Array of author objects.',
	),

	'example_response' => '{
		"found": 1,
		"users": [
			{
				"ID": 78972699,
				"login": "apiexamples",
				"email": "justin+apiexamples@a8c.com",
				"name": "apiexamples",
				"first_name": "",
				"last_name": "",
				"nice_name": "apiexamples",
				"URL": "http://apiexamples.wordpress.com",
				"avatar_URL": "https://1.gravatar.com/avatar/a2afb7b6c0e23e5d363d8612fb1bd5ad?s=96&d=identicon&r=G",
				"profile_URL": "http://en.gravatar.com/apiexamples",
				"site_ID": 82974409,
				"roles": [
					"administrator"
				],
				"is_super_admin": false
			}
		]
	}',

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/users',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	)
) );

new WPCOM_JSON_API_Update_User_Endpoint( array(
	'description' => 'Deletes or removes a user of a site.',
	'group'       => 'users',
	'stat'        => 'users:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/users/%d/delete',
	'path_labels' => array(
		'$site'       => '(int|string) The site ID or domain.',
		'$user_ID'    => '(int) The user\'s ID'
	),

	'request_format' => array(
		'reassign' => '(int) An optional id of a user to reassign posts to.',
	),

	'response_format' => array(
		'success' => '(bool) Was the deletion of user successful?',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/users/1/delete',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	)
) );

new WPCOM_JSON_API_List_Invites_Endpoint( array(
	'description' => 'List the invites of a site.',
	'group'       => '__do_not_document',
	'stat'        => 'invites:list',

	'method'      => 'GET',
	'path'        => '/sites/%s/invites',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'number'   => '(int=25) Limit the total number of invites to be returned.',
		'offset'   => '(int=0) The first n invites to be skipped in the returned array.',
		'status'   => array(
			'pending' => 'Return only pending invites.',
			'all'     => 'Return all invites, pending and accepted, that have not been deleted.',
		)
	),

	'response_format' => array(
		'found'   => '(int) The total number of invites found that match the request (ignoring limits and offsets).',
		'invites' => '(array) Array of invites.',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/82974409/invites',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
) );

new WPCOM_JSON_API_Site_User_Endpoint( array(
	'description' => 'Get details of a user of a site by ID.',
	'group'       => '__do_not_document', //'users'
	'stat'        => 'sites:1:user',
	'method'      => 'GET',
	'path'        => '/sites/%s/users/%d',
	'path_labels' => array(
		'$site'    => '(int|string) Site ID or domain',
		'$user_id' => '(int) User ID',
	),
	'response_format' => WPCOM_JSON_API_Site_User_Endpoint::$user_format,
	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/user/23',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_response'     => '{
		"ID": 18342963,
		"login": "binarysmash"
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash",
		"roles": [ "administrator" ]
	}'
) );

new WPCOM_JSON_API_Site_User_Endpoint( array(
	'description' => 'Get details of a user of a site by login.',
	'group'       => 'users',
	'stat'        => 'sites:1:user',
	'method'      => 'GET',
	'path'        => '/sites/%s/users/login:%s',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID or domain.',
		'$user_id' => '(string) The user\'s login.',
	),
	'response_format' => WPCOM_JSON_API_Site_User_Endpoint::$user_format,
	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/user/login:binarysmash',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_response'     => '{
		"ID": 18342963,
		"login": "binarysmash"
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash",
		"roles": [ "administrator" ]
	}'
) );

new WPCOM_JSON_API_Site_User_Endpoint( array(
	'description' => 'Update details of a user of a site.',
	'group'       => 'users',
	'stat'        => 'sites:1:user',
	'method'      => 'POST',
	'path'        => '/sites/%s/users/%d',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID or domain.',
		'$user_id' => '(int) The user\'s ID.',
	),
	'request_format'  => WPCOM_JSON_API_Site_User_Endpoint::$user_format,
	'response_format' => WPCOM_JSON_API_Site_User_Endpoint::$user_format,
	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/user/23',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'roles' => array(
				array(
					'administrator',
				)
			),
			'first_name' => 'Rocco',
			'last_name' => 'Tripaldi',
		)
	),
	'example_response'     => '{
		"ID": 18342963,
		"login": "binarysmash"
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash",
		"roles": [ "administrator" ]
	}'
) );

new WPCOM_JSON_API_Update_Invites_Endpoint( array(
	'description' => 'Delete an invite for a user to join a site.',
	'group'       => '__do_not_document',
	'stat'        => 'invites:1:delete',
	'method'      => 'POST',
	'path'        => '/sites/%s/invites/%s/delete',
	'path_labels' => array(
		'$site'      => '(int|string) Site ID or domain',
		'$invite_id' => '(string) The ID of the invite'
	),
	'response_format' => array(
		'invite_key' => '(string) Identifier for the deleted invite',
		'deleted' => '(bool) Was the invitation removed?'
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/30434183/invites/123523562/delete',

	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
	),
) );

new WPCOM_JSON_API_Update_Invites_Endpoint( array(
	'description' => 'Resend invitation for a user to join a site.',
	'group'       => '__do_not_document',
	'stat'        => 'invites:1',
	'method'      => 'POST',
	'path'        => '/sites/%s/invites/%s/resend',
	'path_labels' => array(
		'$site'      => '(int|string) Site ID or domain',
		'$invite_id' => '(string) The ID of the invite'
	),
	'response_format' => array(
		'result' => '(bool) Was the invitation resent?'
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/30434183/invites/123523562',

	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
	),
) );

new WPCOM_JSON_API_Site_Settings_Endpoint( array(
	'description' => 'Get detailed settings information about a site.',
	'group'	      => '__do_not_document',
	'stat'        => 'sites:X',

	'method'      => 'GET',
	'path'        => '/sites/%s/settings',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'query_parameters' => array(
		'context' => false,
	),

	'response_format' => WPCOM_JSON_API_Site_Settings_Endpoint::$site_format,

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/settings?pretty=1',
) );

new WPCOM_JSON_API_Site_Settings_Endpoint( array(
	'description' => 'Update settings for a site.',
	'group'       => '__do_not_document',
	'stat'        => 'sites:X',

	'method'      => 'POST',
	'path'        => '/sites/%s/settings',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),

	'request_format'  => array(
		'blogname'                     => '(string) Blog name',
		'blogdescription'              => '(string) Blog description',
		'default_pingback_flag'        => '(bool) Notify blogs linked from article?',
		'default_ping_status'          => '(bool) Allow link notifications from other blogs?',
		'default_comment_status'       => '(bool) Allow comments on new articles?',
		'blog_public'                  => '(string) Site visibility; -1: private, 0: discourage search engines, 1: allow search engines',
		'jetpack_sync_non_public_post_stati' => '(bool) allow sync of post and pages with non-public posts stati',
		'jetpack_relatedposts_enabled' => '(bool) Enable related posts?',
		'jetpack_relatedposts_show_headline' => '(bool) Show headline in related posts?',
		'jetpack_relatedposts_show_thumbnails' => '(bool) Show thumbnails in related posts?',
		'jetpack_protect_whitelist'    => '(array) List of IP addresses to whitelist',
		'infinite_scroll'              => '(bool) Support infinite scroll of posts?',
		'default_category'             => '(int) Default post category',
		'default_post_format'          => '(string) Default post format',
		'require_name_email'           => '(bool) Require comment authors to fill out name and email?',
		'comment_registration'         => '(bool) Require users to be registered and logged in to comment?',
		'close_comments_for_old_posts' => '(bool) Automatically close comments on old posts?',
		'close_comments_days_old'      => '(int) Age at which to close comments',
		'thread_comments'              => '(bool) Enable threaded comments?',
		'thread_comments_depth'        => '(int) Depth to thread comments',
		'page_comments'                => '(bool) Break comments into pages?',
		'comments_per_page'            => '(int) Number of comments to display per page',
		'default_comments_page'        => '(string) newest|oldest Which page of comments to display first',
		'comment_order'                => '(string) asc|desc Order to display comments within page',
		'comments_notify'              => '(bool) Email me when someone comments?',
		'moderation_notify'            => '(bool) Email me when a comment is helf for moderation?',
		'social_notifications_like'    => '(bool) Email me when someone likes my post?',
		'social_notifications_reblog'  => '(bool) Email me when someone reblogs my post?',
		'social_notifications_subscribe' => '(bool) Email me when someone follows my blog?',
		'comment_moderation'           => '(bool) Moderate comments for manual approval?',
		'comment_whitelist'            => '(bool) Moderate comments unless author has a previously-approved comment?',
		'comment_max_links'            => '(int) Moderate comments that contain X or more links',
		'moderation_keys'              => '(string) Words or phrases that trigger comment moderation, one per line',
		'blacklist_keys'               => '(string) Words or phrases that mark comment spam, one per line',
		'lang_id'                      => '(int) ID for language blog is written in',
		'wga'                          => '(array) Google Analytics Settings',
		'disabled_likes'               => '(bool) Are likes globally disabled (they can still be turned on per post)?',
		'disabled_reblogs'             => '(bool) Are reblogs disabled on posts?',
		'jetpack_comment_likes_enabled' => '(bool) Are comment likes enabled for all comments?',
		'sharing_button_style'         => '(string) Style to use for sharing buttons (icon-text, icon, text, or official)',
		'sharing_label'                => '(string) Label to use for sharing buttons, e.g. "Share this:"',
		'sharing_show'                 => '(string|array:string) Post type or array of types where sharing buttons are to be displayed',
		'sharing_open_links'           => '(string) Link target for sharing buttons (same or new)',
		'twitter_via'                  => '(string) Twitter username to include in tweets when people share using the Twitter button',
		'jetpack-twitter-cards-site-tag' => '(string) The Twitter username of the owner of the site\'s domain.',
		'eventbrite_api_token'         => '(int) The Keyring token ID for an Eventbrite token to associate with the site',
		'holidaysnow'                  => '(bool) Enable snowfall on frontend of site?'
	),

	'response_format' => array(
		'updated' => '(array)'
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/settings?pretty=1',
) );

/**
 * Sharing Button Endpoints
 */

new WPCOM_JSON_API_Get_Sharing_Buttons_Endpoint( array(
	'description' => 'Get a list of a site\'s sharing buttons.',
	'group'       => 'sharing',
	'stat'        => 'sharing-buttons',
	'method'      => 'GET',
	'path'        => '/sites/%s/sharing-buttons/',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),
	'query_parameters' => array(
		'enabled_only' => '(bool) If true, only enabled sharing buttons are included in the response',
		'visibility'   => '(string) The type of enabled sharing buttons to filter by, either "visible" or "hidden"',
	),
	'response_format' => array(
		'found'           => '(int) The total number of sharing buttons found that match the request.',
 		'sharing_buttons' => '(array:object) Array of sharing button objects',
	),
	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/sharing-buttons/',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
	),
	'example_response' => '{
	"found": 1,
	"sharing_buttons": [
		{
			"ID": "facebook",
			"name": "Facebook"
			"shortname": "facebook",
			"custom": false,
			"enabled": true,
			"visibility": "visible",
			"genericon": "\\f204"
		}
	]
}'
) );

new WPCOM_JSON_API_Get_Sharing_Button_Endpoint( array(
	'description' => 'Get information about a single sharing button.',
	'group'       => '__do_not_document',
	'stat'        => 'sharing-buttons:1',
	'method'      => 'GET',
	'path'        => '/sites/%s/sharing-buttons/%s',
	'path_labels' => array(
		'$site'      => '(int|string) Site ID or domain',
		'$button_id' => '(string) The button ID',
	),
	'response_format' => array(
		'ID'           => '(int) Sharing button ID',
		'name'         => '(string) Sharing button name, used as a label on the button itself',
		'shortname'    => '(string) A generated short name for the sharing button',
		'URL'          => '(string) The URL pattern defined for a custom sharing button',
		'icon'         => '(string) URL to the 16x16 icon defined for a custom sharing button',
		'genericon'    => '(string) Icon character in Genericons icon set',
		'custom'       => '(bool) Is the button a user-created custom sharing button?',
		'enabled'      => '(bool) Is the button currently enabled for the site?',
		'visibility'   => '(string) If enabled, the current visibility of the sharing button, either "visible" or "hidden"',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/30434183/sharing-buttons/facebook',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
	),
	'example_response' => '{
	"ID": "facebook",
	"name": "Facebook"
	"shortname": "facebook",
	"custom": false,
	"enabled": true,
	"visibility": "visible",
	"genericon": "\\f204"
}'
) );

new WPCOM_JSON_API_Update_Sharing_Buttons_Endpoint( array(
	'description' => 'Edit all sharing buttons for a site.',
	'group'       => 'sharing',
	'stat'        => 'sharing-buttons:X:POST',
	'method'      => 'POST',
	'path'        => '/sites/%s/sharing-buttons',
	'path_labels' => array(
		'$site'      => '(int|string) Site ID or domain',
	),
	'request_format' => array(
		'sharing_buttons' => '(array:sharing_button) An array of sharing button objects',
	),
	'response_format' => array(
		'success' => '(bool) Confirmation that all sharing buttons were updated as specified',
		'updated' => '(array) An array of updated sharing buttons',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/30434183/sharing-buttons',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN',
		),
		'body' => array(
			'sharing_buttons' => array(
				array(
					'ID'         => 'facebook',
					'visibility' => 'hidden',
				)
			)
		)
	),
	'example_response' => '{
	"success": true,
	"updated": [
		{
			"ID": "facebook"
			"name": "Facebook"
			"shortname": "facebook"
			"custom": false
			"enabled": true,
			"visibility": "hidden",
			"genericon": "\f204"
		}
	]
}'
) );

new WPCOM_JSON_API_Update_Sharing_Button_Endpoint( array(
	'description' => 'Create a new custom sharing button.',
	'group'       => '__do_not_document',
	'stat'        => 'sharing-buttons:new',
	'method'      => 'POST',
	'path'        => '/sites/%s/sharing-buttons/new',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),
	'request_format' => array(
		'name'       => '(string) The name for your custom sharing button, used as a label on the button itself',
		'URL'        => '(string) The URL to use for share links, including optional placeholders (%post_title%, %post_url%, %post_full_url%, %post_excerpt%, %post_tags%)',
		'icon'       => '(string) The full URL to a 16x16 icon to display on the sharing button',
		'enabled'    => '(bool) Is the button currently enabled for the site?',
		'visibility' => '(string) If enabled, the visibility of the sharing button, either "visible" (default) or "hidden"',
	),
	'response_format' => array(
		'ID'           => '(string) Sharing button ID',
		'name'         => '(string) Sharing button name, used as a label on the button itself',
		'shortname'    => '(string) A generated short name for the sharing button',
		'URL'          => '(string) The URL pattern defined for a custom sharing button',
		'icon'         => '(string) URL to the 16x16 icon defined for a custom sharing button',
		'genericon'    => '(string) Icon character in Genericons icon set',
		'custom'       => '(bool) Is the button a user-created custom sharing button?',
		'enabled'      => '(bool) Is the button currently enabled for the site?',
		'visibility'   => '(string) If enabled, the current visibility of the sharing button, either "visible" or "hidden"',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/30434183/sharing-buttons/new/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'name'       => 'Custom',
			'URL'        => 'https://www.wordpress.com/%post_name%',
			'icon'       => 'https://en.wordpress.com/i/stats-icon.gif',
			'enabled'    => true,
			'visibility' => 'visible'
		)
	),
	'example_response' => '{
	"ID": "custom-123456789",
	"name": "Custom"
	"shortname": "ustom",
	"url": "https://www.wordpress.com/%post_name%",
	"icon": "https://en.wordpress.com/i/stats-icon.gif",
	"custom": true,
	"enabled": true,
	"visibility": "visible"
}'
) );

new WPCOM_JSON_API_Update_Sharing_Button_Endpoint( array(
	'description' => 'Edit a sharing button.',
	'group'       => '__do_not_document',
	'stat'        => 'sharing-buttons:1:POST',
	'method'      => 'POST',
	'path'        => '/sites/%s/sharing-buttons/%s',
	'path_labels' => array(
		'$site'      => '(int|string) Site ID or domain',
		'$button_id' => '(string) The button ID',
	),
	'request_format' => array(
		'name'       => '(string) Only if a custom sharing button, a new name used as a label on the button itself',
		'URL'        => '(string) Only if a custom sharing button, the URL to use for share links, including optional placeholders (%post_title%, %post_url%, %post_full_url%, %post_excerpt%, %post_tags%)',
		'icon'       => '(string) Only if a custom sharing button, the full URL to a 16x16 icon to display on the sharing button',
		'enabled'    => '(bool) Is the button currently enabled for the site?',
		'visibility' => '(string) If enabled, the visibility of the sharing button, either "visible" (default) or "hidden"',
	),
	'response_format' => array(
		'ID'           => '(string) Sharing button ID',
		'name'         => '(string) Sharing button name, used as a label on the button itself',
		'shortname'    => '(string) A generated short name for the sharing button',
		'URL'          => '(string) The URL pattern defined for a custom sharing button',
		'icon'         => '(string) URL to the 16x16 icon defined for a custom sharing button',
		'genericon'    => '(string) Icon character in Genericons icon set',
		'custom'       => '(bool) Is the button a user-created custom sharing button?',
		'enabled'      => '(bool) Is the button currently enabled for the site?',
		'visibility'   => '(string) If enabled, the current visibility of the sharing button, either "visible" or "hidden"',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/30434183/sharing-buttons/custom-123456789/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'enabled' => false,
		)
	),
	'example_response' => '{
	"ID": "custom-123456789",
	"name": "Custom"
	"shortname": "ustom",
	"custom": true,
	"enabled": false,
	"icon": "https://en.wordpress.com/i/stats-icon.gif",
	"url": "https://www.wordpress.com/%post_name%"
}'
) );

new WPCOM_JSON_API_Delete_Sharing_Button_Endpoint( array(
	'description' => 'Delete a custom sharing button.',
	'group'		  => '__do_not_document',
	'stat'		  => 'sharing-buttons:1:delete',
	'method'	  => 'POST',
	'path'        => '/sites/%s/sharing-buttons/%s/delete',
	'path_labels' => array(
		'$site'      => '(int|string) Site ID or domain',
		'$button_id' => '(string) The button ID',
	),
	'response_format' => array(
		'ID'      => '(int) The ID of the deleted sharing button',
		'success' => '(bool) Confirmation that the sharing button has been removed'
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/30434183/sharing-buttons/custom-123456789/delete',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
	),
	'example_response' => '{
	"ID": "custom-123456789",
	"success": "true"
}'
) );

/*
 * Custom CSS endpoints
 */
new WPCOM_JSON_API_Get_CustomCss_Endpoint( array (
	'description'      => 'Retrieve custom-css data for a site.',
	'group'            => '__do_not_document',
	'stat'             => 'customcss:1:get',
	'method'           => 'GET',
	'min_version'      => '1.1',
	'path'             => '/sites/%s/customcss',
	'path_labels'      => array(
		'$site' => '(string) Site ID or domain.',
	),
	'response_format'  => array(
		'css' => '(string) The raw CSS.',
		'preprocessor' => '(string) The name of the preprocessor if any.',
		'add_to_existing' => '(bool) False to skip the existing styles.',
	),
	'example_request'  => 'https://public-api.wordpress.com/rest/v1.1/sites/12345678/customcss',
	'example_response' => array(
		array(
			'css' => '.stie-title { color: #fff; }',
			'preprocessor' => 'sass',
			'add_to_existing' => 'true',
		)
	)
) );

new WPCOM_JSON_API_Update_CustomCss_Endpoint( array (
	'description'      => 'Set custom-css data for a site.',
	'group'            => '__do_not_document',
	'stat'             => 'customcss:1:update',
	'method'           => 'POST',
	'min_version'      => '1.1',
	'path'             => '/sites/%s/customcss',
	'path_labels'      => array(
		'$site' => '(string) Site ID or domain.',
	),
	'request_format'  => array(
		'css' => '(string) Optional. The raw CSS.',
		'preprocessor' => '(string) Optional. The name of the preprocessor if any.',
		'add_to_existing' => '(bool) Optional. False to skip the existing styles.',
	),
	'response_format'  => array(
		'css' => '(string) The raw CSS.',
		'preprocessor' => '(string) The name of the preprocessor if any.',
		'add_to_existing' => '(bool) False to skip the existing styles.',
	),
	'example_request'  => 'https://public-api.wordpress.com/rest/v1.1/sites/12345678/customcss',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
		'body' => array(
			'css' => '.stie-title { color: #fff; }',
			'preprocessor' => 'sass'
		),
	),
	'example_response' => array(
		array(
			'css' => '.stie-title { color: #fff; }',
			'preprocessor' => 'sass',
			'add_to_existing' => 'true',
		)
	)
) );

/*
 * Custom Menus endpoints
 */
new WPCOM_JSON_API_Menus_New_Menu_Endpoint( array (
	'method' => 'POST',
	'description' => 'Create a new navigation menu.',
	'group' => 'menus',
	'stat' => 'menus:new-menu',
	'path' => '/sites/%s/menus/new',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),
	'request_format'  => array(
		'name' => '(string) Name of menu',
	),
	'response_format' => array(
		'id' => '(int) Newly created menu ID',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/menus/new',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
		'body' => array(
			'name' => 'Menu 1'
		)
	),
) );

new WPCOM_JSON_API_Menus_Update_Menu_Endpoint( array (
	'method' => 'POST',
	'description' => 'Update a navigation menu.',
	'group' => 'menus',
	'stat' => 'menus:update-menu',
	'path' => '/sites/%s/menus/%d',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
		'$menu_id' => '(int) Menu ID',
	),
	'request_format'  => array(
		'name'  => '(string) Name of menu',
		'items' => '(array) A list of menu item objects.
			<br/><br/>
			Item objects contain fields relating to that item, e.g. id, type, content_id,
			but they can also contain other items objects - this nesting represents parents
			and child items in the item tree.'
	),
	'response_format' => array(
		'menu' => '(object) Updated menu object',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/menus/347757165',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
		'body' => array(
			'name' => 'Menu 1'
		),
	),
) );

new WPCOM_JSON_API_Menus_List_Menus_Endpoint( array (
	'method'=> 'GET',
	'description' => 'Get a list of all navigation menus.',
	'group' => 'menus',
	'stat' => 'menus:list-menu',
	'path' => '/sites/%s/menus',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
	),
	'response_format' => array(
		'menus' => '(array) A list of menu objects.<br/><br/>
			A menu object contains a name, items, locations, etc.
			Check the example response for the full structure.
			<br/><br/>
			Item objects contain fields relating to that item, e.g. id, type, content_id,
			but they can also contain other items objects - this nesting represents parents
			and child items in the item tree.',
		'locations' => '(array) Locations where menus can be placed. List of objects, one per location.'
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/menus',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
	),
) );

new WPCOM_JSON_API_Menus_Get_Menu_Endpoint( array (
	'method'=> 'GET',
	'description' => 'Get a single navigation menu.',
	'group' => 'menus',
	'stat' => 'menus:get-menu',
	'path' => '/sites/%s/menus/%d',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
		'$menu_id' => '(int) Menu ID',
	),
	'response_format' => array(
		'menu' => '(object) A menu object.<br/><br/>
			A menu object contains a name, items, locations, etc.
			Check the example response for the full structure.
			<br/><br/>
			Item objects contain fields relating to that item, e.g. id, type, content_id,
			but they can also contain other items objects - this nesting represents parents
			and child items in the item tree.'
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/menus/347757165',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
	),
) );

new WPCOM_JSON_API_Menus_Delete_Menu_Endpoint( array (
	'method' => 'POST',
	'description' => 'Delete a navigation menu',
	'group' => 'menus',
	'stat' => 'menus:delete-menu',
	'path' => '/sites/%s/menus/%d/delete',
	'path_labels' => array(
		'$site' => '(int|string) Site ID or domain',
		'$menu_id' => '(int) Menu ID',
	),
	'response_format' => array(
		'deleted' => '(bool) Has the menu been deleted?',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1.1/sites/82974409/menus/$menu_id/delete',
	'example_request_data' => array(
		'headers' => array( 'authorization' => 'Bearer YOUR_API_TOKEN' ),
	),
) );
