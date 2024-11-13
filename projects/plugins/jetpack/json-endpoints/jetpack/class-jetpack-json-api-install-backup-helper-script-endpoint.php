<?php
/**
 * API endpoint /sites/%s/install-backup-helper-script
 * This API endpoint installs a Helper Script to assist Jetpack Backup fetch data
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Backup\V0005\Helper_Script_Manager;

/**
 * API endpoint /sites/%s/install-backup-helper-script
 * This API endpoint installs a Helper Script to assist Jetpack Backup fetch data
 */
class Jetpack_JSON_API_Install_Backup_Helper_Script_Endpoint extends Jetpack_JSON_API_Endpoint {
	/**
	 * This endpoint is only accessible from Jetpack Backup; it requires no further capabilities.
	 *
	 * @var array
	 */
	protected $needed_capabilities = array();

	/**
	 * Method to call when running this endpoint (install)
	 *
	 * @var string
	 */
	protected $action = 'install';

	/**
	 * Contents of the Helper Script to install
	 *
	 * @var string|null
	 */
	protected $helper_script = null;

	/**
	 * Contains the result of installing the Helper Script.
	 *
	 * @var null|WP_Error|array
	 */
	protected $result = null;

	/**
	 * Checks that the input args look like a valid Helper Script.
	 *
	 * @param  null $object  Unused.
	 * @return bool|WP_Error a WP_Error object or true if the input seems ok.
	 */
	protected function validate_input( $object ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$args = $this->input();

		if ( ! isset( $args['helper'] ) ) {
			return new WP_Error( 'invalid_args', __( 'You must specify a helper script body', 'jetpack' ), 400 );
		}

		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_decode
		$this->helper_script = base64_decode( $args['helper'] );
		if ( ! $this->helper_script ) {
			return new WP_Error( 'invalid_args', __( 'Helper script body must be base64 encoded', 'jetpack' ), 400 );
		}

		return true;
	}

	/**
	 * Installs the uploaded Helper Script.
	 */
	protected function install() {
		$this->result = Helper_Script_Manager::install_helper_script( $this->helper_script );
		Helper_Script_Manager::cleanup_expired_helper_scripts();
	}

	/**
	 * Return the success or failure of the backup helper script installation operation.
	 *
	 * @return array|WP_Error An array with installation info on success:
	 *
	 *   'path'    (string) Helper script installation path on the filesystem.
	 *   'url'     (string) URL to the helper script.
	 *   'abspath' (string) WordPress root.
	 *
	 *   or an instance of WP_Error on failure.
	 */
	protected function result() {
		return $this->result;
	}
}
