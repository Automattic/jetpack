<?php

/*
 * Endpoint class definitions. Only instantiations should be in this file
 *   file ordering matters
 */

$json_endpoints_dir = dirname( __FILE__ ) . '/json-endpoints/';

//abstract endpoints
require_once( $json_endpoints_dir . 'class.wpcom-json-api-post-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-comment-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-taxonomy-endpoint.php' );


require_once( $json_endpoints_dir . 'class.wpcom-json-api-delete-media-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-comment-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-media-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-post-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-render-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-render-shortcode-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-shortcodes-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-render-embed-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-embeds-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-site-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-taxonomies-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-get-taxonomy-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-comments-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-media-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-posts-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-list-users-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-comment-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-media-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-post-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-update-taxonomy-endpoint.php' );
require_once( $json_endpoints_dir . 'class.wpcom-json-api-upload-media-endpoint.php' );


// Jetpack Only Endpoints
//  TODO: move instantiations into this file?
require_once( $json_endpoints_dir . 'class.json-api-jetpack-endpoints.php' );


/*
 * Endpoint instantiations
 */

new WPCOM_JSON_API_GET_Site_Endpoint( array(
	'description' => 'Information about a site ID/domain',
	'group'	      => 'sites',
	'stat'        => 'sites:X',

	'method'      => 'GET',
	'path'        => '/sites/%s',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'query_parameters' => array(
		'context' => false,
	),

	'response_format' => WPCOM_JSON_API_GET_Site_Endpoint::$site_format,

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/?pretty=1',
) );

/*
 * Shortcode endpoints
 */

new WPCOM_JSON_API_List_Shortcodes_Endpoint( array(
	'description' => "Lists shortcodes available on a site. Only for users with publishing access.",
	//'group'       => 'sites',
	'group'       => '__do_not_document',
	'stat'        => 'shortcodes',
	'method'      => 'GET',
	'path'        => '/sites/%s/shortcodes',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
	),
	'response_format' => array(
		'shortcodes' => '(array) A list of supported shortcodes by their handle.',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.com/shortcodes'
) );

new WPCOM_JSON_API_Render_Shortcode_Endpoint( array(
	'description' => "Render a shortcode on a site. Only for users with publishing access.",
	//'group'       => 'sites',
	'group'       => '__do_not_document',
	'stat'        => 'shortcodes:render',
	'method'      => 'GET',
	'path'        => '/sites/%s/shortcodes/render',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
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
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/shortcodes/render?shortcode=%5Bgallery%20ids%3D%22729%2C732%2C731%2C720%22%5D'
) );

/*
 * embed endpoints
 */
new WPCOM_JSON_API_List_Embeds_Endpoint( array(
	'description' => "Lists embeds available on a site. Only for users with publishing access.",
	//'group'       => 'sites',
	'group'       => '__do_not_document',
	'stat'        => 'embeds',
	'method'      => 'GET',
	'path'        => '/sites/%s/embeds',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
	),
	'response_format' => array(
		'embeds' => '(array) A list of supported embeds by their regex pattern.',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.com/embeds'
) );

new WPCOM_JSON_API_Render_Embed_Endpoint( array(
	'description' => "Render a shortcode on a site. Only for users with publishing access.",
	//'group'       => 'sites',
	'group'       => '__do_not_document',
	'stat'        => 'embeds:render',
	'method'      => 'GET',
	'path'        => '/sites/%s/embeds/render',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
	),
	'query_parameters' => array(
		'embed_url'     => '(string) The query-string encoded embed URL to render. Required. Only accepts one at a time.',
	),
	'response_format' => array(
		'embed_url' => '(string) The embed_url that was passed in for rendering.',
		'result'    => '(html) The rendered HTML result of the embed.',
	),
	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/embeds/render?embed_url=https%3A%2F%2Fwww.youtube.com%2Fwatch%3Fv%3DSQEQr7c0-dw'
) );

/*
 * Post endpoints
 */
new WPCOM_JSON_API_List_Posts_Endpoint( array(
	'description' => 'Return matching Posts',
	'min_version' => '0',
	'max_version' => '1.1',

	'group'       => 'posts',
	'stat'        => 'posts',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'query_parameters' => array(
		'number'   => '(int=20) The number of posts to return.  Limit: 100.',
		'offset'   => '(int=0) 0-indexed offset.',
		'page'     => '(int) Return the Nth 1-indexed page of posts.  Takes precedence over the <code>offset</code> parameter.',
		'order'    => array(
			'DESC' => 'Return posts in descending order.  For dates, that means newest to oldest.',
			'ASC'  => 'Return posts in ascending order.  For dates, that means oldest to newest.',
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
		'status'   => array(
			'publish' => 'Return only published posts.',
			'private' => 'Return only private posts.',
			'draft'   => 'Return only draft posts.',
			'pending' => 'Return only posts pending editorial approval.',
			'future'  => 'Return only posts scheduled for future publishing.',
			'trash'   => 'Return only posts in the trash.',
			'any'     => 'Return all posts regardless of status.',
		),
		'sticky'   => '(bool) Specify the stickiness.',
		'author'   => "(int) Author's user ID",
		'search'   => '(string) Search query',
		'meta_key'   => '(string) Metadata key that the post should contain',
		'meta_value'   => '(string) Metadata value that the post should contain. Will only be applied if a `meta_key` is also given',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/?number=5&pretty=1'
) );

new WPCOM_JSON_API_Get_Post_Endpoint( array(
	'description' => 'Return a single Post (by ID)',
	'group'       => 'posts',
	'stat'        => 'posts:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/%d',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/7/?pretty=1'
) );

new WPCOM_JSON_API_Get_Post_Endpoint( array(
	'description' => 'Return a single Post (by name)',
	'group'       => '__do_not_document',
	'stat'        => 'posts:name',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/name:%s',
	'path_labels' => array(
		'$site'      => '(int|string) The site ID, The site domain',
		'$post_name' => '(string) The post name (a.k.a. slug)',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/name:blogging-and-stuff?pretty=1',
) );

new WPCOM_JSON_API_Get_Post_Endpoint( array(
	'description' => 'Return a single Post (by slug)',
	'group'       => 'posts',
	'stat'        => 'posts:slug',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/slug:%s',
	'path_labels' => array(
		'$site'      => '(int|string) The site ID, The site domain',
		'$post_slug' => '(string) The post slug (a.k.a. sanitized name)',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/slug:blogging-and-stuff?pretty=1',
) );

new WPCOM_JSON_API_Update_Post_Endpoint( array(
	'description' => 'Create a Post',
	'group'       => 'posts',
	'stat'        => 'posts:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/posts/new',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
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
		),
		'sticky'    => '(bool) Mark the post as sticky?',
		'password'  => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'    => "(int) The post ID of the new post's parent.",
		'type'      => "(string) The post type. Defaults to 'post'. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
		'categories' => "(array|string) Comma separated list or array of categories (name or id)",
		'tags'       => "(array|string) Comma separated list or array of tags (name or id)",
		'format'     => get_post_format_strings(),
		'featured_image' => "(string) The post ID of an existing attachment to set as the featured image. Pass an empty string to delete the existing image.",
		'media'      => "(media) An array of images to attach to the post. To upload media, the entire request should be multipart/form-data encoded.  Multiple media items will be displayed in a gallery.  Accepts images (image/gif, image/jpeg, image/png) only.<br /><br /><strong>Example</strong>:<br />" .
				"<code>curl \<br />--form 'title=Image' \<br />--form 'media[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'media_urls' => "(array) An array of URLs for images to attach to a post. Sideloads the media in for a post.",
		'metadata'      => "(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are avaiable for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.",
		'comments_open' => "(bool) Should the post be open to comments?  Defaults to the blog's preference.",
		'pings_open'    => "(bool) Should the post be open to comments?  Defaults to the blog's preference.",
		'likes_enabled' => "(bool) Should the post be open to likes?  Defaults to the blog's preference.",
		'sharing_enabled' => "(bool) Should sharing buttons show on this post?  Defaults to true.",
		'gplusauthorship_enabled' => "(bool) Should a Google+ account be associated with this post?  Defaults to true.",
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/posts/new/',

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
	),

	'example_response'     => '
{
	"ID": 1270,
	"author": {
		"ID": 18342963,
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
	},
	"date": "2012-04-11T19:42:44+00:00",
	"modified": "2012-04-11T19:42:44+00:00",
	"title": "Hello World",
	"URL": "http:\/\/opossumapi.wordpress.com\/2012\/04\/11\/hello-world-3\/",
	"short_URL": "http:\/\/wp.me\/p23HjV-ku",
	"content": "<p>Hello. I am a test post. I was created by the API<\/p>\n",
	"excerpt": "<p>Hello. I am a test post. I was created by the API<\/p>\n",
	"status": "publish",
	"sticky": false,
	"password": "",
	"parent": false,
	"type": "post",
	"comments_open": true,
	"pings_open": true,
	"likes_enabled": true,
	"sharing_enabled": true,
	"gplusauthorship_enabled": false,
	"comment_count": 0,
	"like_count": 0,
	"i_like": false,
	"is_reblogged": false,
	"is_following": false,
	"featured_image": "",
	"format": "standard",
	"geo": false,
	"publicize_URLs": [

	],
	"tags": {
		"tests": {
			"name": "tests",
			"slug": "tests",
			"description": "",
			"post_count": 1,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"categories": {
		"API": {
			"name": "API",
			"slug": "api",
			"description": "",
			"post_count": 1,
			"parent": 0,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"metadata {
		{
			"id" : 123,
			"key" : "test_meta_key",
			"value" : "test_value",
		}
	},
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1270",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1270\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1270\/replies\/",
			"likes": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1270\/likes\/"
		}
	}
}'
) );

new WPCOM_JSON_API_Update_Post_Endpoint( array(
	'description' => 'Edit a Post',
	'group'       => 'posts',
	'stat'        => 'posts:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
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
		'sticky'  	 => '(bool) Mark the post as sticky?',
		'password'   => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
		'parent'     => "(int) The post ID of the new post's parent.",
		'categories' => "(string) Comma separated list of categories (name or id)",
		'tags'       => "(string) Comma separated list of tags (name or id)",
		'format'     => get_post_format_strings(),
		'comments_open' => '(bool) Should the post be open to comments?',
		'pings_open'    => '(bool) Should the post be open to comments?',
		'likes_enabled' => "(bool) Should the post be open to likes?",
		'sharing_enabled' => "(bool) Should sharing buttons show on this post?",
		'gplusauthorship_enabled' => "(bool) Should a Google+ account be associated with this post?",
		'featured_image' => "(string) The post ID of an existing attachment to set as the featured image. Pass an empty string to delete the existing image.",
		'media'      => "(media) An array of images to attach to the post. To upload media, the entire request should be multipart/form-data encoded.  Multiple media items will be displayed in a gallery.  Accepts images (image/gif, image/jpeg, image/png) only.<br /><br /><strong>Example</strong>:<br />" .
		                "<code>curl \<br />--form 'title=Image' \<br />--form 'media[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
		'media_urls' => "(array) An array of URLs for images to attach to the post. Sideloads the media in for the post.",
		'metadata'      => "(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are available for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.",
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/posts/1222/',

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
	),

	'example_response'     => '
{
	"ID": 1222,
	"author": {
		"ID": 422,
		"email": false,
		"name": "Justin Shreve",
		"URL": "http:\/\/justin.wordpress.com",
		"avatar_URL": "http:\/\/1.gravatar.com\/avatar\/9ea5b460afb2859968095ad3afe4804b?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/justin"
	},
	"date": "2012-04-11T15:53:52+00:00",
	"modified": "2012-04-11T19:44:35+00:00",
	"title": "Hello World (Again)",
	"URL": "http:\/\/opossumapi.wordpress.com\/2012\/04\/11\/hello-world-2\/",
	"short_URL": "http:\/\/wp.me\/p23HjV-jI",
	"content": "<p>Hello. I am an edited post. I was edited by the API<\/p>\n",
	"excerpt": "<p>Hello. I am an edited post. I was edited by the API<\/p>\n",
	"status": "publish",
	"sticky": false,
	"password": "",
	"parent": false,
	"type": "post",
	"comments_open": true,
	"pings_open": true,
	"likes_enabled": true,
	"sharing_enabled": true,
	"gplusauthorship_enabled": false,
	"comment_count": 5,
	"like_count": 0,
	"i_like": false,
	"is_reblogged": false,
	"is_following": false,
	"featured_image": "",
	"post_thumbnail": "",
	"format": "standard",
	"geo": false,
	"publicize_URLs": [

	],
	"tags": {
		"tests": {
			"name": "tests",
			"slug": "tests",
			"description": "",
			"post_count": 2,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"categories": {
		"API": {
			"name": "API",
			"slug": "api",
			"description": "",
			"post_count": 2,
			"parent": 0,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"metadata {
		{
			"id" : 123,
			"key" : "test_meta_key",
			"value" : "test_value",
		}
	},
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/replies\/",
			"likes": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/likes\/"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Post_Endpoint( array(
	'description' => 'Delete a Post. Note: If the post object is of type post or page and the trash is enabled, this request will send the post to the trash. A second request will permanently delete the post.',
	'group'       => 'posts',
	'stat'        => 'posts:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d/delete',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/posts/1222/delete/',

	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	),

	'example_response'     => '
{
	"ID": 1222,
	"author": {
		"ID": 422,
		"email": false,
		"name": "Justin Shreve",
		"URL": "http:\/\/justin.wordpress.com",
		"avatar_URL": "http:\/\/1.gravatar.com\/avatar\/9ea5b460afb2859968095ad3afe4804b?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/justin"
	},
	"date": "2012-04-11T15:53:52+00:00",
	"modified": "2012-04-11T19:49:42+00:00",
	"title": "Hello World (Again)",
	"URL": "http:\/\/opossumapi.wordpress.com\/2012\/04\/11\/hello-world-2\/",
	"short_URL": "http:\/\/wp.me\/p23HjV-jI",
	"content": "<p>Hello. I am an edited post. I was edited by the API<\/p>\n",
	"excerpt": "<p>Hello. I am an edited post. I was edited by the API<\/p>\n",
	"status": "trash",
	"sticky": false,
	"password": "",
	"parent": false,
	"type": "post",
	"comments_open": true,
	"pings_open": true,
	"likes_enabled": true,
	"sharing_enabled": true,
	"gplusauthorship_enabled": false,
	"comment_count": 5,
	"like_count": 0,
	"i_like": false,
	"is_reblogged": false,
	"is_following": false,
	"featured_image": "",
	"post_thumbnail": "",
	"format": "standard",
	"geo": false,
	"publicize_URLs": [

	],
	"tags": {
		"tests": {
			"name": "tests",
			"slug": "tests",
			"description": "",
			"post_count": 1,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/tests\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"metadata {
		{
			"id" : 123,
			"key" : "test_meta_key",
			"value" : "test_value",
		}
	},
	"categories": {
		"API": {
			"name": "API",
			"slug": "api",
			"description": "",
			"post_count": 1,
			"parent": 0,
			"meta": {
				"links": {
					"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api",
					"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/api\/help",
					"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
				}
			}
		}
	},
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/replies\/",
			"likes": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222\/likes\/"
		}
	}
}'

) );

/*
 * Media Endpoints
 */
new WPCOM_JSON_API_List_Media_Endpoint( array(
	'description' => 'Return the media library',
	'group'       => 'media',
	'stat'        => 'media',

	'method'      => 'GET',
	'path'        => '/sites/%s/media/',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'query_parameters' => array(
		'number'    => '(int=20) The number of media items to return.  Limit: 100.',
		'offset'    => '(int=0) 0-indexed offset.',
		'parent_id' => '(int) Default is nothing. The post where the media item is attached. Passing nothing shows all media items. 0 shows unattached media items.',
		'mime_type' => "(string) Default is nothing. Filter by mime type (e.g., 'image/jpeg', 'application/pdf'",
	),

	'response_format' => array(
 		'media' => '(array) Array of media',
 		'found' => '(int) The number of total results found'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.com/media/?pretty=true',
) );

new WPCOM_JSON_API_Get_Media_Endpoint( array(
	'description' => 'Return a single media item (by ID)',
	'group'       => 'media',
	'stat'        => 'media:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/media/%d',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
		'$media_ID' => '(int) The ID of the media item',
	),
	'response_format' => array(
		'id'    => '(int) The ID of the media item',
		'date' =>  '(ISO 8601 datetime) The date the media was uploaded',
		'parent'           => '(int) ID of the post this media is attached to',
		'link'             => '(string) URL to the file',
		'title'            => '(string) File name',
		'caption'          => '(string) User provided caption of the file',
		'description'      => '(string) Description of the file',
		'metadata'         => '(array) Misc array of information about the file, such as exif data or sizes',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/example.wordpress.com/media/36',
) );

new WPCOM_JSON_API_Upload_Media_Endpoint( array(
	'description' => 'Upload a new piece of media',
	'group'       => 'media',
	'stat'        => 'media:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/media/new',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'request_format' => array(
		'media'      => "(media) An array of media to attach to the post. To upload media, the entire request should be multipart/form-data encoded.  Accepts images (image/gif, image/jpeg, image/png) only at this time.<br /><br /><strong>Example</strong>:<br />" .
				"<code>curl \<br />--form 'files[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/media/new'</code>",
		'media_urls' => "(array) An array of URLs to upload to the post."
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/media/new/',

	'response_format' => array(
 		'media' => '(array) Array of uploaded media',
	),
) );

new WPCOM_JSON_API_Update_Media_Endpoint( array(
	'description' => 'Edit basic information about a media item',
	'group'       => 'media',
	'stat'        => 'media:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/media/%d',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
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
		'metadata'    => '(array) Misc array of information about the file, such as exif data or sizes',
	)
) );


new WPCOM_JSON_API_Delete_Media_Endpoint( array(
	'description' => 'Delete a piece of media',
	'group'       => 'media',
	'stat'        => 'media:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/media/%d/delete',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
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
	)
) );

/*
 * Comment endpoints
 */
new WPCOM_JSON_API_List_Comments_Endpoint( array(
	'description' => 'Return recent Comments',
	'group'       => 'comments',
	'stat'        => 'comments',

	'method'      => 'GET',
	'path'        => '/sites/%s/comments/',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/comments/?number=5&pretty=1'
) );

new WPCOM_JSON_API_List_Comments_Endpoint( array(
	'description' => 'Return recent Comments for a Post',
	'group'       => 'comments',
	'stat'        => 'posts:1:replies',

	'method'      => 'GET',
	'path'        => '/sites/%s/posts/%d/replies/',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
		'$post_ID' => '(int) The post ID',
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/posts/7/replies/?number=5&pretty=1'
) );

new WPCOM_JSON_API_Get_Comment_Endpoint( array(
	'description' => 'Return a single Comment',
	'group'       => 'comments',
	'stat'        => 'comments:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/comments/%d',
	'path_labels' => array(
		'$site'       => '(int|string) The site ID, The site domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'example_request' => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/comments/11/?pretty=1'
) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Create a Comment on a Post',
	'group'       => 'comments',
	'stat'        => 'posts:1:replies:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/posts/%d/replies/new',
	'path_labels' => array(
		'$site'    => '(int|string) The site ID, The site domain',
		'$post_ID' => '(int) The post ID'
	),

	'request_format' => array(
		// explicitly document all input
		'content'   => '(HTML) The comment text.',
//		@todo Should we open this up to unauthenticated requests too?
//		'author'    => '(author object) The author of the comment.',
	),

	'pass_wpcom_user_details' => true,
	'can_use_user_details_instead_of_blog_membership' => true,

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/posts/1222/replies/new/',
	'example_request_data' =>  array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'content' => 'Your reply is very interesting. This is a reply.'
		)
	),

	'example_response'     => '
{
	"ID": 9,
	"post": {
		"ID": 1222,
		"type": "post",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222"
	},
	"author": {
		"ID": 18342963,
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
	},
	"date": "2012-04-11T18:09:41+00:00",
	"URL": "http:\/\/opossumapi.wordpress.com\/2012\/04\/11\/hello-world-2\/#comment-9",
	"short_URL": "http:\/\/wp.me\/p23HjV-jI%23comment-9",
	"content": "<p>Your reply is very interesting. This is a reply.<\/p>\n",
	"status": "approved",
	"parent": {
		"ID":8,
		"type": "comment",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/8"
	},
	"type": "comment",
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/9",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/9\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"post": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1222",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/9\/replies\/"
		}
	}
}',
) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Create a Comment as a reply to another Comment',
	'group'       => 'comments',
	'stat'        => 'comments:1:replies:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/comments/%d/replies/new',
	'path_labels' => array(
		'$site'       => '(int|string) The site ID, The site domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'request_format' => array(
		'content'   => '(HTML) The comment text.',
//		@todo Should we open this up to unauthenticated requests too?
//		'author'    => '(author object) The author of the comment.',
	),

	'pass_wpcom_user_details' => true,
	'can_use_user_details_instead_of_blog_membership' => true,

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/comments/8/replies/new/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'content' => 'This reply is very interesting. This is editing a comment reply via the API.',
		)
	),
	'example_response'     => '
{
	"ID": 13,
	"post": {
		"ID": 1,
		"type": "post",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1"
	},
	"author": {
		"ID": 18342963,
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
	},
	"date": "2012-04-11T20:16:28+00:00",
	"URL": "http:\/\/opossumapi.wordpress.com\/2011\/12\/13\/hello-world\/#comment-13",
	"short_URL": "http:\/\/wp.me\/p23HjV-1%23comment-13",
	"content": "<p>This reply is very interesting. This is editing a comment reply via the API.<\/p>\n",
	"status": "approved",
	"parent": {
		"ID": 1,
		"type": "comment",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/1"
	},
	"type": "comment",
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"post": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/replies\/"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Edit a Comment',
	'group'       => 'comments',
	'stat'        => 'comments:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/comments/%d',
	'path_labels' => array(
		'$site'       => '(int|string) The site ID, The site domain',
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

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/comments/8/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'content' => 'This reply is now edited via the API.',
			'status'  => 'approved',
		)
	),
	'example_response'     => '
{
	"ID": 13,
	"post": {
		"ID": 1,
		"type": "post",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1"
	},
	"author": {
		"ID": 18342963,
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
	},
	"date": "2012-04-11T20:16:28+00:00",
	"URL": "http:\/\/opossumapi.wordpress.com\/2011\/12\/13\/hello-world\/#comment-13",
	"short_URL": "http:\/\/wp.me\/p23HjV-1%23comment-13",
	"content": "<p>This reply is very interesting. This is editing a comment reply via the API.<\/p>\n",
	"status": "approved",
	"parent": {
		"ID": 1,
		"type": "comment",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/1"
	},
	"type": "comment",
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"post": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/replies\/"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Comment_Endpoint( array(
	'description' => 'Delete a Comment',
	'group'       => 'comments',
	'stat'        => 'comments:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/comments/%d/delete',
	'path_labels' => array(
		'$site'       => '(int|string) The site ID, The site domain',
		'$comment_ID' => '(int) The comment ID'
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/comments/8/delete/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		)
	),

	'example_response'     => '
{
	"ID": 13,
	"post": {
		"ID": 1,
		"type": "post",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1"
	},
	"author": {
		"ID": 18342963,
		"email": false,
		"name": "binarysmash",
		"URL": "http:\/\/binarysmash.wordpress.com",
		"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
		"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
	},
	"date": "2012-04-11T20:16:28+00:00",
	"URL": "http:\/\/opossumapi.wordpress.com\/2011\/12\/13\/hello-world\/#comment-13",
	"short_URL": "http:\/\/wp.me\/p23HjV-1%23comment-13",
	"content": "<p>This reply is very interesting. This is editing a comment reply via the API.<\/p>\n",
	"status": "deleted",
	"parent": {
		"ID": 1,
		"type": "comment",
		"link": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/1"
	},
	"type": "comment",
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183",
			"post": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/posts\/1",
			"replies": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/comments\/13\/replies\/"
		}
	}
}'

) );

/**
 * Taxonomy Management Endpoints
 */
new WPCOM_JSON_API_Get_Taxonomy_Endpoint( array(
	'description' => 'Returns information on a single Category',
	'group'       => 'taxonomy',
	'stat'        => 'categories:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/categories/slug:%s',
	'path_labels' => array(
		'$site'     => '(int|string) The site ID, The site domain',
		'$category' => '(string) The category slug'
	),

	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/categories/slug:community?pretty=1'
) );

new WPCOM_JSON_API_Get_Taxonomies_Endpoint( array(
	'description' => "Returns a list of a site's categories",
	'group'       => 'taxonomy',
	'stat'        => 'categories',
	'method'      => 'GET',
	'path'        => '/sites/%s/categories',
	'path_labels' => array(
		'$site'     => '(int|string) The site ID, The site domain'
	),
	'response_format' => array(
		'found'      => '(int) The number of categories returned.',
		'categories' => '(array) Array of category objects.',
	),
	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/categories?pretty=1'
) );

new WPCOM_JSON_API_Get_Taxonomies_Endpoint( array(
	'description' => "Returns a list of a site's tags",
	'group'       => 'taxonomy',
	'stat'        => 'tags',
	'method'      => 'GET',
	'path'        => '/sites/%s/tags',
	'path_labels' => array(
		'$site'     => '(int|string) The site ID, The site domain'
	),
	'response_format' => array(
		'found'    => '(int) The number of tags returned.',
		'tags'     => '(array) Array of tag objects.',
	),
	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/tags?pretty=1'
) );

new WPCOM_JSON_API_Get_Taxonomy_Endpoint( array(
	'description' => 'Returns information on a single Tag',
	'group'       => 'taxonomy',
	'stat'        => 'tags:1',

	'method'      => 'GET',
	'path'        => '/sites/%s/tags/slug:%s',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
		'$tag'  => '(string) The tag slug'
	),

	'example_request'  => 'https://public-api.wordpress.com/rest/v1/sites/en.blog.wordpress.com/tags/slug:wordpresscom?pretty=1'
) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Create a new Category',
	'group'       => 'taxonomy',
	'stat'        => 'categories:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/categories/new',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'request_format' => array(
		'name'        => '(string) Name of the category',
		'description' => '(string) A description of the category',
		'parent'      => '(id) ID of the parent category',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/categories/new/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'name' => 'Puppies',
		)
	),
	'example_response'     => '
{
	"name": "Puppies",
	"slug": "puppies",
	"description": "",
	"post_count": 0,
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/puppies",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/puppies\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Create a new Tag',
	'group'       => 'taxonomy',
	'stat'        => 'tags:new',

	'method'      => 'POST',
	'path'        => '/sites/%s/tags/new',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
	),

	'request_format' => array(
		'name'        => '(string) Name of the tag',
		'description' => '(string) A description of the tag',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/tags/new/',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'name' => 'Kitties'
		)
	),
	'example_response'     => '
{
	"name": "Kitties",
	"slug": "kitties",
	"description": "",
	"post_count": 0,
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/kitties",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/kitties\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Edit a Tag',
	'group'       => 'taxonomy',
	'stat'        => 'tags:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/tags/slug:%s',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
		'$tag'  => '(string) The tag slug',
	),

	'request_format' => array(
		'name'        => '(string) Name of the tag',
		'description' => '(string) A description of the tag',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/tags/slug:testing-tag',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'description' => 'Kitties are awesome!'
		)
	),
	'example_response'     => '
{
	"name": "testing tag",
	"slug": "testing-tag",
	"description": "Kitties are awesome!",
	"post_count": 0,
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/testing-tag",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/tags\/testing-tag\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Edit a Category',
	'group'       => 'taxonomy',
	'stat'        => 'categories:1:POST',

	'method'      => 'POST',
	'path'        => '/sites/%s/categories/slug:%s',
	'path_labels' => array(
		'$site'     => '(int|string) The site ID, The site domain',
		'$category' => '(string) The category slug',
	),

	'request_format' => array(
		'name'        => '(string) Name of the category',
		'description' => '(string) A description of the category',
		'parent'      => '(id) ID of the parent category',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/categories/slug:testing-category',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
		'body' => array(
			'description' => 'Puppies are great!'
		)
	),
	'example_response'     => '
{
	"name": "testing category",
	"slug": "testing-category",
	"description": "Puppies are great!",
	"post_count": 0,
	"parent": 0,
	"meta": {
		"links": {
			"self": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/testing-category",
			"help": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183\/categories\/testing-category\/help",
			"site": "https:\/\/public-api.wordpress.com\/rest\/v1\/sites\/30434183"
		}
	}
}'

) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Delete a Category',
	'group'       => 'taxonomy',
	'stat'        => 'categories:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/categories/slug:%s/delete',
	'path_labels' => array(
		'$site'     => '(int|string) The site ID, The site domain',
		'$category' => '(string) The category slug',
	),
	'response_format' => array(
		'slug'    => '(string) The slug of the deleted category',
		'success' => '(bool) Was the operation successful?',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/categories/slug:some-category-name/delete',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_response'     => '{
	"slug": "some-category-name",
	"success": "true"
}'
) );

new WPCOM_JSON_API_Update_Taxonomy_Endpoint( array(
	'description' => 'Delete a Tag',
	'group'       => 'taxonomy',
	'stat'        => 'tags:1:delete',

	'method'      => 'POST',
	'path'        => '/sites/%s/tags/slug:%s/delete',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
		'$tag'  => '(string) The tag slug',
	),
	'response_format' => array(
		'slug'    => '(string) The slug of the deleted tag',
		'success' => '(bool) Was the operation successful?',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/tags/slug:some-tag-name/delete',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_response'     => '{
	"slug": "some-tag-name",
	"success": "true"
}'
) );

new WPCOM_JSON_API_List_Users_Endpoint( array(
	'description' => 'List the Users of a blog',
	'group'       => 'users',
	'stat'        => 'users:list',

	'method'      => 'GET',
	'path'        => '/sites/%s/users',
	'path_labels' => array(
		'$site' => '(int|string) The site ID, The site domain',
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
		'authors_only'      => "(bool) Set to true to fetch authors only",
		'type'              => "(string) Specify the post type to query authors for. Only works when combined with the `authors_only` flag. Defaults to 'post'. Post types besides post and page need to be whitelisted using the <code>rest_api_allowed_post_types</code> filter.",
	),

	'response_format' => array(
		'found'    => '(int) The total number of authors found that match the request (ignoring limits and offsets).',
		'authors'  => '(array:author) Array of author objects.',
	),

	'example_request'      => 'https://public-api.wordpress.com/rest/v1/sites/30434183/users',
	'example_request_data' => array(
		'headers' => array(
			'authorization' => 'Bearer YOUR_API_TOKEN'
		),
	),
	'example_response'     => '{
		"found": 1,
		"users": [
			{
				"ID": 18342963,
				"login": "binarysmash"
				"email": false,
				"name": "binarysmash",
				"URL": "http:\/\/binarysmash.wordpress.com",
				"avatar_URL": "http:\/\/0.gravatar.com\/avatar\/a178ebb1731d432338e6bb0158720fcc?s=96&d=identicon&r=G",
				"profile_URL": "http:\/\/en.gravatar.com\/binarysmash"
			},
		]
	}'
) );

