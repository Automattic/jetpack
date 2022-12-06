<?php
/**
 * Blogging prompt settings.
 *
 * @since 11.7
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\BloggingPrompts\Settings;

use Automattic\Jetpack\Constants;

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
	if ( ! Constants::is_true( 'JETPACK_EXPERIMENTAL_BLOCKS' ) && ! Constants::is_true( 'JETPACK_BETA_BLOCKS' ) ) {
		return;
	}

	register_setting(
		'writing',
		'jetpack_blogging_prompts_enabled',
		array(
			'type'         => 'boolean',
			'description'  => __( 'Show a writing prompt in the editor when starting a new post.', 'jetpack' ),
			'show_in_rest' => true,
			'default'      => jetpack_has_write_intent() || jetpack_has_posts_page(),
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
