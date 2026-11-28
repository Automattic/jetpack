<?php
/**
 * Stands in for the Jetpack CRM plugin's form handler.
 *
 * @package automattic/jetpack-forms
 */

if ( ! defined( 'ZBS_TYPE_CONTACT' ) ) {
	define( 'ZBS_TYPE_CONTACT', 1 );
}

if ( ! function_exists( 'zero_bs_crm_capture_jetpack_form' ) ) {
	/**
	 * Records each call, as Jetpack CRM's handler would save a contact.
	 *
	 * @param int   $post_id      Feedback post ID.
	 * @param array $fields       The fields.
	 * @param bool  $is_spam      Whether it's spam.
	 * @param array $entry_values Entry values.
	 */
	function zero_bs_crm_capture_jetpack_form( $post_id, $fields, $is_spam, $entry_values ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$GLOBALS['jetpack_crm_stub_calls'][] = $fields;
	}
}
