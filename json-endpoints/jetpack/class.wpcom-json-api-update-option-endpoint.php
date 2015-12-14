<?php

class WPCOM_JSON_API_Update_Option_Endpoint extends WPCOM_JSON_API_Get_Option_Endpoint {
	public $option_value;

	function result() {
		if ( $this->site_option ) {
			update_site_option( $this->option_name, $this->option_value );
		} else {
			update_option( $this->option_name, $this->option_value );
		}
		return parent::result();
	}

	function validate_input( $object ) {
		$input = $this->input();
		if ( ! isset( $input['option_value'] ) || is_array( $input['option_value'] ) ) {
			return new WP_Error( 'option_value_not_set', __( 'You must specify an option_value', 'jetpack' ) );
		}
		$this->option_value = $input['option_value'];
		return parent::validate_input( $object );
	}
}
