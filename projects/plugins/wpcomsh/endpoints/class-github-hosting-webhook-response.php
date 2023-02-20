<?php
/**
 * The GitHub deployment webhook handler.
 *
 * @package endpoints
 */

/**
 * GitHub hosting webhook response endpoint.
 *
 * @package endpoints
 */
class GitHub_Hosting_Webhook_Response extends WP_REST_Controller {
	/**
	 * The API namespace.
	 *
	 * @var string
	 */
	protected $namespace = 'wpcomsh/v1';

	/**
	 * The API REST base URL.
	 *
	 * @var string
	 */
	protected $rest_base = 'hosting';

	/**
	 * The content root within the server.
	 *
	 * @var string
	 */
	protected $root = '/srv/htdocs/wp-content/';

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {
		// POST https://<atomic-site-address>/wp-json/wpcomsh/v1/hosting/github/handle-webhook-event.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/github/handle-webhook-event',
			array(
				'show_in_index' => true,
				'methods'       => WP_REST_Server::CREATABLE,
				'callback'      => array( $this, 'handle_webhook_event' ),
			)
		);
	}

	/**
	 * GitHub webhook events will be received here after the user
	 * connects a repo and branch.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 **/
	public function handle_webhook_event( $request ) {
		$is_valid = $this->verify_xml_rpc_signature( $request );

		if ( ! $is_valid ) {
			return new WP_Error( 'invalid-request', 'Could not validate the request', array( 'status' => 403 ) );
		}

		$body          = json_decode( $request->get_body() );
		$repo          = $body->repo;
		$ref           = $body->ref;
		$base_path     = $body->base_path;
		$access_token  = $body->access_token;
		$removed_files = $body->removed_files;

		if ( ! isset( $base_path ) ) {
			$base_path = '';
		}

		$file_name = $this->download_repo( $repo, $ref, $access_token );

		if ( is_wp_error( $file_name ) ) {
			return $file_name;
		}

		$result = $this->unpack_zipfile( $file_name, $base_path );

		if ( is_wp_error( $result ) ) {
			return $result;
		}

		$this->remove_files( $removed_files );
	}

	/**
	 * Returns the WP file system API.
	 *
	 * @return WP_Filesystem
	 */
	private function get_filesystem() {
		global $wp_filesystem;

		if ( is_null( $wp_filesystem ) ) {
			require_once ABSPATH . '/wp-admin/includes/file.php';
			WP_Filesystem();
		}

		return $wp_filesystem;
	}

	/**
	 * Checks if a given request has the correct signature. We only
	 * want to accept "internal" requests from WPCOM.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool True if the request has access, false otherwise.
	 */
	public function verify_xml_rpc_signature( $request ) { //phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundInExtendedClass
		return method_exists( 'Automattic\Jetpack\Connection\Manager', 'verify_xml_rpc_signature' ) && ( new Automattic\Jetpack\Connection\Manager() )->verify_xml_rpc_signature();
	}

	/**
	 * Grabs the zipball for the correspondent commit and saves it
	 * into a temporary file.
	 *
	 * @param string $repo The repository name.
	 * @param string $ref The reference commit to grab the zipball.
	 * @param string $access_token The GitHub access token to grab the zipball.
	 *
	 * @return string|WP_Error File path on success, WP_Error on failure.
	 */
	private function download_repo( $repo, $ref, $access_token ) {
		$url = 'https://api.github.com/repos/' . $repo . '/zipball/' . $ref;

		/**
		 * The $repo variable comes in `<owner>/<repo>` format, but `/` is the UNIX convention for folder separations,
		 * so we need to replace it with something else when creating the zip file.
		 */
		$file_name     = str_replace( '/', '-', $repo ) . '_' . $ref;
		$zip_file_name = '/tmp/' . $file_name . '.zip';

		$args = array(
			'headers' => array(
				'User-Agent'    => 'WordPress.com',
				'Authorization' => 'Bearer ' . $access_token,
			),
		);

		$response = wp_remote_get( $url, $args );

		if ( is_wp_error( $response ) ) {
			//phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'Failed to download file' );
			return $response;
		}

		$zipfile = $this->get_filesystem()->put_contents( $zip_file_name, $response['body'] );

		if ( is_wp_error( $zipfile ) ) {
			//phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'Failed to save file' );
			return $zipfile;
		}

		return $zip_file_name;
	}

	/**
	 * Unpacks the download zipball.
	 *
	 * @param string $zip_file_path The path to the zipball.
	 * @param string $base_path The path to extract the contents.
	 *
	 * @return bool|WP_Error True if successful, WP_Error in case of failure.
	 */
	private function unpack_zipfile( $zip_file_path, $base_path ) {
		$target_folder = rtrim( $this->root . $base_path, '/' ) . '/';
		$path_info     = pathinfo( $zip_file_path );
		$zip_folder    = $path_info['dirname'] . DIRECTORY_SEPARATOR . $path_info['filename'];

		$zip_handler = new ZipArchive();
		$was_opened  = $zip_handler->open( $zip_file_path );

		if ( true !== $was_opened ) {
			//phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			error_log( 'The zip file could not be opened: ' . $zip_file_path );
			return new WP_Error( 'zipfile_open_failure', __( 'The ZIP file could not be opened.' ) );
		}
		$zip_handler->extractTo( $zip_folder );

		foreach ( $this->list_all_files( $zip_folder ) as $file ) {
			// remove the zip folder from the file name.
			$file_path   = str_replace( $zip_folder, '', $file );
			$destination = $target_folder . $file_path;
			$dir         = dirname( $destination );

			if ( ! is_dir( $dir ) ) {
				mkdir( $dir, 0755, true );
			}

			$this->get_filesystem()->move( $file, $destination );
		}
		$this->get_filesystem()->delete( $zip_file_path );
		$this->get_filesystem()->delete( $zip_folder, true );
		return true;
	}

	/**
	 * Removes files.
	 *
	 * @param string[] $files The file names.
	 */
	private function remove_files( $files ) {
		foreach ( $files as $file ) {
			$this->get_filesystem()->delete( $this->root . $file );
		}
	}

	/**
	 * Lists all files in a directory.
	 *
	 * @param string $path The directory path.
	 *
	 * @return string[] The files names in that directory.
	 */
	private function list_all_files( $path ) {
		$iterator = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $path ) );
		$files    = array();

		foreach ( $iterator as $file ) {
			if ( $file->isDir() ) {
				continue;
			}
			$files[] = $file->getPathname();
		}
		return $files;
	}
}
