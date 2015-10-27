<?php

class Jetpack_JSON_API_Update_Option_Endpoint extends Jetpack_JSON_API_Endpoint {

    // POST sites/$site/options
    protected function result() {
        if ( ! current_user_can( 'manage_options' ) ) {
            return new WP_Error( 'unauthorized', 'You are not authorized to manage options on this site.', 401 );
        }

        $args = $this->query_args();
        $input = $this->input();
        $option_name = $args['option_name'];

        if ( $args['site_option'] ) {
            update_site_option( $option_name, $input['option_value'] );
            $option_value = get_site_option( $option_name );
        } else {
            update_option( $option_name, $input['option_value'] );
            $option_value = get_option( $option_name );
        }

        return array( 'option_value' => $option_value );
    }
}

