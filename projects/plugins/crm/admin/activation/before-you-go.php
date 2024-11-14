<?php
/*
 * Jetpack CRM
 * https://jetpackcrm.com
 */

/*
======================================================
	Breaking Checks ( stops direct access )
	====================================================== */
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}
/*
======================================================
	/ Breaking Checks
	====================================================== */

	global $zbs;

	// Assets we need specifically here

	// js
	wp_enqueue_script( 'jquery' );
	// not really needed. wp_enqueue_script('zbsbeforeyougojs', plugins_url('/js/before-you-go/jquery.blockUI.min.js',ZBS_ROOTFILE), array( 'jquery' ), $zbs->version);

	// css
	wp_enqueue_style( 'zbsbeforeyougocssloadstyles', plugins_url( '/css/before-you-go/loadstyles.min.css', ZBS_ROOTFILE ), array(), $zbs->version );
	wp_enqueue_style( 'zbsbeforeyougocssopensans', plugins_url( '/css/before-you-go/opensans' . wp_scripts_get_suffix() . '.css', ZBS_ROOTFILE ), array(), $zbs->version );
	wp_enqueue_style( 'zbsbeforeyougocssadminmin', plugins_url( '/css/before-you-go/admin.min.css', ZBS_ROOTFILE ), array(), $zbs->version );
	wp_enqueue_style( 'zbsbeforeyougocssexitform', plugins_url( '/css/before-you-go/zbs-exitform.min.css', ZBS_ROOTFILE ), array(), $zbs->version );
	$style_handles = array( 'zbsbeforeyougocssloadstyles', 'zbsbeforeyougocssopensans', 'zbsbeforeyougocssadminmin', 'zbsbeforeyougocssexitform' );

?><!DOCTYPE html>
<html lang="en-US">
<head>
	<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
	<meta name="viewport" content="width=device-width">
	<title><?php esc_html_e( 'Before you Go...', 'zero-bs-crm' ); ?></title>
	<?php
	wp_print_styles( $style_handles );
	?>
	<style type="text/css">img.wp-smiley,img.emoji{display:inline !important;border:none !important;box-shadow:none !important;height:1em !important;width:1em !important;margin:0 .07em !important;vertical-align:-0.1em !important;background:none !important;padding:0 !important}#wc-logo img{max-width:20% !important}#feedbackPage{display:none}.wc-setup .wc-setup-actions .button-primary{background-color:#408bc9 !important;border-color:#408bc9 !important;-webkit-box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 1px 0 #408bc9 !important;box-shadow:inset 0 1px 0 rgba(255,255,255,.25),0 1px 0 #408bc9 !important;text-shadow:0 -1px 1px #408bc9,1px 0 1px #408bc9,0 1px 1px #408bc9,-1px 0 1px #408bc9 !important;float:right;margin:0;opacity:1}</style>	
	<style type="text/css">#wpadminbar { display:none !important; }</style>	
</head>
<body class="wc-setup wp-core-ui">
			<h1 id="byebye"><a href="https://jetpackcrm.com" target="_blank"><img src="<?php echo esc_url( jpcrm_get_logo( false ) ); ?>" alt="Jetpack CRM"></a></h1>
		<div class="wc-setup-content" id="firstPage">
			<h1><?php esc_html_e( 'Before you go...', 'zero-bs-crm' ); ?></h1>
			<p><?php esc_html_e( 'Thank you for trying Jetpack CRM! Before you go, we\'d really love your feedback on our free CRM plugin. It\'d make our day if you could guide us to improving Jetpack CRM.', 'zero-bs-crm' ); ?> :)</p>
			<p><?php esc_html_e( 'Just temporarily deactivating, or don\'t fancy giving feedback? No worries.', 'zero-bs-crm' ); ?><br /><?php echo wp_kses( sprintf( __( 'We\'re improving Jetpack CRM every week, so come back sometime and check us out @ <a href="%1$s">%2$s</a>', 'zero-bs-crm' ), esc_url( 'https://jetpackcrm.com' ), 'jetpackcrm.com' ), $zbs->acceptable_restricted_html ); ?></p>
			<p><?php esc_html_e( 'All the best', 'zero-bs-crm' ); ?></p>
			<p><?php esc_html_e( 'The Jetpack CRM Team', 'zero-bs-crm' ); ?></p>
			<p class="wc-setup-actions step">
				<a href="https://forms.gle/q5KjMBytni3kfFco7" target="_blank" class="button-primary button button-large button-next" id="giveFeedback"><?php esc_html_e( 'Let\'s Go! (Give Feedback)', 'zero-bs-crm' ); ?></a>
				<a href="<?php echo esc_url( admin_url( 'plugins.php' ) ); ?>" class="button button-large" id="notNow"><?php esc_html_e( 'Not right now', 'zero-bs-crm' ); ?></a>
			</p>
		</div>
		<p style="text-align:center"><?php esc_html_e( 'Giving feedback won\'t close this tab, and it shouldn\'t take more than a few minutes.', 'zero-bs-crm' ); ?></p>

</body></html>
