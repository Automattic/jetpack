<?php
/**
 * Jetpack CRM Endpoint Listener Class
 * Provides support for generic verified endpoint call captures
 * e.g. OAuth return calls of webhooks
 * 
 * Endpoint example:
 *  https://example.com?jpcrm_listen={hash}&jpcrm_action={action}
 *  https://example.com?jpcrm_listen=1234&jpcrm_action=oauth_gmail
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * Endpoint Listener class.
 */
class Endpoint_Listener {


	/**
	 * Callback url base (url which will be listened for)
	 */
	private $callback_url_base = false;

	/**
	 * Callback actions
	 * An array of acceptable actions
	 */
	private $actions = array();

	/**
	 * Listened state (have we caught a request)
	 */
	private $listened_state = false;

	/**
	 * Init
	 */
	public function __construct() {

		// verify & set callback_url
		$this->establish_callback_url();

	}


	/*
	 * Catch listener requests
	 * Fired on load, catches any listener responses inbound
	 *
	*/
	public function catch_listener_request() {

		// has hit our hook parameter with a valid key, only needs to fire once.
		if ( $this->is_listener_request() && !$this->listened_state ){			

			// split by action
			$action = sanitize_text_field( $_GET['jpcrm_action'] );

			if ( $this->legitimate_action( $action ) ){

				// call wp action 
				do_action( 'jpcrm_listener_' . $action );

				$this->listened_state = true;

			}

		}

	}


	/*
	 * Verify and set callback url (frontend)
	*/
	public function establish_callback_url(){

		// Set url
		$this->callback_url_base = site_url()  . '?jpcrm_listen=' . $this->get_listener_key();

	}

	/*
	 * Retrieve a callback url with secondary endpoint (action) affixed
	*/
	public function get_callback_url( $action ){

		if ( $this->legitimate_action( $action ) ){

			return $this->callback_url_base . '&jpcrm_action=' . $action;
		}

		return false;

	}

	/*
	 * Is this request to our listener?
	*/
	public function is_listener_request(){

		// check for an oauth request & valid key
		if ( isset( $_GET['jpcrm_listen'] ) && $this->verify_listener_key() ) {
			
			return true;

		}

		return false;

	}


	/*
	 * Verify listener key against the setting
	*/
	public function verify_listener_key( $key='' ){

		// if key isn't passed, seek for it in _GET
		if ( !isset( $key ) || empty( $key ) ){

			$potential_key = sanitize_text_field( $_GET['jpcrm_listen'] );
			if ( empty( $potential_key ) ){
				return false;
			} else {
				$key = $potential_key;
			}

		}

		if ( $key == $this->get_listener_key() ){
			return true;
		}

		return false;

	}


	/*
	 * Get listener key
	*/
	public function get_listener_key(){
		
		global $zbs;

		// retrieve
		$key = $zbs->settings->get( 'global_listener_key', false );

		// check it
		if ( empty( $key ) ){

			// generate new one
			return $this->create_listener_key();

		}

		return $key;

	}


	/*
	 * Create/reset listener key
	*/
	public function create_listener_key(){
		
		global $zbs;

		// generate a key
		$new_key = zeroBSCRM_generateHash( 20 );

		// set it
		$zbs->settings->update( 'global_listener_key', $new_key );

		// re-verify & set callback_url
		$this->establish_callback_url();

		// return it
		return $new_key;

	}

	/*
	* Get actions
	*/
	public function get_actions() {
	
		return apply_filters( 'jpcrm_listener_actions', $this->actions );
		
	}

	/*
	* Add action
	*/
	public function add_action( $action ) {

		if ( !in_array( $action, $this->actions ) ){

			$this->actions[] = $action;

		}

		return $this->actions;
		
	}


	/*
	 * Checks if a action is on the list
	*/
	public function legitimate_action( $action ){

		if ( !empty( $action ) && in_array( $action, $this->get_actions() ) ){

			return true;

		}

		return false;

	}



}