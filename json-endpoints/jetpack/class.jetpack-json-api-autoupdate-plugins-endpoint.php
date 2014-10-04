<?php

class Jetpack_JSON_API_Autoupdate_Plugins_Endpoint extends Jetpack_JSON_API_Plugins_Endpoint {

	// POST /sites/%s/autoupdate/plugins
    protected $autoupdate;
    protected $autoupdate_plugins;
    protected $jetpack_options;

	public function callback( $path = '', $blog_id = 0, $plugin = null ) {
        if ( is_wp_error( $error = $this->validate_call( $blog_id, 'update_plugins' ) ) ) {
            return $error;
        }
        if ( is_wp_error( $error = $this->validate_input( $plugin ) ) ) {
            return $error;
        }
        if ( is_wp_error( $error = $this->validate_plugins() ) ) {
            return new WP_Error( 'unknown_plugin', $error->get_error_messages() , 404 );
        }
        if ( is_wp_error( $error = $this->validate_autoupdate() ) ) {
            return new WP_Error( 'autoupdate_error', $error->get_error_messages() , 404 );
        }

        $this->jetpack_options    = new Jetpack_Options();
        $this->autoupdate_plugins = $this->jetpack_options->get_option( 'autoupdate_plugins', array() );

        if( $this->autoupdate ) {
            $this->flag_autoupdate();
        } else {
            $this->unflag_autoupdate();
        }

        $response = array(
            'plugins'    => $this->plugins,
            'autoupdate' => $this->autoupdate,
        );
        return $response;
	}

    protected function flag_autoupdate() {
        foreach( $this->plugins as $p ) {
            if( ! in_array( $p, $this->autoupdate_plugins ) ) {
                $this->autoupdate_plugins[] = $p;
            }
        }
        $this->jetpack_options->update_option( 'autoupdate_plugins', $this->autoupdate_plugins );
    }

    protected function unflag_autoupdate() {
        foreach( $this->autoupdate_plugins as $k => $v ) {
            if( in_array( $v, $this->plugins ) ) {
                unset( $this->autoupdate_plugins[$k] );
            }
        }
        $this->jetpack_options->update_option( 'autoupdate_plugins', $this->autoupdate_plugins );
    }

    protected function validate_autoupdate() {
        $args = $this->input();
        if( ! isset( $args['autoupdate'] ) || ! is_bool( $args['autoupdate'] ) ) {
            return new WP_Error( 'missing_parameter', __( 'You did not specify an autoupdate parameter.', 'jetpack' ), 400 );
        }
        $this->autoupdate = $args['autoupdate'];
        return true;
    }
}
