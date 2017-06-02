<?php 

/**
 * A bridge between WP's built-in REST and Jetpack's XMLRPC server
 */
class Jetpack_XMLRPC_Fallback {
    private $xmlrpc_server;

    function init() {
        register_rest_route( 'jetpack/v1', '/verify_registration', array(
			'methods' => 'POST',
			'callback' => array( $this, 'verify_registration' ),
		) );

        // fallback for anything not yet converted
        register_rest_route( 'jetpack/v1', '/xmlrpc', array(
			'methods' => 'POST',
			'callback' => array( $this, 'xmlrpc_fallback' ),
		) );
    }

    function verify_registration( $request ) {
        $this->load_xmlrpc();
		return $this->xmlrpc_server->verify_registration( array( $request['secret_1'], $request['state'] ) );
	}

    // allow invocation of Jetpack XMLRPC, and a handful of core XMLRPC methods, over REST
    // does NOT allow random XMLRPC requests
    function xmlrpc_fallback( $request ) {
        $this->load_xmlrpc();
        $methods = $this->xmlrpc->xmlrpc_methods();
        error_log("xmlrpc fallback");
        error_log(print_r($methods,1));
    }

    private function load_xmlrpc() {
        if ( ! $this->xmlrpc_server ) {
            require_once JETPACK__PLUGIN_DIR . 'class.jetpack-xmlrpc-server.php';
            $this->xmlrpc_server = new Jetpack_XMLRPC_Server();
        }
    }
}