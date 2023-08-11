<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Modules wrapper
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

class CRM_Modules {

	/**
	 * Setup Modules
	 */
	public function __construct() {

		// register modules
		$this->register_modules();

	}

	/*
	 * Autoloads the modules (core extensions) included with core
	 * 
	 * Modularisation of this manner may allow easier drop-in integrations by third-party devs as well.
	*/
	public function register_modules(){

		$module_directories = jpcrm_get_directories( JPCRM_MODULES_PATH );

		if ( is_array( $module_directories ) ){

			foreach ( $module_directories as $directory ){

				// load module
				$this->register_module( $directory );

			}

		}

	}

	/*
	* Registers a specific module
	* (Ultimately loads the `jpcrm-{$directory}-init.php` file)
	*
	* @param string $module_slug
	*/
	public function register_module( $module_slug ){

		// where `jpcrm-{$directory}-init.php` present, include
		if ( file_exists( JPCRM_MODULES_PATH . "{$module_slug}/jpcrm-{$module_slug}-init.php" ) ){
		
			require_once( JPCRM_MODULES_PATH . "{$module_slug}/jpcrm-{$module_slug}-init.php" );

		}

	}

	/*
	* Load module
	* Loads a modules class into $zbs->modules->*
	*/
	public function load_module( $module_slug, $module_class ) {

		if ( isset( $this->$module_slug ) ) {
			return $this->$module_slug;
		}

		// double backslash due to the $
		$class_name = "Automattic\JetpackCRM\\$module_class";

		$this->$module_slug = new $class_name;

		return $this->$module_slug;
		
	}

	/**
	 * Activate a new module (if needed) and redirect to its 'hub' slug
	 */
	public function activate_module_and_redirect() {
		global $zbs;
		global $zeroBSCRM_extensionsCompleteList;

		// Bail if activating from network, or bulk.
		if ( wp_doing_ajax()
			|| is_network_admin()
			|| ! wp_verify_nonce( $_GET['_wpnonce'], 'jpcrmmoduleactivateredirectnonce' )
			|| ! current_user_can( 'admin_zerobs_manage_options' )
			|| ! isset( $_GET['jpcrm-module-name'] )
			|| ! array_key_exists( $_GET['jpcrm-module-name'], $zeroBSCRM_extensionsCompleteList )
		) {
			return;
		}

		$module_name = sanitize_text_field( $_GET['jpcrm-module-name'] );
		$safe_module_name = $this->get_safe_module_string( $module_name );
		$safe_function_string = $this->get_safe_function_string( $module_name );

		// if module is not installed, try to install it
		if (
			! zeroBSCRM_isExtensionInstalled( $module_name )
			&& function_exists( 'zeroBSCRM_extension_install_' . $safe_function_string )
		) {
			call_user_func( 'zeroBSCRM_extension_install_' . $safe_function_string );
			call_user_func( 'jpcrm_load_' . $safe_function_string );
		}

		if ( ! empty( $zbs->modules->$safe_module_name ) ) {

			// default to CRM dashboard
			$redirect_to = jpcrm_esc_link( $zbs->slugs['dash'] );

			//if redirect_to is specified, use that
			if ( isset( $_GET['redirect_to'] ) ) {
				$redirect_to = sanitize_url( $_GET['redirect_to'] );
			}

			// otherwise, if module has a hub slug use that
			else if ( isset( $zbs->modules->$safe_module_name->slugs['hub'] ) ) {
				$redirect_to = jpcrm_esc_link( $zbs->modules->$safe_module_name->slugs['hub'] );
			}

			// redirect to URL
			wp_safe_redirect( $redirect_to );
			exit;
		} else {
			echo sprintf( 'Module %s not found. Error #607', esc_html( $module_name ) );
		}

	}

	/** These functions are used to avoid conflicts with old extension names (e.g. WooSync)
	 * 
	 *  For example:
	 * 
	 *  - the old Woo extension key is `woosync`
	 *  - the new Woo module extension key is `woo-sync`
	 *  - the install/load functions for the Woo module use `woo_sync`
	 *  - the new Woo module is loaded into `$zbs->modules->woosync`
	 */
	
	public function get_safe_module_string( $module_name ) {
		return str_replace( '-', '', $module_name );
	}
	public function get_safe_function_string( $module_name ) {
		return str_replace( '-', '_', $module_name );
	}

}