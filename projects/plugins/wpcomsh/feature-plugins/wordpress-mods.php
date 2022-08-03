<?php
/**
 * File for all Atomic-specific changes to WordPress.
 *
 * @package wpcomsh
 */

/**
 * Upgrade transferred db.
 *
 * @return void
 */
function wpcomsh_upgrade_transferred_db() {
	global $wp_db_version;

	if ( isset( $_SERVER['ATOMIC_SITE_ID'] ) ) {
		$atomic_site_id = $_SERVER['ATOMIC_SITE_ID']; //phpcs:ignore WordPress.Security.ValidatedSanitizedInput
	} elseif ( defined( 'ATOMIC_SITE_ID' ) ) {
		$atomic_site_id = ATOMIC_SITE_ID;
	}

	if (
		empty( $atomic_site_id ) ||
		$atomic_site_id <= 149474462 /* Last site ID before WP 5.5 update. */
	) {
		// We only want to run for real sites created after the WordPress 5.5 update.
		return;
	}

	// Value taken from https://github.com/WordPress/wordpress-develop/blob/b591209e141e0357a69fff1d01d2650ac2d916cb/src/wp-includes/version.php#L23
	$db_version_5_5 = 48748;

	if ( $wp_db_version < $db_version_5_5 ) {
		// WordPress isn't yet at the version for upgrade.
		return;
	}

	if ( get_option( 'wpcomsh_upgraded_db' ) ) {
		/*
		 * We only ever want to upgrade the DB once per transferred site.
		 * After that, the platform should take care of upgrades as WordPress is updated.
		 */
		return;
	}

	/*
	 * Log the upgrade immediately because we do not want to re-attempt upgrade and bring down a site if there are
	 * persistent errors.
	 */
	update_option( 'wpcomsh_upgraded_db', 1 );

	/*
	 * We have to be in installation mode to work with options deprecated in WP 5.5.
	 * Otherwise all gets and updates are directed to the new option names.
	 */
	wp_installing( true );

	// Logic derived from: https://github.com/WordPress/wordpress-develop/blob/b591209e141e0357a69fff1d01d2650ac2d916cb/src/wp-admin/includes/upgrade.php#L2176
	if (
		false !== get_option( 'comment_whitelist' ) &&
		// Default value from: https://github.com/WordPress/wordpress-develop/blob/f0733600c9b8a0833d7e63f60fae651d46f22320/src/wp-admin/includes/schema.php#L536
		in_array( get_option( 'comment_previously_approved' ), array( false, 1 /* default value */ ) ) //phpcs:ignore WordPress.PHP.StrictInArray.MissingTrueStrict
	) {
		$comment_previously_approved = get_option( 'comment_whitelist', '' );
		update_option( 'comment_previously_approved', $comment_previously_approved );
		delete_option( 'comment_whitelist' );
	}

	// Logic derived from: https://github.com/WordPress/wordpress-develop/blob/b591209e141e0357a69fff1d01d2650ac2d916cb/src/wp-admin/includes/upgrade.php#L2182
	if (
		false !== get_option( 'blacklist_keys' ) &&
		// Default value from https://github.com/WordPress/wordpress-develop/blob/f0733600c9b8a0833d7e63f60fae651d46f22320/src/wp-admin/includes/schema.php#L535
		in_array( get_option( 'disallowed_keys' ), array( false, '' /* default value */ ) ) //phpcs:ignore WordPress.PHP.StrictInArray.MissingTrueStrict
	) {
		// Use more clear and inclusive language.
		$disallowed_list = get_option( 'blacklist_keys' );

		/*
		 * This option key was briefly renamed `blocklist_keys`.
		 * Account for sites that have this key present when the original key does not exist.
		 */
		if ( false === $disallowed_list ) {
			$disallowed_list = get_option( 'blocklist_keys' );
		}

		update_option( 'disallowed_keys', $disallowed_list );
		delete_option( 'blacklist_keys' );
		delete_option( 'blocklist_keys' );
	}

	// We're done updating deprecated options.
	wp_installing( false );

	/*
	 * Make sure that comment_type update is attempted.
	 *
	 * @see https://github.com/WordPress/wordpress-develop/blob/b591209e141e0357a69fff1d01d2650ac2d916cb/src/wp-admin/includes/upgrade.php#L2199
	 */
	if (
		! get_option( 'finished_updating_comment_type' ) &&
		false === wp_next_scheduled( 'wp_update_comment_type_batch' )
	) {
		update_option( 'finished_updating_comment_type', 0 );
		wp_schedule_single_event( time() + ( 1 * MINUTE_IN_SECONDS ), 'wp_update_comment_type_batch' );
	}

	// We need to be in installation mode to get actual, saved DB version.
	wp_installing( true );
	$current_db_version = get_option( 'db_version' );
	wp_installing( false );

	/*
	 * Update DB version to avoid applying core upgrade logic which may be destructive
	 * to things like the new `comment_previously_approved` option.
	 *
	 * @see https://github.com/WordPress/wordpress-develop/blob/b591209e141e0357a69fff1d01d2650ac2d916cb/src/wp-admin/includes/upgrade.php#L2178
	 */
	if ( $current_db_version < $db_version_5_5 ) {
		update_option( 'db_version', $db_version_5_5 );

		// Preserve previous version for troubleshooting.
		update_option( 'wpcom_db_version_before_upgrade', $current_db_version, false /* Do not autoload. */ );
	}
}
add_action( 'muplugins_loaded', 'wpcomsh_upgrade_transferred_db' );

/**
 * Logs wp_die() calls.
 *
 * @param string|WP_Error $message Error message or WP_Error object.
 * @param string          $title   Optional. Error title. Default empty.
 * @param string|array    $args    Optional. Arguments to control behavior. Default empty array.
 * @return void
 */
function wpcomsh_wp_die_handler( $message, $title = '', $args = array() ) {
	$exception = new Exception( 'wp_die was called' );
	error_log( $exception ); //phpcs:ignore WordPress.PHP.DevelopmentFunctions

	if ( function_exists( '_default_wp_die_handler' ) ) {
		_default_wp_die_handler( $message, $title, $args );
		return;
	}

	// If the default wp_die handler is not available just die.
	die();
}

/**
 * Get wp die handler.
 */
function wpcomsh_get_wp_die_handler() {
	return 'wpcomsh_wp_die_handler';
}
// Disabling the die handler per p9F6qB-3TQ-p2
// add_filter( 'wp_die_handler', 'wpcomsh_get_wp_die_handler' );

/**
 * Links were removed in 3.5 core, but we've kept them active on dotcom.
 * This will expose both the Links section, and the widget.
 */
add_filter( 'pre_option_link_manager_enabled', '__return_true' );

/**
 * WordPress 5.3 adds "big image" processing, for images over 2560px (by default).
 * This is not needed on Atomic since we use Photon for dynamic image work.
 */
add_filter( 'big_image_size_threshold', '__return_false' );

/**
 * WordPress 5.3 adds periodic admin email verification, disable it for WordPress.com on Atomic.
 */
add_filter( 'admin_email_check_interval', '__return_zero' );

/**
 * Limit post revisions.
 *
 * @return int
 */
function wpcomsh_limit_post_revisions() {
	return 100;
}
add_filter( 'wp_revisions_to_keep', 'wpcomsh_limit_post_revisions', 5 );

/**
 * Remove WordPress 5.2+ Site Health Tests that are not a good fit for Atomic.
 *
 * @param array $tests An associative array to declare if the test should run via Ajax calls after page load.
 * @return array
 */
function wpcomsh_site_status_tests_disable( $tests ) {
	unset( $tests['direct']['plugin_version'] );
	unset( $tests['direct']['theme_version'] );

	return $tests;
}
add_filter( 'site_status_tests', 'wpcomsh_site_status_tests_disable' );

/**
 * Don't allow site owners to be removed.
 *
 * @param array $allcaps An array of all the user's capabilities.
 * @param array $caps    Actual capabilities for meta capability.
 * @param array $args    Optional parameters passed to has_cap(), typically object ID.
 * @return array
 */
function wpcomsh_prevent_owner_removal( $allcaps, $caps, $args ) {
	// Trying to edit or delete a user other than yourself?
	if ( in_array( $args[0], array( 'edit_user', 'delete_user', 'remove_user', 'promote_user' ), true ) ) {
		$jetpack = get_option( 'jetpack_options' );

		if ( ! empty( $jetpack['master_user'] ) && $args[2] === $jetpack['master_user'] ) {
			return array();
		}
	}

	return $allcaps;
}
add_filter( 'user_has_cap', 'wpcomsh_prevent_owner_removal', 10, 3 );
