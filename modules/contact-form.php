<?php
/**
 * Module Name: Contact Form
 * Module Description: Add a customizable contact form to any post or page using the Jetpack Form Block.
 * Sort Order: 15
 * Recommendation Order: 14
 * First Introduced: 1.3
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Other
 * Feature: Writing
 * Additional Search Queries: contact, form, grunion, feedback, submission, contact form, email, feedback, contact form plugin, custom form, custom form plugin, form builder, forms, form maker, survey, contact by jetpack, contact us, forms free
 */

require_once dirname( __FILE__ ) . '/contact-form/grunion-contact-form.php';
/*
 * Filters if the new Contact Form Editor View should be used.
 *
 * A temporary filter to disable the new Editor View for the older UI.
 * Please note this filter and the old UI will be removed in the future.
 * Expected to be removed in Jetpack 5.8 or if a security issue merits removing the old code sooner.
 *
 * @since 5.2.0
 *
 * @param boolean $view Use new Editor View. Default true.
 */
if ( is_admin() && apply_filters( 'tmp_grunion_allow_editor_view', true ) ) {
	require_once dirname( __FILE__ ) . '/contact-form/grunion-editor-view.php';
}
