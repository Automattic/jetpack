<?php

class Jetpack_Heartbeat {
	var $jetpack = null;

	public function __construct() {
		$this->jetpack = Jetpack::init();

		// Add weekly interval for wp-cron
		add_filter('cron_schedules', array($this, 'add_cron_intervals'));

		// Schedule the task
		add_action('jetpack_heartbeat', array( $this, 'cron_exec' ) );

		if (!wp_next_scheduled('jetpack_heartbeat')) {
			wp_schedule_event(time(), 'jetpack_weekly', 'jetpack_heartbeat');
		}
	}
	
	public function cron_exec() {
		global $wp_version;
		
		/*
		 * Check for an identity crisis
		 * 
		 * If one exists:
		 * - Bump stat for ID crisis
		 * - Email site admin about potential ID crisis
		 * - Abort the rest of the heartbeat
		 */ 
		
		
		
		/**
		 * Setup an array of items that will eventually be stringified
		 * and sent off to the Jetpack API 
		 * 
		 * Associative array with format group => values
		 * - values should be an array that will be imploded to a string
		 */

		$this->jetpack->stat( 'active-modules', implode( ',', $this->jetpack->get_active_modules() ) );
		$this->jetpack->stat( 'active', JETPACK__VERSION );
		$this->jetpack->stat( 'wp-version', $wp_version );
		$this->jetpack->stat( 'php-version', PHP_VERSION );
		// DATABASE AND VERSION?
		$this->jetpack->stat( 'ssl',  Jetpack::is_ssl() );

		// For the future - $data = apply_filters( 'jetpack_heartbeat_data', $data );
	}

	/**
	 *
	 * @since 2.3.3
	 * @return array 
	 */
	public function add_cron_intervals() {
		$schedules['jetpack_weekly'] = array(
		    'interval' => WEEK_IN_SECONDS,
		    'display' => __('Jetpack weekly')
		);
		return $schedules;
	}

}

// end class