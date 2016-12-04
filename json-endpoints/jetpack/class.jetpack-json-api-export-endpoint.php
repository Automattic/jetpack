<?php

// POST /sites/%s/export
class Jetpack_JSON_API_Export_Endpoint extends Jetpack_JSON_API_Endpoint {
	protected $needed_capabilities = 'export';

	protected function validate_call( $_blog_id, $capability, $check_manage_active = true ) {
		parent::validate_call( $_blog_id, $capability, false );
	}

	protected function result() {

		$args = $this->input();

		// Set up args array
		$args['download'] = 'true';

		/**
		 * Filters the export args.
		 *
		 * @since 3.5.0
		 *
		 * @param array $args The arguments to send to the exporter.
		 */
		$args = apply_filters( 'export_args', $args );

		// Using output buffering to catch the exporter response and write it to a file.
		include( ABSPATH . 'wp-admin/includes/export.php' );
		ob_start();
		export_wp( $args);
		$string_data = ob_get_clean();

		// Export file is saved to the uploads folder.
		$file_name = wp_upload_dir()['path'] . '/export.xml';
		$file_url = wp_upload_dir()['url'] . '/export.xml';
		file_put_contents( $file_name, $string_data );


		return array(
			'status'       => 'success',
			'download_url' => $file_url,
		);
	}

	private function setup_args( $args ) {
// If the 'download' URL parameter is set, a WXR export file is baked and returned.
		if ( isset( $_GET['download'] ) ) {
			$args = array();

			if ( ! isset( $_GET['content'] ) || 'all' == $_GET['content'] ) {
				$args['content'] = 'all';
			} elseif ( 'posts' == $_GET['content'] ) {
				$args['content'] = 'post';

				if ( $_GET['cat'] ) {
					$args['category'] = (int) $_GET['cat'];
				}

				if ( $_GET['post_author'] ) {
					$args['author'] = (int) $_GET['post_author'];
				}

				if ( $_GET['post_start_date'] || $_GET['post_end_date'] ) {
					$args['start_date'] = $_GET['post_start_date'];
					$args['end_date']   = $_GET['post_end_date'];
				}

				if ( $_GET['post_status'] ) {
					$args['status'] = $_GET['post_status'];
				}
			} elseif ( 'pages' == $_GET['content'] ) {
				$args['content'] = 'page';

				if ( $_GET['page_author'] ) {
					$args['author'] = (int) $_GET['page_author'];
				}

				if ( $_GET['page_start_date'] || $_GET['page_end_date'] ) {
					$args['start_date'] = $_GET['page_start_date'];
					$args['end_date']   = $_GET['page_end_date'];
				}

				if ( $_GET['page_status'] ) {
					$args['status'] = $_GET['page_status'];
				}
			} elseif ( 'attachment' == $_GET['content'] ) {
				$args['content'] = 'attachment';

				if ( $_GET['attachment_start_date'] || $_GET['attachment_end_date'] ) {
					$args['start_date'] = $_GET['attachment_start_date'];
					$args['end_date']   = $_GET['attachment_end_date'];
				}
			} else {
				$args['content'] = $_GET['content'];
			}

			return $args;
		}
	}
}
