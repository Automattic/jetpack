<?php
/**
 * Module Name: Contact Form
 * Module Description: Insert a customizable contact form anywhere on your site.
 * Jumpstart Description: Adds a button to your post and page editors, allowing you to build simple forms to help visitors stay in touch.
 * Sort Order: 15
 * Recommendation Order: 14
 * First Introduced: 1.3
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Other
 * Feature: Writing, Jumpstart
 * Additional Search Queries: contact, form, grunion, feedback, submission
 */

include dirname( __FILE__ ) . '/contact-form/grunion-contact-form.php';
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
