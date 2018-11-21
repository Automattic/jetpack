<?php
/**
 * Module Name: Private site template
 *
 * @package Jetpack
 */

nocache_headers();
header( 'Content-Type: ' . get_bloginfo( 'html_type' ) . '; charset=' . get_bloginfo( 'charset' ) );

$redirect_to = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER['REQUEST_URI'];
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

	$login_link = site_url() . '/wp-login.php?redirect_to=' . $redirect_to;
?>

</head>
<body class="login <?php echo esc_attr( implode( ' ', $classes ) ); ?>">
	<div id="login">
		<h1><a href="<?php echo esc_attr( $login_link ); ?>" tabindex="-1"><?php bloginfo( 'name' ); ?></a></h1>
		<div class="message" style="overflow: auto;">
			<p>
				<?php esc_html_e( 'This site is marked private by its owner. If you would like to view it, you’ll need permission from the site owner.', 'jetpack' ); ?><br>
				<br>
				<?php esc_html_e( 'If you already have permission then log in.', 'jetpack' ); ?><br>
				<br>
				<a class="button-primary" href="<?php echo esc_attr( $login_link ); ?>"><?php is_user_logged_in() ? esc_html_e( 'Switch user', 'jetpack' ) : esc_html_e( 'Log in', 'jetpack' ); ?></a>
			</p>
		</div>
		<?php wp_footer(); ?>
	</div>
</body>
</html>
