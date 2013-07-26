<?php

class Jetpack_Heartbeat {

	/**
	 * Jetpack object
	 * 
	 * @since 2.3.3
	 * @var Jetpack 
	 */
	var $jetpack = null;

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
		$this->jetpack = Jetpack::init();

		// Add weekly interval for wp-cron
		add_filter('cron_schedules', array( $this, 'add_cron_intervals' ) );

		// Schedule the task
		add_action( $this->cron_name, array( $this, 'cron_exec' ) );

		if (!wp_next_scheduled( $this->cron_name ) ) {
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

		$jetpack = $this->jetpack;

		$jetpack->stat( 'active-modules', implode( ',', $this->jetpack->get_active_modules() ) );
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

		// Only check a few plugins, to see if they're currently active.
		$plugins_to_check = array(
			'vaultpress/vaultpress.php',
			'akismet/akismet.php',
			'wp-super-cache/wp-cache.php',
		);
		$plugins = array_intersect( $plugins_to_check, get_option( 'active_plugins', array() ) );
		foreach( $plugins as $plugin ) {
			$jetpack->stat( 'plugins', $plugin );
		}

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
		    'display' => __('Jetpack weekly')
		);
		return $schedules;
	}

	public function deactivate() {
		$timestamp = wp_next_scheduled( $this->cron_name );
		wp_unschedule_event($timestamp, $this->cron_name );
	}

}// end class
