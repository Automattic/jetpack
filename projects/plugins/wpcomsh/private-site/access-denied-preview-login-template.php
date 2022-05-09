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
	<script>
		window.addEventListener('message', function(e) {
			window.calypso = e.source;
		})
	</script>
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

	$preview_source = site_preview_source();
	$redirect_to    = $preview_source === 'android-app' ? '/' : set_url_scheme( original_request_url() );
	$login_link     = site_url() . '/wp-login.php?redirect_to=' . $redirect_to;
	?>

</head>
<body class="login <?php echo esc_attr( implode( ' ', $classes ) ); ?>">
<div id="login">
	<h1><a href="<?php echo esc_url( $login_link ); ?>" tabindex="-1"><?php bloginfo( 'name' ); ?></a></h1>
	<div class="message" style="overflow: auto;">
		<p>
			<?php if ( $preview_source === 'android-app' ) { ?>
				<?php
					// This text will be only ever displayed to english audience - Android support will land before scaling to
					// non-english users
				?>
				This site is private. Private sites cannot be previewed from the app yet. Log in using your web browser to preview the site. <br>
				<?php $button_text = 'Log in using browser'; ?>
			<?php } elseif ( is_user_logged_in() ) { ?>
				<?php esc_html_e( 'This site is private. You need to log in as a user with permissions before previewing it.', 'wpcomsh' ); ?><br>
				<?php $button_text = 'Switch user'; ?>
			<?php } else { ?>
				<?php esc_html_e( 'This site is private. You need to log in to the preview to see it.', 'wpcomsh' ); ?><br>
				<?php $button_text = 'Log in'; ?>
			<?php } ?>

			<br>
			<?php if ( $preview_source === 'browser-iframe' ) { ?>
				<script>
					function handleClick() {
						<?php if ( isset( $_GET['calypso_token'] ) ) { /* phpcs:ignore WordPress.Security */ ?>
							window.calypso.postMessage(JSON.stringify({
								type: 'needs-auth',
								channel: "preview-" + <?php echo wp_json_encode( $_GET['calypso_token'] ); /* phpcs:ignore WordPress.Security */ ?>
							}), '*');
						<?php } else { ?>
							window.location.href = <?php echo wp_json_encode( $login_link ); ?>;
						<?php } ?>
					}
				</script>
				<span class="button-primary" onclick="handleClick()">
					<?php echo esc_html( $button_text ); ?>
				</span>
			<?php } else { ?>
				<a class="button-primary" href="<?php echo esc_url( $login_link ); ?>">
					<?php echo esc_html( $button_text ); ?>
				</a>
			<?php } ?>
		</p>
	</div>
	<?php wp_footer(); ?>
</div>
</body>
</html>
