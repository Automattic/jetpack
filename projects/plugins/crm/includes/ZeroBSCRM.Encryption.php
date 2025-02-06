<?php
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 */

/* 
    DEPRECATED - The following should be left in place for migrations to 5.3
    Thereafter all encryption should go through class-encryption.php class
*/



define( 'ZBS_ENCRYPTION_METHOD', "AES-256-CBC" );

 // NOTE - NOT GOOD for hard encryption, for now used basically
 // https://gist.github.com/joashp/a1ae9cb30fa533f4ad94
function zeroBSCRM_encryption_unsafe_process( $action, $string, $key, $iv, $hide_deprecation = false ) {

    if ( !$hide_deprecation ) zeroBSCRM_DEPRECATEDMSG('CRM Function Deprecated in v5.3: zeroBSCRM_encryption_unsafe_process');

    $output = false;
    $encrypt_method = ZBS_ENCRYPTION_METHOD;

    // catch cases where IV length is wrong
    // openssl truncates already, but this catches it before logging
    $max_iv_length = openssl_cipher_iv_length( ZBS_ENCRYPTION_METHOD );
    if ( strlen( $iv ) > $max_iv_length ) {
        $iv = substr( $iv, $max_iv_length );
    }

    if ( $action == 'encrypt' ) {
        $output = openssl_encrypt($string, $encrypt_method, $key, 0, $iv);
    } else if( $action == 'decrypt' ) {
        $output = openssl_decrypt( $string, $encrypt_method, $key, 0, $iv);
    }
    return $output;
}

function zeroBSCRM_get_iv( $hide_deprecation = false ) {

    if ( !$hide_deprecation ) zeroBSCRM_DEPRECATEDMSG('CRM Function Deprecated in v5.3: zeroBSCRM_get_iv');

	static $iv = null;
	if ( null === $iv ) {
		$iv = pack( 'C*', ...array_slice( unpack( 'C*', AUTH_KEY ), 0,  openssl_cipher_iv_length( ZBS_ENCRYPTION_METHOD ) ) );
	}
	return $iv;
}

function zeroBSCRM_encrypt( $string, $key, $hide_deprecation = false  ){

    if ( !$hide_deprecation ) zeroBSCRM_DEPRECATEDMSG('CRM Function Deprecated in v5.3: zeroBSCRM_encrypt');

	return zeroBSCRM_encryption_unsafe_process( 'encrypt', $string, $key, zeroBSCRM_get_iv() );

}

function zeroBSCRM_decrypt( $string, $key, $hide_deprecation = false ) {

    if ( !$hide_deprecation ) zeroBSCRM_DEPRECATEDMSG('CRM Function Deprecated in v5.3: zeroBSCRM_decrypt');

	return zeroBSCRM_encryption_unsafe_process( 'decrypt', $string, $key, zeroBSCRM_get_iv() );

}
