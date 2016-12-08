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
		$args = $this->setup_args($args);

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
		$file_name = wp_upload_dir()['path'] . '/export.pdf'; // for uploading to media lib. real format - xml'
		file_put_contents( $file_name, $string_data );

		// Move export file to wpcom
		$file_url = wp_upload_dir()['url'] . '/export.pdf';
		$media_item = $this->transfer_export_to_wpcom($file_url);
		$wpcom_file_url = $media_item['URL'];

		return array(
			'status'       => 'success',
			'download_url' => $wpcom_file_url,
		);
	}

	private function transfer_export_to_wpcom($export_file_url) {
		// Upload export file to WPCOM using the media/new API endpoint.
		$options  = array (
			'http' =>
				array (
					'ignore_errors' => true,
					'method' => 'POST',
					'header' =>
						array (
							0 => 'authorization: ???',
							1 => 'Content-Type: application/x-www-form-urlencoded',
						),
					'content' =>
						http_build_query(  array (
							'media_urls' => $export_file_url,
						)),
				),
		);

		$context  = stream_context_create( $options );
		$response = file_get_contents(
			'https://public-api.wordpress.com/rest/v1.1/sites/2426177/media/new',
			false,
			$context
		);
		$response = json_decode( $response );

		// Return the newly created media item.
		return $response['media'][0];
	}

	private function setup_args( $args ) {
		$prepared_args = array();

		if ( ! isset( $args['content'] ) || 'all' == $args['content'] ) {
			$prepared_args['content'] = 'all';
		} elseif ( 'posts' == $args['content'] ) {
			$prepared_args['content'] = 'post';

			if ( $args['cat'] ) {
				$prepared_args['category'] = (int) $args['cat'];
			}

			if ( $args['post_author'] ) {
				$prepared_args['author'] = (int) $args['post_author'];
			}

			if ( $args['post_start_date'] || $args['post_end_date'] ) {
				$prepared_args['start_date'] = $args['post_start_date'];
				$prepared_args['end_date']   = $args['post_end_date'];
			}

			if ( $args['post_status'] ) {
				$prepared_args['status'] = $args['post_status'];
			}
		} elseif ( 'pages' == $args['content'] ) {
			$prepared_args['content'] = 'page';

			if ( $args['page_author'] ) {
				$prepared_args['author'] = (int) $args['page_author'];
			}

			if ( $args['page_start_date'] || $args['page_end_date'] ) {
				$prepared_args['start_date'] = $args['page_start_date'];
				$prepared_args['end_date']   = $args['page_end_date'];
			}

			if ( $args['page_status'] ) {
				$prepared_args['status'] = $args['page_status'];
			}
		} elseif ( 'attachment' == $args['content'] ) {
			$prepared_args['content'] = 'attachment';

			if ( $args['attachment_start_date'] || $args['attachment_end_date'] ) {
				$prepared_args['start_date'] = $args['attachment_start_date'];
				$prepared_args['end_date']   = $args['attachment_end_date'];
			}
		} else {
			$prepared_args['content'] = $args['content'];
		}

		return $prepared_args;
	}
}
