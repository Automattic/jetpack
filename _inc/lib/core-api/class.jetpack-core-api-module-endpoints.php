<?php
/**
 * This is the base class for every Core API endpoint Jetpack uses.
 *
 */
class Jetpack_Core_API_Module_Toggle_Endpoint
	extends Jetpack_Core_API_XMLRPC_Consumer_Endpoint {

	/**
	 * List of modules that require WPCOM public access.
	 *
	 * @since 4.3
	 *
	 * @var array
	 */
	private $modules_requiring_public = array(
		'photon',
		'enhanced-distribution',
		'json-api',
	);

	/**
	 * Check if the module requires the site to be publicly accessible from WPCOM.
	 * If the site meets this requirement, the module is activated. Otherwise an error is returned.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 *     @type bool   $active should module be activated.
	 * }
	 *
	 * @return WP_REST_Response|WP_Error A REST response if the request was served successfully, otherwise an error.
	 */
	public function process( $data ) {
		if ( $data['active'] ) {
			return $this->activate_module( $data );
		} else {
			return $this->deactivate_module( $data );
		}
	}

	/**
	 * If it's a valid Jetpack module, activate it.
	 *
	 * @since 4.1.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function activate_module( $data ) {
		if ( ! Jetpack::is_module( $data['slug'] ) ) {
			return new WP_Error(
				'not_found',
				esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		if (
			in_array( $data['slug'], $this->modules_requiring_public )
			&& ! $this->is_site_public()
		) {
			return new WP_Error(
				'rest_cannot_publish',
				__( 'This module requires your site to be set to publicly accessible.', 'jetpack' ),
				array( 'status' => 424 )
			);
		}

		if ( Jetpack::activate_module( $data['slug'], false, false ) ) {
			return rest_ensure_response( array(
				'code' 	  => 'success',
				'message' => esc_html__( 'The requested Jetpack module was activated.', 'jetpack' ),
			) );
		}

		return new WP_Error(
			'activation_failed',
			esc_html__( 'The requested Jetpack module could not be activated.', 'jetpack' ),
			array( 'status' => 424 )
		);
	}

	/**
	 * If it's a valid Jetpack module, deactivate it.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return bool|WP_Error True if module was activated. Otherwise, a WP_Error instance with the corresponding error.
	 */
	public function deactivate_module( $data ) {
		if ( ! Jetpack::is_module( $data['slug'] ) ) {
			return new WP_Error(
				'not_found',
				esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
				array( 'status' => 404 )
			);
		}

		if ( ! Jetpack::is_module_active( $data['slug'] ) ) {
			return new WP_Error(
				'already_inactive',
				esc_html__( 'The requested Jetpack module was already inactive.', 'jetpack' ),
				array( 'status' => 409 )
			);
		}

		if ( Jetpack::deactivate_module( $data['slug'] ) ) {
			return rest_ensure_response( array(
				'code' 	  => 'success',
				'message' => esc_html__( 'The requested Jetpack module was deactivated.', 'jetpack' ),
			) );
		}
		return new WP_Error(
			'deactivation_failed',
			esc_html__( 'The requested Jetpack module could not be deactivated.', 'jetpack' ),
			array( 'status' => 400 )
		);
	}

	/**
	 * Check that the current user has permissions to manage Jetpack modules.
	 *
	 * @since 4.3
	 *
	 * @return bool
	 */
	public function can_write() {
		return current_user_can( 'jetpack_manage_modules' );
	}
}

class Jetpack_Core_API_Module_Endpoint {

	/**
	 * Get a list of all Jetpack modules and their information.
	 *
	 * @since 4.3.0
	 *
	 * @return array Array of Jetpack modules.
	 */
	public function process( $data ) {
		require_once( JETPACK__PLUGIN_DIR . 'class.jetpack-admin.php' );

		$modules = Jetpack_Admin::init()->get_modules();
		foreach ( $modules as $slug => $properties ) {
			$modules[ $slug ]['options'] =
				Jetpack_Core_Json_Api_Endpoints::prepare_options_for_response( $slug );
			if (
				isset( $modules[ $slug ]['requires_connection'] )
				&& $modules[ $slug ]['requires_connection']
				&& Jetpack::is_development_mode()
			) {
				$modules[ $slug ]['activated'] = false;
			}
		}

		return $modules;
	}

	public function can_read() {
		return current_user_can( 'jetpack_admin_page' );
	}
}

class Jetpack_Core_API_Module_Get_Endpoint {

	/**
	 * Get information about a specific and valid Jetpack module.
	 *
	 * @since 4.3.0
	 *
	 * @param WP_REST_Request $data {
	 *     Array of parameters received by request.
	 *
	 *     @type string $slug Module slug.
	 * }
	 *
	 * @return mixed|void|WP_Error
	 */
	public static function process( $data ) {
		if ( Jetpack::is_module( $data['slug'] ) ) {

			$module = Jetpack::get_module( $data['slug'] );

			$module['options'] = Jetpack_Core_Json_Api_Endpoints::prepare_options_for_response( $data['slug'] );

			if (
				isset( $module['requires_connection'] )
				&& $module['requires_connection']
				&& Jetpack::is_development_mode()
			) {
				$module['activated'] = false;
			}

			return $module;
		}

		return new WP_Error(
			'not_found',
			esc_html__( 'The requested Jetpack module was not found.', 'jetpack' ),
			array( 'status' => 404 )
		);
	}

	public function can_read() {
		return current_user_can( 'jetpack_admin_page' );
	}
}