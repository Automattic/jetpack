<?php

function jetpack_register_module( $slug, $args ) {
	$jetpack_modules_registry = Jetpack_Modules_Registry::get_instance();
	$jetpack_modules_registry->register( $slug, $args );
}

/**
 * Class Jetpack_Modules_Registry
 *
 * Class for keeping the state of all modules in memory.
 */
class Jetpack_Modules_Registry {

	private $modules = array();

	private static $instance = null;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	public function register( $slug, $args ) {
		$this->modules[ $slug ] = new Jetpack_Module( $slug, $args );
	}

	public function get_available_slugs() { // Jetpack::get_available_modules
		return array_keys( $this->modules );
	}

	public function get_module( $slug ) {
		return $this->modules[ $slug ]->_get_array();
	}

}
