<?php
/*
!
 * Jetpack CRM
 * https://jetpackcrm.com
 * V3.0
 *
 * Copyright 2020 Automattic
 *
 * Date: 04/06/2019
 */

// V3.0 version of API

// Breaking Checks ( stops direct access )
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

// Breaking Checks
$json_params = file_get_contents( 'php://input' );
$new_trans   = json_decode( $json_params, true );

// REQUIRED FIELDS
$required_fields = array(
	'orderid',
	'status',
	'total',
);

// Check for required fields. Fail if any are missing.
foreach ( $required_fields as $field ) {
	if ( ! array_key_exists( $field, $new_trans ) ) {
		wp_send_json(
			array(
				'error'   => 400,
				'message' => 'Missing required field: ' . $field,
			)
		);
		exit();
	}
}

$email = '';
$fname = '';

if ( isset( $new_trans['orderid'] ) ) {
	$orderid = sanitize_text_field( $new_trans['orderid'] );
}

if ( isset( $new_trans['email'] ) ) {
	$email = sanitize_text_field( $new_trans['email'] );
}
		$customer = zeroBS_getCustomerIDWithEmail( $email );
if ( isset( $new_trans['fname'] ) ) {
	$fname = sanitize_text_field( $new_trans['fname'] );
}

if ( empty( $customer ) ) {

	// customer with that email does not exist.. create a customer
	// do we need STATUS? WH: YES

	// } ... added pretty logs... cloned from create_customer + tweaked

		// } Build pretty log msgs :)

			// } DEFAULTS

				// } New User from API
				$newUserAPISourceShort = __( 'Created from API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
				$newUserAPISourceLong  = __( 'API Action fired to create contact (New Transaction)', 'zero-bs-crm' ); // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase

	$external_api_name = jpcrm_api_process_external_api_name();
	if ( $external_api_name !== false ) {
		$newUserAPISourceShort = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			// Translators: %s is a dynamic service name invoking the API.
			__( 'Created by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
			$external_api_name
		);
		$newUserAPISourceLong = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			// Translators: %s is a dynamic service name invoking the API.
			__( '%s fired an API Action to create this transaction', 'zero-bs-crm' ),
			$external_api_name
		);
	}
				// } Actual log var passed- SHOULD NEVER HAPPEN HERE... this is new cust
				$fall_back_log = array();

				// } Internal automator overrides - here we pass a "customer.create" note override (so we can pass it a custom str, else we let it fall back to "created by form")
				$internal_automator_override = array(

					'note_override' => array(

						'type'      => 'API Action',
						'shortdesc' => $newUserAPISourceShort,
						'longdesc'  => $newUserAPISourceLong,

					),

				);

				$customer = zeroBS_integrations_addOrUpdateCustomer(
					'api',
					$email,
					array(

						'zbsc_email'  => $email,
						'zbsc_status' => 'Customer',
						'zbsc_fname'  => $fname,

					),
					'', // ) Customer date (auto)
					// } Fallback log (for customers who already exist)
					$fall_back_log,
					false, // } Extra meta
					// } Internal automator overrides - here we pass a "customer.create" note override (so we can pass it a custom str, else we let it fall back to "created by API")
					$internal_automator_override
				);

}

$transaction_fields = array();

foreach ( $new_trans as $field => $value ) {

	// These fields are not part of the transaction object.
	if ( $field === 'email' || $field === 'fname' || $field === 'orderid' ) {
		continue;
	}

	if ( $field === 'date' ) {
		$transaction_fields[ $field ] = gmdate( 'Y-m-d H:i:s', (int) $value );
		continue;
	}

	$transaction_fields[ $field ] = sanitize_text_field( $value );
}

$transaction_fields['customer'] = $customer;
$transaction_fields['ref']      = $orderid;

// } We can only add a trans if it has a unique id ($orderid)
// } This isn't even a check that it's unique, if it exists, it'll update...
if ( ! empty( $orderid ) ) {

	// } Build pretty log msgs :)

		// } DEFAULTS
			// } Existing user updated by API
			$existing_transaction_short_log = __( 'Transaction Updated by API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
			$existing_transaction_desc_log  = __( 'API Action fired to update a transaction', 'zero-bs-crm' ) . ': #' . $orderid . ' for ' . zeroBSCRM_getCurrencyChr() . $transaction_fields['total'] . ' (Status: ' . $transaction_fields['status'] . ')';

			// } New Transaction from API
			$new_transaction_short_log = __( 'Transaction Created from API Action', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>';
			$new_transaction_desc_log  = __( 'API Action fired to create a transaction', 'zero-bs-crm' ) . ': #' . $orderid . ' for ' . zeroBSCRM_getCurrencyChr() . $transaction_fields['total'] . ' (Status: ' . $transaction_fields['status'] . ')';

	$external_api_name = jpcrm_api_process_external_api_name();
	if ( $external_api_name !== false ) {
		$existing_transaction_short_log = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			// Translators: %s is a dynamic service name invoking the API.
			__( 'Transaction Updated by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
			$external_api_name
		);
		$existing_transaction_desc_log = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			// Translators: %1$s is a dynamic service name invoking the API, %2$s is the transaction ID, %3$s is the currency/value, %4$s is the status string.
			__( '%1$s fired an API Action to update a transaction: #%2$s for %3$s (Status: %4$s)', 'zero-bs-crm' ),
			$external_api_name,
			$orderid,
			zeroBSCRM_getCurrencyChr() . $transaction_fields['total'],
			$transaction_fields['status']
		);
		$new_transaction_short_log = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			// Translators: %s is a dynamic service name invoking the API.
			__( 'Transaction Added by %s (API)', 'zero-bs-crm' ) . ' <i class="fa fa-random"></i>',
			$external_api_name
		);
		$new_transaction_desc_log = sprintf( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.VariableNotSnakeCase
			// Translators: %1$s is a dynamic service name invoking the API, %2$s is the transaction ID, %3$s is the currency/value, %4$s is the status string.
			__( '%1$s fired an API Action to add a transaction: #%2$s for %3$s (Status: %4$s)', 'zero-bs-crm' ),
			$external_api_name,
			$orderid,
			zeroBSCRM_getCurrencyChr() . $transaction_fields['total'],
			$transaction_fields['status']
		);
	}
			// } Actual log var passed
			$fall_back_log = array(
				'type'      => 'API Action',
				'shortdesc' => $existing_transaction_short_log,
				'longdesc'  => $existing_transaction_desc_log,
			);

			// } Internal automator overrides - here we pass a "transaction.create" note override (so we can pass it a custom str, else we let it fall back to "created by api")
			$internal_automator_override = array(

				'note_override' => array(

					'type'      => 'API Action',
					'shortdesc' => $new_transaction_short_log,
					'longdesc'  => $new_transaction_desc_log,

				),

			);

			$trans = zeroBS_integrations_addOrUpdateTransaction(
				'api',
				$orderid,
				$transaction_fields,
				array(), // } TAGS
				'', // ) Trans date (auto)
				$fall_back_log, // } Fallback log (for Trans who already exist)
				false, // } Extra meta
				$internal_automator_override, // } Internal automator overrides - here we pass a "transaction.create" note override (so we can pass it a custom str, else we let it fall back to "created by API")
				'' // field prefix, e.g. zbst_
			);
	// ^^ this'll be either: ID if added, no of rows if updated, or FALSE if failed to insert/update

	// old way just returned what was sent...
	// wp_send_json($json_params);

	// thorough much? lol.
	if ( ! empty( $trans ) && $trans !== false && $trans !== -1 ) {

		// return what was passed...
		// this is legacy funk.. not ideal at all, should probs reload.
		$return_params = $new_trans;

		// add the id if it's new
		if ( $trans > 0 ) {
			$return_params['id'] = $trans;
		}

		// return
		wp_send_json( $return_params );

	} else {

		// fail.
		wp_send_json( array( 'error' => 100 ) );

	}
}

exit();
