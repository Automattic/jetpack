<?php
/**
 * Repair Jetpack AI settings on WordPress.com Simple sites.
 *
 * @package automattic/jetpack-mu-wpcom
 */

namespace Automattic\Jetpack\Jetpack_Mu_Wpcom\Jetpack_AI_Options_Repair;

use Automattic\Jetpack\Status\Host;

/**
 * Jetpack AI options corrupted by General Settings saves.
 */
const JETPACK_AI_OPTIONS = array(
	'jetpack_ai_enabled',
	'jetpack_ai_writing_assistant_enabled',
	'jetpack_ai_image_editor_enabled',
	'jetpack_ai_feature_clip_enabled',
	'jetpack_ai_seo_enabled',
);

/**
 * Records that the Simple-site repair has run.
 */
const SIMPLE_REPAIR_MARKER = 'jetpack_mu_wpcom_ai_options_repaired';

/**
 * Restore Jetpack AI defaults on Simple sites affected by General Settings saves.
 *
 * @return void
 */
function repair_wpcom_simple_options() {
	if ( ! ( new Host() )->is_wpcom_simple() || get_option( SIMPLE_REPAIR_MARKER, false ) ) {
		return;
	}

	foreach ( JETPACK_AI_OPTIONS as $option ) {
		delete_option( $option );
	}

	update_option( SIMPLE_REPAIR_MARKER, true, false );
}
repair_wpcom_simple_options();
