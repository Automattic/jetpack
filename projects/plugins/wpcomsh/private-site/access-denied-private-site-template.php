<?php
/**
 * WordPress.com Site Helper Private Site Template.
 *
 * @package private-site
 */

namespace Private_Site;

nocache_headers();
header( 'Content-Type: ' . get_bloginfo( 'html_type' ) . '; charset=' . get_bloginfo( 'charset' ) );

?><!DOCTYPE html>
<!--[if IE 8]>
<html xmlns="http://www.w3.org/1999/xhtml" class="ie8" <?php language_attributes(); ?>>
<![endif]-->
<!--[if !(IE 8) ]><!-->
<html xmlns="http://www.w3.org/1999/xhtml" <?php language_attributes(); ?>>
<!--<![endif]-->
<head>
	<meta http-equiv="Content-Type" content="<?php bloginfo( 'html_type' ); ?>; charset=<?php bloginfo( 'charset' ); ?>" />
	<meta name="viewport" content="width=device-width, initial-scale=1">
	<title><?php echo bloginfo( 'name' ); ?></title>
	<?php
	// Use styles from wp-login.
	wp_enqueue_style( 'login' );
	do_action( 'login_enqueue_scripts' );
	do_action( 'login_head' );

	$classes = array( 'wp-core-ui' );
	if ( is_rtl() ) {
		$classes[] = 'rtl';
	}
	$classes[] = ' locale-' . sanitize_html_class( strtolower( str_replace( '_', '-', get_locale() ) ) );

	$login_link = site_url() . '/wp-login.php?redirect_to=' . set_url_scheme( original_request_url() );
	?>

</head>
<body class="login <?php echo esc_attr( implode( ' ', $classes ) ); ?>">
<div id="login">
	<h1><a href="<?php echo esc_url( $login_link ); ?>" tabindex="-1"><?php bloginfo( 'name' ); ?></a></h1>
	<div class="message" style="overflow: auto;">
		<p>
			<?php esc_html_e( 'You need to be logged in as a user who has permission to view this site.', 'wpcomsh' ); ?><br>
			<br>
			<a class="button-primary" href="<?php echo esc_url( $login_link ); ?>"><?php is_user_logged_in() ? esc_html_e( 'Switch user', 'wpcomsh' ) : esc_html_e( 'Log in', 'wpcomsh' ); ?></a>
		</p>
	</div>
	<?php wp_footer(); ?>
</div>
</body>
</html>
