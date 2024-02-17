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
  Data Processing Functions
   ====================================================== */

    // Ensures storage and return as UTF8 without slashes
    function zeroBSCRM_textProcess($string=''){
      return htmlentities(stripslashes($string),ENT_QUOTES,'UTF-8');
    } 
    function zeroBSCRM_textExpose($string=''){
      return html_entity_decode($string,ENT_QUOTES,'UTF-8');
    } 

    // hitting this issue
    // https://core.trac.wordpress.org/ticket/43087
    // + 
    // https://core.trac.wordpress.org/ticket/32315#comment:43
    // (pasted emoji's in inputs (log text) would cause a silent wpdb error)
    // so for now, passing any emoji-ridden text through here:
    function zeroBSCRM_preDBStr($string=''){

        // encode emoji's - https://core.trac.wordpress.org/ticket/43087
        return wp_encode_emoji($string);

    }

    // strips all except <br />
    function zeroBSCRM_stripExceptLineBreaks($string=''){

        // simplistic switchout. can surely be done more elegantly
        $brs = array('<br />','<br>','<br/>','<BR />','<BR>','<BR/>');
        $str = str_replace($brs,'###BR###',$string);
        $str = wp_strip_all_tags($str,1);
        $str = str_replace('###BR###','<br />',$str);

        return $str;
    }

    /*
     * sanitize_text_field, but allows whitespace through :roll-eyes:
     * https://developer.wordpress.org/reference/functions/sanitize_text_field/
     */
    function jpcrm_sanitize_text_field_allow_whitespace( $string = '' ){

        $string = str_replace( ' ', '**WHITESPACE**', $string );
        $string = sanitize_text_field( $string );
        return str_replace( '**WHITESPACE**', ' ', $string );

    }

    // lol https://stackoverflow.com/questions/6063184/how-to-strip-all-characters-except-for-alphanumeric-and-underscore-and-dash
    function zeroBSCRM_strings_stripNonAlphaNumeric_dash($str=''){
        return preg_replace("/[^a-z0-9_\-\s]+/i", "", $str);
    }

    // https://stackoverflow.com/questions/33993461/php-remove-all-non-numeric-characters-from-a-string
    function zeroBSCRM_strings_stripNonNumeric($str=''){
        return preg_replace("/[^0-9]/", "", $str);
    }

/* ======================================================
  / Data Processing Functions
   ====================================================== */




/* ======================================================
  Data Validation Functions
   ====================================================== */

    /*
     * Taking a variable, this function checks if it could be an int
     * (returns true if is an int or a string which could be an int)
     .. with a little help from my friends: https://stackoverflow.com/questions/2012187/how-to-check-that-a-string-is-an-int-but-not-a-double-etc
     */
    function jpcrm_is_int( $var = false ){

        // straight check
        if ( is_int($var) ) return true;

        // string check
        if ( is_string($var) ){

            // catch negative
		if ( str_starts_with( $var, '-' ) ) {

                // use ctype where available
                if ( function_exists('ctype_digit') ){
                    return ctype_digit( substr($var, 1) );
                } else {
                    return is_numeric( $var );
                }
		}

            // use ctype_digit where available to check the string only contains digits
            if ( function_exists('ctype_digit') ){
                return ctype_digit( $var );
            } else {
                return is_numeric( $var );
            }

        }

        return false;

    }

/**
 * Checks if a given string is a URL
 *
 * @param string  $s Potential URL string.
 * @param boolean $do_tld_check use TLD check instead of regex to confirm if it is a valid URL.
 *
 * @return boolean
 */
function jpcrm_is_url( $s, $do_tld_check = false ) {
	if ( $do_tld_check ) {
		return jpcrm_has_valid_tld( $s );
	}
	return preg_match( '/^(https?:\/\/|www\.)\w+(\.\w+)*?(\/[^\s]*)?$/', $s );
}

/**
 * Checks if host of a given URL is using a whitelisted TLD
 *
 * @param string $s URL string.
 * @param array  $valid_tlds List of approved TLDs.
 *
 * @return boolean
 */
function jpcrm_has_valid_tld( $s, $valid_tlds = array( '.com', '.net', '.org', '.edu', '.gov', '.co.uk' ) ) {
	$host = wp_parse_url( jpcrm_url_with_scheme( $s ), PHP_URL_HOST );
	if ( ! $host ) {
		return false;
	}
	foreach ( $valid_tlds as $tld ) {
		if ( str_ends_with( $host, $tld ) ) {
			return true;
		}
	}
	return false;
}

   /*
    * adds a scheme to a URL string if it doesn't exist
    *
    * @param str $s as a URL string
    * @param str $scheme as an optional default scheme
    *
    * return scheme + str
    */
    //adapted from https://stackoverflow.com/a/14701491
    function jpcrm_url_with_scheme($s, $scheme='https') {
      return parse_url($s, PHP_URL_SCHEME) === null ? $scheme . '://' . ltrim($s,'/') : $s;
    }

	#} Checks an email addr
	function zeroBSCRM_validateEmail($emailAddr){

		if (filter_var($emailAddr, FILTER_VALIDATE_EMAIL)) return true;

		return false;

	}

    function zeroBSCRM_dataIO_postedArrayOfInts($array=false){

        $ret = array(); if (is_array($array)) $ret = $array; 

        // sanitize
        $ret = array_map( 'sanitize_text_field', $ret );
        $ret = array_map( 'intval', $ret );

        return $ret;
    }

    /*
     * Checks file path doesn't use unsafe/undesirable protocols
     */
    function jpcrm_dataIO_file_path_seems_unsafe( $file_path_string ){

	// this one is important enough to be hard typed here #gh-2501
	if ( str_contains( $file_path_string, 'phar' ) ) {
		return true;
	}

	// these we block with their full string (unless we find a reason to open them up)
	$blocked_protocols = array( 'file', 'http', 'ftp', 'php', 'zlib', 'data', 'glob', 'ssh2', 'rar', 'ogg', 'expect' );
	foreach ( $blocked_protocols as $protocol ) {

		if ( str_contains( $file_path_string, $protocol . '://' ) ) {
			return true;
		}
	}
	// this is only as accurate as what we know here and now (!)
	return false;
}

/**
 * A check which does its best to ensure a URI is an url with the same root as existing site
 *
 * @param string $url_string A URL string.
 * @param string $site_path  The site path if applicable.
 */
function jpcrm_url_appears_to_match_site( $url_string, $site_path = '' ) {
	$this_site_url = site_url( $site_path );
	if ( str_starts_with( $url_string, $this_site_url ) ) {
		return true;
	}
	return false;
}

/* ======================================================
  / Data Validation Functions
   ====================================================== */


/* ======================================================
  Data Validation Functions: Segments
   ====================================================== */

// filters out segment conditions (From anything passed) which are not 'safe' 
// e.g. on our zeroBSCRM_segments_availableConditions() list
// ACCEPTS a POST arr
// $processCharacters dictates whether or not to pass strings through zeroBSCRM_textProcess
// ... only do so pre-save, not pre "preview" because this html encodes special chars.
   // note $processCharacters now legacy/defunct.
function zeroBSCRM_segments_filterConditions($conditions=array(),$processCharacters=true){

    if (is_array($conditions) && count($conditions) > 0){

        $approvedConditions = array();

        $availableConditions = zeroBSCRM_segments_availableConditions();
        $availableConditionOperators = zeroBSCRM_segments_availableConditionOperators();

        foreach ($conditions as $c){

            // has proper props
            if (isset($c['type']) && isset($c['operator']) && isset($c['value'])){

                // retrieve val
                $val = $c['value'];
                if ($processCharacters) $val = zeroBSCRM_textProcess($val); // only pre-saving
                $val = sanitize_text_field( $val );

                // conversions (e.g. date to uts)
                $val = zeroBSCRM_segments_typeConversions($val,$c['type'],$c['operator'],'in');

                // okay. (passing only expected + validated)
                $addition = array(

                    'type' => $c['type'],
                    'operator' => $c['operator'],
                    'value' => $val

                );

                // ranges:

                    // int/floatval
                    if (isset($c['value2'])){

                        // retrieve val2
                        $val2 = $c['value2'];
                        if ($processCharacters) $val2 = zeroBSCRM_textProcess($val2); // only pre-saving
                        $val2 = sanitize_text_field( $val2 );

                        $addition['value2'] = $val2;

                    }

                    // daterange || datetimerange
                    if (
                            (
                                $c['operator'] == 'daterange' 
                                ||
                                $c['operator'] == 'datetimerange'
                            )
                            && !empty( $val )
                        ){

                        // hmmm what if peeps use ' - ' in their date formats? This won't work if they do!
					if ( str_contains( $val, ' - ' ) ) {

						$dates = explode( ' - ', $val );
						if ( count( $dates ) === 2 ) {

								$local_date_time = new DateTime( $dates[0], wp_timezone() );
								$local_date_time->setTimezone( new DateTimeZone( 'UTC' ) );
								$value = $local_date_time->format( 'Y-m-d H:i' );

								$local_date_time_2 = new DateTime( $dates[1], wp_timezone() );
								$local_date_time_2->setTimezone( new DateTimeZone( 'UTC' ) );
								$value_2 = $local_date_time_2->format( 'Y-m-d H:i' );
								// Set the converted dates to UTC.
								$addition['value']  = zeroBSCRM_locale_dateToUTS( $value );
								$addition['value2'] = zeroBSCRM_locale_dateToUTS( $value_2 );
                            }

                        }

                    }

                // if intrange force it
                if ($c['type'] == 'intrange' && !isset($addition['value2'])) $addition['value2'] = 0;

                $approvedConditions[] = $addition;

            }


        }

        return $approvedConditions;

    }

    return array();


}

// uses zeroBSCRM_textExpose to make query-ready strings, 
// .. because conditions are saved in encoded format, e.g. é = &eacute;
function zeroBSCRM_segments_unencodeConditions($conditions=array()){

    if (is_array($conditions) && count($conditions) > 0){

        $ret = array();

        foreach ($conditions as $c){

            // for now it's just value we're concerned with
            $nC = $c;
            if (isset($nC['value'])) $nC['value'] = zeroBSCRM_textExpose($nC['value']);
            if (isset($nC['value2'])) $nC['value2'] = zeroBSCRM_textExpose($nC['value2']);

            // simple.
            $ret[] = $nC;

        }

        return $ret;

    }

    return array();
}
/* ======================================================
  / Data Validation Functions: Segments
   ====================================================== */
