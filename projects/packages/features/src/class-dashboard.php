<?php
/**
 * Read-only admin dashboard for the Feature Catalog.
 *
 * Renders the resolved catalog as a table under the wp-admin Tools menu.
 * Server-rendered, no JS build. Platform-agnostic: it displays whatever the
 * bound Feature_Environment resolves.
 *
 * @package automattic/jetpack-features
 */

namespace Automattic\Jetpack\Features;

/**
 * Registers and renders the Tools > Jetpack Features page.
 */
class Dashboard {

	const MENU_SLUG  = 'jetpack-features';
	const CAPABILITY = 'manage_options';

	/**
	 * Hook the admin page. Safe to call once the flag is on.
	 */
	public static function register() {
		add_action( 'admin_menu', array( __CLASS__, 'add_page' ) );
	}

	/**
	 * Add the Tools submenu page.
	 */
	public static function add_page() {
		add_submenu_page(
			'tools.php',
			__( 'Jetpack Features', 'jetpack-features' ),
			__( 'Jetpack Features', 'jetpack-features' ),
			self::CAPABILITY,
			self::MENU_SLUG,
			array( __CLASS__, 'render' )
		);
	}

	/**
	 * Map a resolved status to a badge CSS modifier class. Pure; unit-tested.
	 *
	 * @param string $status Resolved status.
	 * @return string CSS class suffix.
	 */
	public static function status_class( $status ) {
		switch ( $status ) {
			case Status_Resolver::STATUS_ACTIVE:
				return 'is-active';
			case Status_Resolver::STATUS_AVAILABLE_OFF:
				return 'is-available';
			case Status_Resolver::STATUS_NEEDS_CONNECTION:
				return 'is-connection';
			case Status_Resolver::STATUS_NEEDS_UPGRADE:
				return 'is-upgrade';
			case Status_Resolver::STATUS_UNSUPPORTED:
			default:
				return 'is-unsupported';
		}
	}

	/**
	 * Render the page.
	 */
	public static function render() {
		if ( ! current_user_can( self::CAPABILITY ) ) {
			wp_die( esc_html__( 'You do not have permission to view this page.', 'jetpack-features' ) );
		}

		Features::ensure_registered();

		$registry = Registry::instance();
		$env      = $registry->environment();
		$resolver = new Status_Resolver();
		$features = $registry->all();

		echo '<style>
			.jpfeat-badge{display:inline-block;padding:2px 8px;border-radius:10px;font-size:12px;font-weight:600;white-space:nowrap}
			.jpfeat-badge.is-active{background:#e5f5e5;color:#1f6f20}
			.jpfeat-badge.is-available{background:#e3f0fb;color:#0b5a94}
			.jpfeat-badge.is-connection{background:#fbeed6;color:#8a5200}
			.jpfeat-badge.is-upgrade{background:#fbeed6;color:#8a5200}
			.jpfeat-badge.is-unsupported{background:#eceff2;color:#586069}
			.jpfeat-table td,.jpfeat-table th{vertical-align:top}
			.jpfeat-muted{color:#787c82}
		</style>';

		echo '<div class="wrap">';
		echo '<h1>' . esc_html__( 'Jetpack Features', 'jetpack-features' ) . '</h1>';
		echo '<p class="jpfeat-muted">' . esc_html__( 'A read-only view of every registered feature and its resolved availability on this site.', 'jetpack-features' ) . '</p>';

		if ( null === $env ) {
			echo '<div class="notice notice-warning"><p>' . esc_html__( 'No feature environment is bound; statuses cannot be resolved.', 'jetpack-features' ) . '</p></div>';
		}

		if ( empty( $features ) ) {
			echo '<p>' . esc_html__( 'No features are registered.', 'jetpack-features' ) . '</p></div>';
			return;
		}

		echo '<table class="widefat striped jpfeat-table"><thead><tr>';
		foreach ( array(
			__( 'Feature', 'jetpack-features' ),
			__( 'Status', 'jetpack-features' ),
			__( 'Connection', 'jetpack-features' ),
			__( 'Entitlement', 'jetpack-features' ),
			__( 'Category', 'jetpack-features' ),
			__( 'Module', 'jetpack-features' ),
			__( 'Since', 'jetpack-features' ),
			__( 'Docs', 'jetpack-features' ),
		) as $heading ) {
			echo '<th>' . esc_html( $heading ) . '</th>';
		}
		echo '</tr></thead><tbody>';

		foreach ( $features as $feature ) {
			$resolved = null === $env ? null : $resolver->resolve( $feature, $env );
			$status   = null === $resolved ? '' : $resolved['status'];
			$reason   = null === $resolved ? '' : $resolved['reason'];

			echo '<tr>';

			// Feature: title + slug + description.
			echo '<td><strong>' . esc_html( '' !== $feature->title() ? $feature->title() : $feature->slug() ) . '</strong>';
			echo '<br><code>' . esc_html( $feature->slug() ) . '</code>';
			if ( '' !== $feature->description() ) {
				echo '<br><span class="jpfeat-muted">' . esc_html( $feature->description() ) . '</span>';
			}
			echo '</td>';

			// Status badge + reason.
			echo '<td>';
			if ( '' === $status ) {
				echo '<span class="jpfeat-muted">&mdash;</span>';
			} else {
				echo '<span class="jpfeat-badge ' . esc_attr( self::status_class( $status ) ) . '">' . esc_html( $status ) . '</span>';
				echo '<br><span class="jpfeat-muted">' . esc_html( $reason ) . '</span>';
			}
			echo '</td>';

			// Connection level.
			echo '<td>' . esc_html( $feature->connection() ) . '</td>';

			// Entitlement.
			$entitlement = $feature->entitlement();
			echo '<td>' . ( null === $entitlement || '' === $entitlement ? '<span class="jpfeat-muted">&mdash;</span>' : '<code>' . esc_html( $entitlement ) . '</code>' ) . '</td>';

			// Category.
			echo '<td>' . ( '' === $feature->category() ? '<span class="jpfeat-muted">&mdash;</span>' : esc_html( $feature->category() ) ) . '</td>';

			// Module the feature belongs to.
			$module = $feature->module();
			echo '<td>' . ( null === $module || '' === $module ? '<span class="jpfeat-muted">&mdash;</span>' : '<code>' . esc_html( $module ) . '</code>' ) . '</td>';

			// Available since (per-platform map).
			echo '<td>';
			$since = $feature->available_since();
			if ( empty( $since ) ) {
				echo '<span class="jpfeat-muted">&mdash;</span>';
			} else {
				$parts = array();
				foreach ( $since as $platform => $marker ) {
					$parts[] = esc_html( $platform . ': ' . $marker );
				}
				echo wp_kses_post( implode( '<br>', $parts ) );
			}
			echo '</td>';

			// Docs links.
			echo '<td>';
			$docs  = $feature->docs();
			$links = array();
			foreach ( array( 'wpcom', 'jetpack' ) as $doc_key ) {
				if ( ! empty( $docs[ $doc_key ] ) ) {
					$links[] = '<a href="' . esc_url( $docs[ $doc_key ] ) . '" target="_blank" rel="noopener noreferrer">' . esc_html( $doc_key ) . '</a>';
				}
			}
			echo '' === implode( '', $links ) ? '<span class="jpfeat-muted">&mdash;</span>' : wp_kses_post( implode( ' &middot; ', $links ) );
			echo '</td>';

			echo '</tr>';
		}

		echo '</tbody></table></div>';
	}
}
