<?php
/**
 * Active Anyone can register option notice file.
 *
 * @package wpcomsh
 */

/**
 * Adds a dismissible admin notice to warn about the risks when users_can_register option is active.
 * The purpose is to reduce unnecessary activation of this option and to reduce chances that malicious admins can register to the site.
 */
const WPCOMSH_ACR_DISMISSED_METADATA = 'wpcomsh_anyone_can_register_dismissed_notice';

/** Handle AJAX request to dismiss notice **/
function wpcomsh_ajax_anyone_can_register_handle_dismissal() {
	if ( isset( $_SERVER['REQUEST_METHOD'] ) && isset( $_POST['action'] ) ) {
		if ( 'anyone_can_register_dismiss_notice' === $_POST['action'] && check_ajax_referer( 'anyone_can_register_ajax_nonce', '_ajax_nonce', false ) ) {
			update_user_meta( get_current_user_id(), WPCOMSH_ACR_DISMISSED_METADATA, '1' );
		}
	}
}
add_action( 'wp_ajax_anyone_can_register_dismiss_notice', 'wpcomsh_ajax_anyone_can_register_handle_dismissal' );

/**
 * Clear metadata when option disabled.
 *
 * @param int $old_value of users_can_register option.
 * @param int $new_value of users_can_register option.
 */
function wpcomsh_users_can_register_option_change( $old_value, $new_value ) {
	if ( ! $new_value ) {
		delete_metadata( 'user', 0, WPCOMSH_ACR_DISMISSED_METADATA, 1, true );
		return;
	}
}
add_action( 'update_option_users_can_register', 'wpcomsh_users_can_register_option_change', 10, 2 );

/**
 * Adds a dismissible notice to wp-admin pages for all administrators if users_can_register option is active.
 * Default roles of Admin and Shop Manager warn red while all other roles warn orange.
 * Dismissal metadata is cleared for all admins when option is disabled.
 *
 * @global WP_Roles $wp_roles Available roles.
 * @global string $pagenow Current page being viewed.
 */
function wpcomsh_anyone_register_warning() {
	global $wp_roles;
	global $pagenow;

	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	if ( ! get_option( 'users_can_register' ) ) {
		return;
	}

	$dismissed = get_user_meta( get_current_user_id(), WPCOMSH_ACR_DISMISSED_METADATA, true );

	if ( $dismissed ) {
		return;
	}

	$default_role = get_option( 'default_role' );

	// only show notice for roles with higher permissions - requested in regards to Sensei p6rkRX-6NA-p2#comment-6691
	if ( ! in_array( $default_role, array( 'administrator', 'shop_manager', 'editor', 'author' ), true ) ) {
		return;
	}

	$warning_text_main = ( $pagenow !== 'options-general.php' ) ?
	/* translators: %1$s default role, %2$s support doc URL, %3$s site options URL, %4$s string highlighting risks*/
	__(
		'The <a href="%2$s">"Anyone can register" option</a> is currently active. The current default role is %1$s. %4$s <a href="%3$s"><strong>Please consider disabling this option if open registration is not needed.</strong></a>.',
		'wpcomsh'
	) :
	/* translators: %1$s default role, %2$s support doc URL, %3$s site options URL, %4$s string highlighting risks*/
	__(
		'The <a href="%2$s">"Anyone can register" option</a> is currently active. The current default role is %1$s. %4$s <strong>Please consider disabling this option if open registration is not needed.<strong>',
		'wpcomsh'
	);

	$warning_text_role = '';
	// using switch instead of array to account for custom $default_role
	switch ( $default_role ) {
		case 'administrator':
			$warning_text_role = __(
				'It allows a user full control over your site and its contents.',
				'wpcomsh'
			);
			break;
		case 'shop_manager':
			$warning_text_role = __(
				'It allows a user control over your orders and products.',
				'wpcomsh'
			);
			break;
		case 'editor':
			$warning_text_role = __(
				'It allows a user to post/modify/delete all content.',
				'wpcomsh'
			);
			break;
		case 'author':
			$warning_text_role = __(
				'It allows a user to post content.',
				'wpcomsh'
			);
			break;
		default:
			$warning_text_role = __(
				'This may pose a security risk to your site.',
				'wpcomsh'
			);
	}

	$message = sprintf(
		$warning_text_main,
		esc_html( $wp_roles->roles[ $default_role ]['name'] ),
		esc_url( 'https://wordpress.com/support/security/#anyone-can-register' ),
		esc_url( admin_url( 'options-general.php' ) ),
		$warning_text_role
	);

	$notice_style = in_array( $default_role, array( 'administrator', 'shop_manager' ), true ) ? 'notice__icon-wrapper-red' : 'notice__icon-wrapper-orange';
	printf(
		'<div class="notice wpcomsh-notice is-dismissible anyone-can-register-notice">
			<span class="notice__icon-wrapper %1$s">
				<span class="dashicons dashicons-info"></span>
			</span>
			<span class="notice__content">
				<span class="notice__text">%2$s</span>
			</span>
		</div>',
		esc_attr( $notice_style ),
		wp_kses_post( $message )
	);

	$nonce = wp_create_nonce( 'anyone_can_register_ajax_nonce' );

	// admin-ajax call to add metadata for persistent dismissal
	echo '<script id="anyone-can-register-notice" type="text/javascript">
		jQuery( function( $ ) {
			$( document ).ready( function() {
				$( ".anyone-can-register-notice .notice-dismiss" ).on( "click", function() {
					$.ajax( {
						url: ' . wp_json_encode( esc_url_raw( admin_url( 'admin-ajax.php' ) ) ) . ',
						type: "POST",
						data: {
							action: "anyone_can_register_dismiss_notice",
							_ajax_nonce: ' . wp_json_encode( $nonce ) . '
						},
						error: function( xhr, status, error ) {
							alert( error );
						}
					});
				});
			});
		});
	</script>';
}

add_action( 'admin_notices', 'wpcomsh_anyone_register_warning' );
