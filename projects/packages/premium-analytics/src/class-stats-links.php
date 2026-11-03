<?php
/**
 * Stats entry points outside the dashboard.
 *
 * @package automattic/jetpack-premium-analytics
 */

namespace Automattic\Jetpack\PremiumAnalytics;

/**
 * Sends links to Stats pages (the admin bar, the post list Views column, the newsletter action bar) to the matching
 * dashboard page instead, and opens the dashboard for `admin.php?page=stats` once no plugin registers that page.
 *
 * @since 0.12.0
 */
class Stats_Links {

	/**
	 * Query arg that carries the old `#!/stats/…` route back to the server.
	 */
	const ROUTE_QUERY_ARG = 'stats_route';

	/**
	 * Views of the old `#!/stats/<view>` routes, and the dashboard section each one opens.
	 */
	private const LEGACY_SECTIONS = array(
		'day'         => 'traffic',
		'week'        => 'traffic',
		'month'       => 'traffic',
		'year'        => 'traffic',
		'insights'    => 'insights',
		'subscribers' => 'subscribers',
		'store'       => 'woocommerce',
		'ads'         => 'ads',
		'settings'    => 'settings',
	);

	/**
	 * Claim the links. Idempotent, like the other register() calls.
	 *
	 * Outside the admin-chrome gate on purpose: the admin bar and the action bar also render on the front end, and Quick Edit re-renders the Views column over AJAX.
	 *
	 * @return void
	 */
	public static function register() {
		add_filter( 'jetpack_stats_url', array( __CLASS__, 'filter_url' ), 10, 2 );
		add_action( 'admin_page_access_denied', array( __CLASS__, 'open_retired_stats_page' ) );
	}

	/**
	 * Open the dashboard in place of `admin.php?page=stats` once no plugin registers that page.
	 *
	 * Core fires this for every denied admin page, a registered one the user may not open included;
	 * the capability check is what keeps that user on core's 403.
	 *
	 * @return void
	 */
	public static function open_retired_stats_page() {
		if ( ! self::is_retired_stats_page_request() ) {
			return;
		}

		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks where to send the reader.
		if ( isset( $_GET[ self::ROUTE_QUERY_ARG ] ) ) {
			// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks where to send the reader.
			$route = sanitize_text_field( wp_unslash( $_GET[ self::ROUTE_QUERY_ARG ] ) );
			wp_safe_redirect( Analytics::dashboard_url( self::legacy_route_path( $route ) ) );
			exit( 0 );
		}

		nocache_headers();
		self::render_retired_stats_page();
		exit( 0 );
	}

	/**
	 * Whether this request is for `page=stats`, retired or with no such page registered for this user, by a user who can read Stats here.
	 *
	 * Retired counts on its own: WordPress.com Simple still registers an older `index.php?page=stats`, which leaves
	 * `admin.php?page=stats` denied.
	 *
	 * @return bool
	 */
	private static function is_retired_stats_page_request() {
		// phpcs:ignore WordPress.Security.NonceVerification.Recommended -- Only picks where to send the reader.
		$page = isset( $_GET['page'] ) ? sanitize_key( wp_unslash( $_GET['page'] ) ) : '';

		return 'stats' === $page
			&& ( Classic_Stats::is_retired() || '' === menu_page_url( 'stats', false ) )
			&& Capabilities::current_user_can_open_stats();
	}

	/**
	 * Print a page that hands the old `#!/stats/…` route back to the server, since the fragment never reaches it.
	 *
	 * @return void
	 */
	private static function render_retired_stats_page() {
		$script = sprintf(
			'window.location.replace( window.location.pathname + window.location.search + "&%s=" + encodeURIComponent( window.location.hash ) );',
			self::ROUTE_QUERY_ARG
		);

		?>
<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
<meta charset="<?php echo esc_attr( get_bloginfo( 'charset' ) ); ?>">
<title><?php echo esc_html__( 'Stats', 'jetpack-premium-analytics-pkg' ); ?></title>
<noscript><meta http-equiv="refresh" content="0;url=<?php echo esc_url( Analytics::dashboard_url( '/' ) ); ?>"></noscript>
		<?php wp_print_inline_script_tag( $script ); ?>
</head>
<body></body>
</html>
		<?php
	}

	/**
	 * The dashboard route for an old `#!/stats/…` route, or its root when it has no counterpart.
	 *
	 * @param string $route The old route, e.g. `#!/stats/post/123/9`.
	 * @return string
	 */
	private static function legacy_route_path( $route ) {
		if ( ! preg_match( '~^#!/stats/([^?]*)~', $route, $match ) ) {
			return '/';
		}

		$segments = explode( '/', $match[1] );
		$view     = $segments[0];

		if ( 'post' === $view ) {
			return self::post_path( $segments[1] ?? 0 );
		}

		// The email routes put the post ID after the metric and the period.
		if ( 'email' === $view && in_array( $segments[1] ?? '', array( 'opens', 'clicks' ), true ) ) {
			return self::post_path( $segments[3] ?? 0, 'email-' . $segments[1] );
		}

		return array_key_exists( $view, self::LEGACY_SECTIONS ) ? '/?section=' . self::LEGACY_SECTIONS[ $view ] : '/';
	}

	/**
	 * A post detail route, or the dashboard root when there is no real post.
	 *
	 * @param mixed  $post_id The post.
	 * @param string $section The post detail tab, or '' for its default.
	 * @return string
	 */
	private static function post_path( $post_id, $section = '' ) {
		$post_id = (int) $post_id;

		if ( $post_id <= 0 ) {
			return '/';
		}

		return '/post/' . $post_id . ( '' === $section ? '' : '?section=' . $section );
	}

	/**
	 * Point a Stats link at the dashboard page for the view it opens.
	 *
	 * @param string $url  Stats URL.
	 * @param array  $args The page the link opens: `view`, plus `id` for the `post` view, or `section` and a
	 *                     `range` of `from`/`to` days as `Y-m-d` for the `dashboard` view.
	 * @return string
	 */
	public static function filter_url( $url, $args ) {
		$view = is_array( $args ) ? ( $args['view'] ?? null ) : null;

		if ( 'dashboard' === $view ) {
			return self::route_url( $url, self::dashboard_path( $args ) );
		}

		if ( 'post' === $view ) {
			return self::post_url( $url, $args['id'] ?? 0 );
		}

		return $url;
	}

	/**
	 * The dashboard root, opened on the section and the days the link names.
	 *
	 * @param array $args The link's `section` and `range`, both optional.
	 * @return string
	 */
	private static function dashboard_path( array $args ) {
		$query   = array();
		$section = sanitize_key( $args['section'] ?? '' );

		if ( '' !== $section ) {
			$query['section'] = $section;
		}

		$query += self::date_window_params( $args['range'] ?? null );

		return '/' . ( $query ? '?' . http_build_query( $query, '', '&', PHP_QUERY_RFC3986 ) : '' );
	}

	/**
	 * The dashboard's date params for a range of whole days, on the site's calendar.
	 *
	 * A "Last N days" window ending today is sent as its preset, so the date picker reads
	 * "Last 7 days" rather than two dates; the day counts mirror the dashboard's presets.
	 *
	 * @param mixed $range `from` and `to` days as `Y-m-d`.
	 * @return array `preset`, or `from` and `to`, or nothing for a range the dashboard cannot open.
	 */
	private static function date_window_params( $range ) {
		if ( ! is_array( $range ) || ! is_string( $range['from'] ?? null ) || ! is_string( $range['to'] ?? null ) ) {
			return array();
		}

		$zone = wp_timezone();
		$from = \DateTimeImmutable::createFromFormat( '!Y-m-d', $range['from'], $zone );
		$to   = \DateTimeImmutable::createFromFormat( '!Y-m-d', $range['to'], $zone );

		if ( ! $from || ! $to || $to < $from ) {
			return array();
		}

		$today = ( new \DateTimeImmutable( 'now', $zone ) )->setTime( 0, 0 );
		$days  = $from->diff( $to )->days + 1;

		if ( $to->getTimestamp() === $today->getTimestamp() && in_array( $days, array( 7, 30, 90, 365 ), true ) ) {
			return array( 'preset' => 'last-' . $days . '-days' );
		}

		return array(
			'from' => $from->format( 'Y-m-d\TH:i:s.vP' ),
			'to'   => $to->setTime( 23, 59, 59, 999999 )->format( 'Y-m-d\TH:i:s.vP' ),
		);
	}

	/**
	 * The post detail page, or `$url` when there is no real post to show.
	 *
	 * @param string $url     Stats URL for the post.
	 * @param mixed  $post_id The post.
	 * @return string
	 */
	private static function post_url( $url, $post_id ) {
		$post_id = (int) $post_id;

		if ( $post_id <= 0 ) {
			return $url;
		}

		return self::route_url( $url, '/post/' . $post_id );
	}

	/**
	 * A dashboard route, or `$url` for a user who cannot read Stats there.
	 *
	 * Wins even where the link would otherwise point at Calypso: this dashboard is the site's
	 * analytics UI and exists only in wp-admin, so the admin-interface preference doesn't apply.
	 * Checked here even where the caller already gates on the same primitives: the filter is public.
	 *
	 * @param string $url  Stats URL.
	 * @param string $path Dashboard route.
	 * @return string
	 */
	private static function route_url( $url, $path ) {
		if ( ! Capabilities::current_user_can_open_stats() ) {
			return $url;
		}

		return Analytics::dashboard_url( $path );
	}
}
