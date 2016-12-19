<?php

// POST /sites/%s/exports/start
class WPCOM_JSON_API_Export_Start_Endpoint extends WPCOM_JSON_API_Endpoint {
	protected $needed_capabilities = 'export';

	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( !current_user_can( $this->needed_capabilities ) ) {
			return new WP_Error( 'unauthorized', 'User cannot export', 403 );
		}
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
		$file_name = wp_upload_dir()['path'] . '/export.xml';
		file_put_contents( $file_name, $string_data );

		$file_url = wp_upload_dir()['url'] . '/export.xml';
		return array(
			'status'        => 'success',
			'download_url'  => $file_url
		);
		//return $result;
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
