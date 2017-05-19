<?php

class WPCOM_JSON_API_Get_Option_Endpoint extends WPCOM_JSON_API_Endpoint {

    public $option_name;
    public $site_option;
    public $option_whitelist = array(
        'blogname'
    );
    public $site_option_whitelist = array();

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
            return array( 'option_value' => get_site_option( $this->option_name ) );
        } else {
            return array( 'option_value' => get_option( $this->option_name ) );
        }

    }

    function validate_input() {
        $query_args = $this->query_args();
        $this->option_name = isset( $query_args['option_name'] ) ? $query_args['option_name'] : false;
        $this->site_option = isset( $query_args['site_option'] ) ? $query_args['site_option'] : false;
        if ( ! $this->option_name ) {
            return false;
        }
        if ( $this->site_option ) {
            return in_array( $this->option_name, apply_filters( 'jetpack_site_option_whitelist', $this->site_option_whitelist ) );
        } else {
            return in_array( $this->option_name, apply_filters( 'jetpack_option_whitelist', $this->option_whitelist ) );
        }
    }
}
