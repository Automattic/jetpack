<?php

/**
 * Base class for working with Jetpack Modules.
 */
abstract class Jetpack_JSON_API_Modules_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $module_slug;
	protected $action;

	static $_response_format = array(
		'id'          => '(string)   The module\'s ID',
		'active'      => '(boolean)  The module\'s status.',
		'name'        => '(string)   The module\'s name.',
		'description' => '(safehtml) The module\'s description.',
		'sort'        => '(int)      The module\'s display order.',
		'introduced'  => '(string)   The Jetpack version when the module was introduced.',
		'changed'     => '(string)   The Jetpack version when the module was changed.',
		'free'        => '(boolean)  The module\'s Free or Paid status.',
		'module_tags' => '(array)    The module\'s tags.'
	);

	protected static function format_module( $module_slug ) {
		$module_data = Jetpack::get_module( $module_slug );


		$module = array();
		$module['id']                = $module_slug;
		$module['active']            = Jetpack::is_module_active( $module_slug );
		$module['name']              = $module_data['name'];
		$module['short_description'] = $module_data['description'];
		$module['sort']              = $module_data['sort'];
		$module['introduced']        = $module_data['introduced'];
		$module['changed']           = $module_data['changed'];
		$module['free']              = $module_data['free'];
		$module['module_tags']       = $module_data['module_tags'];

		// Fetch the HTML formatted long description
		ob_start();
		if ( Jetpack::is_active() && has_action( 'jetpack_module_more_info_connected_' . $module_slug ) ) {
			do_action( 'jetpack_module_more_info_connected_' . $module_slug );
		} else {
			do_action( 'jetpack_module_more_info_' . $module_slug );
		}
		$module['description']  = ob_get_clean();

		return $module;
	}

	public function callback( $path = '', $blog_id = 0, $module_slug = '' ) {
		if ( is_wp_error( $error = $this->validate_call( $blog_id, 'jetpack_manage_modules', true ) ) ) {
			return $error;
		}
		if ( ! Jetpack::is_module( $module_slug ) ) {
			return new WP_Error( 'unknown_jetpack_module', sprintf( __( 'Module not found: `%s`.', 'jetpack' ), $module_slug ), 404 );
		}

		$this->module_slug = $module_slug;

		if ( ! empty( $this->action ) &&  is_wp_error( $error = call_user_func( array( $this, $this->action ) ) ) ) {
			return $error;
		}

		return self::get_module( $module_slug );
	}

	protected static function get_module( $module_slug ) {
		if ( ! Jetpack::is_module( $module_slug ) )
			return new WP_Error( 'unknown_jetpack_module', sprintf( __( 'Module not found: `%s`.', 'jetpack' ), $module_slug ), 404 );
		return self::format_module( $module_slug );
	}
}
