<?php

/**
 * Get shared configuration for each migration button.
 */
function wpsc_get_boost_migration_config() {
	return array(
		'install_url'  => wp_nonce_url( admin_url( 'update.php?action=install-plugin&plugin=jetpack-boost' ), 'install-plugin_jetpack-boost' ),
		'activate_url' => admin_url( 'plugins.php' ),
		'is_installed' => wpsc_is_boost_installed(),
	);
}

/**
 * Add a notice to the settings page if the Jetpack Boost cache module is detected.
 * The notice contains instructions on how to disable the Boost Cache module.
 */
function wpsc_deactivate_boost_cache_notice() {
	global $wpsc_advanced_cache_filename;
	?>
	<div style="width: 50%" class="notice notice-error"><h2><?php esc_html_e( 'Warning! Jetpack Boost Cache Detected', 'wp-super-cache' ); ?></h2>
		<?php // translators: %s is the filename of the advanced-cache.php file ?>
		<p><?php printf( esc_html__( 'The file %s was created by the Jetpack Boost plugin.', 'wp-super-cache' ), esc_html( $wpsc_advanced_cache_filename ) ); ?></p>
		<p><?php esc_html_e( 'You can use Jetpack Boost and WP Super Cache at the same time but only if the Cache Site Pages module in Boost is disabled. To use WP Super Cache for caching:', 'wp-super-cache' ); ?></p>
		<ol>
			<?php // translators: %s is a html link to the Boost settings page ?>
			<li><?php printf( esc_html__( 'Deactivate the "Cache Site Pages" module of Jetpack Boost on the %s page.', 'wp-super-cache' ), '<a href="' . esc_url( admin_url( 'admin.php?page=jetpack-boost' ) ) . '">' . esc_html__( 'Boost Settings', 'wp-super-cache' ) . '</a>' ); ?></li>
			<li><?php esc_html_e( 'Reload this page to configure WP Super Cache.', 'wp-super-cache' ); ?></li>
			<li><?php esc_html_e( 'You can continue to use the other features of Jetpack Boost.', 'wp-super-cache' ); ?></li>
		</ol>
	</div>
	<?php
	set_transient( 'wpsc_boost_cache_notice_displayed', true, WEEK_IN_SECONDS );
}

/**
 * Tell Jetpack when the cache is moved from Jetpack Boost to WP Super Cache.
 */
function wpsc_track_move_from_boost() {
	if ( ! get_transient( 'wpsc_boost_cache_notice_displayed' ) ) {
		return;
	}
	delete_transient( 'wpsc_boost_cache_notice_displayed' );

	do_action( 'jb_cache_moved_to_wpsc' );
}
add_action( 'wpsc_created_advanced_cache', 'wpsc_track_move_from_boost' );

/**
 * Notify Jetpack Boost that Boost Cache will be used instead of WP Super Cache.
 *
 * @param string $source The source of the migration: 'notice', 'banner', 'try_button'.
 */
function wpsc_notify_migration_to_boost( $source ) {
	if ( ! in_array( $source, array( 'notice', 'banner', 'try_button' ), true ) ) {
		return;
	}
	set_transient( 'jb_cache_moved_to_boost', $source, WEEK_IN_SECONDS );
}