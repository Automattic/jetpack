<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Jetpack CRM
 * https://jetpackcrm.com
 * V1.20
 *
 *
 * Date: 24th January 2020
 *
 * This file will house any functionality related to Jetpack
 */

/*
======================================================
Breaking Checks ( stops direct access )
======================================================
*/
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

/*
======================================================
/ Breaking Checks
======================================================
*/

/**
 *
 * JETPACK CONTACT FORM CAPTURE => Jetpack CRM
 *
 * This intercepts the jetpack form submission. Capturing the lead in Jetpack CRM.
 * This is the only action that appears to pass the field values in $all_values and
 * oddly named $extra_values which are contact form fields not in all values
 * so...  all values is "almost all values :-)"
 */

add_action( 'grunion_after_feedback_post_inserted', 'zero_bs_crm_capture_jetpack_form', 10, 4 );

/**
 * Creates a ZBS contact from a Jetpack form submission.
 *
 * @param integer $post_id The post id that contains the contact form data.
 * @param array   $all_field_data An array containg the form's Grunion_Contact_Form_Field objects.
 * @param bool    $is_spam Whether the form submission has been identified as spam.
 * @param array   $entry_values The feedback entry values.
 */
function zero_bs_crm_capture_jetpack_form( $post_id, $all_field_data, $is_spam, $entry_values ) {
	global $zbs;

	if ( $is_spam || ! is_array( $all_field_data ) || empty( $all_field_data ) ) {
		return;
	}

	$first_field = reset( $all_field_data );
	if ( isset( $first_field->form->attributes['jetpackCRM'] ) && ! $first_field->form->attributes['jetpackCRM'] ) {
		// The Jetpack contact form CRM integration toggle is set to off, so bail.
		return;
	}

	$contact_data = array();

	/*
	 * These keys are used by ZBS internally. Don't allow users to set them
	 * using form fields.
	 */
	$restricted_keys = array(
		'externalSources',
		'companies',
		'lastcontacted',
		'created',
		'aliases',
	);

	/*
	 * Try to process the fields using user-specified 'jetpackcrm-' ids.
	 * This is the ideal situation: the user has specified ids with
	 * a 'jetpackcrm-' prefix for each form field, so the fields should map
	 * directly to the CRM contact fields.
	 */
	$jpcrm_field_prefix = 'jetpackcrm-';

	foreach ( (array) $all_field_data as $field => $field_data ) {
		$field_id = $field_data->get_attribute( 'id' );

		if ( 0 === strpos( $field_id, $jpcrm_field_prefix ) && ! empty( $field_data->value ) ) {
			$data_key = substr( $field_id, strlen( $jpcrm_field_prefix ) );

			if ( ! in_array( $data_key, $restricted_keys, true ) ) {
				if ( $data_key == 'tags' ) {
					if ( is_array( $field_data->value ) ) {
						$contact_data[ $data_key ] = $field_data->value;
					}
					else {
						$contact_data[ $data_key ] = explode( ',', $field_data->value );
					}
				}
				else {
					$contact_data[ $data_key ] = $field_data->value;
				}
			}
		}
	}

	if ( empty( $contact_data['email'] ) ) {
		/*
		 * If the field ids aren't prefixed with 'jetpackcrm-', try to get an
		 * email, phone, and name using the field types.
		 */
		foreach ( (array) $all_field_data as $field => $field_data ) {
			if ( 'email' === $field_data->get_attribute( 'type' )
				&& ! isset( $contact_data['email'] )
				&& ! empty( $field_data->value )
			) {
				// Use the first email field that's found.
				$contact_data['email'] = $field_data->value;
			}

			if ( 'telephone' === $field_data->get_attribute( 'type' )
				&& ! isset( $contact_data['hometel'] )
				&& ! empty( $field_data->value )
			) {
				// Use the first phone field that's found.
				$contact_data['hometel'] = $field_data->value;
			}

			if ( 'name' === $field_data->get_attribute( 'type' )
				&& ! isset( $contact_data['fname'] )
				&& ! empty( $field_data->value )
			) {
				// Use the first name field that's found.
				$name                  = explode( ' ', $field_data->value, 2 );
				$contact_data['fname'] = $name[0];
				if ( !empty( $name[1] ) ) {
					$contact_data['lname'] = $name[1];
				}
			}
		}
	}

	// If we couldn't find an email, bail.
	if ( empty( $contact_data['email'] ) ) {
		return;
	}

	// Add the external source.
	$contact_data['externalSources'] = array(
		array(
			'source' => 'jetpack_form',
			'origin' => $zbs->DAL->add_origin_prefix( site_url(), 'domain' ),
			'uid'    => $contact_data['email'],
		),
	);

	/*
	 * Get the form entry info for extra meta.
	 */
	$entry_title     = isset( $entry_values['entry_title'] ) ? $entry_values['entry_title'] : null;
	$entry_permalink = isset( $entry_values['entry_permalink'] ) ? $entry_values['entry_permalink'] : null;
	$feedback_id     = isset( $entry_values['feedback_id'] ) ? $entry_values['feedback_id'] : null;

	$extra_meta = array(
		'jp_form_entry_title'     => $entry_title,
		'jp_form_entry_permalink' => $entry_permalink,
		'jp_form_feedback_id'     => $feedback_id,
	);

	$new_user_form_source_short = 'Created from Jetpack Form <i class="fa fa-wpforms"></i>';
	$new_user_form_source_long  = 'User created from the form <span class="zbsEmphasis">' . $entry_title . '</span>,'
		. ' on page: <span class="zbsEmphasis">' . $entry_permalink . '</span>';

	$success_log = array(
		'note_override' =>
			array(
				'type'      => 'Form Filled',
				'shortdesc' => $new_user_form_source_short,
				'longdesc'  => $new_user_form_source_long,
			),
	);

	$existing_user_form_source_short = 'User completed Jetpack form <i class="fa fa-wpforms"></i>';
	$existing_user_form_source_long  = 'Form <span class="zbsEmphasis">' . $entry_title . '</span>,'
		. ' which was filled out from the page: <span class="zbsEmphasis">' . $entry_permalink . '</span>';

	$exists_log = array(
		'type'      => 'Form Filled',
		'shortdesc' => $existing_user_form_source_short,
		'longdesc'  => $existing_user_form_source_long,
	);

	//phpcs:ignore WordPress.NamingConventions.ValidVariableName.UsedPropertyNotSnakeCase
	$zbs->DAL->contacts->addUpdateContact(
		array(
			'data'                 => $contact_data,
			'automatorPassthrough' => $success_log,
			'fallBackLog'          => $exists_log,
			'extraMeta'            => $extra_meta,
		)
	);
}
