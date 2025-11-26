<?php
/**
 * Stubs for the WordPress Abilities API.
 *
 * @package automattic/jetpack
 */

/**
 * Class WP_Ability
 *
 * Stub for the WordPress Abilities API WP_Ability class.
 */
class WP_Ability {
	/**
	 * Get the ability name.
	 *
	 * @return string
	 */
	public function get_name() {}

	/**
	 * Get the ability label.
	 *
	 * @return string
	 */
	public function get_label() {}

	/**
	 * Get the ability description.
	 *
	 * @return string
	 */
	public function get_description() {}

	/**
	 * Get the ability category.
	 *
	 * @return string
	 */
	public function get_category() {}

	/**
	 * Get the input schema.
	 *
	 * @return array
	 */
	public function get_input_schema() {}

	/**
	 * Get the output schema.
	 *
	 * @return array
	 */
	public function get_output_schema() {}

	/**
	 * Execute the ability.
	 *
	 * @param mixed $input Optional input data.
	 * @return mixed|WP_Error
	 */
	public function execute( $input = null ) {}
}

/**
 * Register an ability with the WordPress Abilities API.
 *
 * @param string $name Unique identifier for the ability.
 * @param array  $args {
 *     Array of arguments for registering the ability.
 *
 *     @type string   $label               Human-readable label.
 *     @type string   $description         Description of the ability.
 *     @type string   $category            Category slug.
 *     @type array    $input_schema        JSON Schema for input validation.
 *     @type array    $output_schema       JSON Schema for output.
 *     @type callable $execute_callback    Callback to execute the ability.
 *     @type callable $permission_callback Callback to check permissions.
 *     @type array    $meta                Additional metadata.
 * }
 * @return WP_Ability|WP_Error The registered ability or error.
 */
function wp_register_ability( $name, $args ) {}

/**
 * Register an ability category.
 *
 * @param string $slug Category slug.
 * @param array  $args {
 *     Array of arguments for the category.
 *
 *     @type string $label       Human-readable label.
 *     @type string $description Description of the category.
 * }
 * @return bool|WP_Error True on success, WP_Error on failure.
 */
function wp_register_ability_category( $slug, $args ) {}

/**
 * Get a registered ability.
 *
 * @param string $name The ability name.
 * @return WP_Ability|null The ability or null if not found.
 */
function wp_get_ability( $name ) {}

/**
 * Get all registered abilities.
 *
 * @return array<string, WP_Ability> Array of abilities keyed by name.
 */
function wp_get_abilities() {}

/**
 * Check if an ability is registered.
 *
 * @param string $name The ability name.
 * @return bool True if registered.
 */
function wp_has_ability( $name ) {}
