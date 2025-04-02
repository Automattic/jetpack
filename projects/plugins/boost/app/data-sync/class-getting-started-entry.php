<?php

namespace Automattic\Jetpack_Boost\Data_Sync;

use Automattic\Jetpack\Status;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Get;
use Automattic\Jetpack\WP_JS_Data_Sync\Contracts\Entry_Can_Set;
use Automattic\Jetpack_Boost\Lib\Connection;
use Automattic\Jetpack_Boost\Lib\Premium_Features;

class Getting_Started_Entry implements Entry_Can_Get, Entry_Can_Set {
	private $option_key = 'jb_get_started';

	/**
	 * Determines if the user should be shown the Getting Started page.
	 */
	public function get( $fallback = false ) {
		// No point in showing the page if the site is offline, it's probably localhost.
		if ( ( new Status() )->is_offline_mode() ) {
			return false;
		}

		// No need to show the page if the site is private.
		if ( ( new Status() )->is_private_site() ) {
			return false;
		}

		// If there is no connection, the page must be shown to give them a chance to connect by choosing a plan.
		if ( ! ( new Connection() )->is_connected() ) {
			return true;
		}

		// If the site already has premium plan, there is no need to show the page.
		if ( Premium_Features::has_any() ) {
			return false;
		}

		// For all other cases, the page should be shown only if the flag is set. It indicates that it's a new site.
		if ( $fallback !== false ) {
			return \get_option( $this->option_key, $fallback );
		}
		return \get_option( $this->option_key );
	}

	public function set( $value ) {
		if ( $value === true ) {
			update_option( $this->option_key, $value, false );
		} else {
			delete_option( $this->option_key );
		}
	}
}
