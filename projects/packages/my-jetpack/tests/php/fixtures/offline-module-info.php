<?php
/**
 * Module metadata for isolated standalone activation tests.
 *
 * @package automattic/my-jetpack
 */

/** @return bool Whether the module has no metadata. */
function jetpack_has_no_module_info() {
	return false;
}

/**
 * @param string $slug Module slug.
 * @return array Test module headers.
 */
function jetpack_get_module_info( $slug ) {
	return array_fill_keys( array( 'sort', 'recommendation_order', 'deactivate', 'free', 'auto_activate', 'module_tags', 'plan_classes', 'feature' ), '' ) + array(
		'requires_connection'      => 'markdown' === $slug ? 'No' : 'Yes',
		'requires_user_connection' => 'No',
	);
}
