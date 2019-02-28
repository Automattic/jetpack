<?php

/**
 * Class Jetpack_Module
 *
 */
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
	}

	private function set_props( $args ) {
		$default_args = array(
			'jumpstart_desc' => '',
			'changed' => '',
			'deactivate' => true,
			'recommendation_order' => 20,
			'auto_activate' => 'No',
			'free' => true,
			'plan_classes' => array( 'free' ),
			'feature' => array( _x( 'Other', 'Feature', 'jetpack' ) ),
			'module_tags' => array( _x( 'Other', 'Module Tag', 'jetpack' ) )
		);

		$args = wp_parse_args(
			$args,
			$default_args
		);
		foreach ( $args as $property_name => $property_value ) {
			$this->$property_name = $property_value;
		}
	}

	public function _get_array() {
		$module_array = get_object_vars( $this );
		$slug =  $module_array['slug'];
		unset( $module_array['slug'] ); // this is not something that is expected.

		/**
		 * Filters the feature array on a module.
		 *
		 * This filter allows you to control where each module is filtered: Recommended,
		 * Jumpstart, and the default "Other" listing.
		 *
		 * @since 3.5.0
		 *
		 * @param array   $module_array['feature'] The areas to feature this module:
		 *     'Jumpstart' adds to the "Jumpstart" option to activate many modules at once.
		 *     'Recommended' shows on the main Jetpack admin screen.
		 *     'Other' should be the default if no other value is in the array.
		 * @param string  $slug The slug of the module, e.g. sharedaddy.
		 * @param array   $mod All the currently assembled module data.
		 */
		$module_array['feature'] = apply_filters( 'jetpack_module_feature', $module_array['feature'], $slug, $module_array );

		/**
		 * Filter the returned data about a module.
		 *
		 * This filter allows overriding any info about Jetpack modules. It is dangerous,
		 * so please be careful.
		 *
		 * @since 3.6.0
		 *
		 * @param array   $mod    The details of the requested module.
		 * @param string  $slug The slug of the module, e.g. sharedaddy
		 * @param string  $file   The path to the module source file.
		 */
		return apply_filters( 'jetpack_get_module', $module_array, $slug, $this->file_path() );
		return $module_array;
	}

	private function file_path() {
		return JETPACK__PLUGIN_DIR . "modules/{$this->slug}.php";
	}
}