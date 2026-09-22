<?php
/**
 * Stats in the WordPress admin bar.
 *
 * @package automattic/jetpack-stats-admin
 */

namespace Automattic\Jetpack\Stats_Admin;

use Automattic\Jetpack\Connection\Client;
use Automattic\Jetpack\Constants;
use Automattic\Jetpack\Stats\Options as Stats_Options;
use Automattic\Jetpack\Status\Host;

/**
 * Adds the views chart and a Stats link to the admin bar.
 */
class Admin_Bar {
	/**
	 * The admin bar charts WordPress.com draws, at 1x and 2x.
	 *
	 * @var string[]
	 */
	const CHARTS = array( 'admin-bar-hours-scale', 'admin-bar-hours-scale-2x' );

	/**
	 * Register the hooks.
	 *
	 * @return void
	 */
	public static function init() {
		add_action( 'admin_head', array( __CLASS__, 'maybe_add_chart' ), 100 );
		add_action( 'wp_head', array( __CLASS__, 'maybe_add_chart' ), 100 );
		add_action( 'wp_before_admin_bar_render', array( __CLASS__, 'add_site_menu_link' ) );
		add_action( 'admin_init', array( __CLASS__, 'maybe_serve_chart' ), 1 );
		add_filter( 'pre_option_db_version', array( __CLASS__, 'ignore_db_version' ) );
	}

	/**
	 * Queue the views chart and print its styles when the current user should see it.
	 *
	 * @return void
	 */
	public static function maybe_add_chart() {
		if (
			! is_user_logged_in() ||
			! Stats_Options::get_option( 'admin_bar' ) ||
			! current_user_can( 'view_stats' ) ||
			! is_admin_bar_showing()
		) {
			return;
		}

		add_action( 'admin_bar_menu', array( __CLASS__, 'add_chart_node' ), 100 );
		?>
<style data-ampdevmode type='text/css'>
#wpadminbar .quicklinks li#wp-admin-bar-stats {
	height: 32px;
}
#wpadminbar .quicklinks li#wp-admin-bar-stats a {
	height: 32px;
	padding: 0;
}
#wpadminbar .quicklinks li#wp-admin-bar-stats a div {
	height: 32px;
	width: 95px;
	overflow: hidden;
	margin: 0 10px;
}
#wpadminbar .quicklinks li#wp-admin-bar-stats a:hover div {
	width: auto;
	margin: 0 8px 0 10px;
}
#wpadminbar .quicklinks li#wp-admin-bar-stats a img {
	height: 24px;
	margin: 4px 0;
	max-width: none;
	border: none;
}
</style>
		<?php
	}

	/**
	 * Add the views chart, linked to the Stats dashboard.
	 *
	 * @param \WP_Admin_Bar $wp_admin_bar The admin bar.
	 * @return void
	 */
	public static function add_chart_node( $wp_admin_bar ) {
		$img_src    = esc_attr( self::get_chart_src( 'admin-bar-hours-scale' ) );
		$img_src_2x = esc_attr( self::get_chart_src( 'admin-bar-hours-scale-2x' ) );
		$alt        = esc_attr__( 'Stats', 'jetpack-stats-admin' );
		$title      = esc_attr__( 'Views over 48 hours. Click for more Jetpack Stats.', 'jetpack-stats-admin' );

		$wp_admin_bar->add_menu(
			array(
				'id'    => 'stats',
				'href'  => admin_url( 'admin.php?page=stats' ),
				'title' => "<div><img fetchpriority='low' loading='lazy' decoding='async' src='$img_src' srcset='$img_src 1x, $img_src_2x 2x' width='112' height='24' alt='$alt' title='$title'></div>",
			)
		);
	}

	/**
	 * Add a Stats link to the site-name menu, next to Dashboard.
	 *
	 * @return void
	 */
	public static function add_site_menu_link() {
		global $wp_admin_bar;

		// WordPress.com adds its own Stats link to this menu.
		if (
			! is_object( $wp_admin_bar ) ||
			! $wp_admin_bar->get_node( 'dashboard' ) ||
			! current_user_can( 'view_stats' ) ||
			( new Host() )->is_wpcom_platform()
		) {
			return;
		}

		$wp_admin_bar->add_node(
			array(
				'parent' => 'site-name',
				'id'     => 'jetpack-stats',
				'title'  => __( 'Stats', 'jetpack-stats-admin' ),
				'href'   => admin_url( 'admin.php?page=stats' ),
			)
		);
	}

	/**
	 * Get the local URL that serves a chart image.
	 *
	 * @param string $chart One of the CHARTS.
	 * @return string
	 */
	public static function get_chart_src( $chart ) {
		return add_query_arg(
			array(
				'page'  => 'stats',
				'chart' => $chart,
			),
			admin_url( 'admin.php' )
		);
	}

	/**
	 * Serve a chart image and stop, when the request asks for one.
	 *
	 * The browser cannot fetch the chart from WordPress.com directly, because only the blog token can read it.
	 *
	 * @return void
	 */
	public static function maybe_serve_chart() {
		// URLs with `proxy` come from the Jetpack plugin's deprecated stats_get_image_chart_src(), and its own handler forwards their extra parameters.
		if ( isset( $_GET['proxy'] ) ) { // phpcs:ignore WordPress.Security.NonceVerification.Recommended -- An image request carries no nonce, and it changes nothing.
			return;
		}

		$chart = self::get_requested_chart();
		if ( null === $chart || ! Stats_Options::get_option( 'admin_bar' ) || ! current_user_can( 'view_stats' ) ) {
			return;
		}

		$image = self::fetch_chart( $chart );
		if ( null === $image ) {
			status_header( 502 );
			exit( 0 );
		}

		header( 'Content-Type: ' . $image['type'] );
		header( 'Content-Length: ' . strlen( $image['body'] ) );
		echo $image['body']; // phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- Binary image data.
		exit( 0 );
	}

	/**
	 * Fetch a chart image from WordPress.com with the blog token.
	 *
	 * @param string $chart One of the CHARTS.
	 * @return array{type: string, body: string}|null The image, or null when WordPress.com did not return one.
	 */
	public static function fetch_chart( $chart ) {
		$server = Constants::get_constant( 'STATS_DASHBOARD_SERVER' ) ?? 'dashboard.wordpress.com';

		// WordPress.com accepts the blog token on this file only when `page`, `proxy` and `blog` are all present.
		$url = add_query_arg(
			array(
				'page'  => 'stats',
				'proxy' => '',
				'blog'  => Stats_Options::get_option( 'blog_id' ),
			),
			"https://{$server}/wp-includes/charts/{$chart}.php"
		);

		$response = Client::remote_request(
			array(
				'url'     => $url,
				'method'  => 'GET',
				'timeout' => 90,
				'user_id' => 0,
			)
		);

		// A failed request has the code '', which PHP 8 cannot divide.
		$code = (int) wp_remote_retrieve_response_code( $response );
		$type = wp_remote_retrieve_header( $response, 'content-type' );
		$body = wp_remote_retrieve_body( $response );
		if ( 2 !== (int) ( $code / 100 ) || ! is_string( $type ) || ! str_starts_with( $type, 'image/' ) || '' === $body ) {
			return null;
		}

		return array(
			'type' => $type,
			'body' => $body,
		);
	}

	/**
	 * Keep chart requests from redirecting to upgrade.php while a database upgrade is pending.
	 *
	 * @see wp-admin/admin.php, which compares the stored `db_version` with `$wp_db_version`.
	 *
	 * @param mixed $version The stored database version.
	 * @return mixed
	 */
	public static function ignore_db_version( $version ) {
		if ( is_admin() && null !== self::get_requested_chart() ) {
			global $wp_db_version;
			return $wp_db_version;
		}

		return $version;
	}

	/**
	 * Get the chart the current request asks for.
	 *
	 * @return string|null One of the CHARTS, or null when the request is not for a chart.
	 */
	private static function get_requested_chart() {
		// phpcs:disable WordPress.Security.NonceVerification.Recommended -- An image request carries no nonce, and it changes nothing.
		if ( ! isset( $_GET['page'] ) || ! isset( $_GET['chart'] ) || 'stats' !== $_GET['page'] ) {
			return null;
		}

		$chart = sanitize_key( wp_unslash( $_GET['chart'] ) );
		// phpcs:enable WordPress.Security.NonceVerification.Recommended

		return in_array( $chart, self::CHARTS, true ) ? $chart : null;
	}
}
