<?php
/**
 * Stats pricing grid initial state.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin\Pricing_Grid;

use Automattic\Jetpack\Connection\Manager as Connection_Manager;
use Jetpack_Options;

/**
 * Builds the initial state object for the pricing grid React component.
 */
class Initial_State {
	/**
	 * Get the initial state data for the pricing grid.
	 *
	 * @return array
	 */
	public function get_data() {
		$connection_manager = new Connection_Manager();
		$blog_id            = Jetpack_Options::get_option( 'id' );
		$is_registered      = $connection_manager->is_connected();

		// Get the site's domain/slug for checkout redirects.
		$domain = $this->get_site_domain();

		return array(
			'blogId'          => $blog_id,
			'siteSuffix'      => $domain,
			'isConnected'     => $is_registered,
			'adminUrl'        => admin_url(),
			'freeProductSlug' => 'jetpack_stats_free_yearly',
			'paidProductSlug' => 'jetpack_stats_yearly',
			'paidPurchaseUrl' => $this->get_paid_purchase_url( $blog_id, $is_registered, $domain ),
		);
	}

	/**
	 * Get the site's domain/slug.
	 * Falls back to the site URL if Jetpack options aren't available yet.
	 *
	 * @return string
	 */
	private function get_site_domain() {
		// Try to get from Jetpack options first.
		$domain = Jetpack_Options::get_option( 'url' );
		if ( $domain ) {
			// Extract domain from URL (remove http/https and path).
			$domain = wp_parse_url( $domain, PHP_URL_HOST );
			if ( $domain ) {
				return $domain;
			}
		}

		// Fallback to site URL.
		$site_url = wp_parse_url( site_url(), PHP_URL_HOST );
		return $site_url ? $site_url : get_bloginfo( 'url' );
	}

	/**
	 * Get the URL for the paid Stats purchase page.
	 *
	 * For connected sites: use the Odyssey in-wp-admin hash route.
	 * For unconnected sites: link to Calypso directly.
	 *
	 * @param int|false $blog_id   The Jetpack blog ID.
	 * @param bool      $is_connected Whether the site is connected.
	 * @param string    $domain   The site's domain/slug.
	 * @return string
	 */
	private function get_paid_purchase_url( $blog_id, $is_connected, $domain ) {
		$redirect_uri = 'admin.php?page=stats';

		if ( $is_connected && $blog_id ) {
			// Connected site: use Odyssey in-wp-admin hash route.
			// Format: admin.php?page=stats#!/stats/purchase/{blogId}?from=...&redirect_uri=...
			return admin_url( 'admin.php?page=stats' ) . '#!/stats/purchase/' . absint( $blog_id ) .
				'?from=jetpack-stats-pricing-grid&redirect_uri=' . rawurlencode( $redirect_uri );
		} else {
			// Unconnected site: link to Calypso directly.
			// Calypso's purchase page handles siteless checkout when site param is provided.
			$purchase_url = 'https://wordpress.com/stats/purchase';
			$params       = array(
				'site'         => $domain,
				'from'         => 'jetpack-stats-pricing-grid',
				'redirect_uri' => admin_url( $redirect_uri ),
			);

			return add_query_arg( $params, $purchase_url );
		}
	}

	/**
	 * Render the initial state as a JavaScript variable.
	 *
	 * @return string JavaScript code to set the global variable.
	 */
	public function render() {
		return 'var JP_STATS_PRICING_GRID_INITIAL_STATE=' . wp_json_encode( $this->get_data(), JSON_UNESCAPED_SLASHES | JSON_HEX_TAG | JSON_HEX_AMP ) . ';';
	}
}
