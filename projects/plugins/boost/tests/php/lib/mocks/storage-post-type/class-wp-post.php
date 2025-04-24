<?php
/**
 * Mocks for Storage_Post_Type tests
 *
 * @package automattic/jetpack-boost
 */

if ( ! class_exists( 'WP_Post' ) ) {
	/**
	 * Mock WP_Post class.
	 */
	class WP_Post {
		/**
		 * Post ID.
		 *
		 * @var int
		 */
		public $ID = 0;

		/**
		 * Post title.
		 *
		 * @var string
		 */
		public $post_title = '';

		/**
		 * Post name.
		 *
		 * @var string
		 */
		public $post_name = '';

		/**
		 * Post content.
		 *
		 * @var string
		 */
		public $post_content = '';

		/**
		 * Post status.
		 *
		 * @var string
		 */
		public $post_status = 'publish';

		/**
		 * Post type.
		 *
		 * @var string
		 */
		public $post_type = 'post';
	}
}
