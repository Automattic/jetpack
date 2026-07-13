<?php
/**
 * Plugin Name: Simulate WordPress.com Connection
 * Description: Simulates a connected Jetpack state with configurable latency for performance testing.
 * Version: 1.0.0
 *
 * This mu-plugin:
 * 1. Sets up fake Jetpack connection tokens
 * 2. Intercepts HTTP requests to WordPress.com
 * 3. Returns mock responses with configurable artificial latency
 * 4. Activates additional Jetpack modules that work without real connection
 *
 * Environment variables:
 * - WPCOM_SIMULATED_LATENCY_MS: Latency to add to each WP.com request (default: 200)
 *
 * @package Jetpack_Performance_Testing
 *
 * @phan-file-suppress PhanUndeclaredClassMethod, PhanUndeclaredConstant
 * These classes (Jetpack, Jetpack_Options) and constants (JETPACK__VERSION) are provided
 * Jetpack which is guaranteed to be active when this mu-plugin runs.
 */

defined( 'ABSPATH' ) || exit;

/**
 * Class to simulate WordPress.com connection for Jetpack.
 */
class Jetpack_WPCom_Connection_Simulator {

	/**
	 * Simulated latency in milliseconds.
	 *
	 * @var int
	 */
	private $latency_ms;

	/**
	 * Fake WordPress.com site ID.
	 *
	 * @var int
	 */
	private $fake_site_id = 123456789;

	/**
	 * Modules that are safe to activate without a real WordPress.com connection.
	 * These modules work locally without external dependencies.
	 *
	 * This list is install-wide: one WordPress install serves every scenario, so a module added
	 * for one page also loads for the others. `contact-form` is needed only by the formsResponses
	 * scenario (it registers the wp-build Forms responses dashboard), but it therefore also runs
	 * on the jetpackConnected Dashboard page and shifts that scenario's live LCP/TTFB/FCP baseline
	 * by one step at the commit it lands. Weigh that before adding another scenario-specific module.
	 *
	 * @var array
	 */
	private $safe_modules = array(
		'shortcodes',    // Embed shortcodes (YouTube, Twitter, etc.) - fully local
		'markdown',      // Markdown support for posts - fully local
		'sharedaddy',    // Social sharing buttons - fully local
		'sitemaps',      // XML sitemaps - fully local
		'seo-tools',     // SEO meta tags - fully local
		'widget-visibility', // Widget visibility rules - fully local
		'custom-content-types', // Custom post types (Portfolios, Testimonials) - fully local
		'contact-form',  // Jetpack Forms - registers the Forms responses wp-build dashboard
	);

	/**
	 * Constructor.
	 */
	public function __construct() {
		$this->latency_ms = getenv( 'WPCOM_SIMULATED_LATENCY_MS' ) ? (int) getenv( 'WPCOM_SIMULATED_LATENCY_MS' ) : 200;

		// Force Jetpack offline mode OFF. The fixture's site URL (http://localhost:<port>)
		// contains no dot, so Status::is_local_site() treats it as a local site and Jetpack
		// enters offline mode. Offline mode blocks My Jetpack from initializing at all
		// (Initializer::should_initialize()), yet this fixture explicitly simulates a
		// production, connected site. This is install-wide: flipping it shifts what EVERY
		// scenario measures (Jetpack runs more code paths when not offline) — see the
		// offline-mode attribution note in README.md.
		//
		// Two filters are needed because Status::is_offline_mode() falls back to the stored
		// option when the filtered value is false: `$offline = (bool) apply_filters( ... );
		// if ( ! $offline ) { $offline = (bool) get_option( 'jetpack_offline_mode' ); }`. The
		// first filter overrides the is_local_site() result; pre_option_* forces the option
		// read to 0 so a dirty/reused fixture DB with jetpack_offline_mode=1 can't silently
		// turn offline mode back on and break every scenario's boot.
		add_filter( 'jetpack_offline_mode', '__return_false' );
		add_filter( 'pre_option_jetpack_offline_mode', '__return_zero' );

		// Set up fake connection on init (after Jetpack loads).
		add_action( 'plugins_loaded', array( $this, 'setup_fake_connection' ), 1 );

		// Activate additional modules after Jetpack initializes.
		add_action( 'jetpack_modules_loaded', array( $this, 'activate_safe_modules' ) );

		// Intercept HTTP requests to WordPress.com.
		add_filter( 'pre_http_request', array( $this, 'intercept_wpcom_requests' ), 10, 3 );

		// Log intercepted requests for debugging.
		if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
			add_action( 'shutdown', array( $this, 'log_request_stats' ) );
		}
	}

	/**
	 * Set up fake Jetpack connection tokens.
	 */
	public function setup_fake_connection() {
		// Only proceed if Jetpack is active.
		if ( ! class_exists( 'Jetpack_Options' ) ) {
			return;
		}

		// Check if already set up (cast to int for reliable comparison since options may be stored as strings).
		$existing_id = Jetpack_Options::get_option( 'id' );
		if ( (int) $existing_id === $this->fake_site_id ) {
			return;
		}

		// Set fake blog token (format: key.secret.blog_id).
		$fake_blog_token = sprintf(
			'%s.%s.%d',
			wp_generate_password( 32, false ),
			wp_generate_password( 32, false ),
			$this->fake_site_id
		);

		// Set fake user token for admin user.
		// First try to get the configured admin user from environment, then fall back to 'admin'.
		$admin_username = getenv( 'WP_ADMIN_USER' ) ? getenv( 'WP_ADMIN_USER' ) : 'admin';
		$admin_user     = get_user_by( 'login', $admin_username );

		// If configured user not found, try to get any administrator.
		if ( ! $admin_user ) {
			$admins = get_users(
				array(
					'role'   => 'administrator',
					'number' => 1,
				)
			);
			if ( ! empty( $admins ) ) {
				$admin_user = $admins[0];
			}
		}

		if ( $admin_user ) {
			$fake_user_token = sprintf(
				'%s.%s.%d',
				wp_generate_password( 32, false ),
				wp_generate_password( 32, false ),
				$admin_user->ID
			);

			Jetpack_Options::update_option(
				'user_tokens',
				array(
					$admin_user->ID => $fake_user_token,
				)
			);

			Jetpack_Options::update_option( 'master_user', $admin_user->ID );
		}

		// Set connection options.
		Jetpack_Options::update_option( 'blog_token', $fake_blog_token );
		Jetpack_Options::update_option( 'id', $this->fake_site_id );

		// Mark as connected.
		Jetpack_Options::update_option( 'version', JETPACK__VERSION ?? '1.0.0' );
	}

	/**
	 * Activate additional Jetpack modules that work without real connection.
	 * These modules add more code paths to exercise during performance testing.
	 *
	 * Note: This is called during 'jetpack_modules_loaded' hook. We wrap in try-catch
	 * because module activation can trigger autoloading that may fail in some Docker
	 * configurations. If activation fails, we skip silently since the core connection
	 * simulation still works.
	 */
	public function activate_safe_modules() {
		if ( ! class_exists( 'Jetpack' ) ) {
			return;
		}

		// Get currently active modules.
		$active_modules = Jetpack::get_active_modules();

		foreach ( $this->safe_modules as $module ) {
			// Skip if already active.
			if ( in_array( $module, $active_modules, true ) ) {
				continue;
			}

			// Check if module exists.
			if ( ! Jetpack::is_module( $module ) ) {
				continue;
			}

			// Activate the module silently (don't trigger external connections).
			// Wrap in try-catch as module activation can trigger autoloading that
			// may fail in Docker environments with read-only mounts.
			try {
				Jetpack::activate_module( $module, false, false );
			} catch ( \Throwable $e ) {
				// Module activation failed - skip silently.
				// The core connection simulation still works without these extra modules.
				if ( defined( 'WP_DEBUG' ) && WP_DEBUG ) {
					error_log( "[WPCom Simulator] Failed to activate module '$module': " . $e->getMessage() ); // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				}
			}
		}
	}

	/**
	 * Intercept HTTP requests to WordPress.com and return mock responses.
	 *
	 * @param false|array|\WP_Error $preempt      A preemptive return value of an HTTP request.
	 * @param array                 $request_args HTTP request arguments.
	 * @param string                $url          The request URL.
	 * @return false|array Response array or false to proceed with actual request.
	 */
	public function intercept_wpcom_requests( $preempt, $request_args, $url ) {
		// Only intercept WordPress.com requests.
		if ( ! $this->is_wpcom_request( $url ) ) {
			return $preempt;
		}

		// Add simulated latency.
		if ( $this->latency_ms > 0 ) {
			usleep( $this->latency_ms * 1000 );
		}

		// Track request for stats.
		$this->track_request( $url, $request_args );

		// Return appropriate mock response based on endpoint.
		return $this->get_mock_response( $url );
	}

	/**
	 * Check if URL is a WordPress.com request.
	 *
	 * Uses pattern matching to catch all WordPress.com subdomains,
	 * including any future API endpoints that Jetpack might add.
	 *
	 * @param string $url Request URL.
	 * @return bool
	 */
	private function is_wpcom_request( $url ) {
		$parsed = wp_parse_url( $url );
		if ( ! isset( $parsed['host'] ) ) {
			return false;
		}

		$host = $parsed['host'];

		// Match wordpress.com and all subdomains (*.wordpress.com)
		if ( $host === 'wordpress.com' || str_ends_with( $host, '.wordpress.com' ) ) {
			return true;
		}

		// Match wp.com and all subdomains (used by some Jetpack services)
		if ( $host === 'wp.com' || str_ends_with( $host, '.wp.com' ) ) {
			return true;
		}

		return false;
	}

	/**
	 * Get mock response for a WordPress.com API request.
	 *
	 * @param string $url          Request URL.
	 * @return array Mock HTTP response.
	 */
	private function get_mock_response( $url ) {
		$parsed = wp_parse_url( $url );
		$path   = $parsed['path'] ?? '';

		// Default successful response.
		$response_body   = array( 'success' => true );
		$status_code     = 200;
		$matched_handler = false;

		// Handle specific endpoints.
		if ( strpos( $path, '/jetpack-token-health' ) !== false ) {
			$matched_handler = true;
			$response_body   = array(
				'is_healthy'      => true,
				'is_registered'   => true,
				'is_connected'    => true,
				'has_blog_token'  => true,
				'has_user_token'  => true,
				'is_healthy_blog' => true,
				'is_healthy_user' => true,
			);
		} elseif ( strpos( $path, '/sites/' . $this->fake_site_id ) !== false ) {
			$matched_handler = true;
			// Site info endpoint.
			$response_body = array(
				'ID'         => $this->fake_site_id,
				'name'       => get_bloginfo( 'name' ),
				'URL'        => home_url(),
				'jetpack'    => true,
				'is_private' => false,
				'plan'       => array(
					'product_id'   => 2002,
					'product_slug' => 'jetpack_free',
					'product_name' => 'Jetpack Free',
				),
				'options'    => array(
					'jetpack_version' => JETPACK__VERSION ?? '1.0.0',
				),
			);
		} elseif ( strpos( $path, '/jetpack-sync-actions' ) !== false || strpos( $path, '/sync/checkout' ) !== false ) {
			$matched_handler = true;
			// Sync endpoints.
			$response_body = array(
				'success' => true,
				'data'    => array(),
			);
		} elseif ( strpos( $path, '/me' ) !== false ) {
			$matched_handler = true;
			// User info endpoint.
			$response_body = array(
				'ID'           => 1,
				'display_name' => 'Test User',
				'username'     => 'testuser',
				'email'        => 'test@example.com',
			);
		} elseif ( strpos( $path, '/stats/summary' ) !== false || strpos( $path, '/stats/visits' ) !== false ) {
			$matched_handler = true;
			// Stats summary endpoint - returns empty but valid structure.
			$response_body = array(
				'date'   => gmdate( 'Y-m-d' ),
				'stats'  => array(
					'visitors_today'                  => 0,
					'visitors_yesterday'              => 0,
					'visitors'                        => 0,
					'views_today'                     => 0,
					'views_yesterday'                 => 0,
					'views_best_day'                  => '0000-00-00',
					'views_best_day_total'            => 0,
					'views'                           => 0,
					'comments'                        => 0,
					'posts'                           => 0,
					'followers_blog'                  => 0,
					'followers_comments'              => 0,
					'comments_per_month'              => 0,
					'comments_most_active_recent_day' => '0000-00-00',
					'comments_most_active_time'       => '',
					'comments_spam'                   => 0,
					'categories'                      => 0,
					'tags'                            => 0,
					'shares'                          => 0,
					'shares_twitter'                  => 0,
					'shares_facebook'                 => 0,
				),
				'visits' => array(
					'unit'   => 'day',
					'fields' => array( 'period', 'views', 'visitors' ),
					'data'   => array(),
				),
			);
		} elseif ( strpos( $path, '/stats/streak' ) !== false ) {
			$matched_handler = true;
			// Stats streak endpoint.
			$response_body = array(
				'streak' => array(
					'long'    => array(
						'start'  => null,
						'end'    => null,
						'length' => 0,
					),
					'current' => array(
						'start'  => null,
						'end'    => null,
						'length' => 0,
					),
				),
				'data'   => array(),
			);
		} elseif ( strpos( $path, '/stats/top-posts' ) !== false || strpos( $path, '/stats/postviews' ) !== false ) {
			$matched_handler = true;
			// Top posts stats endpoint.
			$response_body = array(
				'date'      => gmdate( 'Y-m-d' ),
				'days'      => array(),
				'top-posts' => array(),
			);
		} elseif ( strpos( $path, '/stats/referrers' ) !== false ) {
			$matched_handler = true;
			// Referrers stats endpoint.
			$response_body = array(
				'date' => gmdate( 'Y-m-d' ),
				'days' => array(),
			);
		} elseif ( strpos( $path, '/stats/clicks' ) !== false ) {
			$matched_handler = true;
			// Clicks stats endpoint.
			$response_body = array(
				'date' => gmdate( 'Y-m-d' ),
				'days' => array(),
			);
		} elseif ( strpos( $path, '/stats/search-terms' ) !== false ) {
			$matched_handler = true;
			// Search terms stats endpoint.
			$response_body = array(
				'date' => gmdate( 'Y-m-d' ),
				'days' => array(),
			);
		} elseif ( strpos( $path, '/stats' ) !== false ) {
			$matched_handler = true;
			// Generic stats endpoint fallback.
			$response_body = array(
				'date'   => gmdate( 'Y-m-d' ),
				'stats'  => array(),
				'visits' => array(
					'unit'   => 'day',
					'fields' => array( 'period', 'views', 'visitors' ),
					'data'   => array(),
				),
			);
		} elseif ( strpos( $url, 'stats.wordpress.com/csv.php' ) !== false ) {
			// Legacy CSV stats endpoint - return empty CSV (early return, no logging needed).
			return array(
				'headers'  => array(
					'content-type' => 'text/csv',
					'x-simulated'  => 'true',
					'x-latency-ms' => (string) $this->latency_ms,
				),
				'body'     => '',
				'response' => array(
					'code'    => 200,
					'message' => 'OK',
				),
				'cookies'  => array(),
				'filename' => null,
			);
		} elseif ( strpos( $url, 'xmlrpc.php' ) !== false ) {
			// XML-RPC response (early return, no logging needed).
			return $this->get_xmlrpc_mock_response();
		}

		// Log unhandled endpoints so we can identify missing mock responses.
		if ( ! $matched_handler ) {
			error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
				sprintf(
					'[WPCom Simulator] Unhandled endpoint (using fallback response): %s',
					$url
				)
			);
		}

		return array(
			'headers'  => array(
				'content-type' => 'application/json',
				'x-simulated'  => 'true',
				'x-latency-ms' => (string) $this->latency_ms,
			),
			'body'     => wp_json_encode( $response_body, JSON_UNESCAPED_SLASHES ),
			'response' => array(
				'code'    => $status_code,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Get mock XML-RPC response.
	 *
	 * @return array Mock HTTP response.
	 */
	private function get_xmlrpc_mock_response() {
		// Generic successful XML-RPC response.
		$xml_response = '<?xml version="1.0"?>
<methodResponse>
  <params>
    <param>
      <value>
        <struct>
          <member>
            <name>success</name>
            <value><boolean>1</boolean></value>
          </member>
        </struct>
      </value>
    </param>
  </params>
</methodResponse>';

		return array(
			'headers'  => array(
				'content-type' => 'text/xml',
				'x-simulated'  => 'true',
				'x-latency-ms' => (string) $this->latency_ms,
			),
			'body'     => $xml_response,
			'response' => array(
				'code'    => 200,
				'message' => 'OK',
			),
			'cookies'  => array(),
			'filename' => null,
		);
	}

	/**
	 * Track intercepted request for stats.
	 *
	 * @param string $url          Request URL.
	 * @param array  $request_args Request arguments.
	 */
	private function track_request( $url, $request_args ) {
		global $wpcom_simulated_requests;

		if ( ! isset( $wpcom_simulated_requests ) ) {
			$wpcom_simulated_requests = array();
		}

		$wpcom_simulated_requests[] = array(
			'url'        => $url,
			'method'     => $request_args['method'] ?? 'GET',
			'latency_ms' => $this->latency_ms,
			'time'       => microtime( true ),
		);
	}

	/**
	 * Log request stats on shutdown (debug mode only).
	 */
	public function log_request_stats() {
		global $wpcom_simulated_requests;

		if ( empty( $wpcom_simulated_requests ) ) {
			return;
		}

		$total_requests = count( $wpcom_simulated_requests );
		$total_latency  = $total_requests * $this->latency_ms;

		error_log( // phpcs:ignore WordPress.PHP.DevelopmentFunctions.error_log_error_log
			sprintf(
				'[WPCom Simulator] Intercepted %d requests, added %dms total simulated latency',
				$total_requests,
				$total_latency
			)
		);
	}
}

// Initialize the simulator (constructor registers hooks).
// @phan-suppress-next-line PhanNoopNew
new Jetpack_WPCom_Connection_Simulator();
