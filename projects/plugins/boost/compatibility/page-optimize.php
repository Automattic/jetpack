<?php
/**
 * Compatibility for Page Optimize.
 *
 * @package automattic/jetpack-boost
 */

/**
 * Handles migrating options to.
 *
 * @param mixed  $pre_option The value used to short-circuit retrieval using the pre_option filter.
 * @param string $option     Name of the option.
 *
 * @return $pre_option       The value used to short-circuit retrieval using the pre_option filter.
 */
function jetpack_boost_page_optimize_migrate_options( $pre_option, $option ) {
	// If any of the options are requested,
	// migrate all if old ones exist.

	$current_legacy_option_name = str_replace( 'jetpack_boost_', '', $option );
	$legacy_options             = array(
		'page_optimize-js',
		'page_optimize-css',
		'page_optimize-load-mode',
		'page_optimize-js-exclude',
		'page_optimize-css-exclude',
	);
	if ( ! in_array( $current_legacy_option_name, $legacy_options, true ) ) {
		return $pre_option;
	}

	// Prevent recursion.
	remove_filter( 'pre_option', 'jetpack_boost_page_optimize_migrate_options', 10, 2 );

	// Populate new options from old options.
	foreach ( $legacy_options as $legacy_option_name ) {
		$old_value = get_option( $legacy_option_name );
		if ( false !== $old_value ) {
			update_option( 'jetpack_boost_' . $legacy_option_name, $old_value );
			delete_option( $legacy_option_name );

			// Update current option value, to use correct value (old one).
			if ( $legacy_option_name === $current_legacy_option_name ) {
				$pre_option = $old_value;
			}
		}
	}

	return $pre_option;
}
add_filter( 'pre_option', 'jetpack_boost_page_optimize_migrate_options', 10, 3 );
