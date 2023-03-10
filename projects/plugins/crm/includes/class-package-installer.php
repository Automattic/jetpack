<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Logic concerned with retrieving packages from our CDN and installing locally
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/*
* Class encapsulating logic concerned with retrieving packages from our CDN and installing locally
*/
class Package_Installer {

	/*
	* Stores packages stack
	*/
	private $packages = array();

	/*
	* Package install directory
	*/
	private $package_dir = false;


	/*
	* Init
	*/
	public function __construct( ) {

		// set $package_dir
		$this->package_dir = dirname( ZEROBSCRM_PATH ) . '/jpcrm-data/packages/';

		// define packages
		$this->packages = array(

					'oauth_dependencies' => array(

						'title'              => __( 'OAuth Connection dependencies', 'zero-bs-crm' ),
						'version'            => 1.0,
						'target_dir'         => $this->package_dir,
						'install_method'     => 'unzip',
						'post_install_call'  => '',

					)

		);

		// does the working directory exist? If not create
		if ( !file_exists( $this->package_dir ) ){ 
			
			wp_mkdir_p( $this->package_dir );
			//chmod( $this->package_dir, 0777 );

			// double check
			if ( !file_exists( $this->package_dir ) ){ 

				// we're going to struggle to install packages
				// Add admin notification
				zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'package.installer.dir_create_error', __( 'Main Working Directory', 'zero-bs-crm' ) );

			} else {
				jpcrm_create_and_secure_dir_from_external_access( $this->package_dir, true );
			}

		}

	}


	/*
	* Returns a list of packages available via our CDN
	*/
	public function list_all_available_packages( $with_install_status = false ){

		// list packages available
		// later we could retrieve this via CDN's package_versions.json
		$packages = $this->packages;

		// if with install status, cycle through and check those
		if ( $with_install_status ){

			$return = array();
			foreach ( $packages as $package_key => $package_info ){

				$return[ $package_key ] = $package_info;
				$return[ $package_key ]['installed'] = $this->get_package_install_info( $package_key );

				// check for failed attempts
				$return[ $package_key ]['failed_installs'] = $this->get_fail_counter( $package_key );

			}

			$packages = $return;

		}

		return $packages;

	}


	/*
	* Returns info array on package
	*
	* @param string $package_key - a slug for a particular package
	*
	*/
	public function get_package_info( $package_key = '' ){

		if ( isset( $this->packages[ $package_key ] ) ){

			$package = $this->packages[ $package_key ];

			// supplement with local install info
			$package['installed'] = $this->get_package_install_info( $package_key );

			// check for failed attempts
			$package['failed_installs'] = $this->get_fail_counter( $package_key );

			return $package;

		}

		return false;

	}


	/*
	* Returns installed package info from package's version_info.json file
	*
	* @param string $package_key - a slug for a particular package
	*
	*/
	public function get_package_install_info( $package_key = '' ){

		// retrieve version_info.json file and load info
		$package_version_info_file = $this->package_dir . $package_key . '/version_info.json';

		if ( file_exists( $package_version_info_file ) ){

			/* Example version_info.json file:

			{
			  "key": "my_package_key",
			  "version": "1.0"
			}

			*/
			$data = file_get_contents( $package_version_info_file );
			return json_decode( $data, true );

		}

		return false;

	}

	/*
	* Checks to see if a package is available on CDN
	*
	* @param string $package_key - a slug for a particular package
	*
	* @returns bool(ish)
	*/
	public function package_is_available( $package_key = '' ){

		return ( $this->get_package_info( $package_key ) ? true : false ); // package doesn't exist on CDN or no connection

	}

	/*
	* Checks to see if a package is available locally
	*
	* @param string $package_key - a slug for a particular package
	* @param float $min_version - if > 0, installed version is compared and returns true only if min version met
	*
	*/
	public function package_is_installed( $package_key = '', $min_version = 0 ){

		// retrieve installed version data if available
		$installed_info = $this->get_package_install_info( $package_key );
		if ( !is_array( $installed_info ) ){
			
			return false;

		} else {

			// check min version
			if ( $min_version > 0 ){

				$local_version = $installed_info['version'];
				if ( version_compare( $local_version, $min_version, '>=' ) ) {

					// meets minimum version
					return true;

				}

			} else {

				// no min version check, but does seem to be installed
				return true;

			}

		}

		// +- check extraction endpoint (e.g. are files actually there?)

		return false; // package doesn't exist or isn't installed

	}

	/*
	* Checks to see if a package is available locally, if it isn't, installs it where possible
	*
	* @param string $package_key - a slug for a particular package
	* @param float $min_version - if > 0, installed version is compared and returns true only if min version met
	*
	*/
	public function ensure_package_is_installed( $package_key = '', $min_version = 0 ){

		if ( !$this->package_is_installed( $package_key, $min_version ) ){

			// not installed, try to install/update(reinstall) it
			return $this->retrieve_and_install_package( $package_key, true );

		}

		// include composer autoload if it exists
		$potential_composer_autoload_path = $this->package_dir . '/' . $package_key . '/vendor/autoload.php';
		if ( file_exists( $potential_composer_autoload_path ) ) {
			require_once $potential_composer_autoload_path;
		}

		return true;

	}


	/*
	* Retrieves a package zip from our CDN and installs it locally
	*/
	public function retrieve_and_install_package( $package_key = '', $force_reinstall = false){

		global $zbs;

		// package exists?
		if ( !$this->package_is_available( $package_key) ){

			return false;

		}

		// package already installed?
		if ( $this->package_is_installed( $package_key ) && !$force_reinstall ){

			return true;

		}

		// failed already 3 times?
		if (  $this->get_fail_counter( $package_key ) >= 3 ){

			// Add error msg
			zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'package.installer.fail_count_over',  $package_key );

			return false;
		}


		// here we set a failsafe which sets an option value such that if this install does not complete
		// ... we'll know the package install failed (e.g. page timeout shorter than download/unzip time)
		// ... that way we can avoid retrying 50000 times.
		$this->increment_fail_counter( $package_key );

		// Retrieve & install the package
		$package_info = $this->get_package_info( $package_key );
		$installed = false;

		// Directories
		$working_dir = $this->package_dir;
		if ( !file_exists( $working_dir ) ){ 
			wp_mkdir_p( $working_dir );
			jpcrm_create_and_secure_dir_from_external_access( $working_dir, true );
		}
		$target_dir = $package_info['target_dir'];
		if ( !file_exists( $target_dir ) ) {
			wp_mkdir_p( $target_dir );
			jpcrm_create_and_secure_dir_from_external_access( $target_dir, true );
		}

		// did that work?
		if ( !file_exists( $target_dir ) || !file_exists( $working_dir ) ) {

			// error creating directories
			// Add admin notification
			zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'package.installer.dir_create_error', $package_info['title'] . ' (' . $package_key . ')' );

			// return error
			return false;

		}

		// Filenames
		$source_file_name = $package_key . '.zip';

		// Attempt to download and install
		if ( file_exists( $target_dir ) && file_exists( $working_dir ) ){

			// if force reinstall, clear out previous directory contents
			if ( $this->package_is_installed( $package_key ) && $force_reinstall ){

				// empty it out!
				jpcrm_delete_files_from_directory( $target_dir );

			}

			// Retrieve package 
			$libs = zeroBSCRM_retrieveFile( $zbs->urls['extdlpackages'] . $source_file_name, $working_dir . $source_file_name, array( 'timeout' => 30 ) );

			// Process package
			if ( file_exists( $working_dir . $source_file_name ) ){

				switch ( $package_info['install_method'] ){

					// expand a zipped package
					case 'unzip':

						// Expand
						$expanded = zeroBSCRM_expandArchive( $working_dir . $source_file_name, $target_dir );

						if ( $expanded ){

							// Check success?
							if ( !zeroBSCRM_is_dir_empty( $target_dir ) ){

								// appears to have worked, tidy up:
								if ( file_exists( $working_dir  . $source_file_name ) ){
									unlink( $working_dir . $source_file_name  );
								}

								$installed = true;

							} else {

								// Add admin notification
								zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'package.installer.unzip_error', $package_info['title'] . ' (' . $package_key . ')' );

								return false;

							}

						} else {

							// failed to open the .zip, remove it
							if ( file_exists( $working_dir . $source_file_name ) ){
								unlink( $working_dir . $source_file_name  );
							}

							// Add admin notification
							zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'package.installer.unzip_error', $package_info['title'] . ' (' . $package_key . ')' );

							return false;

						}

						break;

					// 1 file package installs, copy to target location
					default:

						// TBD, add when we need this.

						break;

				}


				// if successfully installed, do any follow-on tasks
				if ( $installed ){

					// Success. Reset fail counter
					$this->clear_fail_counter( $package_key );

					// if the $package_info has ['post_install_call'] set, call that
					if ( isset( $package_info['post_install_call'] ) && function_exists( $package_info['post_install_call'] ) ){

						call_user_func( $package_info['post_install_call'], $package_info );

					}

					return true;

				}

			} else {

				// Add error msg
				zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'package.installer.dl_error', $package_info['title'] . ' (' . $package_key . ')' );

			}


		} else {

			// Add error msg
			zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'package.installer.dir_create_error', $package_info['title'] . ' (' . $package_key . ')' );

		}

		return false;


	}


	/*
	* Gets a package fail counter option value
	*/
	private function get_fail_counter( $package_key = ''){

		return (int)get_option( 'jpcrm_package_fail_' . $package_key, 0 );

	}


	/*
	* Adds a tick to a package fail counter option ( to track failed installs )
	*/
	private function increment_fail_counter( $package_key = ''){

		// here we set a failsafe which sets an option value such that if this install does not complete
		// ... we'll know the package install failed (e.g. page timeout shorter than download/unzip time)
		// ... that way we can avoid retrying 50000 times.
		$existing_fails = $this->get_fail_counter( $package_key );
		update_option( 'jpcrm_package_fail_' . $package_key, $existing_fails + 1, false );

	}


	/*
	* Resets fail counter for a package
	*/
	private function clear_fail_counter( $package_key = ''){

		// simple.
		delete_option( 'jpcrm_package_fail_' . $package_key );

	}

}