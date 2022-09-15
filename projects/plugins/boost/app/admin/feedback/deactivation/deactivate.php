<?php
/*
 * Jetpack Boost - Deactivation Takeover
 *
 * This fires on the deactivation hook. There's no way of stopping the process of deactivation
 * once this hook starts (the code will carry on in the background) this page will stay up until
 * dismissed.
 *
 * Currently it will fire on every deactivation of the plugin. We might want to store in an option
 * whether it's been shown already but for this project keeping it in to fire each time it is deactivated.
 *
 * Uses Google Font to load in a font similar to the main Jetpack Font (SF Pro) i.e. Source Sans Pro
 *
 */

// If this file is called directly, abort.
if ( ! defined( 'WPINC' ) ) {
	echo 'Sorry. You do not have permission to do that.';
	die;
}

wp_enqueue_style( 'jb-deactivate-font', 'https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap', false, '1.0' );
wp_dequeue_style( 'admin-bar-css' );

// Deactivation survey link - wrap via Jetpack Redirect Manager in case we want to update the survey in future.
$survey_link = 'https://jetpack.com/redirect/?source=jetpack-boost-deactivation-feedback';
$logo_link   = JETPACK_BOOST_DIR_URL . 'app/assets/src/images/logo.svg';

?><!DOCTYPE html>
<html lang="en-US">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<meta name="viewport" content="width=device-width">
	<title><?php esc_html_e( 'Before you Go...', 'jetpack-boost' ); ?></title>
	<?php wp_print_styles(); ?>
	<style type="text/css">#wpadminbar { display:none !important; }</style>	
	<style>
		.buttons,.header{text-align:center}html{background:#f6f7f7;font-family:'Source Sans Pro',sans-serif}.container{max-width:680px;margin:auto;background:#fff;padding:20px;border:1px solid #ddd}.header{display:inline-block;width:100%}.header a img{width:250px;height:auto}.buttons{font-size:1.3em}.buttons .btn-jp{background:#000;color:#fff;text-decoration:none;padding:5px 15px;margin-right:15px;border-radius:4px;font-size:1.2rem}.inner-text{font-size:1.2rem;line-height:1.4rem}.trailer{font-size:.9rem;font-style:italic;margin-top:10px}a{color:#000}.close-wrap{position:relative}.close{position:absolute;top:-20px;right:-10px;color:#8e8e8e;cursor:pointer;text-decoration:none}@media only screen and (min-width:900px){.container{position:fixed;top:50%;left:50%;transform:translate(-50%,-50%);-webkit-transform:translate(-50%,-50%);-moz-transform:translate(-50%,-50%);-o-transform:translate(-50%,-50%);-ms-transform:translate(-50%,-50%)}}@media only screen and (max-width:900px){.container{position:absolute;top:0;bottom:0;left:0;right:0}}
	</style>
</head>
<body class="boost-feedback-catcher">
	<div class="container">
		<div class="close-wrap"><a href="<?php echo esc_url( admin_url( 'plugins.php' ) ); ?>" class="close">x</a></div>
		<div class="header"><a href="https://jetpack.com/boost/" target="_blank"><img src="<?php echo esc_url( $logo_link ); ?>" alt="Jetpack Boost"></a></div>
			<h1><?php esc_html_e( 'Before you go...', 'jetpack-boost' ); ?></h1>
			<div class="inner-text">
				<p><?php esc_html_e( "Thank you for trying Jetpack Boost, before you go, we'd really love your feedback on our plugin.", 'jetpack-boost' ); ?></p>
				<p><?php esc_html_e( "Just temporarily deactivating, or don't fancy giving feedback? No problem.", 'jetpack-boost' ); ?></p>
				<p><?php esc_html_e( 'All the best', 'jetpack-boost' ); ?></p>
				<p>Jetpack Boost</p>
			</div>
			<div class="buttons">
				<a href="<?php echo esc_url( $survey_link ); ?>" target="_blank" class="btn btn-jp" id="giveFeedback"><?php esc_html_e( 'Give Feedback', 'jetpack-boost' ); ?></a>
				<a href="<?php echo esc_url( admin_url( 'plugins.php' ) ); ?>" class="button button-large" id="notNow"><?php esc_html_e( 'Not right now', 'jetpack-boost' ); ?></a>
			</div>			
		<p class="trailer" style="text-align:center"><?php esc_html_e( "Giving feedback won't close this tab, and it shouldn't take more than 2 minutes", 'jetpack-boost' ); ?></p>
	</div>
</body></html>
