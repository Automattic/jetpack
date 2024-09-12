<?php
/**
 * File for Customizer fixes.
 *
 * @package wpcomsh
 */

/**
 * Enqueues the script with customizer fixes.
 */
function customizer_fixes_scripts() {
	/*
	 * Because we support private sites by default, we should override '_wpCustomizeControlsL10n' values set in script-loader.php
	 * This is to avoid confusion between saving site changes and publishing or launching a site.
	 */
	wp_register_script( 'customizer-labels-site-not-launched', plugin_dir_url( __FILE__ ) . 'customizer-labels-site-not-launched.js', array( 'customize-controls' ), '20210206', false );
	wp_localize_script(
		'customizer-labels-site-not-launched',
		'_wpCustomizeControlsL10nSitePrivate',
		array(
			'activate'        => __( 'Activate &amp; Save', 'wpcomsh' ),
			'save'            => __( 'Save', 'wpcomsh' ),
			'publish'         => __( 'Save Changes', 'wpcomsh' ),
			'published'       => __( 'Saved', 'wpcomsh' ),
			'trashConfirm'    => __( 'Are you sure you want to discard your unsaved changes?', 'wpcomsh' ),
			'publishSettings' => __( 'Save Settings', 'wpcomsh' ),
		)
	);
	wp_enqueue_script( 'customizer-labels-site-not-launched' );
}
add_action( 'customize_controls_enqueue_scripts', 'customizer_fixes_scripts' );
