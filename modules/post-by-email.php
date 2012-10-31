<?php

/**
 * Module Name: Post by Email
 * Module Description: Publish posts to your blog directly from your personal email account.
 * First Introduced: 2.0
 * Sort Order: 4
 */

add_action( 'jetpack_modules_loaded', array( 'Jetpack_Post_By_Email', 'init' ) );

Jetpack_Sync::sync_options( __FILE__,
	'large_size_w',
	'large_size_h',
	'thumbnail_size_w',
	'thumbnail_size_h',
	'medium_size_w',
	'medium_size_h'
);

add_action( 'jetpack_activate_module_post-by-email',   array( 'Jetpack_Post_By_Email', 'module_toggle' ) );
add_action( 'jetpack_deactivate_module_post-by-email', array( 'Jetpack_Post_By_Email', 'module_toggle' ) );

Jetpack::enable_module_configurable( __FILE__ );
Jetpack::module_configuration_load( __FILE__, array( 'Jetpack_Post_By_Email', 'configuration_redirect' ) );
		        
class Jetpack_Post_By_Email {
	function &init() {
		static $instance = NULL;

		if ( !$instance ) {
			$instance = new Jetpack_Post_By_Email;
		}

		return $instance;
	}

	function __construct() {
		add_action( 'init', array( &$this, 'action_init' ) );
	}

	function module_toggle() {
		$jetpack = Jetpack::init();
		$jetpack->sync->register( 'noop' );
	}
	
	function configuration_redirect() {
		wp_safe_redirect( admin_url( 'profile.php#post-by-email' ) );
		exit;
	}

	function action_init() {
		add_action( 'profile_personal_options', array( &$this, 'user_profile' ) );
		add_action( 'admin_print_scripts-profile.php', array( &$this, 'profile_scripts' ) );

		add_action( 'wp_ajax_jetpack_post_by_email_enable', array( &$this, 'create_post_by_email_address' ) );
		add_action( 'wp_ajax_jetpack_post_by_email_regenerate', array( &$this, 'regenerate_post_by_email_address' ) );
		add_action( 'wp_ajax_jetpack_post_by_email_disable', array( &$this, 'delete_post_by_email_address' ) );

		if ( ! $this->check_user_connection() )
			Jetpack::init()->admin_styles();
	}

	function profile_scripts() {
		wp_enqueue_script( 'post-by-email', plugins_url( 'post-by-email/post-by-email.js', __FILE__ ), array( 'jquery' ) );
		wp_enqueue_style( 'post-by-email', plugins_url( 'post-by-email/post-by-email.css', __FILE__ ) );
	}

	function check_user_connection() {
		$user_token = Jetpack_Data::get_access_token( get_current_user_id() );
		$is_user_connected = $user_token && !is_wp_error( $user_token );

		// If the user is already connected via Jetpack, then we're good
		if ( $is_user_connected )
			return true;

		return false;
		Jetpack::init()->admin_styles();
		add_action( 'profile_personal_options', array( &$this, 'user_profile' ) );
	}

	function user_profile() { ?>
		<div id="post-by-email"></div>
		<table class="form-table">
			<tr>
				<th scope="row"><?php _e( 'Post By Email', 'jetpack' ); ?></th>
				<td>
				<div id="jp-pbe-error"></div> <?php
		
				if ( $this->check_user_connection() ) {
					$email = $this->get_post_by_email_address();
		
					if ( empty( $email ) ) {
						$enable_hidden = '';
						$info_hidden = ' hidden="hidden"';
					}
					else {
						$enable_hidden = ' hidden="hidden"';
						$info_hidden = '';
					}
				
					// TODO: Add a spinner, or some such feedback for when the API calls are occurring ?>
			
					<input type="button" name="jp-pbe-enable" id="jp-pbe-enable" value="<? _e( 'Enable Post By Email', 'jetpack' ); ?> "<?php echo $enable_hidden; ?> />
					<div id="jp-pbe-info"<?php echo $info_hidden; ?>>
						<span id="jp-pbe-email-wrapper"><strong><?php _e( 'Email Address:', 'jetpack' ); ?></strong> <span id="jp-pbe-email"><?php echo $email; ?></span></span><br/>
						<input type="button" name="jp-pbe-regenerate" id="jp-pbe-regenerate" value="<? _e( 'Regenerate Address', 'jetpack' ); ?> " />
						<input type="button" name="jp-pbe-disable" id="jp-pbe-disable" value="<? _e( 'Disable Post By Email', 'jetpack' ); ?> " />
					</div> <?php
				} else {
					$jetpack = Jetpack::init(); ?>
		
					<input type="button" disabled="disabled" value="<? _e( 'Enable Post By Email', 'jetpack' ); ?>" />
					<br /><br />
		
					<div class="jetpack-inline-error"><p>
						<?php _e( "To use Post By Email you&#8217;ll need to link your account here to your WordPress.com account.", 'jetpack' ); ?> <br />
						<?php _e( "If you don't have one yet you can sign up for free, in just a few seconds.", 'jetpack' ) ?>
						<br /><br />
						<a href="<?php echo $jetpack->build_connect_url(); ?>" class="button-connector" id="wpcom-connect"><?php _e( 'Link account with WordPress.com', 'jetpack' ); ?></a> 
						
					</p></div>
					<?php
				} ?>
				</td>
			</tr>
		</table> <?php
	}

	// TODO: API call to get the actual email address
	function get_post_by_email_address() {
		Jetpack::load_xml_rpc_client();
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
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
		) );
		$xml->query( 'jetpack.createPostByEmailAddress' );

		if ( $xml->isError() ) {
			echo json_encode( array(
						'response' => 'error',
						'message' => __( 'Unable to create your Post By Email address. Please try again later.', 'jetpack' )
			) );
			die();
		}

		$response = $xml->getResponse();
		if ( empty( $response ) ) {
			echo json_encode( array(
						'response' => 'error',
						'message' => __( 'Unable to create your Post By Email address. Please try again later.', 'jetpack' )
			) );
			die();
		}

		echo $response;
		die();
	}

	function regenerate_post_by_email_address() {
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
		) );
		$xml->query( 'jetpack.regeneratePostByEmailAddress' );

		if ( $xml->isError() ) {
			echo json_encode( array(
						'response' => 'error',
						'message' => __( 'Unable to regenerate your Post By Email address. Please try again later.', 'jetpack' )
			) );
			die();
		}

		$response = $xml->getResponse();
		if ( empty( $response ) ) {
			echo json_encode( array(
						'response' => 'error',
						'message' => __( 'Unable to regenerate your Post By Email address. Please try again later.', 'jetpack' )
			) );
			die();
		}

		echo $response;
		die();
	}

	function delete_post_by_email_address() {
		Jetpack::load_xml_rpc_client();
		$xml = new Jetpack_IXR_Client( array(
			'user_id' => get_current_user_id(),
		) );
		$xml->query( 'jetpack.deletePostByEmailAddress' );

		if ( $xml->isError() ) {
			echo json_encode( array(
						'response' => 'error',
						'message' => __( 'Unable to disable your Post By Email address. Please try again later.', 'jetpack' )
			) );
			die();
		}

		$response = $xml->getResponse();
		if ( empty( $response ) ) {
			echo json_encode( array(
						'response' => 'error',
						'message' => __( 'Unable to disable your Post By Email address. Please try again later.', 'jetpack' )
			) );
			die();
		}

		echo $response;
		die();
	}
}
