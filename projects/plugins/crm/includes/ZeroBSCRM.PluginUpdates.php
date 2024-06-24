<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */



#} Note: This update check will only run in the presence of a license key, or Paid-for extension (separate to the free Core CRM Plugin on wp.org)
#} Users of Paid extensions have separately accepted our general privacy policy which allows the 
#} passing of data to our update server/license check system. For core-crm-only users, this will never fire, and no private data will ever be sent or collected.

class zeroBSCRM_Plugin_Updater {

	// vars
	private $api_url     = '';
	private $api_ver 	 = '';
	private $api_data    = array();
	private $name        = '';
	private $slug        = '';
	private $version     = '';
	private $wp_override = false;
	private $installedExts = false;

	private $nag_every = 432000; // php5.5 doesn't like this: (5 * 24 * 3600); //60; //nag every 5 days..  5 * 24 * 3600


	/* ===============================================================================================
	=======================================  init functions ==========================================
	=============================================================================================== */
	/**
	 * Class constructor.
	 *
	 * @uses plugin_basename()
	 * @uses hook()
	 *
	 * @param string  $_api_url     The URL pointing to the custom API endpoint.
	 * @param string  $_api_ver 	??WH: Is not clear? (is passing 1.0 currently)
	 * @param string  $_plugin_file Path to the plugin file.
	 * @param array   $_api_data    Optional data to send with API calls.
	 */
	public function __construct( $_api_url, $_api_ver, $_plugin_file, $_api_data = null ) {

		global $zbs_plugin_data;
		$this->api_url     = trailingslashit( $_api_url );
		$this->api_ver     = untrailingslashit( $_api_ver ); // wh: not used as of this check? 17/8/18
		
		if ( is_array( $_api_data ) ) { // Prevent warning if it's null
			$this->api_data = $_api_data;
			$this->version  = $_api_data['version'];
			$this->wp_override = isset( $_api_data['wp_override'] ) ? (bool) $_api_data['wp_override'] : false;
		}
		// Set up hooks.
		$this->init();
	}


	/**
	 * Set up WordPress filters to hook into WP's update process. 
	 *   - pre_set_transient is the info on whether it needs updating
	 *   - plugins_api is when the 'view version [x.x] details' is clicked.
	 */
	public function init() {

		// actual check for updates
		add_filter( 'pre_set_site_transient_update_plugins', array( $this, 'check_update' ) );
		// can also use this, but untested: add_filter( 'site_transient_update_plugins', array( $this, 'check_update' ) );

		// Set our own get_info call
		add_filter( 'plugins_api', array( $this, 'get_info' ),10,3);

		// this 'renames' the source 
		// fixes a WP bug where wp renames zero-bs-extension-password-manager to zero-bs-extension-password-manager-KGBdBz
		// (removes trailing group)
		// not req: add_filter('upgrader_clear_destination', array($this, 'delete_old_plugin'), 100, 4);
		add_filter( 'upgrader_source_selection', array( $this, 'maybe_adjust_source_dir' ), 1, 4 );

	}

	/* ===============================================================================================
	=====================================  / init functions ==========================================
	=============================================================================================== */



	/* ===============================================================================================
	====================================  main call functions ========================================
	=============================================================================================== */


	public function check_update( $transient ) {

		// req
		global $zbs;

		// define
		$zbs_plugins = array();
		$zbs_check_update_start = time();
		$installedExts = 0;

		// retrieves all active/all WP plugins installed (not just ours)
		// Further gets other configs of same...
		$active_plugins = get_option('active_plugins');
		$zbs_active_plugins = zeroBSCRM_activePluginListSimple();
		$zbs_all_plugins_and_ver = zeroBSCRM_allPluginListSimple();
		$zbs_extensions_on_site = zeroBSCRM_installedProExt();
		$active_core_modules = jpcrm_core_modules_installed();
		$installedExts = zeroBSCRM_extensionsInstalledCount();

		// 7/1/19 - needs to do if key entered, regardless of if ext, because some peeps enter it before adding extensions
		if( $installedExts > 0 || $this->get_license_key() !== false ) {

			// retrieve license key info (later overwritten if updating)
			$key_info = $zbs->settings->get( 'license_key' );

			// api request (will retrieve cached from this func, if just called same request)
			$response = $this->api_request(
				'all_info',
				array(
					'slug'              => 'all',
					'zbs-extensions'    => $zbs_extensions_on_site,
					'active-extensions' => $active_plugins,
					'telemetry-active'  => $zbs_active_plugins,
					'telemetry-all'     => $zbs_all_plugins_and_ver,
					'core-modules'      => $active_core_modules
				)
			); //, 'license'=>$lk

			// if got response
		  	if ( ! is_wp_error( $response ) ) {

		  		// check presence of license_key_valid
		  		// ... this catches the faulty/empty/devmode ones
				if ( isset( $response['license_key_valid'] ) && ( $response['license_key_valid'] == 'false' || $response['license_key_valid'] == 'empty' || $response['license_key_valid'] == '' || $response['license_key_valid'] == 'expired' ) ) {

					// is it dev mode?
					if ( isset( $response['devmode'] ) ) {

						// updates server thinks this user is in dev mode
						// ... so, no need to hassle. or do nout.

					} else {

						// invalid license key
						$key_info['validity'] = '';
						if ( isset( $key_info['validity'] ) ) {
							$key_info['validity'] = $response['license_key_valid'];
						}

						// if this is saying false, then send a notification IF we haven't nagged for 5 days
						if ( !get_transient( 'zbs-nag-license-key-now' ) ) {

							// generate nag
							$link = admin_url( 'admin.php?page=zerobscrm-plugin-settings&tab=license' );
							$parameters = __( 'Your License Key is incorrect.', 'zero-bs-crm' ) . ' <a href="' . $link . '">' . __( 'Please enter your license key here.', 'zero-bs-crm') . '</a>';
							$reference = time();
							$cid = get_current_user_id();

							#NAG-ME-PLZ
							zeroBSCRM_notifyme_insert_notification( $cid, -999, -1, 'license.update.needed', $parameters, $reference );
							set_transient( 'zbs-nag-license-key-now', 'nag', $this->nag_every );
						
						} // / if set nag

					} // / if not dev mode

				// Otherwise, this is a valid license key
				// so next check if it's a rebranded one
				} else if ( $response['license_key_valid'] == 'brand.template' ) {

					// set validity - no brand template
					$key_info['validity'] = '';
					if ( isset( $key_info['validity'] ) ) {
						$key_info['validity'] = 'brand.template';
					}

					// This gives specific unbranded nag, so that wl peeps can forward to us, then we can say
					// "you need to add a brand template?"

					// if this is saying false, then send a notification IF we haven't nagged for 5 days
					// (rebrandr template needed)
					if ( !get_transient( 'zbs-nag-license-key-now' ) ) {

						// generate nag
						$link = admin_url( 'admin.php?page=zerobscrm-plugin-settings&tab=license' );
						$parameters = __( 'Your License Key is not linked to a CRM Brand (Error #401)', 'zero-bs-crm') . ' <a href="' . $link .'">' . __( 'Please enter your license key here.', 'zero-bs-crm') . '</a>';
						$reference = time();
						$cid = get_current_user_id();

						#NAG-ME-PLZ
						zeroBSCRM_notifyme_insert_notification( $cid, -999, -1, 'license.update.needed', $parameters, $reference );
						set_transient( 'zbs-nag-license-key-now', 'nag', $this->nag_every );
					}

				// otherwise this is a legit key :)
				} else {

					// set validity
					$key_info['validity'] = 'true';

					// if passed, copy access level + expires
					if ( isset( $response['access'] ) ) {
						$key_info['access'] = sanitize_text_field( $response['access'] );
					}
					if ( isset( $response['expires'] ) ) {
						$key_info['expires'] = (int)sanitize_text_field( $response['expires'] );
					}

					// if this was the first time this api been used, it'll also send this back:
					if ( isset( $response['claimed'] ) ) {

						// define this just the once, it'll show a msg on license page if on the page
						global $zbsLicenseClaimed;
						$zbsLicenseClaimed = true;

					}

				}

				// here we build a var containing the correct 'up to date versions'
				$official_ver = $response['extensions'];

				// ... and we start with presumption everything is up to date
				$extensions_all_updated = true;

				// cycle through each ext on site & check against list recieved via api_request
				// this is safer + more longterm stable:
				foreach ( $zbs_extensions_on_site as $name => $pluginDetails ) {

					// Here we also now have 'key' to check against, which will in future
					// ... allow rebrandr auto updates
					// ... so what we do is go through all extensions on site...
					// ... and compare with dl'd versions:
					if ( is_array( $official_ver ) ) {
						foreach ( $official_ver as $extUpdateInfo ) {

							// if the key is set & matches
							if ( isset( $extUpdateInfo['zbskey'] ) && $extUpdateInfo['zbskey'] == $pluginDetails['key'] ) {

								// this is our ext :) - check the version to see if newer than installed
								if ( version_compare( $pluginDetails['ver'], $extUpdateInfo['version'], '<' ) ) {

									// ===========================
									// Local Mods to dl obj - these are needed in get_info and all_info (here)

									$newSlug = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
									$e = false;
									if ( is_array( $pluginDetails ) && isset( $pluginDetails['path'] ) ) {
										$e = explode( '/', $pluginDetails['path'] );
									}
									if ( is_array( $e ) ) {
										$newSlug = $e[0];
									}
									if ( empty( $newSlug ) ) {
										$newSlug = $extUpdateInfo['slug'];
									}

									// this isn't needed once dl link fixed server side :) 
									// actually, is a fairly legit fix for now
									// ... MAKES SURE installs in same dir as current for that ext, even in rebranded
									$modifiedDLLink = false;
									if ( isset( $extUpdateInfo['download_link'] ) ) {
										$modifiedDLLink = $extUpdateInfo['download_link'];
										$modifiedDLLink = str_replace( '?', '/' . $newSlug . '.zip?', $modifiedDLLink );
									}

									// / Local Mods to dl obj - these are needed in get_info and all_info (here)
									// ===========================

									// Build 'update needed' obj ref

									$obj              = new stdClass();
									$obj->slug        = $newSlug;
									$obj->plugin      = ( isset( $pluginDetails['path'] ) ? $pluginDetails['path'] : '' );
									$obj->new_version = $extUpdateInfo['version'];
									$obj->tested      = $extUpdateInfo['tested'];
									$obj->package     = $modifiedDLLink;

									// these errored on some rebrandr, so setting defaults
									$obj->url = false; 
									// these errored on some rebrandr, so checking first to stop php notices
									if ( isset( $extUpdateInfo['url'] ) ) {
										$obj->url = $extUpdateInfo['url'];
									}

									if ( isset( $pluginDetails['path'] ) ) {
										$transient->response[$pluginDetails['path']] = $obj;
									}
									else {
										$transient->response[] = $obj;
									}

									// generate nag
									// then we are adding the notification to "please update Jetpack CRM extension "X")
									$parameters = sprintf( __( 'Please update %s from version %s to version %s.', 'zero-bs-crm' ), $pluginDetails['name'], $pluginDetails['ver'], $extUpdateInfo['version'] );
									$ref = $pluginDetails['ver'] . $extUpdateInfo['version'];

									#NAG-ME-PLZ
									$reference = $pluginDetails['key'] . str_replace( '.', '', $ref );
									$cid = get_current_user_id();
									zeroBSCRM_notifyme_insert_notification( $cid, -999, -1, 'custom.extension.update.needed', $parameters, $reference );

									// make note that something needs an update
									$extensions_all_updated = false;

								} // / end if ver is newer

							} // / end if key matches
						
						} // / end cycle through $official_ver
					}

				} // / end cycle through $zbs_extensions_on_site


				// This checks that this plugin_update is being called on a rebranded plugin
				// .. further, it then proceeds to check if the WL ver of CORE CRM needs updating
				// .. as that's not hosted on wp.org, it's a rebrand/remix :)
				if ( zeroBSCRM_isWL() ) {

					// get core ver
					$core = zeroBSCRM_installedWLCore();

					// is core wl?
					if ( isset( $core ) && is_array( $core ) && isset( $core['ver'] ) ) {

						// get ext update info for core
						$coreUpdateInfo = false;
						if ( is_array( $official_ver ) ) {
							foreach ( $official_ver as $extUpdateInfo ) {
								if ( isset( $extUpdateInfo['zbskey'] ) && $extUpdateInfo['zbskey'] == 'core' ) {
									$coreUpdateInfo = $extUpdateInfo;
									break;
								}
							}
						}

						// this checks if it's the core & if the ver is older than latest
						if ( $coreUpdateInfo && version_compare( $core['ver'], $coreUpdateInfo['version'], '<' ) ) {

							// ===========================
							// Local Mods to dl obj - these are needed in get_info and all_info (here)

							$newSlug = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
							$e = explode( '/', $core['path'] );
							if ( is_array( $e ) ) {
								$newSlug = $e[0];
							}
							if ( empty( $newSlug ) ) {
								$newSlug = $coreUpdateInfo['slug'];
							}

							// this isn't needed once dl link fixed server side :) 
							// actually, is a fairly legit fix for now
							// ... MAKES SURE installs in same dir as current for that ext, even in rebranded
							$modifiedDLLink = $coreUpdateInfo['download_link'];
							$modifiedDLLink = str_replace( '?', '/' . $newSlug . '.zip?', $modifiedDLLink );

							// / Local Mods to dl obj - these are needed in get_info and all_info (here)
							// ===========================

							// Build 'update needed' obj ref
							$obj              = new stdClass();
							$obj->slug        = $newSlug;
							$obj->plugin      = $core['path'];
							$obj->new_version = $coreUpdateInfo['version'];
							$obj->url         = $coreUpdateInfo['url'];
							$obj->tested      = $coreUpdateInfo['tested'];
							$obj->package     = $modifiedDLLink;

							$transient->response[ $core['path'] ] = $obj;

							// generate nag
							// then we are adding the notification to "please update Jetpack CRM extension "X")
							$parameters = sprintf( __( 'Please update %s from version %s to version %s.', 'zero-bs-crm' ), $core['name'], $core['ver'], $coreUpdateInfo['version'] );
							$ref = $core['ver'] . $coreUpdateInfo['version'];
					
							#NAG-ME-PLZ
							$reference = $core['key'] . str_replace( '.', '', $ref );
							$cid = get_current_user_id();
							zeroBSCRM_notifyme_insert_notification( $cid, -999, -1, 'core.update.needed', $parameters, $reference );

							// make note that something needs an update
							$extensions_all_updated = false;

						} // / core crm rebrand has update

					} // / has core rebrand installed

				} // if is rebranded

				// If not all the Jetpack CRM extensions are updated. Fire off the warning shot.
				if( !$extensions_all_updated ) {

					// 1+ ext needs update

					// Recently nagged?
					if( !get_transient( 'zbs-nag-extension-update-now' ) ) {

						// generate nag
						$parameters = __( 'You are running extensions which are out of date and not supported. Please update to avoid any issues.', 'zero-bs-crm' );
						$reference = time();
						$cid = get_current_user_id();

						#NAG-ME-PLZ
						zeroBSCRM_notifyme_insert_notification( $cid, -999, -1, 'general.extension.update.needed', $parameters, $reference );
						set_transient( 'zbs-nag-extension-update-now', 'nag', $this->nag_every );

					}

					// set extensions_updated to false in license info setting
					$key_info['extensions_updated'] = false;

				} else {

					// all exts are up to date

					// set extensions_updated to true in license info setting
					$key_info['extensions_updated'] = true;

				}

			} else {

				// There was a WP Error
			}

			// Brutally, update the settings obj containing license info
			// name is a legacy throwback to old sys
			$zbs->settings->update( 'license_key', $key_info );

		} // / if $installdExts

		// return the trans :)
		// (modified or not)
		return $transient;
	}

	#} This fires when a user clicks "view version x.x.x information" next to an update in plugins.php or update-core.php
	// ... showing the info in the modal popup
	public function get_info($obj, $action, $arg){

		// is this an info req? & is slug set?
		if ( $action === 'plugin_information' && isset( $arg->slug ) ) {

			// Grab the extension, if it is one of ours :)
			$possibleExtension = $this->getCRMExtension( $arg->slug );

			// or is it core?
			if ( ! is_array( $possibleExtension ) ) {
			    $possibleExtension = $this->getCoreWLCRM( $arg->slug );
            }

			// if this is an array, it's either one of our ext or the core (or either rebranded)
			if ( is_array( $possibleExtension ) ) {

				// we'll need this:
				global $zbs;
		
				// do api request to get the info from api.jetpackcrm.com
				$res = $this->api_request( 'ext_info', array( 'slug' => $arg->slug, 'key' => $possibleExtension['key'] ) );
				
				// is it a WP error?
				if ( ! is_wp_error( $res ) ) {

					// ===========================
					// Local Mods to dl obj - these are needed in get_info (here) and all_info

					$newSlug        = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					$modifiedDLLink = ''; // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

					$e = explode('/',$possibleExtension['path']);
					if (is_array($e)) $newSlug = $e[0];
					if (empty($newSlug)) $newSlug = $res['slug'];

					if (isset($res['download_link']) && $res['download_link'] !== 'false' && !empty($newSlug)) {

						// this isn't needed once dl link fixed server side :) 
						// actually, is a fairly legit fix for now
						// ... MAKES SURE installs in same dir as current for that ext, even in rebranded
						$modifiedDLLink = $res['download_link'];
						$modifiedDLLink = str_replace('?','/'.$newSlug.'.zip?',$modifiedDLLink);

					}

					// / Local Mods to dl obj - these are needed in get_info (here) and all_info
					// ===========================

					// Build 'update needed' obj ref
					$obj	 			= new stdClass();
					$obj->slug 			= $newSlug; 
				    $obj->plugin_name 	= $res['slug'];
				    $obj->new_version 	= $res['version'];
				    $obj->requires 		= $res['requires'];
				    
				    	// name
					    if (isset($res['name'])) 
					    	$obj->name 			= $res['name'];
					    elseif (isset($possibleExtension['name']))
					    	$obj->name = $possibleExtension['name'];
					    else
					    	$obj->name = '';
					
						// tested to
						if (isset($res['tested'])) 
							$obj->tested 		= $res['tested']; 				
						else
							// default to latest in core
							$obj->tested = $zbs->wp_tested;

						// url
						if (isset($res['url'])) 
							$obj->url 	= $res['url'];  
						else
							// default to core
							$obj->url 			= $zbs->urls['home'];
	
						// mod link
						if (isset($modifiedDLLink) && !empty($modifiedDLLink)){
							$obj->download_link = $modifiedDLLink;
							$obj->package = $modifiedDLLink;
						}

						// html sections		
						if (isset($res['sections'])) 
							$obj->sections       = $res['sections'];
						else
							// default
							$obj->sections = array();

					// optional
					if (isset($res['banners'])) $obj->banners       = $res['banners'];
					if (isset($res['downloaded'])) $obj->downloaded 	= $res['downloaded'];  				
					if (isset($res['last_updated'])) $obj->last_updated 	= $res['last_updated'];	


				} // / end if ! wp error

			} // / end if is one of ours

		} // / end if slug set && is plugin_information


		// return the singular update obj
	    return $obj;

	}


	/* ===============================================================================================
	=================================== / main call functions ========================================
	=============================================================================================== */



	/* ===============================================================================================
	=====================================  helper functions ==========================================
	=============================================================================================== */

	// Retrieves license key, (if is one), from settings obj
	public function get_license_key(){

		global $zbs;
		$settings = $zbs->settings->get('license_key');
		
		// checks if exists and it's not empty
		if ( ! empty( $settings['key'] ) ) {
			return $settings['key'];
		}

		return false;

	}

	public function isLicenseValid(){

		// taken wholesale out of adminPages license key page. 

  		  $licenseKeyArr = zeroBSCRM_getSetting('license_key');
          // simplify following:
          $licenseValid = false; if (isset($licenseKeyArr['validity'])) $licenseValid = ($licenseKeyArr['validity'] === 'true');

          return $licenseValid;

	}


	/**
	 * This is used to verify if is one of our extensions
	 * >> only hook in if the slug is one of our plugins!! :)
	 */
	public function isCRMExtension($slug=''){

		// req.
		global $zbs;

		// if slug passed
		if (!empty($slug)){

			// get latest list (or cache)
			if (!is_array($this->installedExts)) $this->installedExts = zeroBSCRM_installedProExt();

			// cycle through em 
			foreach ($this->installedExts as $extName => $extDeets){

				// debug echo 'checking '.$extDeets['slug'].' against '.$slug.'<br>';

				// is slug in this arr?
				if (is_array($extDeets) && isset($extDeets['slug']) && $extDeets['slug'] == $slug) return true;

			}

		}

		return false;

	}

	#} Retireve extension details array based on the plugin slug
	public function getCRMExtension( $slug='' ) {

		global $zbs;

		// if slug
		if ( ! empty( $slug ) && $slug !== 'jetpack' && $slug !== 'zero-bs-crm' ) {

			// get latest list (or cache)
			if ( ! is_array( $this->installedExts ) ) {
			    $this->installedExts = zeroBSCRM_installedProExt();
            }

			// cycle through each, check if matches
			foreach ( $this->installedExts as $extName => $extDeets ) {

				if (
					// something else we changed, changed this. Use first part of path now, not slug.
					( is_array( $extDeets ) && isset( $extDeets['path'] ) && str_starts_with( $extDeets['path'], $slug ) ) // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
					) {

					// simple return.
					$x = $extDeets;
					$x['shortname'] = $extName;
					return $x;
				}

			}


		} // / if slug

		// no luck
		return false;

	}

	#} Retireve rebranded core crm plugin details array based on the plugin slug
	public function getCoreWLCRM( $slug = '' ) {

		// req.
		global $zbs;
		
		// is this install rebranded, and is there a slug?
		if ( zeroBSCRM_isWL() && ! empty( $slug ) && $slug !== 'jetpack' ) {

			// get core ver
			$core = zeroBSCRM_installedWLCore();

			//echo 'core:';print_r($core); 

			// is core wl?
			if (isset($core) && is_array($core) && isset($core['ver'])){

					// is this it?
					if (
					// something else we changed, changed this. Use first part of path now, not slug.
					( is_array( $core ) && isset( $core['path'] ) && str_starts_with( $core['path'], $slug ) )
					) {

						$x = $core;
						$x['shortname'] = $core['name'];
						return $x;
					}

			} // / this is core & it has a ver


		} // / is this install rebranded, and is there a slug?

		return false;

	}


	// Retrieves the latest info for ZBS extension list, or singular (if get_info)
	// 13/12/18 - this now caches, as is recalled for each plugin when getting all_info.
	// cachcing = side-hack for v1.0 
	public function api_request($action, $data){

		// req. 
		global $zbs;

		// discern multisite, WL
		$multisite = false; $wl = false;
		$multisite = is_multisite();
		if ($multisite == ''){
			$multisite = false;
		} if (zeroBSCRM_isWL()) $wl = true;

		// build request data package
		$api_params = array(
			'zbs-action' 	=> $action,
			'license'    	=> $this->get_license_key(),
			'url'        	=> home_url(),
			'method'	 	=> 'POST',
			'is_multi_site'	=> $multisite,
			'is_wl'			=> $wl,
			'country'		=> '',
			'core_ver'		=> $zbs->version
		);

		// sites
		$sites['sites'] 	= zeroBSCRM_multisite_getSiteList();

		// combine sites list, our package, and any passed $data
		$api_params = array_merge($api_params, $sites);
		$api_params = array_merge($api_params, $data);

		/* Ultimately that'll make this remote post:

		1 big array:

				$api_params = array(
					'zbs-action' 	=> $action,
					'license'    	=> $this->get_license_key(),
					'url'        	=> home_url(),
					'method'	 	=> 'POST',
					'is_multi_site'	=> $multisite,
					'is_wl'			=> $wl,
					'country'		=> $country,
					'core_ver'		=> $zbs->version

				 ++ 
					'slug'=> 'all', 
					'zbs-extensions'=> $zbs_extensions_on_site, 
					'active-extensions' => $active_plugins, 
					'telemetry-active' => $zbs_active_plugins, 
					'telemetry-all' => $zbs_all_plugins_and_ver

				++ 
					'sites' => array()
			 
				);

		*/


		// got cache? (we don't cache ext_info)
		global $zbsExtUpdateCache;
		if ($action !== 'ext_info' && isset($zbsExtUpdateCache) && is_array($zbsExtUpdateCache)){
		
			return $zbsExtUpdateCache;
		
		} else {

			// note, if we have recurring failures in this license key retrieve, it's likely that their is an SSL issue			// 
			// https://wordpress.stackexchange.com/questions/167898/is-it-safe-to-use-sslverify-true-for-with-wp-remote-get-wp-remote-post
			$licensingAttempts = $zbs->DAL->setting('licensingcount',0);

			// check for setting
			$hasHitError = $zbs->DAL->setting('licensingerror',false); if (is_array($hasHitError)) $hasHitError = true;

			// if 1 + no success, turn this off for third
			$sslIgnore = false; if ($licensingAttempts > 0 && !$this->isLicenseValid() && $hasHitError) $sslIgnore = true;
			if ($sslIgnore){
				add_filter( 'https_ssl_verify', '__return_false' );
			}

			// run the req.
			$responseFull = wp_remote_post( $this->api_url, array(
				'method' => 'POST',
				'timeout' => 60,
				'redirection' => 5,
				'httpversion' => '1.0',
				'blocking' => true,
				'headers' => array(),
				'body' => $api_params,
				'cookies' => array()
			    )
			);

			// remove filter if set
			if ($sslIgnore){
				remove_filter( 'https_ssl_verify', '__return_false' );
			}

			// up count.
			$zbs->DAL->updateSetting('licensingcount',($licensingAttempts+1));

			// hmmm - was wary of only allowing 200, but probs makes more sense than this?
			$unacceptableHTTPCodes = array(500,443);
			$httpCode = wp_remote_retrieve_response_code($responseFull);

			// got wp err?
			if ( ! is_wp_error( $responseFull ) && !in_array($httpCode,$unacceptableHTTPCodes)) {

				// decode
				$response = json_decode( $responseFull['body'],true  );

				// set cache
				$zbsExtUpdateCache = $response;

				// clear any err
				$zbs->DAL->updateSetting('licensingerror',false);


				// return
				return $response;

			} else {

				// wp err
				if (is_wp_error( $responseFull )){

					// log the err
					$zbs->DAL->updateSetting('licensingerror',array('time'=>time(), 'err' => $responseFull->get_error_message()));

				}

				// http err 
				if (in_array($httpCode,$unacceptableHTTPCodes)) {

					// log the err
					$msg = ''; if (is_array($responseFull) && isset($responseFull['message'])) $msg = $responseFull['message'];
					$zbs->DAL->updateSetting('licensingerror',array('time'=>time(), 'err' => 'Error:'.$httpCode.' '.$msg));

				}

			}
		}

		return false;

	}


		/* This is a WH hack using 
		.... https://github.com/CherryFramework/cherry-plugin-wizard/blob/master/includes/class-cherry-plugin-wizard-plugin-upgrader.php#L71
		... as a base
		... which shoves itself in the middle of all plugin installs/upgrades
		... IF it finds that the plugin being updated is one of OURS, it'll intercede and change:
		... zero-bs-extension-password-manager-KGBdBz 
		... to 
		... zero-bs-extension-password-manager

		Useful:
			https://core.trac.wordpress.org/browser/tags/5.0/src/wp-admin/includes/class-plugin-upgrader.php#L21
			https://core.trac.wordpress.org/browser/tags/5.0/src/wp-admin/includes/class-wp-upgrader.php#L502
			https://developer.wordpress.org/reference/hooks/upgrader_process_complete/
		*/
		/**
		 * Adjust the plugin directory name if necessary.
		 *
		 * The final destination directory of a plugin is based on the subdirectory name found in the
		 * (un)zipped source. In some cases - most notably GitHub repository plugin downloads -, this
		 * subdirectory name is not the same as the expected slug and the plugin will not be recognized
		 * as installed. This is fixed by adjusting the temporary unzipped source subdirectory name to
		 * the expected plugin slug.
		 *
		 * @since  1.0.0
		 * @param  string       $source        Path to upgrade/zip-file-name.tmp/subdirectory/.
		 * @param  string       $remote_source Path to upgrade/zip-file-name.tmp.
		 * @param  \WP_Upgrader $upgrader      Instance of the upgrader which installs the plugin.
		 * @return string $source
		 */
		public function maybe_adjust_source_dir( $source, $remote_source, $upgrader, $extraArgs ) {
			
				// is this one of our plugins that's being updated? (will be called by all)
				$ours = false; $pluginPath = false;
				if (isset($extraArgs) && isset($extraArgs['plugin']) && !empty($extraArgs['plugin'])) $pluginPath = $extraArgs['plugin'];

				// normal ext + rebranded ext test
				if ($pluginPath !== false){
					$ourExts = zeroBSCRM_installedProExt();
					if (is_array($ourExts)) foreach ($ourExts as $x => $ext) if ($ext['path'] == $pluginPath) $ours = true;
				}

				// wl(rebranded) core test
				if ($pluginPath !== false && zeroBSCRM_isWL()){

					// core check
					$core = zeroBSCRM_installedWLCore();

					// if wl core is installed
					if (isset($core) && is_array($core) && isset($core['ver'])){

						if ($core['path'] == $pluginPath) $ours = true;

					}	

				}

			// if not ours, just return $source for now
			// otherwise use ORIGINAL plugin dir :)
			// https://core.trac.wordpress.org/browser/tags/5.0/src/wp-admin/includes/class-wp-upgrader.php#L502
			if (!$ours) return $source;

			// req. 
			global $wp_filesystem; if (! is_object( $wp_filesystem ) ) { return $source; }

			// check from path
			$from_path = untrailingslashit( $source );
			$desired_slug = isset( $extraArgs['plugin'] ) ? $extraArgs['plugin'] : false;
			if (!empty($desired_slug)) {
				$e = explode('/',$desired_slug);
				if (is_array($e)) $desired_slug = $e[0];
				if (empty($desired_slug)) return $source;
			}
			if ( ! $desired_slug ) {
				return $source;
			}

			// holder dir
			$to_path = untrailingslashit( $source );
			
			// remove working dir 
			// ?? not req.

			// attempt to build a 'proper' to_path
			if (!empty($to_path)) {
				$to_path = substr($to_path,0,strrpos($to_path,'/'));
				$to_path .= '/'.$desired_slug;
			}

			// if checks out...
			if ( ! empty( $to_path ) && $to_path !== $from_path ) {

				//echo 'from:'.$from_path.'<br>to:'.$to_path;
				//exit();

				if ( true === $wp_filesystem->move( $from_path, $to_path ) ) {
					return trailingslashit( $to_path );
				} else {
					return new WP_Error(
						'rename_failed',
						esc_html__( 'The remote plugin package does not contain a folder with the desired slug and renaming did not work.', 'zero-bs-crm' ) . ' ' . esc_html__( 'Please contact the plugin provider and ask them to package their plugin according to the WordPress guidelines.', 'zero-bs-crm' ),
						array( 'found' => $to_path, 'expected' => $desired_slug )
					);
				}
			} elseif ( empty( $to_path ) ) {
				return new WP_Error(
					'packaged_wrong',
					esc_html__( 'The remote plugin package consists of more than one file, but the files are not packaged in a folder.', 'zero-bs-crm' ) . ' ' . esc_html__( 'Please contact the plugin provider and ask them to package their plugin according to the WordPress guidelines.', 'zero-bs-crm' ),
					array( 'found' => $to_path, 'expected' => $desired_slug )
				);
			}
			return $source;
		}



	/* ===============================================================================================
	==================================== / helper functions ==========================================
	=============================================================================================== */
}

//https://stackoverflow.com/questions/2053245/how-can-i-detect-if-the-user-is-on-localhost-in-php
// fullCheck = true = also checks in with our sever (max 1 x 24h) to see if we have an override rule in place
// defaults to full check as of 2.97.9
// SELECT * FROM `zbs_app_users_licenses_requests` WHERE action = 'localcheck'
function zeroBSCRM_isLocal($fullCheck=true) {
	// quick caching
	if (jpcrm_is_devmode_override()) return false;

	// is local, unless override setting set within past 48h
	$whitelist = array( '127.0.0.1', 'localhost', '::1' );
	if ( in_array( zeroBSCRM_getRealIpAddr(), $whitelist, true ) ) {

    	if ($fullCheck){

	    	global $zbs;

	    	// appears to be local
	    	// see if setting (if this is set, it's legit, and its the last timestamp it was 'checked')
	    	$key = $zbs->DAL->setting('localoverride',false);
	    	// debug echo 'settinglocal:'.$key.' vs '.(time()-172800).'!<br>';

	    	// how often to recheck
	    	$ageOkay = time()-(7*86400);

	    	// if set, less than xxx ago
	    	if ($key !== false && $key > $ageOkay)
	    		return false; // it appears not to be dev mode
	    	else {
	    		
	    		// is probably dev mode, if last check was more than xxx days ago, recheck
	    		$lastcheck = $zbs->DAL->setting('localoverridecheck',false);
	    		// debug echo 'lastcheck:'.$lastcheck.'!<br>';

	    		// has last check
	    		if ($lastcheck !== false && $lastcheck > $ageOkay)
	    			// was checked less than a day ago, so is probs dev mode
	    			return true;
	    		else {

	    			// check + return
	    			$check = zeroBSCRM_localDblCheck();

	    			// debug echo 'check:'.$check.'!<br>';

	    			return $check;

	    		}

	    	}

    	} else {

    		// non-full-check
    		return true;
    	}

    }

    return false;

}

/*
	
	This function connects to https://api.jetpackcrm.com/localcheck
	... passing this site url
	... it's to be used to test if we have an "override" logged for this siteurl
	... (to say that it's NOT a dev server, at this site url.)

	.. this should only ever be run once a day or so max, as calls API. 
	.. in this case it's called by zeroBSCRM_isLocal itself, on param

*/
function zeroBSCRM_localDblCheck(){

		// quick caching
		if (jpcrm_is_devmode_override()) return false;

		// req. 
		global $zbs;

		// build request data package
		$api_params = array(
			'siteurl'        => home_url(),
			'method'	 	=> 'POST',
		);

		// run the req.
		$responseFull = wp_remote_post( $zbs->urls['apilocalcheck'], array(
			'method' => 'POST',
			'timeout' => 60,
			'redirection' => 5,
			'httpversion' => '1.0',
			'blocking' => true,
			'headers' => array(),
			'body' => $api_params,
			'cookies' => array()
		    )
		);

		// log that it was checked
		$zbs->DAL->updateSetting('localoverridecheck',time());

		// got wp err?
		if ( ! is_wp_error( $responseFull ) ) {

			// decode
			$response = json_decode( $responseFull['body'],true  );

			// infer
			if (isset($response['overridemode']) && $response['overridemode'] == 1){

				//debug echo home_url().' is override';
				// is legit, set here + Return false, this is to be override (not a local site)
				$zbs->DAL->updateSetting('localoverride',time());

				// we also set this runtime global to avoid us having to multicheck settings
				define('JPCRM_DEVOVERRIDE',true);

				return false;

			} else {

				// debug echo home_url().' Not override';
				// nope. not override (return true, is a local site)
				return true;

			}


		} else {

			// log the err
			//$zbs->DAL->updateSetting('licensingerror',array('time'=>time(), 'err' => $responseFull->get_error_message()));

		}

		// nope. not override (return true, is a local site)
		return true;

	}


	// checks if a plugin has an update.
	// adapted from https://wordpress.stackexchange.com/questions/228468/plugin-update-warning 
	// ... for pre-checking new ver releases (e.g. <3.0 to 3.0) to enable pre-warning as in ZeroBSCRM.PluginUpdates.ImminentRelease.php
	// name = Jetpack CRM
	// textdom = zero-bs-crm (in lieu of slug)
	function zeroBSCRM_updates_pluginHasUpdate($name='',$textDomain=''){

	    if ( ! function_exists( 'get_plugin_updates' ) ) {
	        require_once ABSPATH . 'wp-admin/includes/update.php';
	        require_once ABSPATH . 'wp-admin/includes/plugin.php';
	    }

	    $list = get_plugin_updates();
	    $data = array();

	    foreach( $list as $i => $item ) {   
	    	
	    	// debug echo 'item:<pre>'.print_r($item,1).'</pre><br>';

	        if ( 
	        	(!empty($name) && strtolower( $name ) == strtolower( $item->Name ) )
	        	||
	        	(!empty($textDomain) && strtolower( $textDomain ) == strtolower( $item->TextDomain ) )
	        	) {

	        	// simpler...
	            return $list[$i];
	        }
	    }

	    /* not req. 
	    if( ! empty( $data ) ) {

	        return array(
	            'name' => $data->Name,
	            'version' => $data->Version,
	            'new_version' => $data->update->new_version,
	            'url' => $data->update->url,
	            'package' => $data->update->package
	        );

	    } */

	    return array();
}
