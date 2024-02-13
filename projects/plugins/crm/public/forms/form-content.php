<?php
/**
 * Contains wrapper for "naked" CRM form
 *
 * @package automattic/jetpack-crm
 */

// prevent direct access
if ( ! defined( 'ZEROBSCRM_PATH' ) ) {
	exit;
}

if ( isset( $_GET['fid'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended

	// Load assets we need
	zeroBSCRM_forms_scriptsStylesRegister();
	zeroBSCRM_forms_enqueuements();

	// Check for valid form
	$form_id  = (int) $_GET['fid']; // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	$zbs_form = zeroBS_getForm( $form_id );

	// If valid, build form
	if ( is_array( $zbs_form ) && isset( $zbs_form['id'] ) ) {

		?>
<!DOCTYPE html>
<html lang="en-US" class="no-js">
	<head>
		<meta charset="UTF-8">
		<meta name="viewport" content="width=device-width, initial-scale=1">
		<meta name='robots' content='noindex,nofollow' />
		<title><?php esc_html_e( 'Jetpack CRM Form', 'zero-bs-crm' ); ?></title>

		<?php
		wp_print_styles( 'zbsfrontendformscss' );
		wp_print_scripts();

		zeroBSCRM_forms_formHTMLHeader();
		?>
	</head>
	<body>

		<?php
		echo zeroBSCRM_forms_build_form_html( $form_id, 'content' ); // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
		?>

	</body>
</html>
		<?php

	}
}

exit();
