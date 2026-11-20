<?php
/**
 * Jetpack `sites/%s/posts/%d` endpoint unit tests.
 *
 * @package automattic/jetpack
 */

use PHPUnit\Framework\Attributes\DataProvider;

require_once JETPACK__PLUGIN_DIR . 'class.json-api-endpoints.php';

/**
 * Jetpack `sites/%s/posts/%d` endpoint unit tests.
 */
class Json_Api_Update_Post_Endpoints_Test extends WP_UnitTestCase {
	use \Automattic\Jetpack\PHPUnit\WP_UnitTestCase_Fix;

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
	 * Publishing with publicize=false must not flag the post for sharing, and must not affect later posts.
	 *
	 * @dataProvider provide_endpoint_classes_and_encodings
	 *
	 * @param string $class_name   Endpoint class.
	 * @param string $content_type Request content type.
	 */
	#[DataProvider( 'provide_endpoint_classes_and_encodings' )]
	public function test_publish_with_publicize_false_is_not_flagged_for_sharing( $class_name, $content_type ) {
		global $blog_id;

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$publicize_ui                       = $GLOBALS['publicize_ui'] ?? null;
		$GLOBALS['publicize_ui']            = new stdClass();
		$GLOBALS['publicize_ui']->publicize = new class() {
			/**
			 * No services, so the endpoint writes no skip meta.
			 *
			 * @return array
			 */
			public function get_services() {
				return array();
			}
		};

		$should_publicize = array();
		$record           = static function ( $new_status, $old_status, $post ) use ( &$should_publicize ) {
			if ( 'publish' === $new_status ) {
				$should_publicize[ $post->post_title ] = apply_filters( 'publicize_should_publicize_published_post', true, $post );
			}
		};
		add_action( 'transition_post_status', $record, 10, 3 );

		$body                                = array(
			'title'     => 'skipped',
			'content'   => 'Hi',
			'status'    => 'publish',
			'publicize' => false,
		);
		WPCOM_JSON_API::init()->post_body    = 'application/json' === $content_type ? wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) : http_build_query( $body );
		WPCOM_JSON_API::init()->content_type = $content_type;

		$response = $this->get_endpoint( $class_name, '/sites/%s/posts/new' )->callback( "/sites/$blog_id/posts/new", $blog_id, 0 );
		self::factory()->post->create(
			array(
				'post_title'  => 'later',
				'post_status' => 'publish',
			)
		);

		remove_action( 'transition_post_status', $record, 10 );
		$GLOBALS['publicize_ui'] = $publicize_ui;

		$this->assertNotWPError( $response );
		$this->assertSame(
			array(
				'skipped' => false,
				'later'   => true,
			),
			$should_publicize
		);
	}

	/**
	 * Connections left out of a publicize list must be skipped before Sync builds the publish event.
	 *
	 * @dataProvider provide_endpoint_classes_and_encodings
	 *
	 * @param string $class_name   Endpoint class.
	 * @param string $content_type Request content type.
	 */
	#[DataProvider( 'provide_endpoint_classes_and_encodings' )]
	public function test_publish_with_publicize_list_skips_other_connections_before_publish_event( $class_name, $content_type ) {
		global $blog_id;

		wp_set_current_user( self::factory()->user->create( array( 'role' => 'administrator' ) ) );

		$publicize_ui                       = $GLOBALS['publicize_ui'] ?? null;
		$GLOBALS['publicize_ui']            = new stdClass();
		$GLOBALS['publicize_ui']->publicize = new class() {
			/**
			 * Skip meta key prefix.
			 *
			 * @var string
			 */
			public $POST_SKIP = '_wpas_skip_'; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.PropertyNotSnakeCase

			/**
			 * Connected services.
			 *
			 * @return array
			 */
			public function get_services() {
				return array(
					'facebook' => array(),
					'linkedin' => array(),
				);
			}

			/**
			 * One connection per service.
			 *
			 * @param string $service_name Service name.
			 * @return array
			 */
			public function get_connections( $service_name ) {
				return array( array( 'unique_id' => $service_name ) );
			}

			/**
			 * Connection unique ID.
			 *
			 * @param array $connection Connection.
			 * @return string
			 */
			public function get_connection_unique_id( $connection ) {
				return $connection['unique_id'];
			}
		};

		$skipped_at_publish = array();
		$record             = static function ( $flags, $post ) use ( &$skipped_at_publish ) {
			$skipped_at_publish[ $post->post_title ] = array(
				'facebook' => (bool) get_post_meta( $post->ID, '_wpas_skip_facebook', true ),
				'linkedin' => (bool) get_post_meta( $post->ID, '_wpas_skip_linkedin', true ),
			);
			return $flags;
		};
		add_filter( 'jetpack_published_post_flags', $record, 10, 2 );

		// Like a page's auto-added menu item, this post is inserted during the endpoint's save.
		$nested_id = 0;
		$nest      = static function ( $new_status, $old_status, $post ) use ( &$nested_id ) {
			if ( 'listed' === $post->post_title && 'publish' === $new_status ) {
				$nested_id = wp_insert_post( array( 'post_type' => 'nav_menu_item' ) );
			}
		};
		add_action( 'transition_post_status', $nest, 10, 3 );

		$draft_id  = self::factory()->post->create(
			array(
				'post_title'  => 'updated',
				'post_status' => 'draft',
			)
		);
		$responses = array();
		foreach ( array(
			'listed'  => array( '/sites/%s/posts/new', "/sites/$blog_id/posts/new", 0, array( 'linkedin' ) ),
			'updated' => array( '/sites/%s/posts/%d', "/sites/$blog_id/posts/$draft_id", $draft_id, array( 'linkedin' ) ),
			'shared'  => array( '/sites/%s/posts/new', "/sites/$blog_id/posts/new", 0, true ),
		) as $title => list( $pattern, $path, $post_id, $publicize ) ) {
			$body                                = array(
				'title'     => $title,
				'content'   => 'Hi',
				'status'    => 'publish',
				'publicize' => $publicize,
			);
			WPCOM_JSON_API::init()->post_body    = 'application/json' === $content_type ? wp_json_encode( $body, JSON_UNESCAPED_SLASHES ) : http_build_query( $body );
			WPCOM_JSON_API::init()->content_type = $content_type;

			$responses[] = $this->get_endpoint( $class_name, $pattern )->callback( $path, $blog_id, $post_id );
		}
		self::factory()->post->create(
			array(
				'post_title'  => 'later',
				'post_status' => 'publish',
			)
		);

		remove_filter( 'jetpack_published_post_flags', $record, 10 );
		remove_action( 'transition_post_status', $nest, 10 );
		$GLOBALS['publicize_ui'] = $publicize_ui;

		$this->assertNotWPError( $responses[0] );
		$this->assertNotWPError( $responses[1] );
		$this->assertNotWPError( $responses[2] );
		$this->assertSame( '', get_post_meta( $nested_id, '_wpas_skip_facebook', true ) );
		$this->assertSame(
			array(
				'listed'  => array(
					'facebook' => true,
					'linkedin' => false,
				),
				'updated' => array(
					'facebook' => true,
					'linkedin' => false,
				),
				'shared'  => array(
					'facebook' => false,
					'linkedin' => false,
				),
				'later'   => array(
					'facebook' => false,
					'linkedin' => false,
				),
			),
			$skipped_at_publish
		);
	}

	/**
	 * Post endpoint classes that create posts, with form-encoded (Post by Email) and JSON bodies.
	 *
	 * @return array
	 */
	public static function provide_endpoint_classes_and_encodings() {
		$classes = array(
			'v1'   => 'WPCOM_JSON_API_Update_Post_Endpoint',
			'v1.1' => 'WPCOM_JSON_API_Update_Post_v1_1_Endpoint',
			'v1.2' => 'WPCOM_JSON_API_Update_Post_v1_2_Endpoint',
		);
		$data    = array();
		foreach ( $classes as $version => $class_name ) {
			$data[ "$version form" ] = array( $class_name, 'application/x-www-form-urlencoded' );
			$data[ "$version json" ] = array( $class_name, 'application/json' );
		}
		return $data;
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
	 * @param string $class_name Endpoint class.
	 * @param string $path       Endpoint path.
	 *
	 * @return WPCOM_JSON_API_Update_Post_v1_1_Endpoint
	 */
	private function get_endpoint( $class_name = 'WPCOM_JSON_API_Update_Post_v1_1_Endpoint', $path = '/sites/%s/posts/%d' ) {
		return new $class_name(
			array(
				'description'    => 'Edit a post.',
				'group'          => 'posts',
				'stat'           => 'posts:1:POST',
				'new_version'    => '1.2',
				'min_version'    => '1.1',
				'max_version'    => '1.1',
				'method'         => 'POST',
				'path'           => $path,
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
		// @todo Remove this call once we no longer need to support PHP <8.1.
		if ( PHP_VERSION_ID < 80100 ) {
			$method->setAccessible( true );
		}

		return $method->invokeArgs( $object, $parameters );
	}
}
