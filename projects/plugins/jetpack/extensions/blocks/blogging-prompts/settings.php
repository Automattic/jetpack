<?php
/**
 * Blogging prompt settings.
 *
 * @since 11.7
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\BloggingPrompts\Settings;

use Jetpack_Gutenberg;

/**
 * Renders the settings field for enabling/disabling blogging prompts in the editor.
 *
 * @return void
 */
function enabled_field_callback() {
	$is_enabled = jetpack_are_blogging_prompts_enabled(); ?>
<input name="jetpack_blogging_prompts_enabled" id="jetpack_blogging_prompts_enabled" type="checkbox" value="1" <?php checked( $is_enabled ); ?>" />
<label for="jetpack_blogging_prompts_enabled"><?php esc_html_e( 'Show a writing prompt when starting a new post.', 'jetpack' ); ?></label>
	<?php
}

/**
 * Initialize the settings for blogging prompts.
 *
 * @return void
 */
function init() {
	// If editor extensions are not loaded, don't show the settings.
	if ( ! Jetpack_Gutenberg::should_load() ) {
		return;
	}

	/*
	 * Blogging prompts is an experimental extension:
	 * Settings should only be shown in an environment
	 * where beta or experimental extension are loaded.
	 */
	$blocks_variation = Jetpack_Gutenberg::blocks_variation();
	if ( ! in_array( $blocks_variation, array( 'beta', 'experimental' ), true ) ) {
		return;
	}

	register_setting(
		'writing',
		'jetpack_blogging_prompts_enabled',
		array(
			'type'         => 'boolean',
			'description'  => __( 'Show a writing prompt in the editor when starting a new post.', 'jetpack' ),
			'show_in_rest' => true,
			'default'      => false,
		)
	);

	add_settings_field(
		'jetpack_blogging_prompts_enabled',
		__( 'Writing Prompts', 'jetpack' ),
		__NAMESPACE__ . '\enabled_field_callback',
		'writing',
		'default'
	);
}

add_action( 'admin_init', __NAMESPACE__ . '\init' );
