<?php

use Automattic\Jetpack\Sync\Defaults;

class WPCOM_JSON_API_Get_Option_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $needed_capabilities = 'manage_options';

	public $option_name;
	public $site_option;

	function result() {
		if ( $this->site_option ) {
			return array( 'option_value' => get_site_option( $this->option_name ) );
		}
		return array( 'option_value' => get_option( $this->option_name ) );
	}

	function validate_input( $object ) {
		$query_args = $this->query_args();
		$this->option_name = isset( $query_args['option_name'] ) ? $query_args['option_name'] : false;
		if ( ! $this->option_name ) {
			return new WP_Error( 'option_name_not_set', __( 'You must specify an option_name', 'jetpack' ) );
		}
		$this->site_option = isset( $query_args['site_option'] ) ? $query_args['site_option'] : false;

		/**
		 * Filter the list of options that are manageable via the JSON API.
		 *
		 * @module json-api
		 *
		 * @since 3.8.2
		 *
		 * @param array The default list of site options.
		 * @param bool Is the option a site option.
		 */
		if ( ! in_array( $this->option_name, apply_filters( 'jetpack_options_whitelist', Defaults::$default_options_whitelist, $this->site_option ) ) ) {
			return new WP_Error( 'option_name_not_in_whitelist', __( 'You must specify a whitelisted option_name', 'jetpack' ) );
		}
		return true;
	}
}
