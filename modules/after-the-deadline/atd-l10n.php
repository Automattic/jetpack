<?php
/*
 * loads AtD localization strings (shared between Visual and HTML Editors)
 */
function AtD_init_l10n_js() {

	if ( AtD_should_load_on_page() ) {

		/* load localized strings for AtD */
		wp_localize_script( 'AtD_settings', 'AtD_l10n_r0ar', array
                (
			'menu_title_spelling' => __( 'Spelling', 'jetpack' ),
			'menu_title_repeated_word' => __( 'Repeated Word', 'jetpack' ),

			'menu_title_no_suggestions' => __( 'No suggestions', 'jetpack' ),

			'menu_option_explain' => __( 'Explain...', 'jetpack' ),
			'menu_option_ignore_once' => __( 'Ignore suggestion', 'jetpack' ),
			'menu_option_ignore_always' => __( 'Ignore always', 'jetpack' ),
			'menu_option_ignore_all' => __( 'Ignore all', 'jetpack' ),

			'menu_option_edit_selection' => __( 'Edit Selection...', 'jetpack' ),

			'button_proofread' => __( 'proofread', 'jetpack' ),
			'button_edit_text' => __( 'edit text', 'jetpack' ),
			'button_proofread_tooltip' => __( 'Proofread Writing', 'jetpack' ),

			'message_no_errors_found' => __( 'No writing errors were found.', 'jetpack' ),
			'message_server_error' => __( 'There was a problem communicating with the After the Deadline service. Try again in one minute.', 'jetpack' ),
			'message_server_error_short' => __( 'There was an error communicating with the proofreading service.', 'jetpack' ),

			'dialog_replace_selection' => __( 'Replace selection with:', 'jetpack' ),
			'dialog_confirm_post_publish' => __( "The proofreader has suggestions for this post. Are you sure you want to publish it?\n\nPress OK to publish your post, or Cancel to view the suggestions and edit your post.", 'jetpack' ),
			'dialog_confirm_post_update' => __( "The proofreader has suggestions for this post. Are you sure you want to update it?\n\nPress OK to update your post, or Cancel to view the suggestions and edit your post.", 'jetpack' ),
		) );

		wp_enqueue_script( 'AtD_l10n', plugins_url( 'install_atd_l10n.js', __FILE__ ), array('AtD_settings', 'jquery') );
	}
}

add_action( 'admin_print_scripts', 'AtD_init_l10n_js' );
