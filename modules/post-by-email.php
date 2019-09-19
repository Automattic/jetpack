<?php

/**
 * Module Name: Post by email
 * Module Description: Publish posts by sending an email
 * First Introduced: 2.0
 * Sort Order: 14
 * Requires Connection: Yes
 * Auto Activate: No
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: post by email, email
 */

add_action( 'jetpack_modules_loaded', array( 'Jetpack_Post_By_Email', 'init' ) );

Jetpack::enable_module_configurable( __FILE__ );

class Jetpack_Post_By_Email {
	public static function init() {
		static $instance = NULL;

		if ( !$instance ) {
			$instance = new Jetpack_Post_By_Email;
		}

		return $instance;
	}

	function __construct() {
		add_action( 'init', array( &$this, 'action_init' ) );
	}

	function action_init() {
		if ( ! current_user_can( 'edit_posts' ) )
			return;

		add_action( 'profile_personal_options', array( &$this, 'user_profile' ) );
		add_action( 'admin_print_scripts-profile.php', array( &$this, 'profile_scripts' ) );

		add_action( 'wp_ajax_jetpack_post_by_email_enable', array( &$this, 'create_post_by_email_address' ) );
		add_action( 'wp_ajax_jetpack_post_by_email_regenerate', array( &$this, 'regenerate_post_by_email_address' ) );
		add_action( 'wp_ajax_jetpack_post_by_email_disable', array( &$this, 'delete_post_by_email_address' ) );
	}

	function profile_scripts() {
		wp_enqueue_script( 'post-by-email', plugins_url( 'post-by-email/post-by-email.js', __FILE__ ), array( 'jquery' ) );
		wp_localize_script( 'post-by-email', 'pbeVars', array(
			'nonces' => array(
				'enable'     => wp_create_nonce( 'jetpack.createPostByEmailAddress' ),
				'regenerate' => wp_create_nonce( 'jetpack.regeneratePostByEmailAddress' ),
				'disable'    => wp_create_nonce( 'jetpack.deletePostByEmailAddress' ),
			),
		));
		wp_enqueue_style( 'post-by-email', plugins_url( 'post-by-email/post-by-email.css', __FILE__ ) );
		wp_style_add_data( 'post-by-email', 'jetpack-inline', true );
		// Do we really need `admin_styles`? With the new admin UI, it's breaking some bits.
		// Jetpack::init()->admin_styles();
	}

	function check_user_connection() {
		$user_token = Jetpack_Data::get_access_token( get_current_user_id() );
		$is_user_connected = $user_token && !is_wp_error( $user_token );

		// If the user is already connected via Jetpack, then we're good
		if ( $is_user_connected )
			return true;

		return false;
	}

	function user_profile() {
		$blog_name = get_bloginfo( 'blogname' );
		if ( empty( $blog_name ) ) {
			$blog_name = home_url( '/' );
		}

		?>
		<div id="post-by-email" class="jetpack-targetable">
		<h3><?php esc_html_e( 'Post by Email', 'jetpack' ); ?></h3>
		<table class="form-table">
			<tr>
				<th scope="row"><?php esc_html_e( 'Email Address', 'jetpack' ); ?><span id="jp-pbe-spinner" class="spinner"></span></th>
				<td>
				<div id="jp-pbe-error" class="jetpack-inline-error"></div> <?php

				if ( $this->check_user_connection() ) {
					$email = $this->get_post_by_email_address();

					if ( empty( $email ) ) {
						$enable_hidden = '';
						$info_hidden = ' style="display: none;"';
					} else {
						$enable_hidden = ' style="display: none;"';
						$info_hidden = '';
					} ?>

					<input type="button" name="jp-pbe-enable" id="jp-pbe-enable" class="button" value="<?php esc_attr_e( 'Enable Post By Email', 'jetpack' ); ?> "<?php echo $enable_hidden; ?> />
					<div id="jp-pbe-info"<?php echo $info_hidden; ?>>
						<p id="jp-pbe-email-wrapper">
							<input type="text" id="jp-pbe-email" value="<?php echo esc_attr( $email ); ?>" readonly="readonly" class="regular-text" />
							<span class="description"><a target="_blank" href="https://jetpack.com/support/post-by-email/"><?php esc_html_e( 'More information', 'jetpack' ); ?></a></span>
						</p>
						<p>
							<input type="button" name="jp-pbe-regenerate" id="jp-pbe-regenerate" class="button" value="<?php esc_attr_e( 'Regenerate Address', 'jetpack' ); ?> " />
							<input type="button" name="jp-pbe-disable" id="jp-pbe-disable" class="button" value="<?php esc_attr_e( 'Disable Post By Email', 'jetpack' ); ?> " />
						</p>
					</div> <?php
				} else {
					$jetpack = Jetpack::init(); ?>

					<p class="jetpack-inline-message">
						<?php printf(
							esc_html( wptexturize( __( 'To use Post By Email, you need to link your %s account to your WordPress.com account.', 'jetpack' ) ) ),
							'<strong>' . esc_html( $blog_name ) . '</strong>'
						); ?><br />
						<?php echo esc_html( wptexturize( __( "If you don't have a WordPress.com account yet, you can sign up for free in just a few seconds.", 'jetpack' ) ) ); ?>
					</p>
					<p>
						<a href="<?php echo $jetpack->build_connect_url( false, get_edit_profile_url( get_current_user_id() ) . '#post-by-email', 'unlinked-user-pbe' ); ?>" class="button button-connector" id="wpcom-connect"><?php esc_html_e( 'Link account with WordPress.com', 'jetpack' ); ?></a>
					</p>
					<?php
				} ?>
				</td>
			</tr>
		</table>
		</div>
	<?php
	}

	function get_post_by_email_address() {
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
		) );
		$xml->query( 'jetpack.getPostByEmailAddress' );

		if ( $xml->isError() )
			return NULL;

		$response = $xml->getResponse();
		if ( empty( $response ) )
			return NULL;

		return $response;
	}

	function create_post_by_email_address() {
		self::__process_ajax_proxy_request(
			'jetpack.createPostByEmailAddress',
			__( 'Unable to create your Post By Email address. Please try again later.', 'jetpack' )
		);
	}

	function regenerate_post_by_email_address() {
		self::__process_ajax_proxy_request(
			'jetpack.regeneratePostByEmailAddress',
			__( 'Unable to regenerate your Post By Email address. Please try again later.', 'jetpack' )
		);
	}

	function delete_post_by_email_address() {
		self::__process_ajax_proxy_request(
			'jetpack.deletePostByEmailAddress',
			__( 'Unable to disable your Post By Email address. Please try again later.', 'jetpack' )
		);
	}

	/**
	 * Back end function to abstract the xmlrpc function calls to wpcom.
	 *
	 * @param $endpoint
	 * @param $error_message
	 */
	function __process_ajax_proxy_request( $endpoint, $error_message ) { // phpcs:ignore
		if ( ! current_user_can( 'edit_posts' ) ) {
			wp_send_json_error( $error_message );
		}
		if ( empty( $_REQUEST['pbe_nonce'] ) || ! wp_verify_nonce( $_REQUEST['pbe_nonce'], $endpoint ) ) {
			wp_send_json_error( $error_message );
		}

		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
		) );
		$xml->query( $endpoint );

		if ( $xml->isError() ) {
			wp_send_json_error( $error_message );
		}

		$response = $xml->getResponse();
		if ( empty( $response ) ) {
			wp_send_json_error( $error_message );
		}

		// Will be used only in Jetpack_Core_Json_Api_Endpoints::get_remote_value.
		update_option( 'post_by_email_address' . get_current_user_id(), $response );

		wp_send_json_success( $response );
	}
}
