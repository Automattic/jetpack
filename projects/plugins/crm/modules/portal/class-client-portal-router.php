<?php
/*!
* Jetpack CRM
* https://jetpackcrm.com
*
* Client Portal Router
*
*/
namespace Automattic\JetpackCRM;

defined( 'ZEROBSCRM_PATH' ) || exit;

/**
 * 
 * Client Portal class that takes care of all the routing
 * 
 */
class Client_Portal_Router {
	/**
	* Redirect CRM contacts to Client Portal after login.
	*
	* @param   str $redirect_to            The redirect destination URL.
	* @param   int $requested_redirect_to  The requested redirect destination URL passed as a parameter.
	* @param   WP_User $wp_user            WP_User object if login was successful, WP_Error object otherwise.
	*
	* @return  str $redirect_to
	*/
	function redirect_contacts_upon_login( $redirect_to, $request, $wp_user ) {

		if ( isset( $wp_user->roles ) && in_array( 'zerobs_customer', $wp_user->roles ) ) {
			$redirect_to = zeroBS_portal_link();
		}

		return $redirect_to;
	}	



	/**
	* Gets client portal endpoint name for a given object type.
	* 
	* @param   int $obj_type_id  object type ID
	* 
	* @return	str
	* @return	bool false if endpoint is not supported
	*/
	function get_endpoint( $obj_type_id ) {
		$endpoint = '';

		// determine which endpoint we are on
		switch ( $obj_type_id ) {
			case ZBS_TYPE_INVOICE:
				$endpoint = 'invoices';
				break;
			case ZBS_TYPE_QUOTE:
				$endpoint = 'quote';
				break;
			default:
				$endpoint = false;
		}

		// fail if endpoint is not supported
		if ( !$endpoint ) {
			return false;
		}

		// support custom endpoints if enabled in Client Portal Pro
		if ( function_exists( 'zeroBSCRM_clientPortalgetEndpoint' ) ) {
			$endpoint = zeroBSCRM_clientPortalgetEndpoint( $endpoint );
		}

		return $endpoint;
	}

	/**
	* Determines if the string is an easy-access hash or not.
	* 
	* @param   str $obj_id_or_hash
	* 
	* @return  bool
	*/
	function jpcrm_is_easy_access_hash( $obj_id_or_hash='' ) {
		return substr( $obj_id_or_hash, 0, 3 ) == 'zh-';
	}


	/**
	* Gets current objid or hash from query parameters
	* For use on singles, which are potentially easy-access calls
	* 
	* @param   int $obj_type_id  object type ID
	* 
	* @return	str - object id or easy-access hash, or ''
	*/
	function jpcrm_get_portal_single_objid_or_hash( $obj_type_id ) {
		$endpoint = $this->get_endpoint( $obj_type_id );

		// fail if bad endpoint
		if ( !$endpoint ) {
			return '';
		}

		return sanitize_text_field( get_query_var( $endpoint ) );
	}

	/**
	* Returns bool if current portal access is provided via easy-access hash
	* 
	* @return	bool - true if current access is via hash
	*/
	function access_is_via_hash( $obj_type_id ){
		return $this->jpcrm_is_easy_access_hash( $this->jpcrm_get_portal_single_objid_or_hash( $obj_type_id ) );
	}

	/**
	* Gets current object ID based on portal page URL.
	* 
	* @param   int $obj_type_id  object type ID
	* 
	* @return	int
	* @return	false if invalid object, bad permissions, or any other failure
	*/
	function get_obj_id_from_current_portal_page_url( $obj_type_id ) {

		global $zbs;

		// limit client portal invoice/quote view to DAL3
		if ( !$zbs->isDAL3() ) {
			return false;
		}

		// get object ID from URL
		$obj_id_or_hash = $this->jpcrm_get_portal_single_objid_or_hash( $obj_type_id );

		// valid obj id or hash?
		if ( empty( $obj_id_or_hash ) ) {
			return false;
		}

		// if a hash...
		if ( $this->jpcrm_is_easy_access_hash( $obj_id_or_hash ) ) {

			// fail if access via hash is not allowed
			if ( !jpcrm_can_access_portal_via_hash( $obj_type_id ) ) {
				return false;
			}

			// retrieve obj ID by hash
			$obj_id = $this->jpcrm_get_obj_id_by_hash( $obj_id_or_hash, $obj_type_id );

			// was an invalid hash
			if ( !$obj_id ) {
				return false;
			}

		}
		else {

			// not a hash, so cast to int
			$obj_id = (int)$obj_id_or_hash;

			// fail if current user isn't allowed
			if ( !jpcrm_can_current_wp_user_view_object( $obj_id, $obj_type_id ) ) {
				return false;
			}

		}

		return $obj_id;
	}


	/**
	* Returns security request name by object type.
	* 
	* @param   str $raw_obj_hash
	* @param   int $obj_type_id
	* 
	* @return  int id
	* @return  bool false if no match
	*/
	function jpcrm_get_obj_id_by_hash( $raw_obj_hash, $obj_type_id ) {

		// remove 'zh-' prefix
		$obj_hash = substr( $raw_obj_hash, 3 );

		$security_request_name = jpcrm_get_easy_access_security_request_name_by_obj_type( $obj_type_id );

		// log request
		$request_id = zeroBSCRM_security_logRequest( $security_request_name, $obj_hash );

		// check hash
		$obj = zeroBSCRM_hashes_GetObjFromHash( $obj_hash, -1, $obj_type_id );

		// bad hash
		if ( !$obj['success'] ) {
			return false;
		}

		$obj_id = (int)$obj['data']['ID'];

		// clear request
		zeroBSCRM_security_finiRequest( $request_id );

		return $obj_id;

	}
}
