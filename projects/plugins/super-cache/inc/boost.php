<?php
/**
 * Dummy function until #37797 is merged.
 *
 * @param string $source The source button of the migration.
 */
function wpsc_notify_migration_to_boost( $source ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
}

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
 * Display a Jetpack Boost admin notice.
 */
function wpsc_jetpack_boost_install_notice() {
	// Don't show the banner if Boost is installed, or the banner has been dismissed.
	$is_dismissed = '1' === get_user_option( 'wpsc_dismissed_boost_admin_notice' );
	if ( $is_dismissed ) {
		return;
	}

	$config       = wpsc_get_boost_migration_config();
	$button_url   = $config['is_installed'] ? $config['activate_url'] : $config['install_url'];
	$button_class = $config['is_installed'] ? 'wpsc-activate-boost-button' : 'wpsc-install-boost-button';

	?>
	<div id="wpsc-notice-boost-migrate" class="notice notice-success is-dismissible">
	<h3>
		<?php esc_html_e( 'Migrate to Jetpack Boost', 'wp-super-cache' ); ?>
	</h3>
	<p>
		<?php esc_html_e( 'Your WP Super Cache setup is compatible with Boost\'s new caching feature. Continue to cache as you currently do and enhance your site\'s speed using our highly-rated performance solutions.', 'wp-super-cache' ); ?>
	</p>

	<p>
		<a data-source='notice' class='button button-primary <?php echo esc_attr( $button_class ); ?>' href="<?php echo esc_url( $button_url ); ?>">
			<strong>
				<?php esc_html_e( 'Migrate now', 'wp-super-cache' ); ?>
			</strong>
		</a>
		<a class="jb-dismiss-notice" href="">
			<strong>
				<?php esc_html_e( 'Dismiss notice', 'wp-super-cache' ); ?>
			</strong>
		</a>
	</p>
	</div>
	<?php
}
if ( isset( $_GET['page'] ) && $_GET['page'] === 'wpsupercache' ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended
	add_action( 'admin_notices', 'wpsc_jetpack_boost_install_notice' );
}

/**
 * Display the secondary button next to the "Update Status" button.
 */
function wpsc_jetpack_boost_install_secondary_button() {
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
