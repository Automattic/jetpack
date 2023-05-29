<?php // phpcs:ignore Squiz.Commenting.FileComment.Missing

/**
 * Generate new WordPress (Client Portal) user
 */
function zeroBSCRM_generateClientPortalUser() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	// Nonce check
	check_ajax_referer( 'newwp-ajax-nonce', 'security' );

	$m = array();

	// Perms check
	if ( zeroBSCRM_permsCustomers() ) {

		$email      = '';
		$contact_id = -1;
		if ( isset( $_POST['email'] ) && ! empty( $_POST['email'] ) ) {
			$email = sanitize_text_field( $_POST['email'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		}
		if ( isset( $_POST['cid'] ) && ! empty( $_POST['cid'] ) ) {
			$contact_id = (int) $_POST['cid'];
		}
		if ( ! zeroBSCRM_validateEmail( $email ) ) {
			$email = '';
		}

		// $email_exists will be either false/int (id of wp user)
		$email_exists = email_exists( $email );

		if ( ! empty( $contact_id ) && null === $email_exists && ! empty( $email ) ) {

			global $zbs;

			// retrieve fname, lname if available
			$fname = '';
			$lname = '';

			$fields = $zbs->DAL->contacts->getContact( // phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
				$contact_id,
				array(
					'withCustomFields' => false,
					'fields'           => array( 'zbsc_addr1', 'zbsc_prefix', 'zbsc_fname', 'zbsc_lname' ),
					'ignoreowner'      => true,
				)
			);

			if ( isset( $fields['fname'] ) ) {
				$fname = $fields['fname'];
			}
			if ( isset( $fields['lname'] ) ) {
				$lname = $fields['lname'];
			}

			// create user
			$created = zeroBSCRM_createClientPortalUser( $contact_id, $email, 12, $fname, $lname );

			$m['message'] = 'WordPress User Created';
			$m['success'] = true;
			$m['user_id'] = $created;
			echo wp_json_encode( $m );
			die();

		} else {

			// if has wp id, & contact ID is set
			if ( is_int( $email_exists ) && $contact_id > 0 ) {

				// link the user to the WordPress ID...
				zeroBSCRM_setClientPortalUser( $contact_id, $email_exists );

			}

			$m['message'] = __( 'User already exists or invalid email!', 'zero-bs-crm' );
			$m['success'] = false;
			$m['email']   = $email;
			echo wp_json_encode( $m );
			die();

		}
	}
}
add_action( 'wp_ajax_zbs_new_user', 'zeroBSCRM_generateClientPortalUser' );

/**
 * Apply action to portal user (enable, disable, or reset password)
 */
function zeroBSCRM_AJAX_zbsPortalAction() { // phpcs:ignore WordPress.NamingConventions.ValidFunctionName.FunctionNameInvalid

	check_ajax_referer( 'zbsportalaction-ajax-nonce', 'security' );

	// can manage users?
	if ( zeroBSCRM_permsCustomers() ) {

		// sanitize?
		$action     = sanitize_text_field( $_POST['portalAction'] ); // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated,WordPress.Security.ValidatedSanitizedInput.MissingUnslash
		$contact_id = (int) $_POST['cid']; // phpcs:ignore WordPress.Security.ValidatedSanitizedInput.InputNotValidated
		if ( ! empty( $action ) && ! empty( $contact_id ) ) {

			switch ( $action ) {

				// enable
				case 'enable':
					// fire dal enable
					zeroBSCRM_customerPortalDisableEnable( $contact_id, 'enable' );

					// send success
					zeroBSCRM_sendJSONSuccess( array( 'success' => 1 ) );

					break;
				// disable
				case 'disable':
					// fire dal disable
					zeroBSCRM_customerPortalDisableEnable( $contact_id, 'disable' );

					// send success
					zeroBSCRM_sendJSONSuccess( array( 'success' => 1 ) );

					break;
				// Reset client portal password
				case 'resetpw':
					// fire dal disable
					$newpw = zeroBSCRM_customerPortalPWReset( $contact_id );

					// send success
					zeroBSCRM_sendJSONSuccess(
						array(
							'success' => 1,
							'pw'      => $newpw,
						)
					);

					break;

			}
		}
	}

	zeroBSCRM_sendJSONError( array( 'no-action-or-rights' => 1 ) );
}
add_action( 'wp_ajax_zbsPortalAction', 'zeroBSCRM_AJAX_zbsPortalAction' );
