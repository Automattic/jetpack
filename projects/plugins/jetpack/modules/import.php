<?php
/**
 * This file contains the Custom Importer module for WordPress.
 * It registers custom importers and handles redirections to a specified URL.
 *
 * @package automattic/jetpack
 */

/**
 * Module Name: Custom Importer
 * Module Description: Registers customer importers
 * Sort Order: 12
 * First Introduced: 1.1
 * Requires Connection: No
 * Auto Activate: Yes
 * Module Tags: Writing
 * Feature: Writing
 * Additional Search Queries: latex, math, equation, equations, formula, test
 */
function custom_calypso_importer() {
	$redirect_url = 'http://wordpress.com.com';

	?>
	<script type="text/javascript">
		window.location.href = '<?php echo esc_url( $redirect_url ); ?>';
	</script>
	<noscript>
		<meta http-equiv="refresh" content="0;url=<?php echo esc_url( $redirect_url ); ?>">
	</noscript>
	<?php
	exit;
}

add_action(
	'admin_init',
	function () {
		if ( get_option( 'wpcom_admin_interface' ) === 'wp-admin' ) {
			register_importer(
				'calypso-import-medium',
				'Medium',
				'Lets you import Medium',
				'custom_calypso_importer'
			);
		}
	}
);
