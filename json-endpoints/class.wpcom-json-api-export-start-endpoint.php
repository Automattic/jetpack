<?php

// POST /sites/%s/exports/start
class WPCOM_JSON_API_Export_Start_Endpoint extends WPCOM_JSON_API_Endpoint {

	function callback( $path = '', $blog_id = 0 ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( !current_user_can( 'export' ) ) {
			return new WP_Error( 'unauthorized', 'User cannot export', 403 );
		}
		$args = $this->input();

		// Set up args array
		$args = $this->setup_args( $args );

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
		export_wp( $args );
		$string_data = ob_get_clean();

		// Export file is saved to the uploads folder. File is later removed via cron.
		// File name includes a nonce to make file name harder to guess.
		$file_name = '/export_' . wp_create_nonce() . '.xml';
		// Get WordPress upload dir. Avoid dereferencing to support older PHP versions.
		$upload_dir = wp_upload_dir();
		$file_path = $upload_dir['path'] . $file_name;
		file_put_contents( $file_path, $string_data );

		$file_url = $upload_dir['url'] . $file_name;
		return array(
			'status'        => 'success',
			'download_url'  => $file_url
		);
	}

	/**
	 * setup_args is the glue between the wpcom API request and the .org exporter.
	 * It translates the parameters for partial exports from one format to the other.
	 *
	 * @param $args - Parameters received from the API request
	 *
	 * @return array - Parameters for the .org exporter
	 */
	private function setup_args( $args ) {
		$prepared_args = array();

		/**
		 * Export options.
		 *
		 */

		// Export everything
		if ( empty( $args['post_type'] ) || 'all' === $args['post_type'] ) {
			$prepared_args['content'] = 'all';

			// Export posts or pages
		} elseif ( 'post' === $args['post_type'] || 'page' === $args['post_type'] ) {
			$prepared_args['content'] = $args['post_type'];

			if ( ! empty( $args['category'] ) ) {
				$prepared_args['category'] = absint( $args['category'] );
			}

			if ( ! empty( $args['author'] ) ) {
				$prepared_args['author'] = absint( $args['author'] );
			}

			if ( ! empty( $args['start_date'] ) ) {
				$prepared_args['start_date'] = $args['start_date'];
			}

			if ( ! empty( $args['end_date'] ) ) {
				// WPCOM_Async_Exporter->sanitize_args() will set this to the last day of the provided month
				$prepared_args['end_date'] = $args['end_date'];
			}

			if ( ! empty( $args['status'] ) ) {
				$exportable_post_statuses = get_post_stati( array( 'internal' => false ) );

				if ( in_array( $args['status'], $exportable_post_statuses, true ) ) {
					$prepared_args['status'] = $args['status'];
				}
			}
			// Export a custom post type.
		} else {
			$exportable_post_types = get_post_types( array( 'can_export' => true ), 'names' );

			if ( in_array( $args['post_type'], $exportable_post_types, true ) ) {
				$prepared_args['content'] = $args['post_type'];
			}
		}

		return $prepared_args;
	}
}
