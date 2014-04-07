<?php

class Jetpack_Heartbeat {

	/**
	 * Holds the singleton instance of this class
	 *
	 * @since 2.3.3
	 * @var Jetpack_Heartbeat
	 */
	static $instance = false;

	private $cron_name = 'jetpack_heartbeat';

	/**
	 * Singleton
	 *
	 * @since 2.3.3
	 * @static
	 * @return Jetpack_Heartbeat
	 */
	public static function init() {
		if ( ! self::$instance ) {
			self::$instance = new Jetpack_Heartbeat;
		}

		return self::$instance;
	}

	/**
	 * Constructor for singleton
	 *
	 * @since 2.3.3
	 * @return Jetpack_Heartbeat
	 */
	private function __construct() {
		if ( ! Jetpack::is_active() )
			return;

		// Add weekly interval for wp-cron
		add_filter( 'cron_schedules', array( $this, 'add_cron_intervals' ) );

		// Schedule the task
		add_action( $this->cron_name, array( $this, 'cron_exec' ) );

		if ( ! wp_next_scheduled( $this->cron_name ) ) {
			wp_schedule_event( time(), 'jetpack_weekly', $this->cron_name );
		}
	}
	
	/**
	 * Method that gets executed on the wp-cron call
	 *
	 * @since 2.3.3
	 * @global string $wp_version
	 */
	public function cron_exec() {

		/*
		 * This should run weekly.  Figuring in for variances in
		 * WP_CRON, don't let it run more than every six days at most.
		 *
		 * i.e. if it ran less than six days ago, fail out.
		 */
		$last = (int) Jetpack_Options::get_option( 'last_heartbeat' );
		if ( $last && ( $last + WEEK_IN_SECONDS - DAY_IN_SECONDS > time() ) ) {
			return;
		}

		/*
		 * Check for an identity crisis
		 *
		 * If one exists:
		 * - Bump stat for ID crisis
		 * - Email site admin about potential ID crisis
		 */



		/**
		 * Setup an array of items that will eventually be stringified
		 * and sent off to the Jetpack API
		 *
		 * Associative array with format group => values
		 * - values should be an array that will be imploded to a string
		 */

		$jetpack = Jetpack::init();

		$jetpack->stat( 'active-modules', implode( ',', $jetpack->get_active_modules() )       );
		$jetpack->stat( 'active',         JETPACK__VERSION                                     );
		$jetpack->stat( 'wp-version',     get_bloginfo( 'version' )                            );
		$jetpack->stat( 'php-version',    PHP_VERSION                                          );
		$jetpack->stat( 'ssl',            $jetpack->permit_ssl()                               );
		$jetpack->stat( 'language',       get_bloginfo( 'language' )                           );
		$jetpack->stat( 'charset',        get_bloginfo( 'charset' )                            );
		$jetpack->stat( 'qty-posts',      wp_count_posts()->publish                            );
		$jetpack->stat( 'qty-pages',      wp_count_posts( 'page' )->publish                    );
		$jetpack->stat( 'qty-comments',   wp_count_comments()->approved                        );
		$jetpack->stat( 'is-multisite',   is_multisite() ? 'multisite' : 'singlesite'          );
		$jetpack->stat( 'identitycrisis', Jetpack::check_identity_crisis( 1 ) ? 'yes' : 'no'   );

		// Only check a few plugins, to see if they're currently active.
		$plugins_to_check = array(
			'vaultpress/vaultpress.php',
			'akismet/akismet.php',
			'wp-super-cache/wp-cache.php',
		);
		$active_plugins = Jetpack::get_active_plugins();
		$plugins = array_intersect( $plugins_to_check, $active_plugins );
		foreach( $plugins as $plugin ) {
			$jetpack->stat( 'plugins', $plugin );
		}

		// New Stats so we don't have old bad data cluttering it...
		// In an old version, some sites were inadvertently firing off far more frequently
		// than weekly and are still polluting the data as it is anonymized.

		// @todo: Set the prefix (Currently v2-) to a variable, or move this into a subfunction
		// accepting the prefix as an argument, so we can track stats by plugin version.

		$jetpack->stat( 'v2-active',         JETPACK__VERSION                                   );
		$jetpack->stat( 'v2-wp-version',     get_bloginfo( 'version' )                          );
		$jetpack->stat( 'v2-php-version',    PHP_VERSION                                        );
		$jetpack->stat( 'v2-wp-branch',      floatval( get_bloginfo( 'version' ) )              );
		$jetpack->stat( 'v2-php-branch',     floatval( PHP_VERSION )                            );
		$jetpack->stat( 'v2-ssl',            $jetpack->permit_ssl()                             );
		$jetpack->stat( 'v2-language',       get_bloginfo( 'language' )                         );
		$jetpack->stat( 'v2-charset',        get_bloginfo( 'charset' )                          );
		$jetpack->stat( 'v2-is-multisite',   is_multisite() ? 'multisite' : 'singlesite'        );
		$jetpack->stat( 'v2-identitycrisis', Jetpack::check_identity_crisis( 1 ) ? 'yes' : 'no' );

		foreach ( $jetpack->get_available_modules() as $slug ) {
			$jetpack->stat( "v2-module-{$slug}", Jetpack::is_module_active( $slug ) ? 'on' : 'off' );
		}

		// Get aggregate data about what plugins are used in conjunction with Jetpack, so
		// we can know what we should spend time testing for compatability with.
		foreach( Jetpack::get_active_plugins() as $plugin ) {
			$jetpack->stat( 'v2-plugins', $plugin );
		}

		Jetpack_Options::update_option( 'last_heartbeat', time() );

		$jetpack->do_stats( 'server_side' );
	}

	/**
	 * Adds additional Jetpack specific intervals to wp-cron
	 *
	 * @since 2.3.3
	 * @return array
	 */
	public function add_cron_intervals( $schedules ) {
		$schedules['jetpack_weekly'] = array(
		    'interval' => WEEK_IN_SECONDS,
		    'display' => __( 'Jetpack weekly', 'jetpack' ),
		);
		return $schedules;
	}

	public function deactivate() {
		$timestamp = wp_next_scheduled( $this->cron_name );
		wp_unschedule_event( $timestamp, $this->cron_name );
	}

}
