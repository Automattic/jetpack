<?php
/**
 * Global functions for Jetpack Forms field registration.
 *
 * These functions provide a WordPress-style API for registering custom form fields,
 * similar to register_post_type() and register_taxonomy().
 *
 * @package automattic/jetpack-forms
 */

use Automattic\Jetpack\Forms\ContactForm\Form_Field_Registry;

/**
 * Register a custom Jetpack form field type.
 *
 * This function provides a unified API for registering custom form fields,
 * similar to WordPress's register_post_type(). It handles block registration,
 * validation, frontend rendering, response value rendering, error messages,
 * and dashboard script registration.
 *
 * @since $$next-version$$
 *
 * @param string $field_type The field type identifier (e.g., 'color', 'rating').
 * @param array  $args       {
 *     Configuration arguments for the field type.
 *
 *     @type string   $block_name           Block name. Defaults to 'jetpack/field-{$field_type}'.
 *     @type array    $block_attributes     Block attributes definition.
 *     @type callable $render_callback      Block render callback. Receives ($atts, $content, $block).
 *                                          If not provided, uses default that calls Contact_Form::parse_contact_field().
 *     @type callable $validate_callback    Validation callback. Receives ($value, $label, $field).
 *                                          Return true for valid, string error message for invalid.
 *     @type callable $render_field         Frontend field render callback. Receives ($data).
 *                                          Return HTML string or null for default rendering.
 *     @type callable $render_value         Value render callback. Receives ($context, $value, $field).
 *                                          Context is 'email', 'web', 'ajax', 'csv', 'api'.
 *                                          Return rendered value or null for default.
 *     @type array    $error_messages       Associative array of error_key => message.
 *     @type string   $editor_script        URL to the editor script.
 *     @type array    $editor_script_deps   Editor script dependencies.
 *     @type string   $editor_script_ver    Editor script version.
 *     @type string   $dashboard_script     URL to the dashboard script.
 *     @type array    $dashboard_script_deps Dashboard script dependencies.
 *     @type string   $dashboard_script_ver Dashboard script version.
 * }
 * @return bool True on success, false on failure.
 */
function register_jetpack_form_field( $field_type, $args = array() ) {
	return Form_Field_Registry::register( $field_type, $args );
}

/**
 * Get a registered Jetpack form field type.
 *
 * @since $$next-version$$
 *
 * @param string $field_type The field type identifier.
 * @return array|null The field configuration or null if not registered.
 */
function get_jetpack_form_field( $field_type ) {
	return Form_Field_Registry::get( $field_type );
}

/**
 * Check if a Jetpack form field type is registered.
 *
 * @since $$next-version$$
 *
 * @param string $field_type The field type identifier.
 * @return bool True if registered, false otherwise.
 */
function jetpack_form_field_exists( $field_type ) {
	return Form_Field_Registry::is_registered( $field_type );
}
