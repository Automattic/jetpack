<?php
/**
 * Protects core's React script handles on the Stats admin page.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

/**
 * Guards the shared `react` / `react-dom` script handles against plugins that repoint
 * them to an incompatible bundle (e.g. The Events Calendar), which would break every
 * React consumer on the page — including the Stats dashboard.
 *
 * The snapshot is a passive, page-agnostic capture of core's registration. The restore
 * is page-scoped and only acts when a handle has actually been repointed away from core.
 * It runs at `admin_enqueue_scripts` / `PHP_INT_MAX`, which beats enqueue-time repointing
 * (what The Events Calendar does); a plugin repointing later (e.g. on `admin_print_scripts`)
 * is out of scope.
 */
class React_Handle_Guard {

	/**
	 * The shared React handles this guard protects.
	 *
	 * @var string[]
	 */
	const HANDLES = array( 'react', 'react-dom' );

	/**
	 * Snapshot of core's canonical registration, keyed by handle.
	 *
	 * @var array<string, \_WP_Dependency>
	 */
	private static $snapshot = array();

	/**
	 * Whether the snapshot hook has already been registered.
	 *
	 * @var bool
	 */
	private static $snapshot_hooked = false;

	/**
	 * Register a passive snapshot of core's React handles.
	 *
	 * Core registers `react` / `react-dom` on `wp_default_scripts` at the default priority 10
	 * (via `wp_default_packages`). We snapshot at priority 20 on every firing so we always hold
	 * the latest registration-time state — core plus any registration-time override (e.g. a page
	 * builder shipping its own matched React pair) — captured before the `admin_enqueue_scripts`
	 * repointing this guard defends against. `wp_default_scripts` may already have fired (a plugin
	 * can instantiate `wp_scripts()` early), so the current state is also captured immediately.
	 * Admin-only and idempotent.
	 */
	public static function register_snapshot() {
		if ( self::$snapshot_hooked || ! is_admin() ) {
			return;
		}
		self::$snapshot_hooked = true;

		add_action( 'wp_default_scripts', array( __CLASS__, 'snapshot_core_handles' ), 20 );

		if ( did_action( 'wp_default_scripts' ) ) {
			self::snapshot_core_handles( wp_scripts() );
		}
	}

	/**
	 * Clone core's registration for each protected handle.
	 *
	 * @param \WP_Scripts $scripts The scripts registry, as passed by `wp_default_scripts`.
	 */
	public static function snapshot_core_handles( $scripts ) {
		foreach ( self::HANDLES as $handle ) {
			if ( isset( $scripts->registered[ $handle ] ) ) {
				self::$snapshot[ $handle ] = clone $scripts->registered[ $handle ];
			}
		}
	}

	/**
	 * Restore core's registration for any handle that has been repointed away from it.
	 *
	 * Call on `admin_enqueue_scripts` at `PHP_INT_MAX`, scoped to a React-mounting page. When a
	 * handle still matches core's snapshot (the clean-site path), it is left untouched.
	 */
	public static function restore_if_hijacked() {
		$scripts = wp_scripts();
		foreach ( self::HANDLES as $handle ) {
			if ( empty( self::$snapshot[ $handle ] ) ) {
				continue;
			}

			$original = self::$snapshot[ $handle ];
			$current  = $scripts->registered[ $handle ] ?? null;

			if ( $current && $current->src === $original->src && $current->ver === $original->ver ) {
				continue;
			}

			wp_deregister_script( $handle );
			wp_register_script( $handle, $original->src, (array) $original->deps, $original->ver, $original->args );

			$restored = $scripts->registered[ $handle ] ?? null;
			if ( $restored ) {
				// Reattach the inline data, footer grouping and translations from core's registration.
				if ( ! empty( $original->extra ) ) {
					$restored->extra = $original->extra;
				}
				$restored->textdomain        = $original->textdomain;
				$restored->translations_path = $original->translations_path;
			}
		}
	}
}
