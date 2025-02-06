<?php

namespace Automattic\Jetpack\WP_JS_Data_Sync;

use Automattic\Jetpack\Schema\Utils as Schema_Utils;

class DS_Utils {
	/**
	 * Is the current environment a development environment?
	 *
	 * @return bool
	 */
	public static function is_debug(): bool {
		return ( defined( 'DATASYNC_DEBUG' ) && \DATASYNC_DEBUG ) || Schema_Utils::is_debug();
	}

	public static function debug_disable( $name ) {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended
		if ( isset( $_GET['ds-debug-disable'] ) && ( is_admin() || ( defined( 'REST_REQUEST' ) && REST_REQUEST ) ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended
			$values = explode( ',', sanitize_key( $_GET['ds-debug-disable'] ) );
			if ( ! $values || ! is_array( $values ) ) {
				return false;
			}
			if ( $values === array( 'all' ) ) {
				return true;
			}
			return in_array( $name, $values, true );
		}
		return false;
	}
}
