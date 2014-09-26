<?php

include JETPACK__PLUGIN_DIR . '/modules/module-info.php';

/**
 * Base class for Jetpack Endpoints, has the validate_call helper function.
 */
abstract class Jetpack_JSON_API_Endpoint extends WPCOM_JSON_API_Endpoint {

	/**
	 * Switches to the blog and checks current user capabilities.
	 * @return bool|WP_Error a WP_Error object or true if things are good.
	 */
	protected function validate_call( $_blog_id, $capability, $check_full_management = true ) {
		$blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $_blog_id ) );
		if ( is_wp_error( $blog_id ) ) {
			return $blog_id;
		}

		if ( is_wp_error( $error = $this->check_capability( $capability ) ) ) {
			return $error;
		}

		if ( $check_full_management && ! Jetpack_Options::get_option( 'json_api_full_management' ) ) {
			return new WP_Error( 'unauthorized_full_access', sprintf( __( 'Full management mode is off for this site.' , 'jetpack' ), $capability ), 403 );
		}
		return true;
	}

	/**
	 * @param $capability
	 *
	 * @return bool|WP_Error
	 */
	protected function check_capability( $capability ) {
		if ( is_array( $capability ) ) {
			// the idea is that the we can pass in an array of capabilitie that the user needs to have before we allowing them to do something
			$capabilities = ( isset( $capability['capabilities'] ) ? $capability['capabilities'] : $capability );

			// We can pass in the number of conditions we must pass by default it is all.
			$must_pass = ( isset( $capability['must_pass'] ) && is_int( $capability['must_pass'] ) ? $capability['must_pass'] : count( $capabilities ) );

			$failed = array(); // store the failed capabilities
			$passed = 0; //

			foreach ( $capabilities as $cap ) {
				if ( current_user_can( $cap ) ) {
					$passed ++;
				} else {
					$failed[] = $cap;
				}
			}
			// Check that must have conditions is less then
			if ( $passed < $must_pass ) {
				return new WP_Error( 'unauthorized', sprintf( __( 'This user is not authorized to %s on this blog.', 'jetpack' ), implode( ', ', $failed ), 403 ) );
			}

		} else {
			if ( !current_user_can( $capability ) ) {
				return new WP_Error( 'unauthorized', sprintf( __( 'This user is not authorized to %s on this blog.', 'jetpack' ), $capability ), 403 );
			}
		}

		return true;
	}

}
