<?php


/**
 * Class Jetpack_Protect_Blocked_Login_Page
 *
 * Instanciated on the wp-login page when Jetpack modules are loaded and $pagenow
 * is available, or during the login_head hook.
 *
 * Class will only be instanciated if Protect has detected a hard blocked IP address.
 *
 *
 */
class Jetpack_Protect_Blocked_Login_Page {

    public $can_send_recovery_emails;
    public $ip_address;
	public $valid_blocked_user_id;
	public $page_title;
    public $email_address;
    public $help_url = 'https://jetpack.com/support/security-features/#unblock';


	function __construct( $ip_address, $valid_blocked_user_id ) {
	    /**
	     * Filter controls if an email recovery form is shown to blocked IPs.
         *
         * A recovery form allows folks to re-gain access to the login form
         * via an email link if their IP was mistakenly blocked.
	     *
	     * @module protect
	     *
	     * @since 5.6
	     *
	     * @param bool $can_send_recovery_emails Defaults to true.
	     */
        $this->can_send_recovery_emails = apply_filters( 'jetpack_protect_can_send_recovery_emails', true );
        $this->ip_address = $ip_address;
        $this->valid_blocked_user_id = $valid_blocked_user_id;
    }

    public function is_blocked_user_valid() {
        if ( ! $this->can_send_recovery_emails ) {
            return false;
        }

	    if ( $this->valid_blocked_user_id ) {
	        return true;
        }

        if ( ! isset( $_GET['validate_jetpack_protect_recovery'], $_GET['user_id'] ) ) {
            return false;
        }

        if ( ! $this->is_valid_protect_recovery_key( $_GET['validate_jetpack_protect_recovery'], $_GET['user_id'] ) ) {
            return false;
        }

        $this->valid_blocked_user_id = $_GET['user_id'];
        return true;
    }

    public function is_valid_protect_recovery_key( $key, $user_id ) {

		$path   = sprintf( '/sites/%d/protect/recovery/confirm', Jetpack::get_option( 'id' ) );
		$response = Jetpack_Client::wpcom_json_api_request_as_blog(
			$path,
			'1.1',
			array(
				'method' => 'post'
			),
			array(
				'token' => $key,
				'user_id' => $user_id,
				'ip' => $this->ip_address,
			)
		);

        $result = json_decode( wp_remote_retrieve_body( $response ) );

		if ( is_wp_error( $result ) || empty( $result ) || isset( $result->error ) ) {
			return false;
		}
		return true;
	}

	public function render_and_die() {
		$this->page_title = __( 'Login Blocked by Jetpack', 'jetpack' );

		if ( ! $this->can_send_recovery_emails ) {
			$this->render_blocked_login_message();
			return;
		}

		if ( isset( $_GET['validate_jetpack_protect_recovery'] ) && $_GET['user_id'] ) {
			$this->protect_die( __( 'Could not validate recovery token.', 'jetpack' ) );
			return;
		}

		if (
			isset( $_GET['jetpack-protect-recovery'] ) &&
			isset( $_POST['_wpnonce'] ) &&
			wp_verify_nonce( $_POST['_wpnonce'], 'bypass-protect' )
		) {
			$this->process_recovery_email();
			return;
		}

		$this->render_recovery_form();
    }

    public function render_blocked_login_message() {
	    $this->protect_die( $this->get_html_blocked_login_message() );
    }

    function process_recovery_email() {
        $sent = $this->send_recovery_email();

        if ( is_wp_error( $sent ) ) {
            $this->protect_die( $sent, true );
        } else {
            $this->render_recovery_success();
        }
    }

    function send_recovery_email() {
	    $email = isset( $_POST['email'] ) ? $_POST['email'] : '';
	    if ( sanitize_email( $email ) !== $email || ! is_email( $email ) ) {
	        return new WP_Error( 'invalid_email', __( "Oops, looks like that's not the right email address. Please try again!", 'jetpack' ) );
	    }
	    $user = get_user_by('email', trim( $email ) );

	    if ( ! $user ) {
	        return new WP_Error( 'invalid_user', __( 'Oops, could not find a user with that email address.', 'jetpack' ) );
        }
        $this->email_address = $email;
	    $path   = sprintf( '/sites/%d/protect/recovery/request', Jetpack::get_option( 'id' ) );


	    $response = Jetpack_Client::wpcom_json_api_request_as_blog(
		    $path,
            '1.1',
		    array(
			    'method' => 'post'
		    ),
            array(
			    'user_id' => $user->ID,
			    'ip' => $this->ip_address
		    )
	    );

	    $code = wp_remote_retrieve_response_code( $response );
	    $result = json_decode( wp_remote_retrieve_body( $response ) );

	    if ( 429 === $code ) {
	        return new WP_Error( 'email_already_sent', __( 'An email was already sent to this address.', 'jetpack' ) );
        } else if ( is_wp_error( $result ) || empty( $result ) || isset( $result->error ) ) {
		    return new WP_Error( 'email_send_error', __( 'There was an error sending your email.', 'jetpack' ) );
	    }
	    return true;
    }

    function protect_die( $content, $back_link = false ) {
    	$image = sprintf(
    	        '<img src="%s" width="180" style="display: block; margin: 0 auto;" />',
                plugins_url( 'modules/protect/jetpack-security.png', JETPACK__PLUGIN_FILE )
        );

    	if ( is_wp_error( $content ) ) {
    	    $content = $content->get_error_message();
        }
	    // hack to get around default wp_die_handler. https://core.trac.wordpress.org/browser/tags/4.8.1/src/wp-includes/functions.php#L2698
	    $content = $image . '</p> ' . $content . '<p>';

    	wp_die( $content, $this->page_title, array( 'back_link' => $back_link ) );
    }

	function render_recovery_form() {
    	$content = $this->get_html_blocked_login_message() . $this->get_html_recovery_form();
		$this->protect_die( $content );
    }

    function render_recovery_success() {
    	$this->protect_die( sprintf( __( 'An email with recovery instructions was sent to %s.', 'jetpack' ), $this->email_address ) );
    }

    function get_html_blocked_login_message() {
    	return sprintf(
    		__( '<p>Your IP (%1$s) has been flagged for potential security violations.</p>', 'jetpack' ),
		        str_replace( 'http://', '', esc_url( 'http://' . $this->ip_address )
		    ) );
    }

    function get_html_recovery_form() {
	    ob_start(); ?>
	    <p><?php _e( 'Email yourself a special link to regain access the login form.', 'jetpack' ); ?></p>
	    <form method="post" action="?jetpack-protect-recovery=true">
		    <?php echo wp_nonce_field( 'bypass-protect' ); ?>
		    <label for="email">Email Address:</label>
		    <input type="email" name="email" />
		    <input type="submit" value="<?php echo esc_attr( __( 'Send', 'jetpack' ) ); ?>" />
	    </form>

	    <?php
	    $contents = ob_get_contents();
	    ob_end_clean();
	    return $contents;
    }
}
