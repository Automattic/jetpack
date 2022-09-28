<?php
/**
 * Jetpack `sites/%s/posts/%d` endpoint unit tests.
 *
 * @package automattic/jetpack
 */

require_jetpack_file( 'class.json-api-endpoints.php' );

/**
 * Jetpack `sites/%s/posts/%d` endpoint unit tests.
 */
class WP_Test_Json_Api_Update_Post_Endpoints extends WP_UnitTestCase {

	/**
	 * Inserts globals needed to initialize the endpoint.
	 */
	private function set_globals() {
		$_SERVER['REQUEST_METHOD'] = 'Post';
		$_SERVER['HTTP_HOST']      = '127.0.0.1';
		$_SERVER['REQUEST_URI']    = '/';
	}

	/**
	 * Prepare the environment for the test.
	 */
	public function set_up() {
		global $blog_id;

		if ( ! defined( 'WPCOM_JSON_API__BASE' ) ) {
			define( 'WPCOM_JSON_API__BASE', 'public-api.wordpress.com/rest/v1' );
		}

		parent::set_up();

		$this->set_globals();

		WPCOM_JSON_API::init()->token_details = array( 'blog_id' => $blog_id );
	}

	/**
	 * Unit tests the should untrash post protected method.
	 */
	public function test_should_untrash_post_method() {

		$post_id  = $this->get_post();
		$endpoint = $this->get_endpoint();

		$post = get_post( $post_id );

		$this->assertTrue( $this->invoke_method( $endpoint, 'should_untrash_post', array( 'trash', 'draft', $post ) ) );
		$this->assertFalse( $this->invoke_method( $endpoint, 'should_untrash_post', array( 'publish', 'trash', $post ) ) );
		$this->assertFalse( $this->invoke_method( $endpoint, 'should_untrash_post', array( 'publish', 'draft', $post ) ) );
	}

	/**
	 * Unit tests the untrash post protected method.
	 */
	public function test_update_post_api_v1_1_untrash_post() {
		$post_id  = $this->get_post();
		$endpoint = $this->get_endpoint();

		wp_trash_post( $post_id );
		$post = get_post( $post_id );
		// hello is coming from the post title.
		$input = array( 'slug' => 'hello__trashed' );

		$updated_input = $this->invoke_method( $endpoint, 'untrash_post', array( $post, $input ) );
		// Tests that we remove the slug id it contains the '__trashed' suffix.
		$this->assertEmpty( $updated_input );
	}

	/**
	 * Helper function that inserts a post.
	 *
	 * @return int|WP_Error
	 */
	private function get_post() {
		return wp_insert_post(
			array(
				'post_title'   => 'hello',
				'post_content' => 'world',
				'post_status'  => 'publish',
			)
		);

	}

	/**
	 * Helper function that returns the post endpoint object.
	 *
	 * @return WPCOM_JSON_API_Update_Post_v1_1_Endpoint
	 */
	private function get_endpoint() {
		return new WPCOM_JSON_API_Update_Post_v1_1_Endpoint(
			array(
				'description'    => 'Edit a post.',
				'group'          => 'posts',
				'stat'           => 'posts:1:POST',
				'new_version'    => '1.2',
				'min_version'    => '1.1',
				'max_version'    => '1.1',
				'method'         => 'POST',
				'path'           => '/sites/%s/posts/%d',
				'path_labels'    => array(
					'$site'    => '(int|string) Site ID or domain',
					'$post_ID' => '(int) The post ID',
				),

				'request_format' => array(
					'date'              => "(ISO 8601 datetime) The post's creation time.",
					'title'             => '(HTML) The post title.',
					'content'           => '(HTML) The post content.',
					'excerpt'           => '(HTML) An optional post excerpt.',
					'slug'              => '(string) The name (slug) for the post, used in URLs.',
					'author'            => '(string) The username or ID for the user to assign the post to.',
					'publicize'         => '(array|bool) True or false if the post be publicized to external services. An array of services if we only want to publicize to a select few. Defaults to true.',
					'publicize_message' => '(string) Custom message to be publicized to external services.',
					'status'            => array(
						'publish' => 'Publish the post.',
						'private' => 'Privately publish the post.',
						'draft'   => 'Save the post as a draft.',
						'future'  => 'Schedule the post (alias for publish; you must also set a future date).',
						'pending' => 'Mark the post as pending editorial approval.',
						'trash'   => 'Set the post as trashed.',
					),
					'sticky'            => array(
						'false' => 'Post is not marked as sticky.',
						'true'  => 'Stick the post to the front page.',
					),
					'password'          => '(string) The plaintext password protecting the post, or, more likely, the empty string if the post is not password protected.',
					'parent'            => "(int) The post ID of the new post's parent.",
					'terms'             => '(object) Mapping of taxonomy to comma-separated list or array of terms (name or id)',
					'categories'        => '(array|string) Comma-separated list or array of categories (name or id)',
					'tags'              => '(array|string) Comma-separated list or array of tags (name or id)',
					'format'            => array_merge( array( 'default' => 'Use default post format' ), get_post_format_strings() ),
					'discussion'        => '(object) A hash containing one or more of the following boolean values, which default to the blog\'s discussion preferences: `comments_open`, `pings_open`',
					'likes_enabled'     => '(bool) Should the post be open to likes?',
					'menu_order'        => '(int) (Pages only) the order pages should appear in. Use 0 to maintain alphabetical order.',
					'page_template'     => '(string) (Pages Only) The page template this page should use.',
					'sharing_enabled'   => '(bool) Should sharing buttons show on this post?',
					'featured_image'    => '(string) The post ID of an existing attachment to set as the featured image. Pass an empty string to delete the existing image.',
					'media'             => '(media) An array of files to attach to the post. To upload media, the entire request should be multipart/form-data encoded. Multiple media items will be displayed in a gallery. Accepts  jpg, jpeg, png, gif, pdf, doc, ppt, odt, pptx, docx, pps, ppsx, xls, xlsx, key. Audio and Video may also be available. See <code>allowed_file_types</code> in the options resposne of the site endpoint. <br /><br /><strong>Example</strong>:<br />' .
									"<code>curl \<br />--form 'title=Image' \<br />--form 'media[]=@/path/to/file.jpg' \<br />-H 'Authorization: BEARER your-token' \<br />'https://public-api.wordpress.com/rest/v1/sites/123/posts/new'</code>",
					'media_urls'        => '(array) An array of URLs for images to attach to a post. Sideloads the media in for a post.',
					'metadata'          => '(array) Array of metadata objects containing the following properties: `key` (metadata key), `id` (meta ID), `previous_value` (if set, the action will only occur for the provided previous value), `value` (the new value to set the meta to), `operation` (the operation to perform: `update` or `add`; defaults to `update`). All unprotected meta keys are available by default for read requests. Both unprotected and protected meta keys are available for authenticated requests with proper capabilities. Protected meta keys can be made available with the <code>rest_api_allowed_public_metadata</code> filter.',
				),
			)
		);
	}

	/**
	 * Call protected/private method of a class.
	 *
	 * @param object $object    Instantiated object that we will run method on.
	 * @param string $method_name Method name to call.
	 * @param array  $parameters Array of parameters to pass into method.
	 *
	 * @return mixed Method return.
	 */
	public function invoke_method( &$object, $method_name, array $parameters = array() ) {
		$reflection = new \ReflectionClass( get_class( $object ) );
		$method     = $reflection->getMethod( $method_name );
		$method->setAccessible( true );

		return $method->invokeArgs( $object, $parameters );
	}
}
