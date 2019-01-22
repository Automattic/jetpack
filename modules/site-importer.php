<?php
/*
 * Load code specific to importing content
 */

class WP_REST_Jetpack_Imports_Controller extends WP_REST_Posts_Controller {
	function register_routes() {
		// Support existing `post` routes to allow the post object to be created
		parent::register_routes();

		// Routes that are specific to our custom post type:
		register_rest_route( $this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)/pieces/(?P<piece_id>[\d]+)', array(
			array(
//				'show_in_index' => false,
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array( $this, 'add_piece' ),
				'permission_callback' => array( $this, 'upload_and_import_permissions_check' ),
				'args' => array(
					'id' => array(
						'description' => __( 'Unique identifier for the object.' ),
						'type' => 'integer',
					),
					'piece_id' => array(
						'description' => __( 'Unique identifier for the piece.' ),
						'type' => 'integer',
					),
				),
				// body: { piece: 'The Base64-encoded piece of the file.' }
			),
		) );

		register_rest_route( $this->namespace, '/' . $this->rest_base . '/(?P<id>[\d]+)/import-from-pieces', array(
			array(
//				'show_in_index' => false,
				'methods' => WP_REST_Server::CREATABLE,
				'callback' => array( $this, 'import_from_pieces' ),
				'permission_callback' => array( $this, 'upload_and_import_permissions_check' ),
				'args' => array(
					'id' => array(
						'description' => __( 'The id of the post storing the export data.' ),
						'type' => 'integer',
					),
					//'checksum'...?
				),
			),
		) );
	}

	/**
	 * Used by the parent class (`WP_REST_Posts_Controller`) to control access to post writes
	 */
	function create_item_permissions_check( $request ) {
		$parent_results = parent::create_item_permissions_check( $request );
		if ( is_wp_error( $parent_results ) ) {
			return $parent_results;
		}

		return $this->upload_and_import_permissions_check( $request );
	}

	function upload_and_import_permissions_check( $request ) {
		if ( ! current_user_can( 'upload_files' ) ) {
			return new WP_Error( 'Sorry, you are not allowed to upload files as this user' );
		}

		if ( ! current_user_can( 'import' ) ) {
			return new WP_Error( 'Sorry, you are not allowed to import as this user' );
		}

		return true;
	}

	static function meta_key_matches( $key ) {
		return preg_match( '/^jetpack_file_import_piece_(\d+)$/', $key );
	}

	static protected function get_pieces_for_cpt_id( $id ) {
		$all_meta = get_post_meta( $id );

		// We can't use array_filter w/ ARRAY_FILTER_USE_KEY until 5.6.0, so this is a workaround
		$pieces = array_intersect_key(
			$all_meta,
			array_flip( array_filter( array_keys( $all_meta ), array( 'WP_REST_Jetpack_Imports_Controller', 'meta_key_matches' ) ) )
		);

		ksort( $pieces );
		return $pieces;
	}

	function add_piece( $request ) {
		$piece = $request->get_param( 'piece' );
		$piece_id = $request->get_param( 'piece_id' );
		$post_id = $request->get_param( 'id' );
		if ( ! update_post_meta( $post_id, 'jetpack_file_import_piece_' . $piece_id, $piece ) ) {
			return new WP_Error( 'Error adding piece ' . $piece_id );
		}

		error_log( 'Added piece ' . $piece_id . ' to post_id ' . $post_id );

		return 'OK';
	}

	function import_from_pieces( $request ) {
		$post_id = (int) $request->get_param( 'id' );
		if ( $post_id < 1 ) {
			return new WP_Error( 'missing_id', 'A valid `id` param is required', 500 );
		}

		$post_obj = get_post( $post_id );

		if ( empty( $post_obj ) || $post_obj->ID !== $post_id ) {
			return new WP_Error( 'not_found', 'The specified post does not exist', 500 );
		}

		if ( 'jetpack_file_import' !== $post_obj->post_type ) {
			return new WP_Error( 'invalid_post_type', 'The specified post is not the correct type', 500 );
		}

		$tmpfile = tmpfile();

		if ( false === $tmpfile ) {
			return new WP_Error( 'tmpfile_error', 'Temporary file could not be created on the server', 500 );
		}

		$total_bytes = 0;

		$pieces = self::get_pieces_for_cpt_id( $post_id );

		foreach ( $pieces as $key => $value ) {
			$piece = base64_decode( $value[0] );

			$piece_bytes = fwrite( $tmpfile, $piece );
			if ( false === $piece_bytes ) {
				fclose( $tmpfile );
				@unlink( $tmpfile );
				throw new Exception( 'Could not write piece' );
			}
			$total_bytes += $piece_bytes;
		}

		set_time_limit( 0 );
		// @TODO fastcgi_finish_request..?

		$result = $this->_import_from_file( $tmpfile );

		fclose( $tmpfile );
		@unlink( $tmpfile );

		return $result;
	}

	protected function _import_from_file( $file ) {
		if ( ! defined( 'WP_LOAD_IMPORTERS' ) ) {
			define( 'WP_LOAD_IMPORTERS', 1 );
			/**
			 * The plugin short-circuits if this constant is not set when plugins load:
			 * https://github.com/WordPress/wordpress-importer/blob/19c7fe19619f06f51d502ea368011f667a419934/src/wordpress-importer.php#L13
			 *
			 * ...& core only sets that in a couple of ways:
			 * https://github.com/WordPress/WordPress/search?q=WP_LOAD_IMPORTERS&unscoped_q=WP_LOAD_IMPORTERS
			 *
			 * In order for this to work, we'll need a change to the core plugin, for example:
			 * https://github.com/WordPress/wordpress-importer/pull/45
			 */
		}

		if ( ! class_exists( 'WP_Import' ) ) {
			return new WP_Error( 'missing_wp_import', 'The WP_Import class does not exist' );
		}

		if ( ! function_exists( 'wordpress_importer_init' ) ) {
			return new WP_Error( 'missing_wp_import_init', 'The wordpress_importer_init function does not exist' );
		}

		// The REST API does not do `admin_init`, so we need to source a bunch of stuff
		require_once ABSPATH . 'wp-admin/includes/admin.php';

		wordpress_importer_init();

		if ( empty( $GLOBALS['wp_import'] ) ) {
			return new WP_Error( 'empty_wp_import', 'The wp_import global is empty' );
		}

		try {
			$file_info = stream_get_meta_data( $file );
			if ( empty( $file_info['uri'] ) || ! is_writable( $file_info['uri'] ) ) {
				return new WP_Error( 'invalid_file', 'Could not access import file' );
			}
			// @TODO promote to "proper" attachment, enqueue cron for import, etc...?
			error_log( 'Starting import from file:' );
			error_log( print_r( $file_info, 1 ) );
			$GLOBALS['wp_import']->import( $file_info['uri'] );
			return 'Imported';
		} catch ( Exception $e ) {
			return new WP_Error( 'import_from_file_exception', $e->getMessage() );
		}
	}
}

function jetpack_site_importer_init() {
	register_post_type( 'jetpack_file_import', array(
		'public'                => false,
		'rest_controller_class' => 'WP_REST_Jetpack_Imports_Controller',
		'rest_base'             => 'jetpack-file-imports',
		'show_in_rest'          => true,
	) );
}

add_action( 'init', 'jetpack_site_importer_init' );
