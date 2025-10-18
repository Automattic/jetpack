<?php
/**
 * Toggle Jetpack Module Ability for Jetpack AI POC.
 *
 * @package automattic/jetpack-ai-poc
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Class Jetpack_AI_POC_Ability_Toggle_Module
 *
 * Toggles any Jetpack module by slug.
 */
class Jetpack_AI_POC_Ability_Toggle_Module {

	/**
	 * Execute the toggle module ability.
	 *
	 * @param array $input Input parameters from the Abilities API.
	 * @return array|WP_Error Result or error.
	 */
	public static function execute( $input ) {
		$module = isset( $input['module'] ) ? $input['module'] : '';
		$action = isset( $input['action'] ) ? $input['action'] : 'enable';

		if ( empty( $module ) ) {
			return new WP_Error(
				'missing_module',
				__( 'Module slug is required.', 'jetpack-ai-poc' )
			);
		}

		// Check if Jetpack is available.
		if ( ! class_exists( 'Jetpack' ) ) {
			return new WP_Error(
				'jetpack_not_available',
				__( 'Jetpack is not available', 'jetpack-ai-poc' )
			);
		}

		// Get available modules.
		$available_modules = Jetpack::get_available_modules();
		if ( ! in_array( $module, $available_modules, true ) ) {
			return new WP_Error(
				'invalid_module',
				sprintf(
					/* translators: %s: module slug */
					__( 'Module "%s" is not available. Available modules: %s', 'jetpack-ai-poc' ),
					$module,
					implode( ', ', $available_modules )
				)
			);
		}

		try {
			if ( 'enable' === $action ) {
				$result = Jetpack::activate_module( $module, false, false );
			} else {
				$result = Jetpack::deactivate_module( $module );
			}

			if ( is_wp_error( $result ) ) {
				return $result;
			}

			$is_active = Jetpack::is_module_active( $module );

			return array(
				'success' => true,
				'message' => sprintf(
					/* translators: 1: module slug, 2: enabled or disabled */
					__( 'Successfully %2$s module: %1$s', 'jetpack-ai-poc' ),
					$module,
					'enable' === $action ? __( 'enabled', 'jetpack-ai-poc' ) : __( 'disabled', 'jetpack-ai-poc' )
				),
				'module'  => array(
					'slug'   => $module,
					'active' => $is_active,
				),
			);
		} catch ( Exception $e ) {
			return new WP_Error(
				'module_toggle_exception',
				sprintf(
					/* translators: 1: module name, 2: error message */
					__( 'Error toggling module %1$s: %2$s', 'jetpack-ai-poc' ),
					$module,
					$e->getMessage()
				)
			);
		}
	}

	/**
	 * Get list of available Jetpack modules.
	 *
	 * @return array List of modules with their status.
	 */
	public static function get_available_modules() {
		if ( ! class_exists( 'Jetpack' ) ) {
			return array(
				'success' => false,
				'message' => 'Jetpack is not available',
			);
		}

		$available_modules = Jetpack::get_available_modules();
		$modules_list      = array();

		foreach ( $available_modules as $module_slug ) {
			$modules_list[] = array(
				'slug'   => $module_slug,
				'active' => Jetpack::is_module_active( $module_slug ),
			);
		}

		return array(
			'success' => true,
			'modules' => $modules_list,
		);
	}
}
