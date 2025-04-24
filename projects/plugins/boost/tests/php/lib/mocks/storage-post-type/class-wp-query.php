<?php
/**
 * Mocks for Storage_Post_Type tests
 *
 * @package automattic/jetpack-boost
 */

if ( ! class_exists( 'WP_Query' ) ) {
	/**
	 * Mock WP_Query class.
	 */
	class WP_Query {
		/**
		 * Query arguments.
		 *
		 * @var array
		 */
		public $query_vars = array();

		/**
		 * Query results.
		 *
		 * @var array
		 */
		public $posts = array();

		/**
		 * Whether posts were found.
		 *
		 * @var bool
		 */
		public $have_posts = false;

		/**
		 * Mock post data store.
		 *
		 * @var array
		 */
		public static $mock_posts = array();

		/**
		 * Current time for testing expiration.
		 *
		 * @var int
		 */
		public static $current_time = 0;

		/**
		 * Constructor.
		 *
		 * @param array $args Query arguments.
		 */
		public function __construct( $args = array() ) {
			$this->query_vars = $args;
			$this->posts      = array();
			$this->have_posts = false;

			// If we have a name parameter, look for a matching mock post
			if ( isset( $args['name'] ) && isset( self::$mock_posts[ $args['name'] ] ) ) {
				$post               = new WP_Post();
				$post->ID           = self::$mock_posts[ $args['name'] ]['id'];
				$post->post_title   = $args['name'];
				$post->post_name    = $args['name'];
				$post->post_content = base64_encode( maybe_serialize( self::$mock_posts[ $args['name'] ]['data'] ) );
				$post->post_status  = 'publish';
				$post->post_type    = 'jb_store_test_storage';

				$this->posts      = array( $post );
				$this->have_posts = true;
			}
		}

		/**
		 * Mock have_posts function.
		 *
		 * @return bool
		 */
		public function have_posts() {
			return $this->have_posts;
		}

		/**
		 * Clear mock posts.
		 *
		 * @return void
		 */
		public static function clear_mock_posts() {
			self::$mock_posts = array();
		}
	}
}
