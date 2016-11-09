<?php

class VideoPress_Media_Library {

	/**
	 * @var VideoPress_Media_Library
	 **/
	private static $instance = null;

	/**
	 * Private VideoPress_Media_Library constructor.
	 *
	 * Use the VideoPress_Media_Library::init() method to get an instance.
	 */
	private function __construct() {
		add_filter( 'ajax_query_attachments_args', array( $this, 'ajax_query_attachments_args' ), 10, 1 );
		add_action( 'pre_get_posts', array( $this, 'media_list_table_query' ) );
	}

	/**
	 * Initialize the VideoPress_Media_Library and get back a singleton instance.
	 *
	 * @return VideoPress_Media_Library
	 */
	public static function init() {
		if ( is_null( self::$instance ) ) {
			self::$instance = new VideoPress_Media_Library;
		}

		return self::$instance;
	}

	/**
	 * Media Grid:
	 * Filter out any videopress video posters that we've downloaded,
	 * so that they don't seem to display twice.
	 *
	 * @param array $args
	 *
	 * @return array
	 */
	public function ajax_query_attachments_args( $args ) {

		$args['meta_query'] = $this->add_status_check_to_meta_query( isset( $args['meta_query'] ) ? $args['meta_query'] : array() );

		return $args;
	}

	/**
	 * Media List:
	 * Do the same as ^^ but for the list view.
	 *
	 * @param WP_Query $query
	 *
	 * @return array
	 */
	public function media_list_table_query( $query ) {
		if ( is_admin() && $query->is_main_query() && ( 'upload' === get_current_screen()->id ) ) {
			$meta_query = $this->add_status_check_to_meta_query( $query->get( 'meta_query' ) );

			$query->set( 'meta_query', $meta_query );
		}
	}

	/**
	 * Add the a videopress_status check to the meta query and if it has a `videopress_status` only include those with
	 * a status of 'completed' or 'processing'.
	 *
	 * @param array $meta_query
	 *
	 * @return array
	 */
	protected function add_status_check_to_meta_query( $meta_query ) {

		if ( ! is_array( $meta_query ) ) {
			$meta_query = array();
		}

		$meta_query[] = array(
			array(
				'relation' => 'OR',
				array(
					'key'     => 'videopress_status',
					'value'   => array( 'completed', 'processing' ),
					'compare' => 'IN',
				),
				array(
					'key'     => 'videopress_status',
					'compare' => 'NOT EXISTS',
				),
			),
		);

		return $meta_query;
	}
}

// Let's start this thing up.
VideoPress_Media_Library::init();