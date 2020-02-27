<?php

/**
 * WordPress.com Site Helper Private Site Template
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
 	<link rel='stylesheet' id='all-css-0-1' href='/wp-content/mu-plugins/wpcomsh/private-site/style.css' type='text/css' media='all' />

	<?php
	wp_enqueue_style( 'domain-landing-style', '/wp-content/themes/a8c/domain-landing-page/style.css' );
	wp_enqueue_style( 'merriweather', '//s1.wp.com/i/fonts/merriweather/merriweather.css' );
	wp_enqueue_style( 'merriweathersans', '//s1.wp.com/i/fonts/merriweathersans/merriweathersans.css' );
	do_action( 'login_enqueue_scripts' );
	do_action( 'login_head' );

	$classes = array( 'wp-core-ui' );
	if ( is_rtl() ) {
		$classes[] = 'rtl';
	}
	$classes[] = ' locale-' . sanitize_html_class( strtolower( str_replace( '_', '-', get_locale() ) ) );

	$login_link = site_url() . '/wp-login.php?redirect_to=' . set_url_scheme( original_request_url() );
	?>

	<style type="text/css">
		.body {
			background: #006088;
			font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", "Oxygen-Sans", "Ubuntu", "Cantarell", "Helvetica Neue", sans-serif;
			justify-content: center;
		}
		.container {
			flex-direction: row;
			align-items: center;
			justify-content: flex-start;
			max-width: 90%;
		}
		.name {
			color: #f7f4f5;
			font-size: .9em;
			text-align: left;
			margin-bottom: 10px;
		}
		.description {
			color: #fff;
			font-size: 1.8em;
			font-weight: bold;
			line-height: 1.2;
			text-align: left;
			margin-bottom: 25px;
			overflow: visible;
		}
		.image {
			display: none;
		}
		@media screen and ( min-width: 660px ) {
			.container {
				max-width: 75%;
			}
			.inner {
				max-width: 68%;
			}
			.image {
				display: block;
				max-width: 35%;
				margin-left: 2%;
				order: 4;
			}
			.image img {
				max-width: 100%;
				height: auto;
				margin-top: -15px;
			}
		}
		.marketing-bar-text {
			color: #006088;
		}
		.marketing-bar .marketing-bar-button {
			background: #d52c82;
			border-color: #992053;
			color: #fff;
			text-shadow: none;
		}
		.wp-core-ui .button-primary {
			background: #d52c82;
			border-color: #992053;
			color: #fff;
			text-shadow: none;
			border-style: solid;
			border-width: 1px 1px 2px;
			box-shadow: none;
			cursor: pointer;
			display: inline-block;
			height: auto;
			margin: 0;
			outline: 0;
			overflow: hidden;
			font-weight: bold;
			text-overflow: ellipsis;
			text-decoration: none;
			vertical-align: top;
			box-sizing: border-box;
			font-size: 14px;
			line-height: 21px;
			letter-spacing: 0;
			border-radius: 4px;
			padding: 7px 14px 9px;
		}
		.wp-core-ui .button-primary {
			margin-left: 11px;
		}
		.wp-core-ui .button-primary:hover,
		.wp-core-ui .button-primary:focus,
		.marketing-bar .marketing-bar-button:hover,
		.marketing-bar .marketing-bar-button:focus {
			background: #ff3997;
			border-color: #992053;
			color: #fff;
		}
	</style>
</head>
<body class="body">
<div class="container">
	<div class="inner">
		<div class="name"><?php echo esc_html( get_bloginfo( 'name' ) ) ?></div>
		<div class="description"><?php echo esc_html( __( 'Something new is coming.', 'wpcomsh' ) ) ?></div>
		<?php if ( ! is_user_logged_in() ) : ?>
			<p class="wp-core-ui"><a class="button button-primary" href="<?php echo esc_url( $login_link ) ?>" style="float: none;"><?php esc_html_e( 'Log in here', 'wpcomsh' ) ?></a></p>
		<?php endif; ?>
	</div>
	<div class="image">
		<img src="https://s2.wp.com/i/private.svg" />
	</div>
</div>
<?php wp_footer(); ?>
</body>
</html>
