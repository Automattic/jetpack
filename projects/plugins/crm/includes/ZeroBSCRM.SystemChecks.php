<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 * Copyright 2020 Automattic
 *
 * Date: 01/11/16
 */

/* ======================================================
  Breaking Checks ( stops direct access )
   ====================================================== */
    if ( ! defined( 'ZEROBSCRM_PATH' ) ) exit;
/* ======================================================
  / Breaking Checks
   ====================================================== */





/* ======================================================
  Generic System Check Wrapper/Helper funcs
   ====================================================== */

/**
 * Check if a PHP systems/library is correctly installed.
 *
 * @param string $key The feature we want to know the status off.
 * @param bool   $with_info Weather we should return a message or not.
 *
 * @return array|false
 */
function zeroBSCRM_checkSystemFeat( $key = '', $with_info = false ) {

	$feat_list = array(
		'zlib',
		'dompdf',
		'mb_internal_encoding',
		'pdffonts',
		'curl',
		'phpver',
		'wordpressver',
		'locale',
		'assetdir',
		'executiontime',
		'memorylimit',
		'postmaxsize',
		'uploadmaxfilesize',
		'wpuploadmaxfilesize',
		'dbver',
		'dalver',
		'corever',
		'local',
		'localtime',
		'serverdefaulttime',
		'sqlrights',
		'devmode',
		'permalinks',
		'mysql',
		'innodb',
		'fontinstalled',
		'encryptionmethod',
	);

	// only show these for legacy users using DAL<3
	// #backward-compatibility
	global $zbs;
	if ( ! $zbs->isDAL3() ) {
		$feat_list[] = 'autodraftgarbagecollect';
	}

	if ( in_array( $key, $feat_list, true ) ) {
		if ( function_exists( 'zeroBSCRM_checkSystemFeat_' . $key ) ) {
			return call_user_func_array( 'zeroBSCRM_checkSystemFeat_' . $key, array( $with_info ) );
		}

		if ( function_exists( 'zbscrm_check_system_feat_' . $key ) ) {
			return call_user_func_array( 'zbscrm_check_system_feat_' . $key, array( $with_info ) );
		}
	}

	if ( ! $with_info ) {
		return false;
	} else {
		return array( false, __( 'No Check!', 'zero-bs-crm' ) );
	}
}

	function zeroBSCRM_checkSystemFeat_permalinks(){
		 if(zeroBSCRM_checkPrettyPermalinks()){
			 	$enabled = true;
			   $enabledStr = 'Permalinks ' . get_option('permalink_structure');
				return array($enabled, $enabledStr);
		 }else{
			 	$enabled = false;
			  $enabledStr = ' Pretty Permalinks need to be enabled';
				return array($enabled, $enabledStr);
		 }
	}

	function zeroBSCRM_checkSystemFeat_fontinstalled($withInfo=false){

		global $zbs;

	    $fonts = $zbs->get_fonts();

		if (!$withInfo)
			return $fonts->default_fonts_installed();
		else {

			$enabled = $fonts->default_fonts_installed();
			if ( $enabled ){ 
				$enabledStr = __( "Font installed", 'zero-bs-crm' );
			} else {
				$enabledStr = sprintf( __( 'Font not installed (<a href="%s" target="_blank">reinstall pdf engine module</a>)', 'zero-bs-crm' ), jpcrm_esc_link( $zbs->slugs['modules'] ) );
			}

			return array($enabled, $enabledStr);
		}
	}

	function zeroBSCRM_checkSystemFeat_corever($withInfo=false){

		if (!$withInfo)
			return true;
		else {

			global $zbs;

			$enabled = true;
			$enabledStr = 'Version ' . $zbs->version;

			return array($enabled, $enabledStr);
		}
	}

	function zeroBSCRM_checkSystemFeat_dbver($withInfo=false){

		if (!$withInfo)
			return true;
		else {

			global $zbs;

			$enabled = true;
			$enabledStr = 'Database Version ' . $zbs->db_version;

			return array($enabled, $enabledStr);
		}
	}

	function zeroBSCRM_checkSystemFeat_dalver($withInfo=false){

		if (!$withInfo)
			return true;
		else {

			global $zbs;

			$enabled = true;
			$enabledStr = 'Data Access Layer Version ' . $zbs->dal_version;

			return array($enabled, $enabledStr);
		}
	}

	function zeroBSCRM_checkSystemFeat_phpver($withInfo=false){

		if (!$withInfo)
			return true;
		else {

			$enabled = true;
			$enabledStr = 'PHP Version ' . PHP_VERSION;

			return array($enabled, $enabledStr);
		}
	}

	function zeroBSCRM_checkSystemFeat_wordpressver($withInfo=false){

		if (!$withInfo)
			return true;
		else {

			global $wp_version;

			$enabled = true;
			$enabledStr = sprintf(__("WordPress Version %s", 'zero-bs-crm'), $wp_version);

			return array($enabled, $enabledStr);
		}
	}



	function zeroBSCRM_checkSystemFeat_local($withInfo=false){

		$local = zeroBSCRM_isLocal();

		if (!$withInfo)
			return !$local;
		else {

			$enabled = !$local;
			if ($local) 
				$enabledStr = 'Running Locally<br />This may cause connectivity issues with SMTP (Emails) and updates/feature downloads.';
			else
				$enabledStr = 'Connectivity Okay.';

			return array($enabled, $enabledStr);
		}
	}
	function zeroBSCRM_checkSystemFeat_serverdefaulttime($withInfo=false){

		/*if (function_exists('locale_get_default'))
			$locale = locale_get_default();
		else
			$locale = Locale::getDefault();
		*/
			$tz = date_default_timezone_get();

		if (!$withInfo)
			return true;
		else {

			$enabled = true;
			$enabledStr = $tz;

			return array($enabled, $enabledStr);
		}
	}
	function zeroBSCRM_checkSystemFeat_localtime($withInfo=false){

		$enabled = true;

		if (!$withInfo)
			return true;
		else {

			$enabledStr = 'CRM Time: '.zeroBSCRM_date_i18n('Y-m-d H:i:s', time() ).' (GMT: '.date_i18n('Y-m-d H:i:s', time(),true).')';

			return array($enabled, $enabledStr);
		}
	}
    	
    // in devmode or not?
	function zeroBSCRM_checkSystemFeat_devmode($withInfo=false){

		$isLocal = zeroBSCRM_isLocal();

		if (!$withInfo)
			return $isLocal;
		else {

			global $zbs;

			$devModeStr = '';

			if (!$isLocal){

				// check if overriden
				$key = $zbs->DAL->setting('localoverride',false);

		    	// if set, less than 48h ago, is overriden
		    	if ($key !== false && $key > time()-172800)
		    		$devModeStr = __('Production','zero-bs-crm').' (override)';
		    	else // normal production (99% users)
		    		$devModeStr = __('Production','zero-bs-crm');

		    } else {

		    	// devmode proper
		    	$devModeStr = __('Developer Mode','zero-bs-crm');

		    }

			return array($isLocal, $devModeStr);
		}
	}

	// https://wordpress.stackexchange.com/questions/6424/mysql-database-user-which-privileges-are-needed
	// can we create tables?
	function zeroBSCRM_checkSystemFeat_sqlrights($withInfo=false){

		global $wpdb;
		
	  	// run check tables
	  	zeroBSCRM_checkTablesExist();
	  	$lastError = $wpdb->last_error;
	  	$okay = true; if (strpos($lastError,'command denied') > -1) $okay = false;

		if (!$withInfo)
			return $okay;
		else {

			global $zbs;

			$enabled = $okay;
			if ($enabled) 
				$enabledStr = __('Appears Okay','zero-bs-crm');
			else
				$enabledStr = __('Error','zero-bs-crm').': '.$lastError;

			return array($enabled, $enabledStr);
		}
	}

	// what mysql we running
	function zeroBSCRM_checkSystemFeat_mysql($withInfo=false){

		if (!$withInfo)
			return zeroBSCRM_database_getVersion();
		else
			return array(1, zeroBSCRM_database_getVersion());

	}

	// got InnoDB?
	function zeroBSCRM_checkSystemFeat_innodb($withInfo=false){

		if (!$withInfo)
			return zeroBSCRM_DB_canInnoDB() ? __('Available','zero-bs-crm') :  __('Not Available','zero-bs-crm');
		else {
			$innoDB = zeroBSCRM_DB_canInnoDB();
			return array($innoDB, ($innoDB ? __('Available','zero-bs-crm') :  __('Not Available','zero-bs-crm')));			
		}

	}



	// below here: https://stackoverflow.com/questions/8744107/increase-max-execution-time-in-php


	function zeroBSCRM_checkSystemFeat_executiontime($withInfo=false){


			$maxExecution = ini_get('max_execution_time');

		if (!$withInfo)
			return $maxExecution;
		else {

			$str = $maxExecution.' seconds';

			// catch infinites
			if ($maxExecution == '0') $str = 'No Limit';

			return array($maxExecution,$str);

		}


	}

	function zeroBSCRM_checkSystemFeat_memorylimit($withInfo=false){

			$maxMemory = ini_get('memory_limit');

		if (!$withInfo)
			return $maxMemory;
		else {

			$str = $maxMemory;

			return array($maxMemory,$str);

		}


	}

	function zeroBSCRM_checkSystemFeat_postmaxsize($withInfo=false){

			$post_max_size = ini_get('post_max_size');

		if (!$withInfo)
			return $post_max_size;
		else {

			$str = $post_max_size;

			return array($post_max_size,$str);

		}


	}

	function zeroBSCRM_checkSystemFeat_uploadmaxfilesize($withInfo=false){

			$upload_max_filesize = ini_get('upload_max_filesize');

		if (!$withInfo)
			return $upload_max_filesize;
		else {

			$str = $upload_max_filesize;

			return array($upload_max_filesize,$str);

		}


	}

	function zeroBSCRM_checkSystemFeat_wpuploadmaxfilesize($withInfo=false){

			//https://codex.wordpress.org/Function_Reference/wp_max_upload_size
			$wp_max_upload_size = zeroBSCRM_prettyformatBytes(wp_max_upload_size());

		if (!$withInfo)
			return $wp_max_upload_size;
		else {

			$str = $wp_max_upload_size;

			return array($wp_max_upload_size,$str);

		}


	}

	/*
	 * Encryption method check 
	 */
	function zeroBSCRM_checkSystemFeat_encryptionmethod( $withInfo = false ){

		global $zbs;

		// load encryption
		$encryption = $zbs->load_encryption();

		// any issues?
		$return_string = '';

		// check if has flipped fallback previously
		$fallback_blocked = zeroBSCRM_getSetting( 'enc_fallback_blocked' );
		if ( !empty( $fallback_blocked ) ) {

			$return_string = __( '<span class="ui label red">Warning!</span> Encryption disabled due to no available encryption method. Please contact support.', 'zero-bs-crm' );

		}

		// check if has flipped fallback previously
		$fallback_active = zeroBSCRM_getSetting( 'enc_fallback_active' );
		if ( !empty( $fallback_active ) ) {

			$return_string = sprintf( __( '<span class="ui label orange">Note:</span> Encryption using fallback method (%s) due to no available encryption method. Please contact support.', 'zero-bs-crm' ), $encryption->cipher_method() );

		}

		if ( !$withInfo ){
			
			return $encryption->ready_to_encrypt();

		}
		else {

			if ( empty( $return_string ) ){

					$return_string = $encryption->cipher_method();

			}

			return array( $encryption->ready_to_encrypt(), $return_string );

		}


	}


// https://codex.wordpress.org/Using_Permalinks#Tips_and_Tricks
function zeroBSCRM_checkPrettyPermalinks(){
	if ( get_option('permalink_structure') ) {  
		return true;
	}else{
		return false;
	}
}



/* ======================================================
  / Generic System Check Wrapper/Helper funcs
   ====================================================== */




/* ======================================================
  Jetpack CRM Check Wrapper/Helper funcs
   ====================================================== */
	

	// only used with DAL<3
	// #backward-compatibility
	function zeroBSCRM_checkSystemFeat_autodraftgarbagecollect($withInfo=false){

		#} just returns the date last cleared
		$lastCleared = get_option('zbscptautodraftclear','');

		if (!$withInfo){

			$enabledStr = 'Not yet cleared'; if (!empty($lastCleared)) $enabledStr = 'Cleared '.date(zeroBSCRM_getTimeFormat().' '.zeroBSCRM_getDateFormat(),$lastCleared); 
			return $enabledStr;

		} else {

			$enabled = false; $enabledStr = 'Not yet cleared'; 
			if (!empty($lastCleared)){
				$enabledStr = 'Cleared '.date(zeroBSCRM_getTimeFormat().' '.zeroBSCRM_getDateFormat(),$lastCleared); 
				$enabled = true;
			}
			return array($enabled,$enabledStr);

		}

	}


/* ======================================================
   / ZBS  Check Wrapper/Helper funcs
   ====================================================== */

/* ======================================================
  Specific System Check Wrapper/Helper funcs
   ====================================================== */

	function zeroBSCRM_checkSystemFeat_zlib($withInfo=false){


		if ( !$withInfo )
			
			return class_exists('ZipArchive');

		else {

			$enabled = class_exists('ZipArchive');
			$str = __('zlib is properly enabled on your server.','zero-bs-crm');
			if ( !$enabled ) {

				$str = __('zlib is disabled on your server.','zero-bs-crm');

				// see if fallback pclzip is working
				if ( class_exists('PclZip') ){

					// it's probably all fine
					$enabled = true;
					$str .= ' '.__("But don't worry, as the fallback PclZip appears to work.",'zero-bs-crm');

				}

			}

			return array($enabled,$str);

		}


	}


	/**
	 * 
	 * Verify mb_internal_encoding (required by dompdf)
	 * 
	 */
	function zeroBSCRM_checkSystemFeat_mb_internal_encoding( $withInfo=false ) {
		$enabled = function_exists( 'mb_internal_encoding' );
		if ( !$withInfo ) {
			return $enabled;
		}

		$str = __( 'The mbstring PHP module is properly enabled on your server.', 'zero-bs-crm' );

		if ( !$enabled ) {
			$str = __( 'The mbstring PHP module is disabled on your server, which may prevent PDFs from being generated.', 'zero-bs-crm' );
		}

		return array( $enabled, $str );
	}

/**
 * Check if Dompdf is installed correctly on the server.
 *
 * @param false $with_info Determine if the returning results contains an explanatory string.
 *
 * @return array|bool
 */
function zbscrm_check_system_feat_dompdf( $with_info = false ) {
	$enabled = class_exists( Dompdf\Dompdf::class );

	if ( ! $with_info ) {
		return $enabled;
	}

	if ( ! $enabled ) {
		return array(
			$enabled,
			__( 'PDF Engine is not installed on your server.', 'zero-bs-crm' ),
		);
	}

	try {
		$dompdf  = new \Dompdf\Dompdf();
		$version = $dompdf->version;
	} catch ( \Exception $e ) {
		$version = 'unknown';
	}

	return array(
		$enabled,
		/* translators: %s a version that explain which library is used and what version number it's running. */
		sprintf( __( 'PDF Engine is properly installed on your server (Version: %s).', 'zero-bs-crm' ), $version ),
	);
}

	function zeroBSCRM_checkSystemFeat_pdffonts($withInfo=false){

		// get fonts dir
		$fonts_dir = jpcrm_storage_fonts_dir_path();
		$fonts_installed = file_exists( $fonts_dir . 'fonts-info.txt' );

		if (!$withInfo) {
			return $fonts_installed;
		} else {

			$str = 'PDF fonts appear to be installed on your server.';
			if ( !$fonts_installed ) {
				$str = 'PDF fonts do not appear to be installed on your server.';
			}

			return array($fonts_installed,$str);

		}


	}
	function zeroBSCRM_checkSystemFeat_curl($withInfo=false){


		if (!$withInfo)
			return function_exists('curl_init');
		else {

			$enabled = function_exists('curl_init');
			$str = 'CURL is enabled on your server.';
			if (!$enabled) $str = 'CURL is not enabled on your server.';

			return array($enabled,$str);

		}


	}
	function zeroBSCRM_checkSystemFeat_locale($withInfo=false){


		if (!$withInfo)
			return true;
		else {

			$locale = zeroBSCRM_getLocale();
			$str = 'WordPress Locale is set to <strong>'.$locale.'</strong>';

			$str .= ' (Server: '.zeroBSCRM_locale_getServerLocale().')';

			return array(true,$str);

		}


	}


	function zeroBSCRM_checkSystemFeat_assetdir(){

		$potentialDirObj = zeroBSCRM_privatisedDirCheck();
		if (is_array($potentialDirObj) && isset($potentialDirObj['path'])) 
			$potentialDir = $potentialDirObj['path'];
		else
			$potentialDir = false;

		$enabled = false; 
		$enabledStr = 'Using Default WP Upload Library';

		if (!empty($potentialDir)) {
			$enabled = true;
			$enabledStr = $potentialDir;
		}

		return array($enabled, $enabledStr);
	}
