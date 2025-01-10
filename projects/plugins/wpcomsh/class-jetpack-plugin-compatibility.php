<?php
/**
 * Plugin compatibility file.
 *
 * @package wpcomsh
 */

/**
 * Class Jetpack_Plugin_Compatibility.
 */
class Jetpack_Plugin_Compatibility {
	/**
	 * Plugin file locations and html messaging in the format:
	 * array(
	 *   'example-plugin/example-plugin.php' => 'example-plugin interferes with Jetpack sync and has been disabled.'
	 * ),
	 * The html messaging is presented as a dismissible error admin notice when an unsupported plugin is deactivated.
	 *
	 * @var string[]
	 */
	public $incompatible_plugins = array(
		// "reset" - break/interfere with provided functionality.
		'advanced-database-cleaner/advanced-db-cleaner.php' => '"advanced-database-cleaner" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'advanced-reset-wp/advanced-reset-wp.php'          => '"advanced-reset-wp" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'advanced-wp-reset/advanced-wp-reset.php'          => '"advanced-wp-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'backup/backup.php'                                => '"backup" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'better-wp-security/better-wp-security.php'        => '"better-wp-security" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'cf7-pipedrive-integration/class-cf7-pipedrive.php' => '"cf7-pipedrive-integration" has been deactivated, it interferes with site operation and is not supported on WordPress.com.',
		'database-browser/database-browser.php'            => '"database-browser" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'duplicator/duplicator.php'                        => '"duplicator" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'extended-wp-reset/extended-wp-reset.php'          => '"extended-wp-reset" has been deactivated, it interferes with site operation and is not supported on WordPress.com.',
		'file-manager-advanced/file_manager_advanced.php'  => '"file-manager-advanced" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'file-manager/file-manager.php'                    => '"file-manager" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'hide-my-wp/index.php'                             => '"hide-my-wp" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'plugins-garbage-collector/plugins-garbage-collector.php' => '"plugins-garbage-collector" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'post-type-switcher/post-type-switcher.php'        => '"post-type-switcher" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'reset-wp/reset-wp.php'                            => '"reset-wp" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'reset/data_reset.php'                             => '"reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'secure-file-manager/secure-file-manager.php'      => '"secure-file-manager" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'ultimate-reset/ultimate-reset.php'                => '"ultimate-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'ultimate-wp-reset/ultimate-wordpress-reset.php'   => '"ultimate-wp-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'username-changer/username-changer.php'            => '"username-changer" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'username-updater/username-updater.php'            => '"username-updater" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'vamtam-offline-jetpack/vamtam-offline-jetpack.php' => '"vamtam-offline-jetpack" has been deactivated, an active Jetpack Connection is required for your site to operate properly on WordPress.com.',
		'wd-youtube/wd-youtube.php'                        => '"wd-youtube" has been deactivated, it interferes with site operation and is not supported on WordPress.com.',
		'wordpress-database-reset/wp-reset.php'            => '"wordpress-database-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wordpress-reset/wordpress-reset.php'              => '"wordpress-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-automatic/wp-automatic.php'                    => '"wp-automatic" has been deactivated, it interferes with site operation and is not supported on WordPress.com.',
		'wp-clone-by-wp-academy/wpclone.php'               => '"wp-clone-by-wp-academy" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-config-file-editor/wp-config-file-editor.php'  => '"wp-config-file-editor" has been deactivated, it messes up data necessary to manage your site and is not supported on WordPress.com.',
		'wp-dbmanager/wp-dbmanager.php'                    => '"wp-dbmanager" has been deactivated, it messes up data necessary to manage your site and is not supported on WordPress.com.',
		'wp-file-manager/file_folder_manager.php'          => '"wp-file-manager" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-phpmyadmin-extension/index.php'                => '"wp-phpmyadmin-extension" has been deactivated, it interferes with site operation. You can access phpMyAdmin under Settings > Hosting Config',
		'wp-prefix-changer/index.php'                      => '"wp-prefix-changer" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-reset/wp-reset.php'                            => '"wp-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-uninstaller-by-azed/wp-uninstaller-by-azed.php' => '"wp-uninstaller-by-azed" is not supported on WordPress.com.',
		'wpmu-database-reset/wpmu-database-reset.php'      => '"wpmu-database-reset" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wps-hide-login/wps-hide-login.php'                => '"wps-hide-login" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'z-inventory-manager/z-inventory-manager.php'      => '"z-inventory-manager" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',
		'wp-downgrade/wp-downgrade.php'                    => '"wp-downgrade" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',

		// Backup.
		'backup-wd/backup-wd.php'                          => '"backup-wd" has been deactivated, WordPress.com handles managing your site backups for you.',
		'backupwordpress/backupwordpress.php'              => '"backupwordpress" has been deactivated, WordPress.com handles managing your site backups for you.',
		'backwpup/backwpup.php'                            => '"backwpup" has been deactivated, WordPress.com handles managing your site backups for you.',
		'backwpup-pro/backwpup.php'                        => '"backwpup-pro" has been deactivated, WordPress.com handles managing your site backups for you.',
		'jetpack-backup/jetpack-backup.php'                => '"jetpack-backup" has been deactivated, WordPress.com handles managing your site backups for you.',
		'wp-db-backup/wp-db-backup.php'                    => '"wp-db-backup" has been deactivated, WordPress.com handles managing your site backups for you.',

		// Caching/performance.
		'breeze/breeze.php'                                => '"breeze" has been deactivated, WordPress.com automatically handles caching for your site.',
		'cache-enabler/cache-enabler.php'                  => '"cache-enabler" has been deactivated, WordPress.com automatically handles caching for your site.',
		'comet-cache/comet-cache.php'                      => '"comet-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'hyper-cache/plugin.php'                           => '"hyper-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'jch-optimize/jch-optimize.php'                    => '"jch-optimize" has been deactivated, WordPress.com automatically handles caching for your site.',
		'performance-lab/load.php'                         => '"performance-lab" has been deactivated, WordPress.com automatically handles caching and database optimization for your site.',
		'powered-cache/powered-cache.php'                  => '"powered-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'quick-cache/quick-cache.php'                      => '"quick-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'redis-cache/redis-cache.php'                      => '"redis-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'sg-cachepress/sg-cachepress.php'                  => '"sg-cachepress" has been deactivated, WordPress.com automatically handles caching for your site.',
		'w3-total-cache/w3-total-cache.php'                => '"w3-total-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'wp-cache/wp-cache.php'                            => '"wp-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'wp-fastest-cache/wpFastestCache.php'              => '"wp-fastest-cache" has been deactivated, WordPress.com automatically handles caching for your site.',
		'wp-optimizer/wp-optizer.php'                      => '"wp-optimizer" has been deactivated, "performance" related plugins may break your site or cause issues and are not supported on WordPress.com.', // p9F6qB-66o-p2
		'wp-speed-of-light/wp-speed-of-light.php'          => '"wp-speed-of-light" has been deactivated, WordPress.com automatically handles caching for your site.',
		'wp-super-cache/wp-cache.php'                      => '"wp-super-cache" has been deactivated, WordPress.com automatically handles caching for your site.',

		// SQL heavy.
		'another-wordpress-classifieds-plugin/awpcp.php'   => '"another-wordpress-classifieds-plugin" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'broken-link-checker/broken-link-checker.php'      => '"broken-link-checker" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'leads/leads.php'                                  => '"leads" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'native-ads-adnow/adnow-widget.php'                => '"native-ads-now" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'ol_scrapes/ol_scrapes.php'                        => '"ol_scrapes" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'page-visit-counter/page-visit-counter.php'        => '"page-visit-counter" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'post-views-counter/post-views-counter.php'        => '"post-views-counter" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'tokenad/token-ad.php'                             => '"tokenad" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'top-10/top-10.php'                                => '"top-10" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'userpro/index.php'                                => '"userpro" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wordpress-popular-posts/wordpress-popular-posts.php' => '"wordpress-popular-posts" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-cerber/wp-cerber.php'                          => '"wp-cerber" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-inject/wpinject.php'                           => '"wp-inject" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-postviews/wp-postviews.php'                    => '"wp-postviews" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'wp-rss-aggregator/wp-rss-aggregator.php'          => '"wp-rss-aggregator" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-rss-feed-to-post/wp-rss-feed-to-post.php'      => '"wp-rss-feed-to-post" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-rss-wordai/wp-rss-wordai.php'                  => '"wp-rss-wordai" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-session-manager/wp-session-manager.php'        => '"wp-session-manager" has been deactivated, it is known to cause severe database performance issues and is not supported.',
		'wp-slimstat/wp-slimstat.php'                      => '"wp-slimstat" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'wp-statistics/wp-statistics.php'                  => '"wp-statistics" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'wp-ulike/wp-ulike.php'                            => '"wp-ulike" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',
		'WPRobot5/wprobot.php'                             => '"WPRobot5" has been deactivated, plugins that insert or update the database on page load can cause severe performance issues for your site and are not supported.',

		// Security.
		'antihacker/antihacker.php'                        => '"antihacker" has been deactivated, "security" related plugins may break your site or cause performance issues for your site and are not supported on WordPress.com.',
		'deactivate-xml-rpc-service/deactivate-xml-rpc-service.php' => '"deactivate-xml-rpc-service" has been deactivated, XML-RPC is required for your Jetpack Connection on WordPress.com.',
		'disable-xml-rpc-api/disable-xml-rpc-api.php'      => '"disable-xml-rpc-api" has been deactivated, XML-RPC is required for your Jetpack Connection on WordPress.com.',
		'disable-xml-rpc-fully/disable-xml-rpc-fully.php'  => '"disable-xml-rpc-fully" has been deactivated, XML-RPC is required for your Jetpack Connection on WordPress.com.',
		'disable-xml-rpc-unset-x-pingback/index.php'       => '"disable-xml-rpc-unset-x-pingback" has been deactivated, XML-RPC is required for your Jetpack Connection on WordPress.com.',
		'disable-xml-rpc/disable-xml-rpc.php'              => '"disable-xml-rpc" has been deactivated, XML-RPC is required for your Jetpack Connection on WordPress.com.',
		'manage-xml-rpc/manage-xml-rpc.php'                => '"manage-xml-rpc" has been deactivated, XML-RPC is required for your Jetpack Connection on WordPress.com.',
		'one-click-ssl/ssl.php'                            => '"one-click-ssl" has been deactivated, because it is not supported on WordPress.com.',
		'really-simple-ssl-pro/really-simple-ssl-pro.php'  => '"really-simple-ssl-pro" is not supported on WordPress.com.',
		'sg-security/sg-security.php'                      => '"sg-security" has been deactivated, "security" related plugins may break your site or cause performance issues for your site and are not supported on WordPress.com.',
		'simple-xml-rpc-disabler/simple-xml-rpc-disabler.php' => '"simple-xml-rpc-disabler" has been deactivated, XML-RPC is required for your Jetpack Connection on WordPress.com.',
		'stopbadbots/stopbadbots.php'                      => '"stopbadbots" has been deactivated, "security" related plugins may break your site or cause performance issues for your site and are not supported on WordPress.com.',
		'wee-remove-xmlrpc-methods/wee-remove-xmlrpc-methods.php' => '"wee-remove-xmlrpc-methods" has been deactivated, XML-RPC is required for your Jetpack Connection on WordPress.com.',
		'wordfence/wordfence.php'                          => '"wordfence" has been deactivated, "security" related plugins may break your site or cause performance issues for your site and are not supported on WordPress.com.',
		'wp-hide-security-enhancer/wp-hide.php'            => '"wp-hide-security-enhancer" has been deactivated, "security" related plugins may break your site or cause performance issues for your site and are not supported on WordPress.com.',
		'wp-security-hardening/wp-hardening.php'           => '"wp-security-hardening" has been deactivated. It breaks WordPress.com required plugins.', // p9F6qB-66o-p2
		'wp-simple-firewall/wp-simple-firewall.php'        => '"wp-simple-firewall" has been deactivated, it deletes data necessary to manage your site and is not supported on WordPress.com.',

		// Spam.
		'e-mail-broadcasting/e-mail-broadcasting.php'      => '"e-mail-broadcasting" has been deactivated, plugins that support sending e-mails in bulk are not supported on WordPress.com.',
		'mailit/mailit.php'                                => '"mailit" has been deactivated, plugins that support sending e-mails in bulk are not supported on WordPress.com.',
		'send-email-from-admin/send-email-from-admin.php'  => '"send-email-from-admin" has been deactivated, plugins that support sending e-mails in bulk are not supported on WordPress.com.',

		// Cloning/staging.
		'flo-launch/flo-launch.php'                        => 'Staging plugins delete data necessary to manage your site and are not supported on WordPress.com. flo-launch has been deactivated.',
		'wp-staging/wp-staging.php'                        => 'Staging plugins delete data necessary to manage your site and are not supported on WordPress.com. wp-staging has been deactivated.',

		// Misc.
		'adult-mass-photos-downloader/adult-mass-photos-downloader.php' => '"adult-mass-photos-downloader" is not supported on WordPress.com.',
		'adult-mass-videos-embedder/adult-mass-videos-embedder.php' => '"adult-mass-videos-embedder" is not supported on WordPress.com.',
		'ari-adminer/ari-adminer.php'                      => '"ari-adminer" is not supported on WordPress.com.',
		'automatic-video-posts'                            => '"automatic-video-posts" is not supported on WordPress.com.',
		'blogmatic-poster/index.php'                       => '"blogmatic-poster" is not supported on WordPress.com.',
		'blogmatic/index.php'                              => '"blogmatic" is not supported on WordPress.com.',
		'bwp-minify/bwp-minify.php'                        => '"bwp-minify" is not supported on WordPress.com.',
		'clearfy/clearfy.php'                              => '"clearfy" is not supported on WordPress.com.',
		'cornerstone/main.php'                             => '"cornerstone" is not supported on WordPress.com.',
		'cryptocurrency-pricing-list/cryptocurrency-pricing-list-and-ticker.php' => '"cryptocurrency-pricing-list" is not supported on WordPress.com.',
		'db-access-adminer/db-access-adminer.php'          => '"db-access-adminer" is not supported on WordPress.com.',
		'event-espresso-decaf/espresso.php'                => '"event-espresso-decaf" is not supported on WordPress.com.',
		'facetwp-manipulator/facetwp-manipulator.php'      => '"facetwp-manipulator" is not supported on WordPress.com.',
		'fast-velocity-minify/fvm.php'                     => '"fast-velocity-minify" is not supported on WordPress.com.',
		'nginx-helper/nginx-helper.php'                    => '"nginx-helper" is not supported on WordPress.com.',
		'p3/p3.php'                                        => '"p3" is not supported on WordPress.com.',
		'pexlechris-adminer/pexlechris-adminer.php'        => '"pexlechris-adminer" is not supported on WordPress.com.',
		'plugin-detective/plugin-detective.php'            => '"plugin-detective" is not supported on WordPress.com.',
		'porn-embed/Porn-Embed.php'                        => '"porn-embed" is not supported on WordPress.com.',
		'propellerads-official/propeller-ads.php'          => '"propellerads-official" is not supported on WordPress.com.',
		'really-simple-ssl/rlrsssl-really-simple-ssl.php'  => '"really-simple-ssl" is not supported on WordPress.com.',
		'speed-contact-bar/speed-contact-bar.php'          => '"speed-contact-bar" is not supported on WordPress.com.',
		'trafficzion/trafficzion.php'                      => '"trafficzion" is not supported on WordPress.com.',
		'tubeace/tubeace.php'                              => '"tubeace" is not supported on WordPress.com.',
		'unplug-jetpack/unplug-jetpack.php'                => '"unplug-jetpack" is not supported on WordPress.com.',
		'video-importer/video-importer.php'                => '"video-importer" is not supported on WordPress.com.',
		'woozone/plugin.php'                               => '"woozone" is not supported on WordPress.com.',
		'wp-cleanfix/index.php'                            => '"wp-cleanfix" is not supported on WordPress.com.',
		'wp-file-upload/wordpress_file_upload.php'         => '"wp-file-upload" is not supported on WordPress.com.',
		'wp-monero-miner-pro/monero-miner-pro.php'         => '"wp-monero-miner-pro" is not supported on WordPress.com.',
		'wp-monero-miner-using-coin-hive/wp-coin-hive.php' => '"wp-monero-miner-using-coin-hive" is not supported on WordPress.com.',
		'wp-optimize-by-xtraffic/wp-optimize-by-xtraffic.php' => '"wp-optimize-by-xtraffic" is not supported on WordPress.com.',
		'wpematico/wpematico.php'                          => '"wpematico" is not supported on WordPress.com.',
		'wpstagecoach/wpstagecoach.php'                    => '"wpstagecoach" is not supported on WordPress.com.', // p9F6qB-66o-p2
		'yuzo-related-post/yuzo_related_post.php'          => '"yuzo-related-post" is not supported on WordPress.com.',
		'zapp-proxy-server/zapp-proxy-server.php'          => '"zapp-proxy-server" is not supported on WordPress.com.',

		// CRM.
		'civicrm/civicrm.php'                              => '"civicrm" is not supported on WordPress.com.', // p9F6qB-66o-p2
	);

	/**
	 * Admin notices.
	 *
	 * @var array
	 */
	protected $admin_notices = array();

	/**
	 * Jetpack_Plugin_Compatibility constructor.
	 */
	protected function __construct() {
		// Disable plugin activation for unsupported plugins.
		add_action( 'load-plugins.php', array( $this, 'check_plugin_compatibility' ) );
		// Replace "Activate" plugin link for plugins that should not be activated (plugins.php).
		add_filter( 'plugin_action_links', array( $this, 'disable_plugin_activate_link' ), 10, 2 );
		add_filter( 'network_admin_plugin_action_links', array( $this, 'disable_plugin_activate_link' ), 10, 2 );
		// Replace "Install" plugin link for plugins that not should not be activated (plugin-install.php).
		add_filter( 'plugin_install_action_links', array( $this, 'disable_plugin_install_link' ), 10, 2 );
		// Print any notices about plugin deactivation.
		add_action( 'admin_notices', array( $this, 'incompatible_plugin_notices' ) );
		// Disable My Jetpack page.
		add_filter(
			'jetpack_my_jetpack_should_initialize',
			function () {
				return get_option( 'wpcom_admin_interface' ) === 'wp-admin';
			}
		);
	}

	/**
	 * Public getter to return a singleton instance of Jetpack_Plugin_Compatibility.
	 */
	public static function get_instance(): Jetpack_Plugin_Compatibility {
		static $instance = null;

		if ( null === $instance ) {
			$instance = new static();
		}

		return $instance;
	}

	/**
	 * Deactivates incompatible plugins.
	 */
	public function check_plugin_compatibility() {
		foreach ( $this->incompatible_plugins as $plugin => $message ) {
			if ( ! is_plugin_active( $plugin ) ) {
				continue;
			}

			deactivate_plugins( $plugin );

			$this->admin_notices[] = '<div class="notice notice-error is-dismissible"><p><strong>' . esc_html( $message ) . '</strong></p></div>';
			unset( $_GET['activate'] ); // phpcs:ignore WordPress.Security.NonceVerification
		}
	}

	/**
	 * Displays admin notices.
	 */
	public function incompatible_plugin_notices() {
		foreach ( $this->admin_notices as $notice ) {
			echo wp_kses_post( $notice );
		}
	}

	/**
	 * Disables plugin activations links for incompatible plugins.
	 *
	 * @param array  $actions     Plugin actions.
	 * @param string $plugin_file Plugin file.
	 *
	 * @return array Filtered array of plugin actions.
	 */
	public function disable_plugin_activate_link( $actions, $plugin_file ) {
		if ( ! empty( $this->incompatible_plugins[ $plugin_file ] ) ) {
			$actions['activate'] = 'Disabled';
			unset( $actions['edit'] );
		}
		return $actions;
	}

	/**
	 * Disables plugin install links for incompatible plugins.
	 *
	 * @param array $action_links Plugin actions.
	 * @param array $plugin       Plugin information.
	 *
	 * @return string[]
	 */
	public function disable_plugin_install_link( $action_links, $plugin ) {
		$needle = "{$plugin['slug']}/";
		foreach ( $this->incompatible_plugins as $disallowed_plugin => $message ) {
			/*
			 * The naming convention of $disallowed_plugin is <slug>/<file>.php so we are checking if
			 * the string $needle is included into $disallowed_plugin from the `0` position.
			 */
			if ( strpos( $disallowed_plugin, $needle ) === 0 ) {
				$action_links = array( 'Not Supported' );
				break;
			}
		}

		return $action_links;
	}

	/**
	 * Find the incompatible plugins on the site.
	 *
	 * @return array
	 */
	public function find_incompatible_plugins(): array {
		// We don't apply the standard Core 'all_plugins' filter, so we are truly looking at all standard plugins.
		$standard_plugins = get_plugins();

		$disallowed_plugins = $this->get_disallowed_plugins();

		$incompatible_plugins_on_site = array();

		foreach ( $standard_plugins as $plugin_file => $plugin_details ) {
			if ( ! array_key_exists( $plugin_file, $disallowed_plugins ) ) {
				continue;
			}

			$incompatible_plugins_on_site[ $plugin_file ] = array(
				'message' => $disallowed_plugins[ $plugin_file ],
				'details' => $plugin_details,
				'status'  => $this->get_plugin_status( $plugin_file ),
			);
		}

		$mu_plugins = get_mu_plugins();

		foreach ( $mu_plugins as $mu_plugin_file => $mu_plugin_details ) {
			if ( ! array_key_exists( $mu_plugin_file, $disallowed_plugins ) ) {
				continue;
			}

			$incompatible_plugins_on_site[ $mu_plugin_file ] = array(
				'message' => $disallowed_plugins[ $mu_plugin_file ],
				'details' => $mu_plugin_details,
				'status'  => 'must-use',
			);
		}

		return $incompatible_plugins_on_site;
	}

	/**
	 * Helper function to return disallowed plugins.
	 * When possible, this function will include platform-level plugins.
	 *
	 * @return string[]
	 */
	protected function get_disallowed_plugins(): array {
		if ( ! class_exists( 'Atomic_Platform_Mu_Plugin' ) || ! method_exists( 'Atomic_Platform_Mu_Plugin', 'get_disallowed_plugins' ) ) {
			return $this->incompatible_plugins;
		}

		$platform_mu_plugin = new Atomic_Platform_Mu_Plugin();

		// We prefer product-level messages to platform messages when there are conflicts.
		return array_merge( $platform_mu_plugin->get_disallowed_plugins(), $this->incompatible_plugins );
	}

	/**
	 * Helper function to determine the status of a standard plugin.
	 *
	 * @param string $plugin_file The full plugin filename.
	 * @return 'active-network'|'active'|'inactive'
	 */
	protected function get_plugin_status( string $plugin_file ): string {
		if ( is_plugin_active_for_network( $plugin_file ) ) {
			return 'active-network';
		}

		if ( is_plugin_active( $plugin_file ) ) {
			return 'active';
		}

		return 'inactive';
	}
}
