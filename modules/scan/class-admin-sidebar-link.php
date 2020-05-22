<?php
/**
 * A class that adds a scan and backup link to the admin sidebar.
 *
 * @package automattic/jetpack
 */

namespace Automattic\Jetpack\Scan;

use Automattic\Jetpack\Redirect;
use Jetpack_Core_Json_Api_Endpoints;

/**
 * Class Main
 *
 * Responsible for showing the link if available.
 *
 * @package Automattic\Jetpack\Scan
 */
class Admin_Sidebar_Link {

	const SCHEDULE_ACTION_HOOK = 'jetpack_scan_refresh_states_event';

	/**
	 * Constructor.
	 *
	 * Adds action hooks.
	 */
	public function __construct() {
		add_action( 'jetpack_admin_menu', array( $this, 'maybe_add_admin_link' ), 99 );
		add_action( self::SCHEDULE_ACTION_HOOK, array( $this, 'refresh_state_cache' ) );
	}

	/**
	 * Adds a link to the Scan and Backup page.
	 */
	public function maybe_add_admin_link() {
		if ( ! $this->should_show_link() ) {
			return;
		}

		$has_scan   = $this->has_scan();
		$has_backup = $this->has_backup();

		if ( $has_scan && ! $has_backup ) {
			$menu_label = __( 'Scan', 'jetpack' );
		} elseif ( ! $has_scan && $has_backup ) {
			$menu_label = __( 'Backup', 'jetpack' );
		} else {
			// Will be both, as the code won't get this far if neither is true.
			$menu_label = __( 'Backup & Scan', 'jetpack' );
		}

		$new_link = array(
			esc_html( $menu_label ) . ' <span class="dashicons dashicons-external"></span>',
			'manage_options', // Check permissions here.
			esc_url( Redirect::get_url( 'calypso-backups' ) ),
		);

		// Splice the nav menu item into the Jetpack nav.
		global $submenu;
		array_splice( $submenu['jetpack'], 1, 0, array( $new_link ) );
	}

	/**
	 * Refreshes the state cache via API call. Called via cron.
	 */
	public function refresh_state_cache() {
		Jetpack_Core_Json_Api_Endpoints::get_scan_state();
		Jetpack_Core_Json_Api_Endpoints::get_rewind_data();
	}

	/**
	 * Returns true if the link should appear.
	 *
	 * @return boolean
	 */
	protected function should_show_link() {
		// Jetpack Scan/Backup is currently not supported on multisite.
		if ( is_multisite() ) {
			return false;
		}

		// Check if VaultPress is active, the assumption there is that VaultPress is working.
		// It has its own notice in the admin bar.
		if ( class_exists( 'VaultPress' ) ) {
			return false;
		}

		return $this->has_backup() || $this->has_scan();
	}

	/**
	 * Detects if Scan is enabled.
	 *
	 * @return boolean
	 */
	protected function has_scan() {
		$this->maybe_refresh_transient_cache();
		$scan_state = get_transient( 'jetpack_scan_state' );
		return ! $scan_state || 'unavailable' !== $scan_state->state;
	}

	/**
	 * Detects if Backup is enabled.
	 *
	 * @return boolean
	 */
	protected function has_backup() {
		$this->maybe_refresh_transient_cache();
		$rewind_state = get_transient( 'jetpack_rewind_state' );
		return ! $rewind_state || 'unavailable' !== $rewind_state->state;
	}

	/**
	 * Triggers a cron job to refresh the Scan and Rewind state cache.
	 */
	protected function maybe_refresh_transient_cache() {
		if ( false !== get_transient( 'jetpack_scan_state' ) && false !== get_transient( 'jetpack_rewind_state' ) ) {
			return;
		}

		if ( false === wp_next_scheduled( self::SCHEDULE_ACTION_HOOK ) ) {
			wp_schedule_single_event( time(), self::SCHEDULE_ACTION_HOOK );
		}
	}
}
