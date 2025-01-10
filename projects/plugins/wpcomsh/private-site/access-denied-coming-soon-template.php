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
	wp_enqueue_style( 'recoleta-font', '//s1.wp.com/i/fonts/recoleta/css/400.min.css', array(), WPCOMSH_VERSION );
	wp_enqueue_style( 'wpcomsh-coming-soon-style', plugins_url( 'style.css', __FILE__ ), array(), WPCOMSH_VERSION );
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
<body class="body wpcom-coming-soon-private-default-body">
	<div class="inner">
		<div class="main">
			<div class="name"><?php echo esc_html( get_bloginfo( 'name' ) ); ?></div>
			<div class="description"><?php esc_html_e( 'Coming Soon', 'wpcomsh' ); ?></div>
		</div>
		<div class="marketing">
			<?php if ( ! is_user_logged_in() ) : ?>
				<div class="marketing-copy">
					<img src="https://s2.wp.com/wp-content/themes/a8c/domain-landing-page/wpcom-wmark-white.svg" alt="WordPress.com" class="logo" />
					<p class="copy"><?php echo esc_html_e( 'Build a website. Sell your stuff. Write a blog. And so much more.', 'wpcomsh' ); ?></p>
				</div>
				<div class="marketing-buttons">
					<p><a class="button button-secondary" href="<?php echo esc_url( $login_link ); ?>"><?php esc_html_e( 'Log in', 'wpcomsh' ); ?></a></p>
					<p><a class="button button-primary " href="https://wordpress.com/start/?ref=coming_soon"><?php esc_html_e( 'Start your website', 'wpcomsh' ); ?></a></p>
				</div>
			<?php endif; ?>
		</div>
	</div>
</div>
<?php wp_footer(); ?>
</body>
</html>
