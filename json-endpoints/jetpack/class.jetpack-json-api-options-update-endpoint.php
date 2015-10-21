<?php

class Jetpack_JSON_API_Options_Update_Endpoint extends Jetpack_JSON_API_Options_Endpoint {
    // GET /sites/%s/options/$option
    protected $needed_capabilities = 'manage_options';
    protected $action = 'update';

    public function update() {
        $query_args = $this->query_args();
        $input = $this->input();
        if( $query_args['site_option'] ) {
            $result = update_site_option( $this->option_name, $input['value'] );
            $this->option_value = get_site_option( $this->option_name );
        } else {
            $result = update_option( $this->option_name, $input['value'] );
            $this->option_value = get_option( $this->option_name );
        }

        if ( ! $result ) {
            return new WP_Error( 'option_update_error', __( 'There was an error updating the option', 'jetpack' ), 400 );
        }

        return true;
    }

}
