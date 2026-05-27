<?php
/**
 * REST routes for the Akismet experimental admin UI.
 *
 * Standalone — the experimental plugin owns the `akismet/v1` namespace because
 * the legacy Akismet plugin is inactive on the sandbox. Routes read/write the
 * standard Akismet `wp_options` keys (`wordpress_api_key`, `akismet_strictness`,
 * `akismet_show_user_comments_approved`) directly.
 *
 * Mutation routes (POST/DELETE/PUT) are gated by `AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS`
 * (see GUARDRAILS.md). The constant is read via `Akismet_Experimental::allow_mutations()`.
 * Client-side, the hooks in `src/hooks/use-*.ts` short-circuit on the same flag
 * for snappy UX; the server check here is defense in depth.
 *
 * @package Akismet_Experimental
 */

defined( 'ABSPATH' ) || exit;

/**
 * Registers and serves the akismet/v1 REST routes used by the experimental UI.
 */
class Akismet_Experimental_REST_API {

	const NAMESPACE_V1 = 'akismet/v1';

	/**
	 * Standard Akismet option name for the API key.
	 */
	const OPTION_API_KEY = 'wordpress_api_key';

	/**
	 * Standard Akismet option name for spam strictness (`'0'` review, `'1'` silent discard).
	 */
	const OPTION_STRICTNESS = 'akismet_strictness';

	/**
	 * Standard Akismet option name for the show-approved-comments toggle.
	 */
	const OPTION_SHOW_APPROVED = 'akismet_show_user_comments_approved';

	/**
	 * Wire route registration. Called from `Akismet_Experimental::init()`.
	 */
	public static function init() {
		add_action( 'rest_api_init', array( __CLASS__, 'register_routes' ) );
	}

	/**
	 * Register all six routes.
	 */
	public static function register_routes() {
		register_rest_route(
			self::NAMESPACE_V1,
			'/key',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_key' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::CREATABLE,
					'callback'            => array( __CLASS__, 'set_key' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
					'args'                => array(
						'key' => array(
							'type'              => 'string',
							'required'          => true,
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
				array(
					'methods'             => WP_REST_Server::DELETABLE,
					'callback'            => array( __CLASS__, 'delete_key' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/settings',
			array(
				array(
					'methods'             => WP_REST_Server::READABLE,
					'callback'            => array( __CLASS__, 'get_settings' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
				),
				array(
					'methods'             => WP_REST_Server::EDITABLE,
					'callback'            => array( __CLASS__, 'put_settings' ),
					'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
					'args'                => array(
						self::OPTION_STRICTNESS    => array(
							'type'              => 'string',
							'enum'              => array( '0', '1' ),
							'required'          => false,
							'sanitize_callback' => 'sanitize_text_field',
						),
						self::OPTION_SHOW_APPROVED => array(
							'type'              => 'string',
							'enum'              => array( '0', '1' ),
							'required'          => false,
							'sanitize_callback' => 'sanitize_text_field',
						),
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/jetpack-key',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_jetpack_key' ),
				'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
			)
		);

		// Plan 2 — Overview tab data sources.
		register_rest_route(
			self::NAMESPACE_V1,
			'/stats/(?P<interval>[a-z0-9-]+)',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_stats' ),
				'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
				'args'                => array(
					'interval' => array(
						'type'     => 'string',
						'enum'     => array( '30-days', '60-days', '6-months', 'all' ),
						'required' => true,
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/stats/timeseries',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_stats_timeseries' ),
				'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
				'args'                => array(
					'interval' => array(
						'type'    => 'string',
						'enum'    => array( '30-days', '60-days', '6-months', 'all' ),
						'default' => '30-days',
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/blackbox/aggregates',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_blackbox_aggregates' ),
				'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
				'args'                => array(
					'category' => array(
						'type'     => 'string',
						'enum'     => array( 'logins', 'bots', 'brute-force', 'forms' ),
						'required' => true,
					),
					'interval' => array(
						'type'    => 'string',
						'enum'    => array( '30-days', '60-days', '6-months', 'all' ),
						'default' => '30-days',
					),
				),
			)
		);

		register_rest_route(
			self::NAMESPACE_V1,
			'/woocommerce/fraud-summary',
			array(
				'methods'             => WP_REST_Server::READABLE,
				'callback'            => array( __CLASS__, 'get_woocommerce_fraud_summary' ),
				'permission_callback' => array( __CLASS__, 'manage_options_permission' ),
				'args'                => array(
					'interval' => array(
						'type'    => 'string',
						'enum'    => array( '30-days', '60-days', '6-months', 'all' ),
						'default' => '30-days',
					),
				),
			)
		);
	}

	/**
	 * Shared permission callback: only users who can manage_options.
	 *
	 * @return bool|WP_Error True if allowed, WP_Error otherwise.
	 */
	public static function manage_options_permission() {
		if ( ! current_user_can( 'manage_options' ) ) {
			return new WP_Error(
				'rest_forbidden',
				__( 'You do not have permission to perform this action.', 'akismet' ),
				array( 'status' => rest_authorization_required_code() )
			);
		}
		return true;
	}

	/**
	 * Mutation guardrail: returns a 403 WP_Error if AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS is off.
	 *
	 * @return null|WP_Error Null when mutations are allowed; WP_Error otherwise.
	 */
	protected static function check_mutation_gate() {
		if ( Akismet_Experimental::allow_mutations() ) {
			return null;
		}
		return new WP_Error(
			'preview_mode_active',
			__( 'Preview mode — action disabled.', 'akismet' ),
			array( 'status' => 403 )
		);
	}

	/**
	 * GET /akismet/v1/key — return the current API key + a coarse validity signal.
	 *
	 * Validity here is "non-empty string of plausible length". The experimental
	 * plugin does NOT round-trip to WPCOM to verify the key; that's a future
	 * concern (and arguably should remain server-side in a real implementation).
	 *
	 * @return WP_REST_Response
	 */
	public static function get_key() {
		$key = (string) get_option( self::OPTION_API_KEY, '' );
		return rest_ensure_response(
			array(
				'key'   => $key,
				'valid' => self::looks_like_key( $key ),
			)
		);
	}

	/**
	 * POST /akismet/v1/key — accept a new key. Gated by AKISMET_EXPERIMENTAL_ALLOW_MUTATIONS.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function set_key( WP_REST_Request $request ) {
		$gate = self::check_mutation_gate();
		if ( $gate ) {
			return $gate;
		}
		$key = trim( (string) $request->get_param( 'key' ) );
		if ( ! self::looks_like_key( $key ) ) {
			return new WP_Error(
				'akismet_invalid_key',
				__( 'Invalid key. Use the 12-character key from your Akismet account.', 'akismet' ),
				array( 'status' => 400 )
			);
		}
		update_option( self::OPTION_API_KEY, $key );
		return rest_ensure_response(
			array(
				'key'   => $key,
				'valid' => true,
			)
		);
	}

	/**
	 * DELETE /akismet/v1/key — clear the stored key. Gated.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function delete_key() {
		$gate = self::check_mutation_gate();
		if ( $gate ) {
			return $gate;
		}
		delete_option( self::OPTION_API_KEY );
		return rest_ensure_response( array( 'success' => true ) );
	}

	/**
	 * GET /akismet/v1/settings — return the current strictness + show-approved values.
	 *
	 * Defaults match legacy Akismet: `'0'` for both (review spam, hide counts).
	 *
	 * @return WP_REST_Response
	 */
	public static function get_settings() {
		return rest_ensure_response(
			array(
				self::OPTION_STRICTNESS    => (string) get_option( self::OPTION_STRICTNESS, '0' ),
				self::OPTION_SHOW_APPROVED => (string) get_option( self::OPTION_SHOW_APPROVED, '0' ),
			)
		);
	}

	/**
	 * PUT /akismet/v1/settings — persist a partial patch. Gated.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function put_settings( WP_REST_Request $request ) {
		$gate = self::check_mutation_gate();
		if ( $gate ) {
			return $gate;
		}
		foreach ( array( self::OPTION_STRICTNESS, self::OPTION_SHOW_APPROVED ) as $opt ) {
			$value = $request->get_param( $opt );
			if ( null !== $value ) {
				update_option( $opt, (string) $value );
			}
		}
		return self::get_settings();
	}

	/**
	 * GET /akismet/v1/jetpack-key — return the Jetpack-connected user's Akismet key.
	 *
	 * In the experimental standalone plugin we don't link against the legacy
	 * `Akismet_Admin::get_jetpack_user` helper. If Jetpack exposes the Akismet
	 * key via `Jetpack_Options::get_option( 'akismet_key' )`, we surface it;
	 * otherwise we return a structured error. Plan 1's UI handles both cases.
	 *
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_jetpack_key() {
		if ( ! class_exists( 'Jetpack' ) ) {
			return new WP_Error(
				'no_jetpack',
				__( 'Jetpack is not active.', 'akismet' ),
				array( 'status' => 400 )
			);
		}

		$jetpack_key = '';
		if ( class_exists( 'Jetpack_Options' ) && method_exists( 'Jetpack_Options', 'get_option' ) ) {
			$jetpack_key = (string) Jetpack_Options::get_option( 'akismet_key', '' );
		}

		if ( '' === $jetpack_key ) {
			return new WP_Error(
				'no_jetpack_user',
				__( 'No Jetpack-connected user with an Akismet key was found.', 'akismet' ),
				array( 'status' => 400 )
			);
		}

		$gate = self::check_mutation_gate();
		if ( $gate ) {
			return $gate;
		}

		update_option( self::OPTION_API_KEY, $jetpack_key );
		return rest_ensure_response(
			array(
				'key'   => $jetpack_key,
				'valid' => true,
			)
		);
	}

	/**
	 * Cheap structural test for an Akismet key: 12+ characters of [a-z0-9].
	 *
	 * The real validity signal is a WPCOM round-trip; this is a quick filter
	 * to avoid persisting obvious junk.
	 *
	 * @param string $key Candidate key.
	 * @return bool
	 */
	protected static function looks_like_key( $key ) {
		return is_string( $key ) && (bool) preg_match( '/^[a-z0-9]{12,}$/', $key );
	}

	// ─── Plan 2 — Overview tab handlers ──────────────────────────────────────
	//
	// Per the project's "What's real, what's mocked" table (README.md): the
	// standalone experimental plugin never loads the legacy `Akismet` class,
	// so `Akismet::get_stats()` is unavailable. Comments stats here are
	// deterministic-fixture with `preview: true` — same honesty contract the
	// other five categories carry. When this code eventually moves into a
	// build where `class_exists( 'Akismet' )` is true, swap the fixture
	// branch for `Akismet::get_stats( $interval )` and set `preview => false`.

	/**
	 * GET /akismet/v1/stats/{interval} — Comments totals (mocked).
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function get_stats( WP_REST_Request $request ) {
		$interval = (string) $request->get_param( 'interval' );
		return rest_ensure_response( self::comments_mock_totals( $interval ) );
	}

	/**
	 * GET /akismet/v1/stats/timeseries — Comments per-bucket series (mocked).
	 *
	 * Proposed contract in `akismet-modernization/endpoint-spec-stats-timeseries.md`.
	 * Returns the same shape that endpoint will once it lands upstream; the
	 * sparkline adapter in the front-end reads from here.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function get_stats_timeseries( WP_REST_Request $request ) {
		$interval = (string) $request->get_param( 'interval' );
		return rest_ensure_response( self::comments_mock_timeseries( $interval ) );
	}

	/**
	 * GET /akismet/v1/blackbox/aggregates — per-category Blackbox counts.
	 *
	 * Per GUARDRAILS.md: real Blackbox API calls require both
	 * `AKISMET_EXPERIMENTAL_ALLOW_BLACKBOX_API` AND a configured client
	 * (`AKISMET_BLACKBOX_CLIENT_ID` + `AKISMET_BLACKBOX_API_KEY`). Otherwise
	 * we serve a deterministic mock no matter what — preventing preview
	 * sessions from burning Blackbox quota or producing telemetry rows.
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response
	 */
	public static function get_blackbox_aggregates( WP_REST_Request $request ) {
		$category = (string) $request->get_param( 'category' );
		$interval = (string) $request->get_param( 'interval' );
		$config   = Akismet_Experimental::blackbox_client_config();

		if ( ! Akismet_Experimental::allow_blackbox_api() || empty( $config['enrolled'] ) ) {
			return rest_ensure_response(
				self::deterministic_mock_aggregate( $category, $interval, true )
			);
		}

		// Real path — gated. Coordinate the aggregate-query shape with
		// @dtbecher before flipping the constant on any environment.
		$bearer = defined( 'AKISMET_BLACKBOX_API_KEY' ) ? AKISMET_BLACKBOX_API_KEY : '';
		$url    = sprintf(
			'%s/v1/aggregates?client_id=%s&category=%s&interval=%s',
			esc_url_raw( $config['apiHost'] ),
			rawurlencode( (string) $config['clientId'] ),
			rawurlencode( $category ),
			rawurlencode( $interval )
		);

		$response = wp_remote_get(
			$url,
			array(
				'timeout' => 8,
				'headers' => array(
					'Authorization' => 'Bearer ' . $bearer,
					'Accept'        => 'application/json',
				),
			)
		);
		if ( is_wp_error( $response ) || (int) wp_remote_retrieve_response_code( $response ) >= 400 ) {
			// Fail soft to the deterministic mock rather than 5xx the reviewer.
			return rest_ensure_response(
				self::deterministic_mock_aggregate( $category, $interval, true )
			);
		}

		$body = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) ) {
			return rest_ensure_response(
				self::deterministic_mock_aggregate( $category, $interval, true )
			);
		}
		$body['preview'] = false;
		return rest_ensure_response( $body );
	}

	/**
	 * GET /akismet/v1/woocommerce/fraud-summary — store fraud KPIs (mocked).
	 *
	 * 400s when WooCommerce is not installed — the front-end short-circuits
	 * via `isWooCommerceActive()` and never hits this in that case, but the
	 * server check exists for defense-in-depth (a direct REST hit shouldn't
	 * leak a synthetic shape from an unrelated site).
	 *
	 * @param WP_REST_Request $request The incoming request.
	 * @return WP_REST_Response|WP_Error
	 */
	public static function get_woocommerce_fraud_summary( WP_REST_Request $request ) {
		$interval = (string) $request->get_param( 'interval' );

		if ( ! class_exists( 'WooCommerce' ) ) {
			return new WP_Error(
				'woocommerce_inactive',
				__( 'WooCommerce is not installed on this site.', 'akismet' ),
				array( 'status' => 400 )
			);
		}

		$wfp_active = class_exists( 'WC_Fraud_Protection' ) || defined( 'WC_FRAUD_PROTECTION_PLUGIN_VERSION' );

		// TODO: when WFP is active, query real data from $wpdb against orders
		// + `_woofraud_score` meta. Coordinate the meta key + query shape
		// with @luizfreis / @tautvidas. Mocked here so the UI is testable
		// end-to-end. `preview` mirrors the badge state in the UI.
		$seed = crc32( 'wc-fraud|' . $interval );
		$n    = static function ( $offset ) use ( $seed ) {
			return abs( ( $seed + ( $offset * 31 ) ) % 9999 );
		};

		return rest_ensure_response(
			array(
				'interval'                          => $interval,
				'orders_flagged'                    => $n( 1 ) % 250,
				'blocked_checkouts'                 => $n( 2 ) % 600,
				'estimated_chargebacks_averted_usd' => $n( 3 ) % 12000,
				'top_signals'                       => array(
					array(
						'name'  => 'avs_mismatch',
						'count' => $n( 4 ) % 60,
					),
					array(
						'name'  => 'high_risk_geo',
						'count' => $n( 5 ) % 40,
					),
					array(
						'name'  => 'velocity_threshold',
						'count' => $n( 6 ) % 35,
					),
					array(
						'name'  => 'card_testing_pattern',
						'count' => $n( 7 ) % 25,
					),
					array(
						'name'  => 'proxy_or_vpn',
						'count' => $n( 8 ) % 20,
					),
				),
				'wfp_active'                        => $wfp_active,
				'preview'                           => ! $wfp_active,
				'generated_at'                      => gmdate( 'c' ),
			)
		);
	}

	/**
	 * Deterministic Blackbox aggregate mock — seeded off the category +
	 * interval so the same call returns the same shape (testable, no jitter).
	 *
	 * @param string $category Category id (logins / bots / brute-force / forms).
	 * @param string $interval Interval id (30-days / 60-days / 6-months / all).
	 * @param bool   $preview  Whether to mark the response as preview data.
	 * @return array
	 */
	protected static function deterministic_mock_aggregate( $category, $interval, $preview ) {
		$seed = crc32( $category . '|' . $interval );
		$n    = static function ( $offset ) use ( $seed ) {
			return abs( ( $seed + ( $offset * 31 ) ) % 9999 );
		};

		$bucket_counts = array(
			'30-days'  => 30,
			'60-days'  => 60,
			'6-months' => 26,
			'all'      => 12,
		);
		$bucket_count  = isset( $bucket_counts[ $interval ] ) ? $bucket_counts[ $interval ] : 30;

		$series = array();
		for ( $i = $bucket_count - 1; $i >= 0; $i-- ) {
			$series[] = array(
				'date'       => gmdate( 'Y-m-d', strtotime( "-{$i} days" ) ),
				'blocked'    => $n( $i + 1 ) % 80,
				'challenged' => $n( $i + 2 ) % 30,
				'passed'     => $n( $i + 3 ) % 20,
			);
		}

		return array(
			'category'     => $category,
			'interval'     => $interval,
			'blocked'      => $n( 1 ) * 7,
			'challenged'   => $n( 2 ) * 3,
			'passed'       => $n( 3 ) * 2,
			'series'       => $series,
			'preview'      => (bool) $preview,
			'generated_at' => gmdate( 'c' ),
		);
	}

	/**
	 * Comments-stats totals fixture. Seeded off interval so the response is
	 * stable across calls. `preview: true` until a real upstream source is
	 * wired up — see the block comment above for the swap point.
	 *
	 * @param string $interval Interval id.
	 * @return array
	 */
	protected static function comments_mock_totals( $interval ) {
		$seed = crc32( 'comments|' . $interval );
		$n    = static function ( $offset ) use ( $seed ) {
			return abs( ( $seed + ( $offset * 31 ) ) % 9999 );
		};

		$spam            = $n( 1 ) * 7;
		$ham             = $n( 2 ) % 300;
		$missed_spam     = $n( 3 ) % 8;
		$false_positives = $n( 4 ) % 3;
		$accuracy        = ( $spam + $ham ) > 0
			? round(
				( ( $spam + $ham - $missed_spam - $false_positives ) / ( $spam + $ham ) ) * 100,
				2
			)
			: 100.0;

		return array(
			'interval'        => $interval,
			'spam'            => $spam,
			'ham'             => $ham,
			'missed_spam'     => $missed_spam,
			'false_positives' => $false_positives,
			'accuracy'        => $accuracy,
			// Seconds; ~30s per spam comment is the legacy Akismet methodology.
			'time_saved'      => $spam * 30,
			'preview'         => true,
			'generated_at'    => gmdate( 'c' ),
		);
	}

	/**
	 * Comments time-series fixture for the sparkline on the Comments card.
	 * Maps to the `endpoint-spec-stats-timeseries.md` proposal shape.
	 *
	 * @param string $interval Interval id.
	 * @return array
	 */
	protected static function comments_mock_timeseries( $interval ) {
		$bucket_counts = array(
			'30-days'  => 30,
			'60-days'  => 60,
			'6-months' => 26,
			'all'      => 12,
		);
		$bucket_count  = isset( $bucket_counts[ $interval ] ) ? $bucket_counts[ $interval ] : 30;

		$seed = crc32( 'comments-ts|' . $interval );
		$n    = static function ( $offset ) use ( $seed ) {
			return abs( ( $seed + ( $offset * 31 ) ) % 9999 );
		};

		$series = array();
		$totals = array(
			'spam'            => 0,
			'ham'             => 0,
			'missed_spam'     => 0,
			'false_positives' => 0,
		);
		$bucket = ( '6-months' === $interval || 'all' === $interval ) ? 'week' : 'day';
		$step   = ( 'day' === $bucket ) ? 1 : 7;
		for ( $i = $bucket_count - 1; $i >= 0; $i-- ) {
			$date                       = gmdate( 'Y-m-d', strtotime( '-' . ( $i * $step ) . ' days' ) );
			$spam                       = $n( $i + 1 ) % 250;
			$ham                        = $n( $i + 2 ) % 20;
			$missed_spam                = $n( $i + 3 ) % 3;
			$false_positives            = $n( $i + 4 ) % 2;
			$series[]                   = array(
				'date'            => $date,
				'spam'            => $spam,
				'ham'             => $ham,
				'missed_spam'     => $missed_spam,
				'false_positives' => $false_positives,
			);
			$totals['spam']            += $spam;
			$totals['ham']             += $ham;
			$totals['missed_spam']     += $missed_spam;
			$totals['false_positives'] += $false_positives;
		}

		$total_evaluated = $totals['spam'] + $totals['ham'];
		$accuracy        = $total_evaluated > 0
			? round(
				( ( $total_evaluated - $totals['missed_spam'] - $totals['false_positives'] ) / $total_evaluated ) * 100,
				2
			)
			: 100.0;

		return array(
			'interval'     => $interval,
			'bucket'       => $bucket,
			'series'       => $series,
			'totals'       => array_merge(
				$totals,
				array(
					'accuracy'   => $accuracy,
					'time_saved' => $totals['spam'] * 30,
				)
			),
			'preview'      => true,
			'generated_at' => gmdate( 'c' ),
		);
	}
}
