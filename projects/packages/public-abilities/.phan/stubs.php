<?php
/**
 * Stubs for WordPress Abilities API functions and classes.
 *
 * These are minimal stubs for static analysis only. They are not loaded at runtime.
 *
 * @package automattic/jetpack-public-abilities
 * phpcs:ignoreFile -- Phan stubs, not production code.
 */

/**
 * Minimal stub for WP_Ability.
 */
class WP_Ability {
	/**
	 * @param string $name Ability name.
	 * @param array  $args Ability arguments.
	 */
	public function __construct( string $name, array $args ) {}

	/** @return string */
	public function get_name(): string {
		return '';
	}

	/** @return string */
	public function get_label(): string {
		return '';
	}

	/** @return string */
	public function get_description(): string {
		return '';
	}

	/** @return string */
	public function get_category(): string {
		return '';
	}

	/** @return array */
	public function get_input_schema(): array {
		return array();
	}

	/** @return array */
	public function get_output_schema(): array {
		return array();
	}

	/** @return array */
	public function get_meta(): array {
		return array();
	}

	/**
	 * @param mixed $input Input data.
	 * @return bool|WP_Error
	 */
	public function check_permissions( $input = null ) {
		return true;
	}

	/**
	 * @param mixed $input Input data.
	 * @return mixed|WP_Error
	 */
	public function execute( $input = null ) {
		return null;
	}
}

/**
 * @return array<WP_Ability>
 */
function wp_get_abilities(): array {
	return array();
}

/**
 * @param string $name Ability name.
 * @param array  $args Ability arguments.
 * @return WP_Ability|null
 */
function wp_register_ability( string $name, array $args ): ?WP_Ability {
	return null;
}
