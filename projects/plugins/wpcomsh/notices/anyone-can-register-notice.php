<?php
/**
 * Active Anyone can register option notice file.
 *
 * @package wpcomsh
 */

/**
 * Adds an admin notice if the Anyone can register option is active.
 * Default roles of Admin and Shop Manager are persistent while lower role notices are dismissable.
 */
function wpcomsh_anyone_register_warning() {
	global $wp_roles;
	global $pagenow;
	if ( ! get_option( 'users_can_register' ) ) {
		return;
	}

	if ( ! current_user_can( 'manage_options' ) ) {
		return;
	}

	$default_role = get_option( 'default_role' );

	$warning_text_main = ( $pagenow !== 'options-general.php' ) ?
	/* translators: %1$s default role, %2$s support doc URL, %3$s site options URL, %4$s string highlighting risks*/
	__(
		'The <a href="%2$s">"Anyone can register" option</a> is currently active. The current default role is %1$s. %4$s <a href="%3$s">Please consider disabling this option</a>.'
	) :
	/* translators: %1$s default role, %2$s support doc URL, %3$s site options URL, %4$s string highlighting risks*/
	__(
		'The <a href="%2$s">"Anyone can register" option</a> is currently active. The current default role is %1$s. %4$s Please consider disabling this option.'
	);

	$warning_text_role = '';
	// using switch instead of array to account for unknown $default_role
	switch ( $default_role ) {
		case 'administrator':
			$warning_text_role = __(
				'It allows a user full control over your site and its contents.'
			);
			break;
		case 'shop_manager':
			$warning_text_role = __(
				'It allows a user control over your orders and products.'
			);
			break;
		case 'editor':
			$warning_text_role = __(
				'It allows a user to post/modify/delete all content.'
			);
			break;
		case 'author':
			$warning_text_role = __(
				'It allows a user to post content.'
			);
			break;
		case 'contributor':
			$warning_text_role = __(
				'It allows a user to create but not post content.'
			);
			break;
		case 'subscriber':
			$warning_text_role = __(
				'It could result in spam users.'
			);
			break;
		default:
			$warning_text_role = __(
				'This may pose a security risk to your site.'
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
		'<div class="notice wpcomsh-notice">
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
}

add_action( 'admin_notices', 'wpcomsh_anyone_register_warning' );

