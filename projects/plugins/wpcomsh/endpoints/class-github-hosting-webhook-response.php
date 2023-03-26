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
	 * The current deployment ID.
	 *
	 * @var string
	 */
	protected $deployment_id = '';

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {
		// GET https://<atomic-site-address>/wp-json/wpcomsh/v1/hosting/github/deployment-status.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/github/deployment-status',
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_deployment_status' ),
				'permission_callback' => array( $this, 'verify_xml_rpc_signature' ),
			)
		);

		// POST https://<atomic-site-address>/wp-json/wpcomsh/v1/hosting/github/handle-webhook-event.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/github/handle-webhook-event',
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'handle_webhook_event' ),
				'permission_callback' => array( $this, 'verify_xml_rpc_signature' ),
			)
		);

		// GET https://<atomic-site-address>/wp-json/wpcomsh/v1/hosting/github/deployment-logs.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/github/deployment-logs',
			array(
				'show_in_index'       => true,
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_deployment_logs' ),
				'permission_callback' => array( $this, 'verify_log_reading_permissions' ),
			)
		);
	}

	/**
	 * Only site admins can access the logs.
	 *
	 * @return bool
	 */
	public function verify_log_reading_permissions() {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Retrieves logs for the last deployment.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public function get_deployment_logs( $request ) { // phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
		$last_deployment = get_option( self::$deployment_status_option, array() );

		if ( ! isset( $last_deployment['log_post_id'] ) ) {
			return new WP_REST_Response( null, 404 );
		}

		$post = get_post( $last_deployment['log_post_id'] );

		if ( 'wpcom_ghi_deploy_log' !== $post->post_type ) {
			return new WP_REST_Response( null, 404 );
		}

		return new WP_HTTP_Response(
			array( 'text' => $post->post_content ),
			200
		);
	}

	/**
	 * The deployment status option name.
	 *
	 * @var string
	 */
	private static $deployment_status_option = 'wpcom_github_hosting_deployment_status';

	/**
	 * Retrieves the deployment status option,
	 * so we can show the progress on WPCOM.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 */
	public function get_deployment_status( $request ) { //phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter
		return get_option( self::$deployment_status_option, null );
	}

	/**
	 * Builds the log file path based on the deployment ID.
	 *
	 * @return string The log file path.
	 */
	private function get_log_file_path() {
		$log_file_name = 'wpcom-github-deployment_' . $this->deployment_id . '.txt';
		return '/tmp/' . $log_file_name;
	}

	/**
	 * Writes to the log file for the ongoing deployment.
	 *
	 * @param string $message The message to write.
	 */
	private function log( $message ) {
		$log_file_path = $this->get_log_file_path();

		/**
		 * We can't use WP_Filesystem::put_contents because it uses
		 * write mode instead of append, so all the content gets overriden.
		 */

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fopen
		$log_file = fopen( $log_file_path, 'a' );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fwrite
		fwrite( $log_file, gmdate( 'c' ) . ' ' . $message . "\n" );

		// phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose
		fclose( $log_file );
	}

	/**
	 * Saves log file and moves it to the upload folder.
	 *
	 * @return string The upload URL.
	 */
	private function save_log_file() {
		$log_file_path = $this->get_log_file_path();

		// Reuse the same post for now until we have a UI for previous deploys, and
		// we're handling log rotation so we don't fill the database with logs forever.
		$id              = 0;
		$last_deployment = get_option( self::$deployment_status_option, array() );
		if ( isset( $last_deployment['log_post_id'] ) ) {
			$id = $last_deployment['log_post_id'];
		}

		return wp_insert_post(
			array(
				'ID'           => $id,
				'post_title'   => 'wpcom_github_integration_deployment_logs',
				'post_content' => $this->get_filesystem()->get_contents( $log_file_path ),
				'post_type'    => 'wpcom_ghi_deploy_log',
			)
		);
	}

	/**
	 * Updates the deployment status option.
	 *
	 * @param Array $content The contents to be merged to the existing option.
	 */
	private function update_status( $content ) {
		$existing = get_option( self::$deployment_status_option, array() );
		$new      = array_merge( $existing, $content );

		update_option( self::$deployment_status_option, $new );
	}

	/**
	 * Saves the logic file and update the deployment status option with the uploaded log file URL.
	 */
	private function commit_log_file() {
		$log_post_id = $this->save_log_file();

		if ( ! is_wp_error( $log_post_id ) ) {
			$this->update_status( array( 'log_post_id' => $log_post_id ) );
		}
	}

	/**
	 * GitHub webhook events will be received here after the user
	 * connects a repo and branch.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 **/
	public function handle_webhook_event( $request ) {
		$body          = json_decode( $request->get_body() );
		$repo          = $body->repo;
		$ref           = $body->ref;
		$base_path     = $body->base_path;
		$access_token  = $body->access_token;
		$removed_files = $body->removed_files;

		$this->deployment_id = $body->deployment_id;

		$this->log( 'Starting deployment ' . $this->deployment_id );
		$this->update_status(
			array(
				'status'                    => 'running',
				'last_deployment_repo'      => $repo,
				'last_deployment_timestamp' => time(),
				'last_deployment_sha'       => $ref,
			)
		);

		if ( ! isset( $base_path ) ) {
			$base_path = '';
		}

		$file_name = $this->download_repo( $repo, $ref, $access_token );

		if ( is_wp_error( $file_name ) ) {
			$this->log( 'Deployment failed.' );
			$this->commit_log_file();
			$this->update_status( array( 'status' => 'failed' ) );
			wpcomsh_bump_github_deploy_stats( 'deploy-complete,deploy-failed' );
			return $file_name;
		}

		$result = $this->unpack_zipfile( $file_name, $base_path );

		if ( is_wp_error( $result ) ) {
			$this->log( 'Deployment failed.' );
			$this->commit_log_file();
			$this->update_status( array( 'status' => 'failed' ) );
			wpcomsh_bump_github_deploy_stats( 'deploy-complete,deploy-failed' );
			return $result;
		}

		$this->remove_files( $removed_files );

		$this->log( 'Deployment completed.' );
		$this->commit_log_file();
		$this->update_status( array( 'status' => 'success' ) );

		$bump_stats        = 'deploy-complete';
		$deployment_status = get_option( self::$deployment_status_option, array() );
		if ( ! empty( $deployment_status['move_failures'] ) ) {
			$bump_stats .= ',deploy-move-failures';
		}
		if ( ! empty( $deployment_status['remove_failures'] ) ) {
			$bump_stats .= ',deploy-remove-failures';
		}
		if ( empty( $deployment_status['move_failures'] ) && empty( $deployment_status['remove_failures'] ) ) {
			$bump_stats .= ',deploy-clean';
		}
		wpcomsh_bump_github_deploy_stats( $bump_stats );
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

		$this->log( 'Downloading zipball ' . $url );

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
			$this->log( 'Failed to download zipball: ' . $response->get_error_message() );
			return $response;
		}

		$this->log( 'Zipball downloaded successfully.' );

		$zipfile = $this->get_filesystem()->put_contents( $zip_file_name, $response['body'] );

		if ( ! $zipfile ) {
			$this->log( 'Failed to save zipball in ' . $zip_file_name );
			return new WP_Error( 'zipball_save_failure', __( 'Failed to save zipball in tmp folder.' ) );
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
			$this->log( 'Failed to open zipball ' . $zip_file_path );
			return new WP_Error( 'zipfile_open_failure', __( 'The ZIP file could not be opened.' ) );
		}

		$this->log( 'Extracting zipball to ' . $zip_folder );

		$extracted = $zip_handler->extractTo( $zip_folder );

		if ( ! $extracted ) {
			$this->log( 'Failed to extract zipball' );
			return new WP_Error( 'zipball_extract_failure', __( 'The ZIP file could not be extracted.' ) );
		}

		$move_failures = array();

		foreach ( $this->list_all_files( $zip_folder ) as $file ) {
			// remove the zip folder from the file name.
			$file_path = str_replace( $zip_folder . DIRECTORY_SEPARATOR, '', $file );

			/**
			 * The GitHub zipball comes with a folder inside that we need to remove
			 * from the path in order to get the right destination.
			 *
			 * Example: zip_folder/owner-repo-ref/*
			 *
			 * As we're mirroring the zip folder to the root (usually wp-content),
			 * we need to remove the `owner-repo-ref` part.
			 */
			list(, $file_path) = explode( DIRECTORY_SEPARATOR, $file_path, 2 );
			$destination       = $target_folder . $file_path;
			$dir               = dirname( $destination );

			if ( ! is_dir( $dir ) ) {
				mkdir( $dir, 0755, true );
			}

			$result = $this->get_filesystem()->move( $file, $destination, true );

			if ( $result ) {
				$this->log( "Moved $file to $destination" );
			} else {
				$move_failures[] = $file_path;
				$this->log( "Failed to move $file to $destination" );
			}
		}
		$this->update_status( array( 'move_failures' => $move_failures ) );
		$this->get_filesystem()->delete( $zip_file_path );
		$this->get_filesystem()->delete( $zip_folder, true );
		$this->log( 'Deleted zipball.' );
		return true;
	}

	/**
	 * Removes files.
	 *
	 * @param string[] $files The file names.
	 */
	private function remove_files( $files ) {
		$remove_failures = array();

		foreach ( $files as $file ) {
			$file_path = $this->root . $file;
			$result    = $this->get_filesystem()->delete( $file_path );

			if ( $result ) {
				$this->log( "Removed $file_path" );
			} else {
				$remove_failures[] = $file;
				$this->log( "Failed to remove $file_path" );
			}
		}

		$this->update_status( array( 'remove_failures' => $remove_failures ) );
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
