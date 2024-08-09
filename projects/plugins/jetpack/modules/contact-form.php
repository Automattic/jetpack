<?php
/**
 * Contact form module.
 *
 * @package automattic/jetpack
 */

use Automattic\Jetpack\Forms\Jetpack_Forms;

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
 * Additional Search Queries: contact, form, grunion, feedback, submission, contact form, email, feedback, contact form plugin, custom form, custom form plugin, form builder, forms, form maker, survey, contact by jetpack, contact us, forms free, creator
 */

/**
 * Load the newer Jetpack Forms package.
 */
Jetpack_Forms::load_contact_form();
