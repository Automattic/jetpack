<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * @package automattic/jetpack-crm
 */

if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit( 0 );
}

global $zbs;

$json_params  = file_get_contents( 'php://input' );
$new_customer = json_decode( $json_params, true );

// if this isn't an array, reply NO
if ( ! is_array( $new_customer ) ) {
	wp_send_json(
		array(
			'error'   => true,
			'message' => 'Invalid JSON data',
		)
	);
}

// no tags assumption, etc.
$we_have_tags = false;
$contact_id   = -1;
$email        = '';

// pass sticky status - pass sticky = false to not have a sticky status
$sticky = true;
if ( isset( $new_customer['sticky'] ) && ! empty( $new_customer['sticky'] ) ) {
	$sticky = false;
}
$stickystat = 'Customer';
if ( isset( $new_customer['stickystat'] ) ) {
	$stickystat = sanitize_text_field( $new_customer['stickystat'] );
}

// this retrieves all fields (inc CUSTOM FIELDS) into customer_array
// empty prefix important here
$remove_empties      = false;
$autogen_autonumbers = true;
// setting $autoGenAutonumbers = true, means if they're not passed, they'll get generated
// autoGenAutonumbers is duck-tape for now, rethink input + field model v3.0+
$customer_array = zeroBS_buildContactMeta( $new_customer, array(), '', 'zbsc_', $remove_empties, $autogen_autonumbers );

// this is needed for check below:
if ( isset( $new_customer['id'] ) ) {
	$contact_id = (int) sanitize_text_field( $new_customer['id'] );
}
if ( isset( $customer_array['zbsc_email'] ) ) {
	$email = $customer_array['zbsc_email'];
}

// diff name used below :)
$update_args = $customer_array;

// } Owner
$assign = -1;
if ( isset( $new_customer['assign'] ) ) {
	$assign = (int) $new_customer['assign'];
}

// } TAGS
$tags = false;
if ( isset( $new_customer['tags'] ) ) {
	$tags = $new_customer['tags'];
}
if ( is_array( $tags ) && count( $tags ) > 0 ) {

	// basic filtering
	$customer_tags = filter_var_array( $tags, FILTER_UNSAFE_RAW );
	// Formerly this used FILTER_SANITIZE_STRING, which is now deprecated as it was fairly broken. This is basically equivalent.
	// @todo Replace this with something more correct.
	foreach ( $customer_tags as $k => $v ) {
		$customer_tags[ $k ] = strtr(
			wp_strip_all_tags( $v ),
			array(
				"\0" => '',
				'"'  => '&#34;',
				"'"  => '&#39;',
				'<'  => '',
			)
		);
	}

	// dumb check - not empties :)
	$temptags = array(); foreach ( $customer_tags as $t ) {
		$t2 = trim( $t );
		if ( ! empty( $t2 ) ) {
			$temptags[] = $t2;
		}
	}

	// last check + set
	if ( count( $temptags ) > 0 ) {
		$we_have_tags  = true;
		$customer_tags = $temptags;
		unset( $temptags );
	}
}

// } Build pretty log msgs :)

// } DEFAULTS
// } Existing user updated by API
$existing_user_api_source_short = __( 'Updated by API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
$existing_user_api_source_long  = __( 'API Action fired to update contact', 'zero-bs-crm' );

// } New User from API
$new_user_api_source_short = __( 'Created from API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
$new_user_api_source_long  = __( 'API Action fired to create contact', 'zero-bs-crm' );

$external_api_name = jpcrm_api_process_external_api_name();
if ( $external_api_name !== false ) {
	$existing_user_api_source_short = sprintf(
		// Translators: %s is a dynamic service name invoking the API.
		__( 'Updated by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
		$external_api_name
	);
	$existing_user_api_source_long = sprintf(
		// Translators: %s is a dynamic service name invoking the API.
		__( '%s fired an API Action to update this contact', 'zero-bs-crm' ),
		$external_api_name
	);
	$new_user_api_source_short = sprintf(
		// Translators: %s is a dynamic service name invoking the API.
		__( 'Created by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
		$external_api_name
	);
	$new_user_api_source_long = sprintf(
		// Translators: %s is a dynamic service name invoking the API.
		__( '%s fired an API Action to create this contact', 'zero-bs-crm' ),
		$external_api_name
	);
}

// } Actual log var passed
$fallback_log = array(
	'type'      => 'API Action',
	'shortdesc' => $existing_user_api_source_short,
	'longdesc'  => $existing_user_api_source_long,
);

// } Internal automator overrides - here we pass a "customer.create" note override (so we can pass it a custom str, else we let it fall back to "created by api")
$internal_automator_override = array(
	'note_override' => array(
		'type'      => 'API Action',
		'shortdesc' => $new_user_api_source_short,
		'longdesc'  => $new_user_api_source_long,
	),
);

// } Validate ID if passed
$verified_id = -1;
if ( $contact_id > 0 ) {
	$verified_id = $zbs->DAL->contacts->getContact( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$contact_id,
		array(
			'withCustomFields' => false,
			'ignoreowner'      => true,
			'onlyID'           => true,
		)
	);
}

// } EMAIL or ID :)
if (
	( ! empty( $email ) && zeroBSCRM_validateEmail( $email ) )
	||
	$verified_id > 0
) {

	// } STICKY status addition - dont have the API update our status if it's sticky
	// } added if ID, exists 12/04/18
	if ( $verified_id < 1 ) {
		$exists = zeroBS_getCustomerIDWithEmail( $email );
	} else {
		$exists            = $verified_id;
		$update_args['id'] = $verified_id;
	}

	if ( $exists && $sticky ) {

		// email exists, chechk status
		$existing_status = $zbs->DAL->contacts->getContactStatus( $exists ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase

		if ( $existing_status === $stickystat ) {
				// so.... set it to be the stickystat/it's existing
				$update_args['zbsc_status'] = $stickystat; // 'Customer';
		} else { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedElse
			// existing status (e.g. lead) is not stickystatus (e.g. customer)
			// so let it override default
		}
	}

	// } Status default - double-backup for api check
	if ( isset( $update_args ) && is_array( $update_args ) && ( $update_args['zbsc_status'] === null || ! isset( $update_args['zbsc_status'] ) || empty( $update_args['zbsc_status'] ) ) ) {
		$default_status             = zeroBSCRM_getSetting( 'defaultstatus' );
		$update_args['zbsc_status'] = $default_status; // 'Lead';
	}

	if ( $we_have_tags ) {
		$update_args['tags'] = $customer_tags;
	}

	/**
	 * Need to pass via the update_args otherwise the tags are added AFTER the automation fires...      when doing new DB we need to hook and filter up varios steps of these
	 * e.g.
	 * apply_filters('pre_do_this', $args);
	 * ...do_this...
	 * apply_filters('post_do_this', $args);
	 */
	$new_contact = zeroBS_integrations_addOrUpdateCustomer(
		'api',
		$email,
		$update_args,
		'', // ) Customer date (auto)
		// } Fallback log (for customers who already exist)
		$fallback_log,
		false, // } Extra meta
		// } Internal automator overrides - here we pass a "customer.create" note override (so we can pass it a custom str, else we let it fall back to "created by API")
		$internal_automator_override
	);
	// ^^ this'll be either: ID if added, no of rows if updated, or FALSE if failed to insert/update

	// } This makes our new customer trigger fire... without this, it isn't firing now ???
	// dig deeper since zeroBS_integrations_addOrUpdateCustomer should fire this..
	// do_action('zbs_new_customer', $new_contact);

	// } are we assigning to a user?
	if ( ! empty( $assign ) && $assign > -1 ) {
		// set owner
		zeroBS_setOwner( $new_contact, $assign, ZBS_TYPE_CONTACT );
	}

	// old way just returned what was sent...
	// wp_send_json($json_params); //sends back to Zapier the customer that's been sent to it.

	// thorough much? lol.
	if ( ! empty( $new_contact ) && $new_contact !== -1 ) {

		// return what was passed...
		// this is legacy funk.. not ideal at all, should probs reload.
		$return_params = $new_customer;

		// add id if new
		if ( $new_contact > 0 ) {
			$return_params['id'] = $new_contact;
		}

		// return
		wp_send_json( $return_params );

	} else {

		// fail.
		wp_send_json( array( 'error' => 100 ) );

	}
}

wp_send_json( array( 'errors' => 1 ) );
