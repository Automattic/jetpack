<?php
/**
 * Blogging prompt settings.
 *
 * @since $$next-version$$
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\BloggingPrompts\Settings;

/**
 * Renders the settings field for enabling/disabling blogging prompts in the editor.
 *
 * @return void
 */
function enabled_field_callback() {
	$option  = get_option( 'jetpack_blogging_prompts_enabled' );
	$checked = ( $option ? 'checked' : '' ); ?>
<input name="jetpack_blogging_prompts_enabled" id="jetpack_blogging_prompts_enabled" type="checkbox" value="1"<?php echo esc_attr( $checked ); ?> />
<p id="jetpack-blogging-prompts-enabled-description" class="description"><?php esc_html_e( 'Displays a writing prompt when starting a new post.', 'jetpack' ); ?></p>
	<?php
}

/**
 * Initialize the settings for blogging prompts.
 *
 * @return void
 */
function init() {
	register_setting(
		'writing',
		'jetpack_blogging_prompts_enabled',
		array(
			'type'         => 'boolean',
			'description'  => __( 'Displays a writing prompt in the editor when starting a new post.', 'jetpack' ),
			'show_in_rest' => true,
			'default'      => jetpack_has_write_intent() || jetpack_has_posts_page(),
		)
	);

	add_settings_field(
		'jetpack_blogging_prompts_enabled',
		__( 'Show Writing Prompts', 'jetpack' ),
		__NAMESPACE__ . '\enabled_field_callback',
		'writing',
		'default',
		array( 'label_for' => 'jetpack_blogging_prompts_enabled' )
	);
}

add_action( 'admin_init', __NAMESPACE__ . '\init' );
