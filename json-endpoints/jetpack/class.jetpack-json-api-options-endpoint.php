<?php

class Jetpack_JSON_API_Options_Endpoint extends Jetpack_JSON_API_Endpoint {
    // GET /sites/%s/options/$option
    protected $needed_capabilities = 'manage_options';
    protected $option_name;
    protected $option_value;

    function result() {
        return array( 'value' => $this->option_value );
    }

    protected function validate_input( $option ) {
        $args = $this->query_args();
        $this->option_name = $option;
        if( $args['site_option'] ) {
            $this->option_value = get_site_option( $option );
        } else {
            $this->option_value = get_option( $option );
        }
        return parent::validate_input( $option );
    }
}
