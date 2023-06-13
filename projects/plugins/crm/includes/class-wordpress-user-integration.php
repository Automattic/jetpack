<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * WordPress User related integrations
 *
 */
namespace Automattic\JetpackCRM;

// block direct access
defined( 'ZEROBSCRM_PATH' ) || exit;

class Wordpress_User_Integration {

	/**
	 * Init
	 */
	public function __construct() {

		// register hooks
		$this->init_hooks();

	}

	/*
	 * Initialise hooks
	*/
	public function init_hooks(){

		add_action( 'profile_update', array( $this, 'wordpress_profile_update' ), 10, 3 );

	}

 
	/*
	 * Catches WordPress user profile updates and updates any related Contacts
	 * Works for all WP users and related systems (e.g. WooSync)
	 * https://developer.wordpress.org/reference/hooks/profile_update/
	 *
	 * @param int $user_id (WordPress User ID)
	 * @param WP_User Object $old_user_data
	 * @param array $new_user_data (This is a raw db insert array)
	 *
	*/
	public function wordpress_profile_update( $user_id, $old_user_data, $new_user_data ) {

		global $zbs,$wp_query;

		// detect whether these changes are coming from Profile page or Woo my account page:
		$change_via_woo_account = false;

		// here we use a relatively hacky approach to retrieve the posted page
		// ... though it seems the best approach
		if ( is_object( $wp_query ) && isset( $wp_query->queried_object ) && isset( $wp_query->queried_object->post_content ) ){

			if ( strpos( $wp_query->queried_object->post_content, '[woocommerce_my_account]' ) > -1 ){

				$change_via_woo_account = true;

			}

		}

		// This var will be defined as JPCRM_PROFILE_UPDATE_CHANGES, which will allow WooSync's save_my_account_crm_field_changes to sidestep repeating changes
		$profile_update_changes = array();

		// retrieve id's
		$old_user_contact_id = false;
		$new_user_contact_id = false;
		$email_conflict = false;
		if ( isset( $old_user_data->data->user_email ) ){

			// check if we have contacts with emails
			$old_user_contact_id = $zbs->DAL->contacts->getContact( -1, array(

				'email'        => $old_user_data->data->user_email,
				'onlyID'       => true,
				'ignoreowner'  => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT )

			));

		}

		if ( isset( $new_user_data['user_email'] ) ){

			$new_user_contact_id = $zbs->DAL->contacts->getContact( -1, array(

				'email'        => $new_user_data['user_email'],
				'onlyID'       => true,
				'ignoreowner'  => zeroBSCRM_DAL2_ignoreOwnership( ZBS_TYPE_CONTACT )

			));

		}

		// Email change (For Client Portal Users & WooSync originated contacts)
		if ( $old_user_data->data->user_email != $new_user_data['user_email'] ){

			// if we had a contact with this users email...
			if ( $old_user_contact_id > 0 ){

				// if we don't already have a contact with this new email (no collision)
				if ( !$new_user_contact_id ){

					// update contacts email address:
					$zbs->DAL->contacts->update_contact_email( $old_user_contact_id, $new_user_data['user_email'] );

					// flag so woosync doesn't also update
					$profile_update_changes[] = 'email';

					// Add log noting the email change
					$note_type = 'contact_changed_details_via_wpprofile';
					$short_description = __( 'Email changed', 'zero-bs-crm' );
					if ( $change_via_woo_account ){
						$note_type = 'contact_changed_details_via_woomyacc';
					}
					$zbs->DAL->logs->addUpdateLog( array(

					    'id'            => -1,
			            'owner'         => -1,
			            'data'          => array(

			                'objtype'   => ZBS_TYPE_CONTACT,
			                'objid'     => $old_user_contact_id,
			                'type'      => $note_type, // contact_changed_details_via_wpprofile or contact_changed_details_via_woomyacc
			                'shortdesc' => $short_description,
			                'longdesc'  => sprintf( __( 'Contact email changed from `%s` to `%s`', 'zero-bs-crm' ), $old_user_data->data->user_email, $new_user_data['user_email'] ),
			                
			            )

			        ));

					

				} else {

					// the email this contact has changed their email to is already in use
					// on another contact :o

					// flag so that we don't also update the new users details below
					$email_conflict = true;

					// Add a log to both contacts.					
					$short_description = __( 'Attempted email Change', 'zero-bs-crm' );
					$zbs->DAL->logs->addUpdateLog( array(

					    'id'            => -1,
			            'owner'         => -1,
			            'data'          => array(

			                'objtype'   => ZBS_TYPE_CONTACT,
			                'objid'     => $old_user_contact_id,
			                'type'      => 'contact_change_details_attempt',
			                'shortdesc' => $short_description,
			                'longdesc'  => sprintf( __( 'There was an attempt to change this contacts email from `%s` to `%s`, unfortunately this was not possible because another contact (#%d) already uses that email address.', 'zero-bs-crm' ), $old_user_data->data->user_email, $new_user_data['user_email'], $new_user_contact_id ),
			                
			            )

			        ));
					$zbs->DAL->logs->addUpdateLog( array(

					    'id'            => -1,
			            'owner'         => -1,
			            'data'          => array(

			                'objtype'   => ZBS_TYPE_CONTACT,
			                'objid'     => $new_user_contact_id,
			                'type'      => 'contact_change_details_attempt',
			                'shortdesc' => $short_description,
			                'longdesc'  => sprintf( __( 'There was an attempt to change another contact\'s (#%d) email from `%s` to `%s`, this was not possible because this contact already uses that email address.', 'zero-bs-crm' ), $old_user_contact_id, $old_user_data->data->user_email, $new_user_data['user_email'] ),
			                
			            )

			        ));

				}

			}


		}


		// First and last names are available in $new_user_data but not in old.
		// Here we brutally updated these, which in some cases may be further updated by `save_my_account_crm_field_changes()` in WooSync
		// ... if changes posted through Woo My Account, and fname/lname specified as editable fields.

		// if we have a contact to op, and this isn't a conflicting situation:
		if ( isset( $old_user_contact_id ) && $old_user_contact_id > 0 && !$email_conflict ){

			// discern if changes
			$changes = array();
			$detail_change_description = '';

			// retrieve existing
			$contact = $zbs->DAL->contacts->getContact( $old_user_contact_id, array( 'withCustomFields' => false, 'fields'=>array( 'zbsc_fname', 'zbsc_lname' ), 'ignoreowner' => true ) );

			// first name
			if ( isset( $new_user_data['first_name'] ) ){
				
				$new_first_name = $new_user_data['first_name'];
				if ( $contact['fname'] != $new_first_name ){
					
					// add limitedFields change
					$changes[] = array( 
                        'key'  => 'zbsc_fname',
                        'val'  => $new_first_name,
                        'type' => '%s'
                    );

                    // add to log
                    $detail_change_description .= '<br>' . sprintf( __( 'First name changed from `%s` to `%s`', 'zero-bs-crm' ), $contact['fname'], $new_first_name );

					// flag so woosync doesn't also update
					$profile_update_changes[] = 'fname';

				}

			}

			// last name
			if ( isset( $new_user_data['last_name'] ) ){
				
				$new_last_name = $new_user_data['last_name'];
				if ( $contact['lname'] != $new_last_name ){

					// add limitedFields change
					$changes[] = array( 
                        'key'  => 'zbsc_lname',
                        'val'  => $new_last_name,
                        'type' => '%s'
                    );

                    // add to log
                    $detail_change_description .= '<br>' . sprintf( __( 'Last name changed from `%s` to `%s`', 'zero-bs-crm' ), $contact['lname'], $new_last_name );

					// flag so woosync doesn't also update
					$profile_update_changes[] = 'lname';

				}

			}

			// any changes?
			if ( count( $changes ) > 0 ){

				// update contact
				$zbs->DAL->contacts->addUpdateContact( array(
	                'id'             => $old_user_contact_id,
	                'limitedFields'  => $changes
	             ));

				// Add log noting the email change
				$note_type = 'contact_changed_details_via_wpprofile';
				$short_description = __( 'Contact name change', 'zero-bs-crm' );
				if ( $change_via_woo_account ){
					$note_type = 'contact_changed_details_via_woomyacc';
				}
				$zbs->DAL->logs->addUpdateLog( array(

				    'id'            => -1,
		            'owner'         => -1,
		            'data'          => array(

		                'objtype'   => ZBS_TYPE_CONTACT,
		                'objid'     => $old_user_contact_id,
		                'type'      => $note_type,
		                'shortdesc' => $short_description,
		                'longdesc'  => __( 'Contact details changed:', 'zero-bs-crm' ) . $detail_change_description,
		                
		            )

		        ));
			}

		}

		// if posted from woo my account, define any changes so that woosync doesn't repeat them
		if ( !defined( 'JPCRM_PROFILE_UPDATE_CHANGES' ) && $change_via_woo_account && count( $profile_update_changes ) > 0 ){
			define( 'JPCRM_PROFILE_UPDATE_CHANGES', $profile_update_changes );
		}

	}
}