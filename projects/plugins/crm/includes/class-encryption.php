<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * Encryption wrapper
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

class Encryption {

	private $cipher            = 'aes-256-gcm'; // AES-256-GCM Cipher we're going to use to encrypt - previously we used AES-256-CBC
	private $cipher_fallback   = 'aes-256-cbc'; // AES-256-CBC is our fallback
	private $tag_length        = 16;         // AES GCM tag length (MAC)
	private $default_key       = false;
	private $ready_to_encrypt  = true;

	/**
	 * Setup
	 */
	public function __construct() {

		// check if we have the algorhithm we want to use, and fall back if not
		$this->check_cipher_and_fallback();

	}


	/*
	 * check if we have the algorhithm we want to use, and fall back if not
	*/
	public function check_cipher_and_fallback(){

		global $zbs;

		// check if has flipped fallback previously
		$fallback_blocked = zeroBSCRM_getSetting( 'enc_fallback_blocked' );
		if ( !empty( $fallback_blocked ) ) {

			// doesn't even have fallback. Non encrypting!!
			$this->ready_to_encrypt = false;

			// error loading encryption
			echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'Unable to load encryption method', 'zero-bs-crm' ), sprintf ( __( 'CRM was unable to load the required encryption method (%s). Until this is method is available to your PHP your sensitive data may not be encrypted properly.', 'zero-bs-crm' ), $this->cipher ) );


			return;

		}

		// check if has flipped fallback previously
		$fallback_active = zeroBSCRM_getSetting( 'enc_fallback_active' );
		if ( !empty( $fallback_active ) ) {

			// has fallback. Let's use that:
			$this->cipher = $this->cipher_fallback;
			return;

		}

		$available_cipher_methods = openssl_get_cipher_methods();

		// check for our method
    	if ( !in_array( $this->cipher, $available_cipher_methods ) ){

    		// try fallback
    		if ( in_array( $this->cipher_fallback, $available_cipher_methods ) ){ 

    			// has fallback. Let's use that:
    			$this->cipher = $this->cipher_fallback;

    			// set option so we get 'stuck' in this mode
				$zbs->settings->update( 'enc_fallback_active', $this->cipher );				

    		} else {

    			// neither method. Present error
    			$this->ready_to_encrypt = false;

    			// set option so we get 'stuck' in this mode
				$zbs->settings->update( 'enc_fallback_blocked', 1 );	

    			// error loading encryption
				echo zeroBSCRM_UI2_messageHTML( 'warning', __( 'Unable to load encryption method', 'zero-bs-crm' ), sprintf ( __( 'CRM was unable to load the required encryption method (%s). Until this is method is available to your PHP your sensitive data may not be encrypted properly.', 'zero-bs-crm' ), $this->cipher ) );

    		}


    	}



	}

	/*
	 * Ready to encrypt?
	*/
	public function ready_to_encrypt(){

		return $this->ready_to_encrypt;

	}

	/*
	 * Cipher method
	*/
	public function cipher_method(){

		return $this->cipher;

	}

	/*
	 * Encrypts a string
	*/
	public function encrypt( $data, $key = false ){

		if ( $this->ready_to_encrypt ){

			// retrieve encryption key (or default if false)
			$encryption_key = $this->encryption_key( $key );

			// encrypt
			$iv_length = openssl_cipher_iv_length( $this->cipher );
			$iv = openssl_random_pseudo_bytes( $iv_length );
			$tag = ''; // will be filled by openssl_encrypt

			$encrypted = openssl_encrypt( $data, $this->cipher, $encryption_key, OPENSSL_RAW_DATA, $iv, $tag, '', $this->tag_length );

			return base64_encode( $iv . $encrypted . $tag );

		} else {

			// if we can't encrypt, store unencrypted, (having warned the user)
			return $data;

		}

	}

	/*
	 * Decrypts a string
	*/
	public function decrypt( $encrypted_data, $key = false ){

		if ( $this->ready_to_encrypt ){

			// retrieve encryption key (or default if false)
			$encryption_key = $this->encryption_key( $key );

			// break up encrypted string into parts
			$encrypted = base64_decode( $encrypted_data );
			$iv_len = openssl_cipher_iv_length( $this->cipher );
			$iv = substr( $encrypted, 0, $iv_len );
			$ciphertext = substr( $encrypted, $iv_len, -$this->tag_length );
			$tag = substr( $encrypted, -$this->tag_length );

			return openssl_decrypt( $ciphertext, $this->cipher, $encryption_key, OPENSSL_RAW_DATA, $iv, $tag );

		} else {

			// if we can't encrypt, store unencrypted, (having warned the user)
			return $encrypted_data;

		}

	}

	/*
	 * Retrieves or generates an encryption key from data store
	 *
	 * @param string $key - a key to make an encryption key for
	*/
	public function get_encryption_key( $key ){

		global $zbs;

		$encryption_key = zeroBSCRM_getSetting( 'enc_' . $key );
		if ( empty( $encryption_key ) ) {

			// Creating a 256 bit key. This might need to change if the algorithm changes
			$encryption_key = openssl_random_pseudo_bytes( 32 );
			$zbs->settings->update( 'enc_' . $key, bin2hex( $encryption_key ) );

		} else { 

			$encryption_key = hex2bin( $encryption_key );

		}

		return $encryption_key;

	}

	/*
	 * Retrieves default key
	*/
	public function get_default_encryption_key( ){

		// cached?
		if ( !empty( $this->default_key ) ){

			return $this->default_key;

		}

		// retrieve
		$default_key = $this->get_encryption_key( 'jpcrm_core' );

		// cache
		$this->default_key = $default_key;

		return $default_key;

	}

	/*
	 * Returns an encryption key, or default encryption key if no key passed
	*/
	public function encryption_key( $key ){

		// retrieve encryption key
		if ( !empty( $key ) ){

			// retrieve encryption key for $key
			return $this->get_encryption_key( $key );

		} else {

			// use default key
			return $this->get_default_encryption_key();

		}

	}

	/*
	 * Returns random hex string. The returned string length will be 2x the input bytes.
	 * 
	 * Inspired by WooCommerce: wc_rand_hash()
	 * 
	 * @param int $bytes - number of bytes to generate a hash from
	 * 
	 * @return str
	 */
	public function get_rand_hex( $bytes = 20 ) {
		return bin2hex( openssl_random_pseudo_bytes( (int)$bytes ) );
	}

	/**
	 * Returns hashed string.
	 * 
	 * Inspired by WooCommerce: wc_api_hash()
	 * 
	 * @param str $str - string to hash
	 * 
	 * @return str
	**/
	public function hash( $str ) {
		return hash_hmac( 'sha256', $str, 'jpcrm' );
	}

}