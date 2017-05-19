<?php

class WPCOM_JSON_API_Update_Option_Endpoint extends WPCOM_JSON_API_Get_Option_Endpoint {
    public $option_value;

    function callback( $path = '', $blog_id = 0 ) {
        $blog_id = $this->api->switch_to_blog_and_validate_user( $this->api->get_blog_id( $blog_id ) );
        if ( is_wp_error( $blog_id ) ) {
            return $blog_id;
        }

        if ( ! current_user_can( 'manage_options' ) ) {
            return new WP_Error( 'unauthorized', 'You are not authorized to manage options on this site.', 403 );
        }

        if ( ! $this->validate_input() ) {
            return new WP_Error( 'invalid_input', 'Invalid parameters.', 400 );
        }

        if ( $this->site_option ) {
            update_site_option( $this->option_name, $this->option_value );
            return array( 'option_value' => get_site_option( $this->option_name ) );
        } else {
            update_option( $this->option_name, $this->option_value );
            return array( 'option_value' => get_option( $this->option_name ) );
        }
    }

    function validate_input() {
        $input = $this->input();
        if ( ! isset( $input['option_value'] ) || is_array( $input['option_value'] ) ) {
            return false;
        }
        $this->option_value = $input['option_value'];
        return parent::validate_input();
    }
}
