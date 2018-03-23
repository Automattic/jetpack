<?php
/**
 * Jetpack Gutenberg Form
 *
 * Loads Gutenberg block support for the Jetpack contact form module.
 *
 * @package Jetpack\modules\contact-form
 * @since 5.9
 */

/**
 * Enqueue Block (scripts)
 *
 * @param  string $name Block name to enqueue
 * @return void
 */
function jetpack_form_enqueue_block( $name ) {
	$namespace = "jetpack/form-{$name}";

    if ( "form" == $name ) {
    	$namespace = "jetpack/form";
    }

	wp_enqueue_script(
		$namespace,
		Jetpack::get_file_url_for_environment(
			"_inc/build/contact-form/blocks/{$name}/block.min.js",
			"modules/contact-form/blocks/{$name}/block.js"
		),
		array( 'wp-blocks', 'wp-components', 'wp-element', 'wp-i18n' ),
		JETPACK__VERSION
	);

    wp_register_style(
        $namespace,
        Jetpack::get_file_url_for_environment(
			"_inc/build/contact-form/blocks/{$name}/editor.css",
			"modules/contact-form/blocks/{$name}/editor.css"
		),
        array( 'wp-edit-blocks' ),
        JETPACK__VERSION
    );

    register_block_type( $type, array(
        'editor_script' => $namespace,
        'editor_style'  => $namespace,
    ) );

}

/**
 * Enqueue Block Assets Action
 *
 * @return void
 */
function jetpack_form_enqueue_editor() {
	jetpack_form_enqueue_block( 'form' );
	jetpack_form_enqueue_block( 'text' );
	jetpack_form_enqueue_block( 'textarea' );
	jetpack_form_enqueue_block( 'button' );
}

add_action( 'enqueue_block_editor_assets', 'jetpack_form_enqueue_editor' );
