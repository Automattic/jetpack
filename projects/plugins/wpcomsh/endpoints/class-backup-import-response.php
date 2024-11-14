<?php
/**
 * Backup Import handler.
 *
 * @package endpoints
 */

use Imports\Backup_Import_Manager;

/**
 * Backup Import response endpoint.
 *
 * @package endpoints
 */
class Backup_Import_Response extends WP_REST_Controller {
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
	protected $rest_base = 'backup-import';

	/**
	 * Registers the routes for the objects of the controller.
	 */
	public function register_routes() {
		// GET https://<atomic-site-address>/wp-json/wpcomsh/v1/backup-import/status.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/status',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( $this, 'get_backup_import_status' ),
				'permission_callback' => array( $this, 'verify_xml_rpc_signature' ),
			)
		);

		// POST https://<atomic-site-address>/wp-json/wpcomsh/v1/backup-import/status.
		register_rest_route(
			$this->namespace,
			'/' . $this->rest_base . '/status',
			array(
				'methods'             => WP_REST_Server::CREATABLE,
				'callback'            => array( $this, 'reset_backup_import_status' ),
				'permission_callback' => array( $this, 'verify_xml_rpc_signature' ),
			)
		);
	}

	/**
	 * Only users with import access can do the action.
	 *
	 * @return bool
	 */
	public function verify_import_permissions() {
		return current_user_can( 'import' );
	}

	/**
	 * Gets the backup import status.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return WP_REST_Response Returns a WP_REST_Response with the backup import status.
	 */
	public function get_backup_import_status( $request ) { //phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter, VariableAnalysis.CodeAnalysis.VariableAnalysis
		if ( ! $this->verify_import_permissions() ) {
			return new WP_REST_Response(
				array(
					'error' => 'User or Token does not have access to specified site.',
				),
				400
			);
		}

		$backup_import_status = Backup_Import_Manager::get_backup_import_status();
		$message              = '';

		if ( $backup_import_status && $backup_import_status['status'] === 'process_files' ) {
			// Read the log file and return last line of the log
			$message = $this->read_last_log_line();
		}

		return new WP_REST_Response(
			array(
				'status'  => $backup_import_status ? $backup_import_status['status'] : '',
				'message' => $message,
			),
			200
		);
	}

	/**
	 * Resets the backup import status.
	 *
	 * @return WP_REST_Response Returns a WP_REST_Response with either a success message or an error message.
	 */
	public function reset_backup_import_status() {
		if ( ! $this->verify_import_permissions() ) {
			return new WP_REST_Response(
				array(
					'error' => 'User or Token does not have access to specified site.',
				),
				400
			);
		}

		$backup_import_status = Backup_Import_Manager::get_backup_import_status();

		if ( empty( $backup_import_status ) ) {
			return new WP_REST_Response(
				array(
					'error' => 'No backup import found.',
				),
				400
			);
		}
		$result = Backup_Import_Manager::reset_import_status();

		if ( is_wp_error( $result ) ) {
			return new WP_REST_Response(
				array(
					'error' => $result->get_error_message(),
				),
				400
			);
		}

		return new WP_REST_Response(
			array(
				'success' => true,
				'message' => 'Reset backup import status successfully.',
			),
			200
		);
	}

	/**
	 * Checks if a given request has the correct signature. We only
	 * want to accept "internal" requests from WPCOM.
	 *
	 * @param WP_REST_Request $request Full details about the request.
	 * @return bool True if the request has access, false otherwise.
	 */
	public function verify_xml_rpc_signature( $request ) { //phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.FoundInExtendedClass, VariableAnalysis.CodeAnalysis.VariableAnalysis
		return method_exists( 'Automattic\Jetpack\Connection\Manager', 'verify_xml_rpc_signature' ) && ( new Automattic\Jetpack\Connection\Manager() )->verify_xml_rpc_signature();
	}

	/**
	 * Reads the last line of the log file.
	 *
	 * @return string|null The last line of the log file, or null if the file could not be read.
	 */
	public function read_last_log_line() {
		$log_file = '/tmp/restore_log/restoration_log.txt';
		if ( ! file_exists( $log_file ) ) {
			return null;
		}

		$log_lines = file( $log_file, FILE_IGNORE_NEW_LINES );
		$last_line = end( $log_lines );

		// Find the position of the first space after the timestamp
		$pos = strpos( $last_line, ' ' );

		// If a space was found, return the part of the string after it
		if ( $pos !== false ) {
			return substr( $last_line, $pos + 1 );
		}

		// If no space was found, return the whole line
		return $last_line;
	}
}
