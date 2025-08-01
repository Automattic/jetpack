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

$json_params = file_get_contents( 'php://input' );
$new_company = json_decode( $json_params, true );

// no tags assumption, etc.
$we_have_tags = false;
$company_id   = -1;
$email        = '';
$field_prefix = 'zbsc_';

// this retrieves all fields (inc CUSTOM FIELDS) into customer_array
// empty prefix important here
$remove_empties      = false;
$autogen_autonumbers = true;
// setting $autoGenAutonumbers = true, means if they're not passed, they'll get generated
// autoGenAutonumbers is duck-tape for now, rethink input + field model v3.0+
$company_array = zeroBS_buildObjArr( $new_company, array(), '', $field_prefix, $remove_empties, ZBS_TYPE_COMPANY, $autogen_autonumbers );

// this is needed for check below:
if ( isset( $new_company['id'] ) ) {
	$company_id = (int) sanitize_text_field( $new_company['id'] );
}
if ( isset( $company_array[ $field_prefix . 'email' ] ) ) {
	$email = $company_array[ $field_prefix . 'email' ];
}

// diff name used below :)
$update_args = $company_array;

// Owner
$assign = -1;
if ( isset( $new_company['assign'] ) ) {
	$assign = (int) $new_company['assign'];
}

// } TAGS
$tags = false;
if ( isset( $new_company['tags'] ) ) {
	$tags = $new_company['tags'];
}
if ( is_array( $tags ) && count( $tags ) > 0 ) {

	// basic filtering
	$company_tags = filter_var_array( $tags, FILTER_UNSAFE_RAW );
	// Formerly this used FILTER_SANITIZE_STRING, which is now deprecated as it was fairly broken. This is basically equivalent.
	// @todo Replace this with something more correct.
	foreach ( $company_tags as $k => $v ) {
		$company_tags[ $k ] = strtr(
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
	$temptags = array(); foreach ( $company_tags as $t ) {
		$t2 = trim( $t );
		if ( ! empty( $t2 ) ) {
			$temptags[] = $t2;
		}
	}

	// last check + set
	if ( count( $temptags ) > 0 ) {
		$we_have_tags = true;
		$company_tags = $temptags;
		unset( $temptags );
	}
}

// } Build pretty log msgs :)

// } DEFAULTS
// } Existing user updated by API
$existing_user_api_source_short = __( 'Updated by API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
$existing_user_api_source_long  = __( 'API Action fired to update company', 'zero-bs-crm' );

// } New User from API
$new_user_api_source_short = __( 'Created from API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
$new_user_api_source_long  = __( 'API Action fired to create company', 'zero-bs-crm' );

$external_api_name = jpcrm_api_process_external_api_name();
if ( $external_api_name !== false ) {
	$existing_user_api_source_short = sprintf(
		// Translators: %s is a dynamic service name invoking the API.
		__( 'Updated by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
		$external_api_name
	);
	$existing_user_api_source_long = sprintf(
		// Translators: %s is a dynamic service name invoking the API.
		__( '%s fired an API Action to update this company', 'zero-bs-crm' ),
		$external_api_name
	);
	$new_user_api_source_short = sprintf(
		// Translators: %s is a dynamic service name invoking the API.
		__( 'Created by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
		$external_api_name
	);
	$new_user_api_source_long = sprintf(
		// Translators: %s is a dynamic service name invoking the API.
		__( '%s fired an API Action to create this company', 'zero-bs-crm' ),
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
if ( $company_id > 0 ) {
	$verified_id = $zbs->DAL->companies->getCompany( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
		$company_id,
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

	// } ID Exists?
	if ( $verified_id > 0 ) {
		$update_args['id'] = $verified_id;
	}

	// } Tags
	if ( $we_have_tags ) {
		$update_args['tags'] = $company_tags;
	}

	// } Status default - double-backup for api check
	if ( isset( $update_args ) && is_array( $update_args ) && ( ( $update_args[ $field_prefix . 'status' ] ) === null || ! isset( $update_args[ $field_prefix . 'status' ] ) || empty( $update_args[ $field_prefix . 'status' ] ) ) ) {
		$default_status                          = zeroBSCRM_getSetting( 'defaultstatus' );
		$update_args[ $field_prefix . 'status' ] = $default_status; // 'Lead';
	}

	/**
	 * Need to pass via the update_args otherwise the tags are added AFTER the automation fires...      when doing new DB we need to hook and filter up varios steps of these
	 * e.g.
	 * apply_filters('pre_do_this', $args);
	 * ...do_this...
	 * apply_filters('post_do_this', $args);  // etc..
	 */

	$new_company_id = zeroBS_integrations_addOrUpdateCompany(
		'api',
		$email,
		$update_args,
		'', // ) Customer date (auto)
		$fallback_log, // } Fallback log (for customers who already exist)
		false, // } Extra meta
		$internal_automator_override, // } Internal automator overrides - here we pass a "customer.create" note override (so we can pass it a custom str, else we let it fall back to "created by API")
		'update',
		$field_prefix // field prefix zbsc_
	);
	// ^^ this'll be either: ID if added, no of rows if updated, or FALSE if failed to insert/update

	// } are we assigning to a user?
	if ( ! empty( $assign ) ) {
		// set owner
		zeroBS_setOwner( $new_company_id, $assign, ZBS_TYPE_COMPANY );
	}

	// old way just returned what was sent...
	// wp_send_json($json_params); //sends back to Zapier the customer that's been sent to it.

	// thorough much? lol.
	if ( ! empty( $new_company_id ) && $new_company_id !== -1 ) {

		// return what was passed...
		// this is legacy funk.. not ideal at all, should probs reload.
		$return_params = $new_company;

		// add id if new
		if ( $new_company_id > 0 ) {
			$return_params['id'] = $new_company_id;
		}

		// return
		wp_send_json( $return_params );

	} else {

		// fail.
		wp_send_json( array( 'error' => 100 ) );

	}
}

exit( 0 );
