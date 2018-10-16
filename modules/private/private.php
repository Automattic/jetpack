<?php

nocache_headers();
header( 'Content-Type: '.get_bloginfo( 'html_type' ).'; charset='.get_bloginfo( 'charset' ));

// redirect_to is probably never set so this is almost pointless
if ( empty( $_REQUEST['redirect_to'] ) )
	$redirect_to = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI']; // This is almost always where we are going
else
	$redirect_to = $_REQUEST['redirect_to'];

$user = wp_signon();

if ( ! is_wp_error( $user ) ) {
	if ( is_private_blog_user( get_current_blog_id(), $current_user) ) {
		wp_safe_redirect( $redirect_to );
		exit();
	} else {
		// If the user isn't a user on this blog then nuke the $user like wp_signon() would have and replace it with an empty WP_Error
		// Remote Login bugs before [50328] mean that some users have auth cookies on blogs they don't have access to
		$user = new WP_Error('', '');;
	}
}

$errors = $user;
var_dump($errors);

if ( !is_user_logged_in() ) :

	$message = '<div class="message">';
	$message .= '<p>' . __( "This site is marked private by its owner. If you would like to view it, you’ll need permission from the site owner. Once you've created an account, log in and revisit this screen to request an invite." ) . '</li>';
	$message .= '</ol>';
	$message .= '<p>' . __( "If you already have permission then log in:" ) . '</p>';
	$message .= '<p style="text-align: center; margin-top: 10px"><a class="button-primary" href="' . site_url() . '/wp-login.php?redirect_to=' . urlencode( $redirect_to ) . '" style="float: none;">' . __( "Log in here" ) . '</a></p>';
	$message .= '</div>';

	//login_header( __( 'Log in' ), $message, $errors );

else : //logged in, but no access to the blog
	$message = '<div class="message">';
	// Success message for requesting access
	if ( isset( $_GET['request_access'] ) && $_GET['request_access'] == 'success' ) {
		$message .= __( 'Thank you. The site owner has been notified of your request.' );
	} else {
		global $current_user;

		if ( ! private_blog_accepts_invites() ) {
			if ( is_automattician() && is_automattic() ) {
				$access_url = add_query_arg( array(
					'user-names' => [ $current_user->user_login ],
					'blogs' => [ intval( get_current_blog_id() ) ],
					'a11n-blogs-nonce' => wpcom_create_mc_nonce( 'a11n-blogs-user-' . $current_user->user_login ),
					'_wp_http_referer' => rawurlencode( site_url() . $_SERVER['REQUEST_URI'] ),
				), 'https://mc.a8c.com/automattic-blogs/index.php' );
				$message .= '<strong>' . trailingslashit( get_home_url() ) . '</strong> is marked private. As an Automattician you can <a href="' . esc_url( $access_url ) . '">give yourself access</a>.';
			} else {
				$message .= sprintf( __( '%s is marked private by its owner.' ), '<strong>' . trailingslashit( get_home_url() ) . '</strong>' );
			}
		} else {
			$message .= '<p>' . sprintf( __( "This site is marked private by its owner. If you would like to view it, you’ll need permission from the site owner. <a href='%s'>Request an invite</a> and we'll send your username to the site owner for their approval." ), get_home_url( null, '?action=request_access&redirect_to=' . urlencode( get_home_url() ) . '&nonce=' . wp_create_nonce( 'request_access_' . get_current_blog_id() ) ) ) . '</p>';
		}
	}
	$message .= '</div>';
	//login_header( __( 'Log in' ), $message, $errors );

endif;
?>


<!doctype html>
<html <?php language_attributes(); ?>>
<head>
	<meta charset="<?php bloginfo( 'charset' ); ?>">
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<link rel="profile" href="https://gmpg.org/xfn/11">
	<?php wp_head(); ?>
</head>

<body <?php body_class(); ?>>
	<?php
		echo $message;
		var_dump($errors);
		wp_footer();
	?>
</body>
</html>