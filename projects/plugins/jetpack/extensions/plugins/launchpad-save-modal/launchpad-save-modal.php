<?php
/**
 * Launchpad Save Modal
 *
 * @since 11.7
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Extensions\LaunchpadSaveModal;

// Feature name.
const FEATURE_NAME = 'launchpad-save-modal';

/**
 * Inject Launchpad options when in the block editor.
 */
function add_launchpad_options() {
	// Return early if we are not in the block editor.
	if ( ! wp_should_load_block_editor_scripts_and_styles() ) {
		return;
	}

	/**
	 * Note the `site_intent` added on this Jetpack_LaunchpadSaveModal var is currently consumed in
	 * both ETK and WBE as a temporary solution to resolve an issue where atomic sites were DoSing
	 * themselves due to a non-existing endpoint. Since this data already existed on the window, we
	 * used it to avoid the unnecessary requests.
	 * https://github.com/Automattic/wp-calypso/blob/b7ba5798fddb56484f2cdaa83e9732ad32f3ca0a/apps/editing-toolkit/editing-toolkit-plugin/dotcom-fse/lib/site-intent/use-site-intent.js#L10
	 * https://github.com/Automattic/wp-calypso/blob/b7ba5798fddb56484f2cdaa83e9732ad32f3ca0a/apps/wpcom-block-editor/src/wpcom/features/use-site-intent.js#L9
	 */
	$launchpad_options = array(
		'launchpadScreenOption'       => get_option( 'launchpad_screen' ),
		'siteIntentOption'            => get_option( 'site_intent' ),
		'hasNeverPublishedPostOption' => get_option( 'has_never_published_post' ),
	);

	if ( function_exists( 'wpcom_launchpad_is_fse_next_steps_modal_hidden' ) && wpcom_launchpad_is_fse_next_steps_modal_hidden() ) {
		$launchpad_options['hideFSENextStepsModal'] = true;
	}

	wp_add_inline_script(
		'jetpack-blocks-editor',
		'var Jetpack_LaunchpadSaveModal = ' . wp_json_encode( $launchpad_options, JSON_HEX_TAG | JSON_HEX_AMP ) . ';',
		'before'
	);
}
add_action( 'enqueue_block_assets', __NAMESPACE__ . '\add_launchpad_options' );

// Populate the available extensions with launchpad-save-modal.
add_filter(
	'jetpack_set_available_extensions',
	function ( $extensions ) {
		return array_merge(
			$extensions,
			array(
				FEATURE_NAME,
			)
		);
	}
);

// Set the launchpad-save-modal availability.
add_action(
	'jetpack_register_gutenberg_extensions',
	function () {
		\Jetpack_Gutenberg::set_extension_available( FEATURE_NAME );
	}
);
