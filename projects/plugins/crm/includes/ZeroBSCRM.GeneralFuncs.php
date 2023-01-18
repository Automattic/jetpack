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

/**
 * Wrapper for zerobscrm_doing_it_wrong.
 *
 * @since  3.0.0
 * @param  string $function
 * @param  string $version
 * @param  string $replacement
 */
function zerobscrm_doing_it_wrong( $function, $message, $version ) {
	$message .= ' Backtrace: ' . wp_debug_backtrace_summary();

	if ( wp_doing_ajax() ) {
		do_action( 'doing_it_wrong_run', $function, $message, $version );
		error_log( "{$function} was called incorrectly. {$message}. This message was added in version {$version}." );
	} else {
		_doing_it_wrong( $function, $message, $version );
	}
}


/* ======================================================
	Error Log :) 
	===================================================== */
    function zbs_write_log ( $log )  {
   
            if ( is_array( $log ) || is_object( $log ) ) {
                error_log( print_r( $log, true ) );
            } else {
                error_log( $log );
            }
      
    }



/* ======================================================
  Globally useful generic Funcs
  NOTE, this file will eventually dissolve into PROPER LIBS :) 
   ====================================================== */
   

	#} https://wordpress.stackexchange.com/questions/221202/does-something-like-is-rest-exist
	function zeroBSCRM_is_rest() {
		$prefix = rest_get_url_prefix( );
		if (defined('REST_REQUEST') && REST_REQUEST // (#1)
			|| isset($_GET['rest_route']) // (#2)
				&& strpos( trim( $_GET['rest_route'], '\\/' ), $prefix , 0 ) === 0)
			return true;

		// (#3)
		$rest_url = wp_parse_url( site_url( $prefix ) );
		$current_url = wp_parse_url( add_query_arg( array( ) ) );
		return strpos( $current_url['path'], $rest_url['path'], 0 ) === 0;
	}


   // adapted from here https://wordpress.stackexchange.com/questions/15376/how-to-set-default-screen-options
   function zeroBSCRM_unhideMetaBox($postType='',$unhideKey='',$userID=''){

	    // So this can be used without hooking into user_register
	    if ( ! $userID) $userID = get_current_user_id(); 

	    // remove from setting
        $new = array(); $existing = get_user_meta( $userID, 'metaboxhidden_'.$postType, true);
        if (is_array($existing)) {
        	foreach ($existing as $x) if ($x != $unhideKey) $new[] = $x;
        	update_user_meta( $userID, 'metaboxhidden_'.$postType, $new );
        }

   }


   #} Return the admin URL of a slug
   function zeroBSCRM_getAdminURL($slug){
   		$url = admin_url('admin.php?page=' . $slug);
   		return $url;
   }


	function zeroBSCRM_slashOut($str='',$return=false){

		$x = addslashes($str);
		if ($return) return $x;
		echo $x;

	}

	// will strip slashes from a string or recurrsively for all strings in array :) 
	// BE CAREFUL with this one.
	function zeroBSCRM_stripSlashes($obj='',$return=true){

		switch (gettype($obj)){

			case 'string':

				// simple
				$x = stripslashes($obj);
				if ($return) return $x;
				echo $x;

				break;

			case 'array':

				// recursively strip
				$x = zeroBSCRM_stripSlashesFromArr($obj);

				if ($return) return $x;
				// this'll never work? echo $x;

				break;

			default:

				// NON str/arr... should not be using this for them>!
				return $obj;

				break;


		}

	}


	function zeroBSCRM_stripSlashesFromArr($value){
	    $value = is_array($value) ?
	                array_map('zeroBSCRM_stripSlashesFromArr', $value) :
	                stripslashes($value);

	    return $value;
	}


   # from http://wordpress.stackexchange.com/questions/91900/how-to-force-a-404-on-wordpress
	function zeroBSCRM_force_404() {
        status_header( 404 );
        nocache_headers();
        include( get_query_template( '404' ) );
        die();
	}

	// WH not sure why we need this, shuttled off into zeroBSCRM_generateHash which is cleaner.
   	function zeroBSCRM_GenerateHashForPost($postID=-1,$length=20){

   		#} Brutal hash generator, for now
   		if (!empty($postID)){

   			return zeroBSCRM_generateHash($length);

   		}

   		return '';

	}

	// WH centralised, we had zeroBSCRM_GenerateHashForPost - but as moving away from CPT's not sure why
	function zeroBSCRM_generateHash($length=20){

		$genLen = 20; if ($genLen < $length) $genLen = $length;
		$newMD5 = wp_generate_password($genLen, false);

		return substr($newMD5,0,$length-1);

	}

	/*
	* Creates an MD5 hash of $obj, (typically an array)
	* Useful if needing to check for changes without needing the full, potentialy large, array
	*
	* @param $obj - {anything}
	* @return string - md5 of $obj, json encoded and sorted
	*/
	function jpcrm_generate_hash_of_obj( $obj ){

		// note this will return different if sort order different
		return md5( json_encode( $obj ) );
	}

	function zeroBSCRM_loadCountryList(){
	    #} load country list                                   
	    global $zeroBSCRM_countries;
	    if(!isset($zeroBSCRM_countries)) require_once( ZEROBSCRM_INCLUDE_PATH . 'wh.countries.lib.php');

	    return $zeroBSCRM_countries;
	}

	function zeroBSCRM_uniqueID(){
		


		#} When you're wrapping a func in another, and you're guaranteed it'll return a val, can just do this:
		
		$prefix = 'ab33id_';
		##WLREMOVE
		$prefix = 'crmt_';
		##/WLREMOVE
		
		return uniqid($prefix);

	}

	function zeroBSCRM_ifV($v){
		if (isset($v)) echo $v; 
	}

	// if is array and has value v, else
	function zbs_ifAV($a=array(),$v='',$else=false){
		if (is_array($a) && isset($a[$v])) return $a[$v];
		return $else;
	}

	function zbs_prettyprint($array){
		echo '<pre>';
	    var_dump($array);
	    echo '</pre>';
	}


	function zeroBS_delimiterIf($delimiter,$ifStr=''){

		if (!empty($ifStr)) return $delimiter;

		return '';
	}


// BE INCREADIBLY CAREFUL WITH THIS FUNC, it'll recursively delete a directory
// ... safety mechanism put in - if not defined will die :)
function zeroBSCRM_del($dir) { 

   if (!defined('ZBS_OKAY_TO_PROCEED')) exit('CANNOT');
   if (file_exists($dir) && is_dir($dir)){
	   	$files = array_diff(scandir($dir), array('.','..')); 
	    if (is_array($files)) foreach ($files as $file) { 
	      (is_dir("$dir/$file")) ? zeroBSCRM_del("$dir/$file") : unlink("$dir/$file"); 
	    } 
	    return rmdir($dir); 
	}
}

/*
* Removes all files in a directory
*
* @param string $directory_path - path to directory, (inc /)
* @param bool $also_remove_hidden_files - shall we also clear files like .htaccess?
*
*/
function jpcrm_delete_files_from_directory( $directory_path, $also_remove_hidden_files = false ){

	if ( !is_dir( $directory_path ) ){

		return false;

	}

	if ( $also_remove_hidden_files ){

		$files = glob( $directory_path . '{,.}*', GLOB_BRACE);

	} else {

		$files = glob( $directory_path . '*' );

	}

	// cycle through
	foreach( $files as $file ){
	  
	  if ( is_file( $file ) ) {
	    
	    unlink( $file );

	  }

	}
}


function zeroBSCRM_user_last_login( $user_login, $user ) {
    update_user_meta( $user->ID, 'last_login', time() );
}
add_action( 'wp_login', 'zeroBSCRM_user_last_login', 10, 2 );


function zeroBSCRM_currentUser_email() {
    $current_user = wp_get_current_user();
    return $current_user->user_email;
}
function zeroBSCRM_currentUser_displayName() {
    $current_user = wp_get_current_user();
    return $current_user->display_name;
}

/**
 * Retrieve users of a specific wp role
 */
function jpcrm_wordpress_users_with_role( $role = '' ) { 

	// needs role
	if (empty($role)) return array();

	// retreive & return
	$args = array(
	    'role'    => $role,
	    'orderby' => 'user_nicename',
	    'order'   => 'ASC'
	);
	return get_users( $args );

}


/**
 * Retrieve users with one of an array of specific wp roles
 */
function jpcrm_wordpress_users_with_role_in( $roles = array() ) { 

	// needs to be an array of roles
	if ( !is_array($roles) ) return array();

	// retreive & return
	$args = array(
	    'role__in'    => $roles,
	    'orderby' => 'user_nicename',
	    'order'   => 'ASC'
	);
	return get_users( $args );

}

 
/**
 * Display last login time
 *
 */
  
function zeroBSCRM_wpb_lastlogin($uid ) { 
    $last_login = get_user_meta( $uid, 'last_login',true);
    if($last_login == ''){
    	$the_login_date = __("Never","zero-bs-crm");
    }else{
    	$the_login_date = human_time_diff($last_login);
	}
    return $the_login_date; 
} 



	#} Pretty up long numbers
	function zeroBSCRM_prettifyLongInts($i){
		
		if ((int)$i > 999){
			return number_format($i);	
		} else {
			if (zeroBSCRM_numberOfDecimals($i) > 2) return round($i,2); else return $i;	
		}
		
	}

	// Brutal. http://snipplr.com/view/39450/
	function zeroBSCRM_prettyAbbr($size) {
	    $size = preg_replace('/[^0-9]/','',$size);
	    $sizes = array("", "k", "m");
	    if ($size == 0) { return('n/a'); } else {
	    return (round($size/pow(1000, ($i = floor(log($size, 1000)))), 0) . $sizes[$i]); }
	}


	#} how many decimal points?
	function zeroBSCRM_numberOfDecimals($value)
	{
		if ((int)$value == $value)
		{
			return 0;
		}
		else if (! is_numeric($value))
		{
			return false;
		}

		return strlen($value) - strrpos($value, '.') - 1;
	}


	function zeroBSCRM_mtime_float(){
	    list($usec, $sec) = explode(" ", microtime());
	    return ((float)$usec + (float)$sec);
	}     

	#} Does it's best to find the real IP for user
	function zeroBSCRM_getRealIpAddr()
	{
		#} check ip from share internet
		if (isset($_SERVER['HTTP_CLIENT_IP']) && !empty($_SERVER['HTTP_CLIENT_IP']))
		{
			$ip=$_SERVER['HTTP_CLIENT_IP'];
		}
		#} To check ip is pass from proxy
		elseif (isset($_SERVER['HTTP_X_FORWARDED_FOR']) && !empty($_SERVER['HTTP_X_FORWARDED_FOR']))
		{
			$ip=$_SERVER['HTTP_X_FORWARDED_FOR'];
		}
		elseif (isset($_SERVER['REMOTE_ADDR']))
		{
			$ip=$_SERVER['REMOTE_ADDR'];
		}
		return $ip;
	}

	// from https://stackoverflow.com/questions/5800927/how-to-identify-server-ip-address-in-php
	function zeroBSCRM_getServerIP(){

		$ip = false;

		// this method is spoofable/not safe on all hosts
		// non iis
		if (!$ip && isset($_SERVER['SERVER_ADDR']) && !empty($_SERVER['SERVER_ADDR'])) $ip = $_SERVER['SERVER_ADDR'];
		// iis
		if (!$ip && isset($_SERVER['LOCAL_ADDR']) && !empty($_SERVER['LOCAL_ADDR'])) $ip = $_SERVER['LOCAL_ADDR'];


		// this method uses dns
		if (!$ip){
			$host= gethostname();
			$ip = gethostbyname($host);
		}

		return $ip;
	}

	
	// deprecated 4.0.9
	function zeroBSCRM_ip_country()
	{
	
		return '';
		/* 
			$ip = zeroBSCRM_getRealIpAddr(); $ip_data = false;
			$country  = "Unknown";

		    $ip_data_in = wp_remote_get( 'http://www.geoplugin.net/json.gp?ip='.$ip, array(
			    'timeout'     => 15
			    )
			);

			if ( is_wp_error( $ip_data_in ) ) {
			    
			    //$error_message = $response->get_error_message();
			    //echo "Something went wrong: $error_message";

			} else {

			    if (is_array($ip_data_in['body']) && isset($ip_data_in['body']) && is_string($ip_data_in['body'])){
					$ip_data = json_decode($ip_data_in['body'],true);
					$ip_data = str_replace('&quot;', '"', $ip_data); // for PHP 5.2 see stackoverflow.com/questions/3110487/
				}
			}
		
			if (is_array($ip_data) && $ip_data && $ip_data['geoplugin_countryName'] != null) {
				$country = $ip_data['geoplugin_countryName'];
			}
		
			return $country;
		*/
	}


	function zeroBSCRM_findAB($html,$first,$nextStr,$fallbackCloser='</'){

		$f1 = strpos($html,$first);
		$f1end = $f1 + strlen($first);
		if ($f1){
			$f2 = strpos(substr($html,$f1end),$nextStr);
			if (!$f2){
				#use fallback closer to try
				$f2 = strpos(substr($html,$f1end),$fallbackCloser);
			}
			if (!$f2) $f2 = strlen(substr($html,$f1end));
			return substr($html,$f1end,$f2);
		}

		#if nothing returned?
		return '';
	}


	// as clean as zeroBSCRM_retrieveFile was above, we needed to wpify for .org.
	// here's an adaptation of https://wordpress.stackexchange.com/questions/50094/wp-remote-get-downloading-and-saving-files
	function zeroBSCRM_retrieveFile( $url, $filepath, $args = array() ){

		// Use wp_remote_get to fetch the data
		$response = wp_remote_get($url, $args);

		// Save the body part to a variable
		if ( is_array( $response ) && isset( $response['body'] ) ){

			// Now use the standard PHP file functions
			$fp = fopen($filepath, "w");
			fwrite($fp, $response['body']);
			fclose($fp);

	     	return (filesize($filepath) > 0)? true : false;

		} elseif ( get_class( $response ) == 'WP_Error' ) {

			// deal with errors

			// timeout
			// https://wordpress.stackexchange.com/questions/240273/wp-remote-get-keeps-timing-out
			if ( isset( $response->errors['http_request_failed'] ) ){
				
				if ( is_array( $response->errors['http_request_failed'] ) ){

					$match_str = 'cURL error 28: Operation timed out after';

					foreach ( $response->errors['http_request_failed'] as $error ){

						if ( substr( $error, 0, strlen( $match_str ) ) == $match_str ){

							// connection timeout error
							// Add admin notification
							zeroBSCRM_notifyme_insert_notification( get_current_user_id(), -999, -1, 'curl.timeout.error', $error );

							return false;

						}

					}

				}

			}

		}

		return false;

	}

	# http://stackoverflow.com/questions/8889025/unzip-a-file-with-php
	function zeroBSCRM_expandArchive($filepath,$expandTo){

		#} REQUIRES PHP 5.2+ - this should be enabled by default
		#} But because some hosts SUCK we have to check + workaround
		if (zeroBSCRM_checkSystemFeat('zlib')){

			#} All should be okay
			try {

				if (file_exists($filepath) && file_exists($expandTo)){

					$zip = new ZipArchive;
					$res = $zip->open($filepath);
					if ($res === TRUE) {
					  $zip->extractTo($expandTo);
					  $zip->close();
					  return true;
					}

				}

			} catch (Exception $ex){


			}

		} else {

			// No ZipArchive, fallback to WP's included PclZip
			// .. we used to package our own copy of this, but it was flagging as malware. See GH-1011

			// proceed using pclzip
			if ( class_exists('PclZip')){

				try {

					if (file_exists($filepath) && file_exists($expandTo)){

							$archive = new PclZip($filepath);

							if ($archive->extract(PCLZIP_OPT_PATH, $expandTo) == 0) {
							    
							    return false;

							} else {
							    
							    return true;

							}


					}

				} catch (Exception $ex){


				}

			}

		}

		return false;

	}

	/**
	 * Wrapper for WP's built-in get_avatar(), but forces avatar display
	 * whether or not "Show Avatar" WP setting is enabled.
	 * 
	 * Also adds the user display name as the alt if no alt is provided.
	 */
	function jpcrm_get_avatar( $user_id, $size, $default='', $alt='', $args=array() ) {
		if ( empty( $alt) ) {
			$user = get_userdata( $user_id );
			if ($user) {
				$alt = $user->display_name;
			}
		}
		$args['force_display'] = true;
		return get_avatar( $user_id, $size, $default, $alt, $args );
	}


	function zeroBSCRM_getGravatarURLfromEmail($email='',$size=80){

		// https:
		$url = '//www.gravatar.com/avatar/' . md5( $email );
		$url = add_query_arg( array(
			's' => $size,
			'd' => 'mm',
		), $url );
		return esc_url_raw( $url );
	}

	/*
	 * Returns html to render business logo, if one is set in biz info settings
	 */
	function jpcrm_business_logo_img( $max_width = '200px' ) {

		// got url?
		$logo_url = jpcrm_business_logo_url();

        // if default, build html
        if ( !empty( $logo_url ) ){
            return  '<img src="' . esc_url( $logo_url ) . '" alt="' . esc_attr( zeroBSCRM_getSetting( 'businessname' ) ) . '" style="max-width:' . esc_attr( $max_width ) . '" />';
        }

        return '';
	}

	/*
	 * Returns an URL for business logo, if one is set in biz info settings
	 *
	 * For now is semi-redundant, but centralising for later expansion
	 *
	 */
	function jpcrm_business_logo_url(  ) {

		// got url?
		$logo_url = zeroBSCRM_getSetting( 'invoicelogourl' );

        // check default
        if ( !empty( $logo_url ) ){
            return $logo_url;
        }

        return '';
	}

	function zeroBSCRM_prettyformatBytes($size, $precision = 2){
	    $base = log($size, 1024);
	    $suffixes = array('', 'K', 'M', 'G', 'T');   

	    return round(pow(1024, $base - floor($base)), $precision) .''. $suffixes[floor($base)];
	}

	/*
	* 	Split a Camel caps string (e.g. ThisStringBecomes = This String Becomes)
	*/	
	function jpcrm_string_split_at_caps( $str ){

		$parts = preg_split('/(?=[A-Z])/', $str);
		return implode(' ', $parts);

	} 


	// returns send-from email + name
	// code ripped from wp_mail func 12/9/18
	// https://developer.wordpress.org/reference/functions/wp_mail/
	function zeroBSCRM_wp_retrieveSendFrom(){

	    // From email and name
	    // If we don't have a name from the input headers
	    //if ( !isset( $from_name ) )
	        $from_name = 'WordPress';

	    //if ( !isset( $from_email ) ) {
	        // Get the site domain and get rid of www.
	        $sitename = strtolower( $_SERVER['SERVER_NAME'] );
	        if ( substr( $sitename, 0, 4 ) == 'www.' ) {
	            $sitename = substr( $sitename, 4 );
	        }
	 
	        $from_email = 'wordpress@' . $sitename;
	    //}
	    $from_email = apply_filters( 'wp_mail_from', $from_email );

	    return array('name'=>$from_name,'email'=>$from_email);
	}



	#} This'll be true if wl
	function zeroBSCRM_isWL(){

		##WLREMOVE
        return false;
		##/WLREMOVE
		return true;

	}


	// ============= TELEMETRY SECTION


	// https://wordpress.stackexchange.com/questions/52144/what-wordpress-api-function-lists-active-inactive-plugins
	function zeroBSCRM_allPluginListSimple() {
    	$plugins = get_plugins();
    	$p = array();
        if (count($plugins) > 0) {
        	foreach ( $plugins as $plugin ) {

        		$p[] = array('n' => $plugin['Name'],'v' => $plugin['Version']);

        	}
        } 

        return $p;
    }

    // this ver gets ONLY active
    function zeroBSCRM_activePluginListSimple(){
    	$pluginsActive = get_option('active_plugins');
    	$plugins = get_plugins();
    	$p = array();
        if (count($plugins) > 0) {
        	foreach ( $plugins as $pluginKey => $plugin ) {

        		if (in_array($pluginKey,$pluginsActive)) $p[] = array('n' => $plugin['Name'],'v' => $plugin['Version']);

        	}
        } 
        
        return $p;
    }

	// ============= / TELEMETRY SECTION


	#} ZBS JSONP decode
	// https://stackoverflow.com/questions/5081557/extract-jsonp-resultset-in-php
	function zeroBSCRM_jsonp_decode($jsonp, $assoc = false) { // PHP 5.3 adds depth as third parameter to json_decode
	    if($jsonp[0] !== '[' && $jsonp[0] !== '{') { // we have JSONP
	       $jsonp = substr($jsonp, strpos($jsonp, '('));
	    }
	    return json_decode(trim($jsonp,'();'), $assoc);
	}

	// used by DAL2 settings 
	// https://stackoverflow.com/questions/6041741/fastest-way-to-check-if-a-string-is-json-in-php
	function zeroBSCRM_isJson($str) {
	    $json = json_decode($str);
	    return $json && $str != $json;
	}

	// return placeholder img :) DAL2 friendly
	function zeroBSCRM_getDefaultContactAvatar(){

		// hmm - how to pass an img here? when using <i class="child icon"></i> for html
		// for now made a quick png
		return plugins_url('/i/default-contact.png',ZBS_ROOTFILE);

	}

	// return logo
	function jpcrm_get_logo( $stacked=true, $color='black' ){
		$logo_url = plugins_url( '/i/icon-32.png', ZBS_ROOTFILE );
		##WLREMOVE
		$logo_url = plugins_url( '/i/jpcrm-logo-'.($stacked?'stacked':'horizontal').'-'.$color.'.png', ZBS_ROOTFILE );
		##/WLREMOVE
		return $logo_url;

	}

	// return placeholder img :) DAL2 friendly
	function zeroBSCRM_getDefaultContactAvatarHTML(){

		return '<i class="child icon zbs-default-avatar"></i>';

	}

	// https://stackoverflow.com/questions/2524680/check-whether-the-string-is-a-unix-timestamp
	function zeroBSCRM_isValidTimeStamp($timestamp){
	    return ((string) (int) $timestamp === $timestamp) 
	        && ($timestamp <= PHP_INT_MAX)
	        && ($timestamp >= ~PHP_INT_MAX);
	}

	// for use with export as per:
	// because of SYLK bug in excel, we have to wrap these in "" - but fputcsv doesnt do it :/
	// https://www.alunr.com/excel-csv-import-returns-an-sylk-file-format-error/
	// https://stackoverflow.com/questions/2489553/forcing-fputcsv-to-use-enclosure-for-all-fields
	function zeroBSCRM_encloseArrItems($arr=array(),$encloseWith='"'){

		$endArr = $arr;

		if (is_array($arr)){

			$endArr = array();
			foreach ($arr as $k => $v){
				$endArr[$k] = $encloseWith.$v.$encloseWith;
			}

		}

		return $endArr;
	}


	// recursive utf8-ing 
	// https://stackoverflow.com/questions/19361282/why-would-json-encode-return-an-empty-string
	function zeroBSCRM_utf8ize($d) {
	    if (is_array($d)) {
	        foreach ($d as $k => $v) {
	            $d[$k] = zeroBSCRM_utf8ize($v);
	        }
	    } else if (is_string ($d)) {
	        return utf8_encode($d);
	    }
	    return $d;
	}


	// returns a filetype img if avail
	// returns 48px from  https://github.com/redbooth/free-file-icons
	// ... cpp has fullsize 512px variants, but NOT to be added to core, adds bloat
	function zeroBSCRM_fileTypeImg($fileExtension=''){

		$fileExtension = sanitize_text_field( $fileExtension );
		if (!empty($fileExtension) && file_exists(ZEROBSCRM_PATH.'i/filetypes/'.$fileExtension.'.png')) return ZEROBSCRM_URL.'i/filetypes/'.$fileExtension.'.png';

		return ZEROBSCRM_URL.'i/filetypes/_blank.png';

	}

	// https://stackoverflow.com/questions/3797239/insert-new-item-in-array-on-any-position-in-php
	/**
	 * @param array      $array
	 * @param int|string $position
	 * @param mixed      $insert
	 */
	function zeroBSCRM_array_insert(&$array, $position, $insert)
	{
	    if (is_int($position)) {
	        array_splice($array, $position, 0, $insert);
	    } else {
	        $pos   = array_search($position, array_keys($array));
	        $array = array_merge(
	            array_slice($array, 0, $pos),
	            $insert,
	            array_slice($array, $pos)
	        );
	    }
	}

	// WH ver of zeroBSCRM_array_insert, specifically used for messing with menu arrs (used mc2)
	function zeroBSCRM_array_insert_ifset(&$array, $position, $insert){

		// check for $position legitimacy
	    if (is_int($position)) {

	    	if (count($array) > $position) 
	    		return zeroBSCRM_array_insert($array,$position,$insert);
	    	else {
	    		// just add
	    		$array = array_merge($array,$insert);
	    		return $array;
	    	}


	    } else if (is_array($position)){

	    	// array - checks for subvalues to find position
	    	/* 

	    		e.g. in this:


						Array
						(
						    [0] => Array
						        (
						            [0] => Jetpack CRM
						            [1] => zbs_dash
						            [2] => zerobscrm-dash
						            [3] => Jetpack CRM User Dash
						        )

						    [1] => Array
						        (
						            [0] => Contacts
						            [1] => admin_zerobs_view_customers
						            [2] => manage-customers
						            [3] => Contacts
						        )

						    [2] => Array
						        (
						            [0] => Quotes
						            [1] => admin_zerobs_view_quotes
						            [2] => manage-quotes
						            [3] => Quotes
						        )

				... if you passed $position as:

					array('1'=>'admin_zerobs_view_customers')

				... it'd insert before [1]

			*/


	    	// brutal
	    	$endPos = -1; $i = 0;
	    	foreach ($array as $a){
	    		// match position?
	    		foreach ($position as $k => $v){
	    			if ($a[$k] == $v){

	    				// has an attr matching position
	    				$endPos = $i;
	    			}
	    		}

	    		$i++;
	    	}

	    	// should now have pos
	    	if ($endPos > -1){

		    	// probs str, fallback to 
		    	return zeroBSCRM_array_insert($array,$endPos,$insert);


	    	} else {

	    		// append
	    		$array = array_merge($array,$insert);
	    		return $array;

	    	}

	    } else {

	    	// probs str, fallback to 
	    	return zeroBSCRM_array_insert($array,$position,$insert);

	    }

	}

	// simplistic directory empty check
	function zeroBSCRM_is_dir_empty($dir) {
	  if (!is_readable($dir)) return null; 
	  $handle = opendir($dir);
	  while (false !== ($entry = readdir($handle))) {
	    if ($entry !== '.' && $entry !== '..') {
	      closedir($handle);
	      return false;
	    }
	  }
	  closedir($handle);
	  return true;
	}

	/**
	 * Copyright © 2020 Theodore R. Smith <https://www.phpexperts.pro/>
	 * License: MIT
	 *
	 * @see https://stackoverflow.com/a/61168906/430062
	 *
	 * @param string $path
	 * @param bool   $recursive Default: false
	 * @param array  $filtered  Default: [., ..]
	 * @return array
	 */
	function jpcrm_get_directories($path, $recursive = false, array $filtered = []){
	    if (!is_dir($path)) {
	        throw new RuntimeException("$path does not exist.");
	    }

	    $filtered += ['.', '..'];

	    $dirs = [];
	    $d = dir($path);
	    while (($entry = $d->read()) !== false) {
	        if (is_dir("$path/$entry") && !in_array($entry, $filtered)) {
	            $dirs[] = $entry;

	            if ($recursive) {
	                $newDirs = getDirs("$path/$entry");
	                foreach ($newDirs as $newDir) {
	                    $dirs[] = "$entry/$newDir";
	                }
	            }
	        }
	    }

	    return $dirs;
	}


    /**
     * Takes an URL string and returns any $_GET parameters as an array
     */
	function jpcrm_url_get_params( $url = '' ){

        $components = parse_url($url);
        if ( isset( $components['query'] ) ){

	        parse_str($components['query'], $results);
	        return $results;
	     
	    }

	    return false;

	}
	

    /**
     * Returns bool whether or not an url has params
     */
	function jpcrm_url_has_params( $url = '' ){

        $components = parse_url($url);
        if ( isset( $components['query'] ) ){
	     
	        parse_str($components['query'], $results);
	     
	        if ( count( $results ) > 0 ){
	        	
	        	return true;

	        }
	    }

	    return false;

	}


	/*
	 * This is adapted from https://github.com/dompdf/dompdf/blob/master/src/Options.php#L1147-L1159
	 * ... to allow us to filter out non-site-url image injections
	 */
	function jpcrm_dompdf_assist_validate_remote_uri( string $uri ){

	    if ($uri === null || strlen($uri) === 0) {

	        return [false, "The URI must not be empty."];

	    }

	    /*
	    if ( !$this->isRemoteEnabled ) {

	        return [false, "Remote file requested, but remote file download is disabled."];

	    }
	    */

	    if ( !jpcrm_url_appears_to_match_site( $uri ) ){

	        return [false, "Remote file requested, but remote file download is disabled."];

	    }


	    return [true, null];
	}


/* ======================================================
  / Globally useful generic Funcs
   ====================================================== */

/* ======================================================
  unsub creation stuff - can't go in other as that's optionally included,
  // migrations sometimes need to use pre-inclusion, so here for now #notidealbutokay
   ====================================================== */
// this is fired by a migration, and checked on deactivate ext
function zeroBSCRM_unsub_checkCreatePage(){

	global $zbs;

	//check if the page exists, if not create and call it clients
	$pageID = zeroBSCRM_mail_getUnsubscribePage();

	if (empty($pageID) || $pageID < 1){

		// wh added to stop weird multi-fires (moving to migration fixed, but this is double protection)
		if (!defined('ZBS_UNSUB_PAGE_MADE')){


			//then we do not have a page for the client portal, create one, with slug clients and set as page
			//this should handle any backwards compatibility and not lose the URLs created
			$args = array(
				'post_name' => 'unsubscribe',
				'post_status' => 'publish',
				'post_title' => __('Unsubscribed','zero-bs-crm'),
				'post_content' => '[jetpackcrm_unsubscribe]',
				'post_type'	=> 'page'
			);

			$pageID = wp_insert_post($args);
			$zbs->settings->update('unsubpage', $pageID);
			define('ZBS_UNSUB_PAGE_MADE',1);

			return $pageID;

		}

	} else return $pageID;

	return -1;
}
// returns an active page id or -1
function zeroBSCRM_mail_getUnsubscribePage(){

		// what settings says it is
		$pageID = (int)zeroBSCRM_getSetting('unsubpage');

		// is page live?
		if (!empty($pageID) || $pageID > 0) {

			$pageStatus = get_post_status($pageID);
			// page is trashed or smt, recreate
			if ($pageStatus !== 'publish') $pageID = -1;

		} else $pageID = -1;

		return $pageID;
}
/* ======================================================
  / unsub creation stuff
   ====================================================== */


/* ======================================================
  Portal creation stuff - can't go in .Portal.php as that's optionally included,
  // migrations sometimes need to use pre-inclusion, so here for now #notidealbutokay
   ====================================================== */
// this is fired by a migration, and checked on deactivate ext
function zeroBSCRM_portal_checkCreatePage(){

	global $zbs;

	//check if the page exists, if not create and call it clients
	$portalPage = zeroBSCRM_portal_getPortalPage();

	if (empty($portalPage) || $portalPage < 1){

		// wh added to stop weird multi-fires (moving to migration fixed, but this is double protection)
		if (!defined('ZBS_PORTAL_PAGE_MADE')){


			//then we do not have a page for the client portal, create one, with slug clients and set as page
			//this should handle any backwards compatibility and not lose the URLs created
			$args = array(
				'post_name' => 'clients',
				'post_status' => 'publish',
				'post_title' => __('Client Portal','zero-bs-crm'),
				'post_content' => '[jetpackcrm_clientportal]',
				'post_type'	=> 'page'
			);

			$portalID = wp_insert_post($args);
			$zbs->settings->update('portalpage', $portalID);
			define('ZBS_PORTAL_PAGE_MADE',1);

			return $portalID;

		}

	} else return $portalPage;

	return -1;
}

// returns an active page id or -1
function zeroBSCRM_portal_getPortalPage(){

		// what settings says it is
		$portalPage = (int)zeroBSCRM_getSetting('portalpage');

		// is page live?
		if (!empty($portalPage) || $portalPage > 0) {

			$pageStatus = get_post_status($portalPage);
			// page is trashed or smt, recreate
			if ($pageStatus !== 'publish') $portalPage = -1;

		} else $portalPage = -1;

		return $portalPage;
}
/* ======================================================
  / Portal creation stuff
   ====================================================== */



/* ======================================================
   Link Helpers
   ====================================================== */
// produces a portal based link to a potentially-hashed obj (inv/quo as of v3.0)
function zeroBSCRM_portal_linkObj( $obj_id = -1, $type_int = ZBS_TYPE_INVOICE ) {
	global $zbs;

	$use_hash        = zeroBSCRM_getSetting( 'easyaccesslinks' );
	$portal_base_url = zeroBS_portal_link();
	// The separator for values in invoices and quotes should be '=' when plain permalinks are being used
	$url_separator   = ( strpos( $portal_base_url, '?' ) === false ) ? '/' : '=';
                
	switch ( $type_int ) {
		case ZBS_TYPE_INVOICE:
			$settings          = zeroBSCRM_get_invoice_settings();
			$invoices_endpoint = $zbs->modules->portal->get_endpoint( ZBS_TYPE_INVOICE );
			// if invoice hashes this will be a hash URL, otherwise the invoice ID
			if ( $use_hash == '1' ) {
				$hash = $zbs->DAL->invoices->getInvoiceHash( $obj_id );
				if ( ! empty( $hash ) ) {
					return esc_url( $portal_base_url .  $invoices_endpoint .  $url_separator .'zh-' . $hash );
				}
			}
			return esc_url( $portal_base_url . $invoices_endpoint . $url_separator . $obj_id );
		break;

		case ZBS_TYPE_QUOTE:
			// get quotes stem	
			$quotes_endpoint   = $zbs->modules->portal->get_endpoint( ZBS_TYPE_QUOTE );
			// got hash?
			if ( $use_hash == "1" ) {
				$hash = $zbs->DAL->quotes->getQuoteHash($obj_id);
				if ( ! empty( $hash ) ) {
					return esc_url( $portal_base_url .  $quotes_endpoint . $url_separator . 'zh-' . $hash );
				}
			}

			// otherwise just id
			return esc_url( $portal_base_url .  $quotes_endpoint .  $url_separator . $obj_id );
		break;
	}
}

function jpcrm_get_portal_slug() {
	$portal_page_id   = zeroBSCRM_getSetting( 'portalpage' );
	$portal_post      = get_post( $portal_page_id );
	$portal_permalink = rtrim( _get_page_link( $portal_post ), '/' );
	$portal_slug      = str_replace( home_url(), "", $portal_permalink);
	
	if ( empty( $portal_slug ) ) {
		$portal_slug = 'clients';
	}

	return $portal_slug;
}

function jpcrm_get_client_portal_root_url() {
	$client_portal_root_url  = home_url( jpcrm_get_portal_slug() );
	// The url separator should be '&' when plain permalinks are being used
	$client_portal_root_url .= ( strpos( $client_portal_root_url, '?' ) === false ) ? '/' : '&';

	return $client_portal_root_url;
}

function zeroBS_portal_link($type='dash',$objIDorHashStr=-1){
	$portalPage = zeroBSCRM_getSetting('portalpage');
	$portalLink = jpcrm_get_client_portal_root_url();
	$portalSlug = jpcrm_get_portal_slug();

	switch ( $type ) {

		case 'dash':
		case 'dashboard':
		case '':
			return $portalLink;
			break;

		default:

			// catch generic e.g. quotes invoices 
			
			$stem = $type; //'quotes';

			// if cpp, use that stem
			if (function_exists('zeroBSCRM_clientPortalgetEndpoint')) $stem = zeroBSCRM_clientPortalgetEndpoint($stem);

			// if using a str (hash) then prefix with zh- if not already
			if (is_string($objIDorHashStr)){
				if (substr($objIDorHashStr, 0,3) != 'zh-') $objIDorHashStr = 'zh-'.$objIDorHashStr;
			}

			if (
				(!is_string($objIDorHashStr) && ($objIDorHashStr == -1 || $objIDorHashStr <= 0)) // is false ID
				||
				(is_string($objIDorHashStr) && empty($objIDorHashStr)) // is empty hash str
				)
				return home_url('/'.$portalSlug.'/'.$stem.'/');
			else
				return home_url('/'.$portalSlug.'/'.$stem.'/'.$objIDorHashStr);
			break;


	}

	return home_url('/#notfound');
}

/* ======================================================
  / Link Helpers
   ====================================================== */


/* ======================================================
     General WP Helpers
   ====================================================== */

/*
 * Compares the version of WordPress running to the $version specified.
 *
 * @param string $operator
 * @param string $version
 * @returns boolean
 */
function jpcrm_wordpress_version( $operator = '>', $version = '4.0' ) {
	global $wp_version;
	return version_compare( $wp_version, $version, $operator );
}

/* ======================================================
   / General WP Helpers
   ====================================================== */



/* ======================================================
     Security Helpers
   ====================================================== */

/**
 * Adds .htaccess and index.html files to directory
 * Used to block access to those which we don't want externally accessible
 * If the directory does not exist, creates it
 * 
 * Adapted from Woo's ReportCSVExporter->maybe_create_directory() 
 * https://github.com/Automattic/woocommerce-admin/pull/6/files#diff-93130caa7eb757181d642767bfcd229f7e1124d0348d05f8db48f432df44fb62R70
 *
 * @param $directory_path - full path to directory
 * @param $include_htaccess - whether or not to include said file
 *
 * @return boolean - success/exists or fail
 */
function jpcrm_create_and_secure_dir_from_external_access( $directory_path = '', $include_htaccess = true ) {

	$safe = true;

	// Creates the directory if it doesn't exist
	if ( ! is_dir( $directory_path ) ) {
		// Attempt to create
		mkdir( $directory_path, 0755, true );
		// Force perms
		chmod( $directory_path, 0755 );
	}

	$files = array(
		array(
			'base'    => $directory_path,
			'file'    => 'index.html',
			'content' => '<!--nope-->',
		),
	);

	if ( $include_htaccess ) {
		$files[] = array(
			'base'    => $directory_path,
			'file'    => '.htaccess',
			'content' => 'DirectoryIndex index.php index.html' . PHP_EOL . 'deny from all',
		);
	}

	foreach ( $files as $file ) {

		if ( ! file_exists( trailingslashit( $file['base'] ) ) ) {
			wp_mkdir_p( $file['base'] );
		}

		if ( ! file_exists( trailingslashit( $file['base'] ) . $file['file'] ) ) {

			$file_handle = fopen( trailingslashit( $file['base'] ) . $file['file'], 'wb' ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged, WordPress.WP.AlternativeFunctions.file_system_read_fopen
			if ( $file_handle ) {
				fwrite( $file_handle, $file['content'] ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fwrite
				fclose( $file_handle ); // phpcs:ignore WordPress.WP.AlternativeFunctions.file_system_read_fclose
			}

			if ( ! file_exists( trailingslashit( $file['base'] ) . $file['file'] ) ){

				// failed to create file
				$safe = false;
				
			}

		}

	}

	return $safe;

}

/* ======================================================
   / Security Helpers
   ====================================================== */

/* ======================================================
     Dashboard Helpers
   ====================================================== */
/*
* Returns arrays of zeros (for dashboard graph prep)
*/
function jetpackcrm_create_zeros_array($start, $end, $zbs_steps = 86400){
	$filled_zeros_y = array();
	$filled_zeros_m = array();
	$filled_zeros_w = array();
	$filled_zeros_d = array();

	$the_day = $start;
	while($the_day <= $end){
		$the_year= date("Y", $the_day);
		$filled_zeros_y[$the_year] = 0;

		$the_month = date("M y", $the_day);
		$filled_zeros_m[$the_month] = 0;

		$the_week = date("W Y", $the_day);
		$filled_zeros_w[$the_week] = 0;

		$the_day_d = date("d M y", $the_day);
		$filled_zeros_d[$the_day_d] = 0;

		$the_day += $zbs_steps;
	}

	$filled_zeros['year'] = $filled_zeros_y;
	$filled_zeros['month'] = $filled_zeros_m;
	$filled_zeros['week'] = $filled_zeros_w;
	$filled_zeros['day'] = $filled_zeros_d;

	return $filled_zeros;
}

/* ======================================================
   / Dashboard Helpers
   ====================================================== */


/* ======================================================
     YouTube Helpers
   ====================================================== */

/*
 * Returns a YouTube thumbnail URL of a video
 *
 * @param string $video_url e.g. https://www.youtube.com/watch?v=2KDy-a2wC8w
 * @param string $quality (sd|mq|hq|maxres)
 * @returns string|boolean
 */
function jpcrm_youtube_url_to_thumbnail_url( $video_url, $quality = 'mq' ){

	$video_id = jpcrm_youtube_url_to_video_id( $video_url );

	if ( !empty( $video_id ) ){

		return 'http://img.youtube.com/vi/' . $video_id . '/' . $quality . 'default.jpg';
	}

	return false;

}


/*
 * Returns a YouTube video ID of a video
 *
 * @param string $video_url e.g. https://www.youtube.com/watch?v=2KDy-a2wC8w
 * @returns string|boolean
 */
function jpcrm_youtube_url_to_video_id( $video_url ) {

    $video_id = explode( "?v=", $video_url );
    if ( !isset( $video_id[1] ) ) {
        $video_id = explode( "youtu.be/", $video_url );
    }
    if ( empty($video_id[1]) ) {
    	$video_id = explode("/v/", $video_url);
    }
    if ( is_array( $video_id ) ){
	    $video_id = explode( "&", $video_id[1] );
	    $youtube_video_id = $video_id[0];
	    if ( !empty( $youtube_video_id ) ) {
	        return $youtube_video_id;
	    }
	}

    return false;

}

/* ======================================================
   / YouTube Helpers
   ====================================================== */