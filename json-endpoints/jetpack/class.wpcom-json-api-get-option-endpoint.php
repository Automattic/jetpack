<?php

class WPCOM_JSON_API_Get_Option_Endpoint extends Jetpack_JSON_API_Endpoint {

	protected $needed_capabilities = 'manage_options';

	public $option_name;
	public $site_option;
	public $option_whitelist = array(
		'blogname'
	);
	public $site_option_whitelist = array();

	function result() {
		if ( $this->site_option ) {
			return array( 'option_value' => get_site_option( $this->option_name ) );
		}
		return array( 'option_value' => get_option( $this->option_name ) );
	}


	function validate_input( $object ) {
		$query_args = $this->query_args();
		$this->option_name = isset( $query_args['option_name'] ) ? $query_args['option_name'] : false;
		$this->site_option = isset( $query_args['site_option'] ) ? $query_args['site_option'] : false;
		if ( ! $this->option_name ) {
			return new WP_Error( 'option_name_not_set', __( 'You must specify an option_name', 'jetpack' ) );
		}
		if ( $this->site_option ) {
			return in_array( $this->option_name, apply_filters( 'jetpack_site_option_whitelist', $this->site_option_whitelist ) );
		}
		return in_array( $this->option_name, apply_filters( 'jetpack_option_whitelist', $this->option_whitelist ) );
	}
}
