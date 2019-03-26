<?php

function jetpack_register_module( $slug, $args ) {
	$jetpack_module_regestry = Jetpack_Modules_Registry::get_intance();
	$jetpack_module_regestry->register( $slug, $args );
}

/**
 * Class Jetpack_Modules_Registry
 *
 * Class for keeping the state of all things modules in memory
 */
class Jetpack_Modules_Registry {
	private $modules;

	public static function get_instance() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	public function get_all() { // Jetpack::get_available_modules
		// todo

	}

	public function get( $slug ) {
		return $this->modules[ $slug ];
	}

	public function register( $slug, $args ) {
		$this->modules[ $slug ] = new Jetpack_Module( $slug, $args );
	}

}


class Jetpack_Module {
	public $slug;

	public $name;                       // Module Name
	public $description;                // Module Description
	public $jumpstart_desc;             // Jumpstart Description
	public $sort;                       // Sort Order
	public $recommendation_order;       // Recommendation Order
	public $introduced;                 // First Introduced
	public $changed;                    // Major Changes In
	public $deactivate;                 // Deactivate
	public $free;                       // Free
	public $requires_connection;        // Requires Connection
	public $auto_activate;              // Auto Activate
	public $module_tags;                // Module Tags
	public $feature;                    // Feature
	public $additional_search_queries;  // Additional Search Queries
	public $plan_classes;               // Plans

	public function __construct( $module, $args = array() ) {
		$this->slug = $module;

		$this->set_props( $args );
		$this->is_avalable = $this->is_module_available( $module );
	}

	private function set_props( $args ) {
		foreach ( $args as $property_name => $property_value ) {
			$this->$property_name = $property_value;
		}
	}
}