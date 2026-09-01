<?php
/**
 * Protect Jetpack AI settings from General Settings saves.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Settings;

/**
 * Remove Jetpack AI options from the General Settings allowlist.
 *
 * @param array $allowed_options Allowed options grouped by settings page.
 * @return array
 */
function exclude_from_general_options( $allowed_options ) {
	if ( ! isset( $allowed_options['general'] ) || ! is_array( $allowed_options['general'] ) ) {
		return $allowed_options;
	}

	$jetpack_ai_options = array(
		'jetpack_ai_enabled',
		'jetpack_ai_writing_assistant_enabled',
		'jetpack_ai_image_editor_enabled',
		'jetpack_ai_feature_clip_enabled',
		'jetpack_ai_seo_enabled',
	);

	$allowed_options['general'] = array_values( array_diff( $allowed_options['general'], $jetpack_ai_options ) );

	return $allowed_options;
}
add_filter( 'allowed_options', __NAMESPACE__ . '\\exclude_from_general_options', 20 );
