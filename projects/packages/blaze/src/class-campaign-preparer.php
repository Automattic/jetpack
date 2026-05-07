<?php
/**
 * Blaze campaign preparation.
 *
 * @package automattic/jetpack-blaze
 */

namespace Automattic\Jetpack\Blaze;

/**
 * Prepares a structured Blaze campaign proposal for review in the Blaze UI.
 */
class Campaign_Preparer {

	private const DEFAULT_BUDGET_TOTAL  = 50.0;
	private const DEFAULT_DURATION_DAYS = 7;
	private const INTENT_ECOMMERCE      = 'ecommerce';
	private const INTENT_CONTENT        = 'content';
	private const INTENT_UNKNOWN        = 'unknown';
	private const SUPPORTED_LANGUAGES   = array( 'zh', 'nl', 'en', 'fr', 'de', 'hi', 'id', 'it', 'ja', 'ko', 'pl', 'pt', 'ru', 'es', 'tr' );
	private const SUPPORTED_DEVICES     = array( 'mobile', 'desktop' );
	private const SUPPORTED_PAGE_TOPICS = array(
		'IAB1',
		'IAB8_IAB18',
		'IAB19',
		'IAB5_IAB15',
		'IAB6_IAB7_IAB16',
		'IAB3_IAB4_IAB13',
		'IAB11_IAB12',
		'IAB14_IAB23',
		'IAB17',
		'IAB2_IAB20',
		'IAB10_IAB21_IAB13',
		'IAB9_IAB22',
	);

	/**
	 * Prepare a Blaze campaign proposal from a target post and optional overrides.
	 *
	 * @param array $args Preparation input.
	 * @return array|\WP_Error
	 */
	public static function prepare( array $args ) {
		$urn = isset( $args['target_urn'] ) ? (string) $args['target_urn'] : '';
		if ( '' === $urn || ! preg_match( '/^urn:wpcom:post:\d+:(\d+)$/', $urn, $matches ) ) {
			return new \WP_Error(
				'blaze_invalid_target_urn',
				/* translators: %s: the malformed URN value supplied by the caller. */
				sprintf( __( 'Invalid target_urn %s. Expected format: urn:wpcom:post:<site_id>:<post_id>.', 'jetpack-blaze' ), $urn ),
				array( 'status' => 400 )
			);
		}

		$post = get_post( (int) $matches[1] );
		if ( ! $post ) {
			return new \WP_Error(
				'blaze_post_not_found',
				__( 'Post referenced by target_urn does not exist on this site.', 'jetpack-blaze' ),
				array( 'status' => 404 )
			);
		}

		$intent          = self::infer_intent( $args, $post );
		$budget_context  = self::resolve_budget_context( $args );
		$assumptions     = self::build_assumptions( $args, $post, $intent, $budget_context );
		$recommendations = self::build_recommendations( $intent, $budget_context );
		$prefill         = self::build_prefill_payload( $args, $post, $intent, $budget_context );
		$prefill_url     = self::build_prefill_url( $post->ID, $prefill );
		$forecast        = self::request_forecast( $prefill, $intent );

		$proposal = array(
			'status'          => 'pending_merchant_review',
			'intent'          => $intent,
			'forecast'        => $forecast,
			'assumptions'     => $assumptions,
			'recommendations' => $recommendations,
			'prefill_url'     => $prefill_url,
			'prefill'         => $prefill,
		);

		if ( $budget_context['include_options'] ) {
			$proposal['budget_options'] = $budget_context['options'];
		}

		return $proposal;
	}

	/**
	 * Build the campaign prefill payload from caller input and the target post.
	 *
	 * @param array    $args           Preparation input.
	 * @param \WP_Post $post           The target post.
	 * @param string   $intent         Inferred campaign intent.
	 * @param array    $budget_context Resolved budget defaults and options.
	 * @return array
	 */
	private static function build_prefill_payload( array $args, $post, string $intent, array $budget_context ): array {
		$featured_image_id   = (int) get_post_thumbnail_id( $post->ID );
		$featured_image_url  = $featured_image_id > 0 ? wp_get_attachment_image_url( $featured_image_id, 'full' ) : '';
		$featured_image_mime = $featured_image_id > 0 ? get_post_mime_type( $featured_image_id ) : '';

		$default_snippet = (string) get_the_excerpt( $post );
		if ( '' === $default_snippet ) {
			$stripped        = trim( wp_strip_all_tags( (string) $post->post_content ) );
			$default_snippet = function_exists( 'mb_substr' ) ? mb_substr( $stripped, 0, 200 ) : substr( $stripped, 0, 200 );
		}

		$payload = array(
			'target_urn'    => (string) $args['target_urn'],
			'type'          => (string) $post->post_type,
			'site_name'     => isset( $args['site_name'] ) && '' !== (string) $args['site_name']
				? (string) $args['site_name']
				: (string) get_the_title( $post ),
			'text_snippet'  => isset( $args['text_snippet'] ) && '' !== (string) $args['text_snippet']
				? (string) $args['text_snippet']
				: $default_snippet,
			'cta_text'      => isset( $args['cta_text'] ) && '' !== (string) $args['cta_text']
				? (string) $args['cta_text']
				: ( 'product' === (string) $post->post_type ? 'Shop Now' : 'Learn More' ),
			'target_url'    => (string) get_permalink( $post ),
			'budget'        => array(
				'mode'     => 'total',
				'amount'   => $budget_context['budget_total'],
				'currency' => $budget_context['currency'],
			),
			'duration_days' => $budget_context['duration_days'],
			'is_evergreen'  => isset( $args['is_evergreen'] ) ? (bool) $args['is_evergreen'] : true,
			'objective'     => self::objective_for_intent( $intent ),
		);

		if ( isset( $args['goal'] ) && '' !== (string) $args['goal'] ) {
			$payload['goal'] = (string) $args['goal'];
		}
		if ( isset( $args['revision_instruction'] ) && '' !== (string) $args['revision_instruction'] ) {
			$payload['revision_instruction'] = (string) $args['revision_instruction'];
		}

		if ( isset( $args['main_image_url'] ) && '' !== (string) $args['main_image_url'] ) {
			$payload['main_image'] = array(
				'url'       => (string) $args['main_image_url'],
				'mime_type' => isset( $args['main_image_mime_type'] ) && '' !== (string) $args['main_image_mime_type']
					? (string) $args['main_image_mime_type']
					: 'image/jpeg',
			);
		} elseif ( '' !== $featured_image_url ) {
			$payload['main_image'] = array(
				'url'       => $featured_image_url,
				'mime_type' => $featured_image_mime ? $featured_image_mime : 'image/jpeg',
			);
		}

		if ( isset( $args['languages'] ) && is_array( $args['languages'] ) ) {
			$languages = array_values(
				array_filter(
					array_map( 'strtolower', array_map( 'strval', $args['languages'] ) ),
					static function ( $code ) {
						return in_array( $code, self::SUPPORTED_LANGUAGES, true );
					}
				)
			);
			if ( ! empty( $languages ) ) {
				$payload['languages'] = $languages;
			}
		}
		if ( isset( $args['countries'] ) && is_array( $args['countries'] ) ) {
			$countries = array_values(
				array_filter(
					array_map( 'strtoupper', array_map( 'strval', $args['countries'] ) ),
					static function ( $code ) {
						return 2 === strlen( $code );
					}
				)
			);
			if ( ! empty( $countries ) ) {
				$payload['countries'] = $countries;
			}
		}
		if ( isset( $args['devices'] ) && is_array( $args['devices'] ) ) {
			$devices = array_values(
				array_unique(
					array_filter(
						array_map( 'strtolower', array_map( 'strval', $args['devices'] ) ),
						static function ( $device ) {
							return in_array( $device, self::SUPPORTED_DEVICES, true );
						}
					)
				)
			);
			if ( 1 === count( $devices ) ) {
				$payload['devices'] = $devices;
			}
		}
		if ( isset( $args['interests'] ) && is_array( $args['interests'] ) ) {
			$page_topics = array_values(
				array_unique(
					array_filter(
						array_map( array( self::class, 'normalize_page_topic' ), $args['interests'] )
					)
				)
			);
			if ( ! empty( $page_topics ) ) {
				$payload['page_topics'] = $page_topics;
			}
		}

		return $payload;
	}

	/**
	 * Request a DSP forecast for the recommended prefilled campaign.
	 *
	 * @param array  $prefill Recommended campaign prefill payload.
	 * @param string $intent  Inferred campaign intent.
	 * @return array
	 */
	private static function request_forecast( array $prefill, string $intent ): array {
		$site_id = \Automattic\Jetpack\Connection\Manager::get_site_id();
		if ( is_wp_error( $site_id ) ) {
			return self::unavailable_forecast( $site_id->get_error_code() );
		}

		$route   = sprintf( '/jetpack/v4/blaze-app/sites/%d/wordads/dsp/api/v1.1/forecast', (int) $site_id );
		$request = new \WP_REST_Request( 'POST', $route );
		$request->set_header( 'Content-Type', 'application/json' );
		$request->set_body( (string) wp_json_encode( self::build_forecast_request_body( $prefill ), JSON_UNESCAPED_SLASHES ) );

		$response = rest_do_request( $request );
		if ( $response->is_error() ) {
			$error = $response->as_error();
			return self::unavailable_forecast( $error->get_error_code() );
		}

		$data = $response->get_data();
		if ( ! is_array( $data ) ) {
			return self::unavailable_forecast( 'forecast_invalid_response' );
		}

		return self::normalize_forecast_response( $data, $intent );
	}

	/**
	 * Build the request body expected by the DSP v1.1 forecast endpoint.
	 *
	 * @param array $prefill Recommended campaign prefill payload.
	 * @return array
	 */
	private static function build_forecast_request_body( array $prefill ): array {
		$duration_days = isset( $prefill['duration_days'] ) ? max( 1, (int) $prefill['duration_days'] ) : self::DEFAULT_DURATION_DAYS;
		$start_date    = gmdate( 'Y-m-d' );
		$end_date      = gmdate( 'Y-m-d', strtotime( '+' . ( $duration_days - 1 ) . ' days' ) );

		return array(
			'time_zone'       => self::get_site_timezone(),
			'start_date'      => $start_date,
			'end_date'        => $end_date,
			'total_budget'    => isset( $prefill['budget']['amount'] ) ? (float) $prefill['budget']['amount'] : self::DEFAULT_BUDGET_TOTAL,
			'is_evergreen'    => isset( $prefill['is_evergreen'] ) ? (bool) $prefill['is_evergreen'] : true,
			'is_tsp_eligible' => false,
			'targeting'       => array(
				'locations'   => array(),
				'languages'   => isset( $prefill['languages'] ) ? array_values( (array) $prefill['languages'] ) : array(),
				'devices'     => isset( $prefill['devices'] ) ? array_values( (array) $prefill['devices'] ) : array(),
				'page_topics' => isset( $prefill['page_topics'] ) ? array_values( (array) $prefill['page_topics'] ) : array(),
			),
		);
	}

	/**
	 * Normalize the DSP forecast response into the prepare-campaign contract.
	 *
	 * @param array  $data   DSP forecast response.
	 * @param string $intent Inferred campaign intent.
	 * @return array
	 */
	private static function normalize_forecast_response( array $data, string $intent ): array {
		$views  = array(
			'min' => isset( $data['total_impressions_min'] ) ? (int) $data['total_impressions_min'] : 0,
			'max' => isset( $data['total_impressions_max'] ) ? (int) $data['total_impressions_max'] : 0,
		);
		$clicks = array(
			'min' => isset( $data['total_clicks_min'] ) ? (int) $data['total_clicks_min'] : 0,
			'max' => isset( $data['total_clicks_max'] ) ? (int) $data['total_clicks_max'] : 0,
		);

		return array(
			'status'           => 'available',
			'primary_metric'   => self::INTENT_ECOMMERCE === $intent ? 'clicks' : 'views',
			'secondary_metric' => self::INTENT_ECOMMERCE === $intent ? 'views' : 'clicks',
			'views'            => $views,
			'impressions'      => $views,
			'clicks'           => $clicks,
			'tsp_impressions'  => array(
				'min' => isset( $data['total_tsp_impressions_min'] ) ? (int) $data['total_tsp_impressions_min'] : 0,
				'max' => isset( $data['total_tsp_impressions_max'] ) ? (int) $data['total_tsp_impressions_max'] : 0,
			),
		);
	}

	/**
	 * Build a non-blocking forecast failure response.
	 *
	 * @param string $reason Stable failure reason.
	 * @return array
	 */
	private static function unavailable_forecast( string $reason ): array {
		return array(
			'status'  => 'unavailable',
			'reason'  => $reason,
			'message' => __( 'Forecast estimates are unavailable, but the campaign proposal can still be reviewed in Blaze.', 'jetpack-blaze' ),
		);
	}

	/**
	 * Infer the campaign intent from natural language and target type.
	 *
	 * @param array    $args Preparation input.
	 * @param \WP_Post $post The target post.
	 * @return string
	 */
	private static function infer_intent( array $args, $post ): string {
		$goal = isset( $args['goal'] ) ? strtolower( (string) $args['goal'] ) : '';

		if ( '' !== $goal ) {
			if ( preg_match( '/\b(sale|sales|sell|shop|purchase|order|conversion|conversions|revenue|roi|customer|customers)\b/', $goal ) ) {
				return self::INTENT_ECOMMERCE;
			}
			if ( preg_match( '/\b(read|reader|readers|readership|article|blog|post|story|content|awareness|visibility|views|traffic)\b/', $goal ) ) {
				return self::INTENT_CONTENT;
			}
		}

		if ( 'product' === (string) $post->post_type ) {
			return self::INTENT_ECOMMERCE;
		}
		if ( in_array( (string) $post->post_type, array( 'post', 'page' ), true ) ) {
			return self::INTENT_CONTENT;
		}

		return self::INTENT_UNKNOWN;
	}

	/**
	 * Resolve the recommended budget and optional comparison choices.
	 *
	 * @param array $args Preparation input.
	 * @return array
	 */
	private static function resolve_budget_context( array $args ): array {
		$currency              = self::get_site_currency();
		$has_budget_override   = isset( $args['budget_total'] );
		$has_duration_override = isset( $args['duration_days'] );
		$budget_total          = $has_budget_override ? max( 1.0, (float) $args['budget_total'] ) : self::DEFAULT_BUDGET_TOTAL;
		$duration_days         = $has_duration_override ? max( 1, (int) $args['duration_days'] ) : self::DEFAULT_DURATION_DAYS;
		$include_options       = ! $has_budget_override || ! $has_duration_override;

		return array(
			'budget_total'          => $budget_total,
			'currency'              => $currency,
			'duration_days'         => $duration_days,
			'has_budget_override'   => $has_budget_override,
			'has_duration_override' => $has_duration_override,
			'include_options'       => $include_options,
			'options'               => $include_options ? self::build_budget_options( $budget_total, $duration_days, $currency ) : array(),
		);
	}

	/**
	 * Build lower/recommended/higher budget options around the recommended campaign.
	 *
	 * @param float  $recommended_total Recommended total budget.
	 * @param int    $duration_days     Campaign duration in days.
	 * @param string $currency          ISO 4217 currency code.
	 * @return array
	 */
	private static function build_budget_options( float $recommended_total, int $duration_days, string $currency ): array {
		$lower_total  = max( 10.0, round( $recommended_total * 0.5, 2 ) );
		$higher_total = round( $recommended_total * 3, 2 );

		return array(
			self::build_budget_option(
				'lower',
				__( 'Lower', 'jetpack-blaze' ),
				$lower_total,
				$duration_days,
				$currency,
				__( 'Lower-risk test budget for learning before spending more.', 'jetpack-blaze' )
			),
			self::build_budget_option(
				'recommended',
				__( 'Recommended', 'jetpack-blaze' ),
				$recommended_total,
				$duration_days,
				$currency,
				__( 'Conservative starting point for a first prepared Blaze campaign.', 'jetpack-blaze' )
			),
			self::build_budget_option(
				'higher',
				__( 'Higher', 'jetpack-blaze' ),
				$higher_total,
				$duration_days,
				$currency,
				__( 'More budget can buy more reach; choose this only when broader delivery is worth the extra spend.', 'jetpack-blaze' )
			),
		);
	}

	/**
	 * Build one budget option row.
	 *
	 * @param string $key           Stable option key.
	 * @param string $label         Human-readable option label.
	 * @param float  $budget_total  Total budget.
	 * @param int    $duration_days Campaign duration in days.
	 * @param string $currency      ISO 4217 currency code.
	 * @param string $rationale     Why this option exists.
	 * @return array
	 */
	private static function build_budget_option( string $key, string $label, float $budget_total, int $duration_days, string $currency, string $rationale ): array {
		return array(
			'key'           => $key,
			'label'         => $label,
			'budget'        => array(
				'mode'     => 'total',
				'amount'   => $budget_total,
				'currency' => $currency,
			),
			'daily_budget'  => array(
				'amount'   => round( $budget_total / $duration_days, 2 ),
				'currency' => $currency,
			),
			'duration_days' => $duration_days,
			'rationale'     => $rationale,
		);
	}

	/**
	 * Build human-readable assumptions for the prepared recommendation.
	 *
	 * @param array    $args           Preparation input.
	 * @param \WP_Post $post           The target post.
	 * @param string   $intent         Inferred campaign intent.
	 * @param array    $budget_context Resolved budget defaults and options.
	 * @return array
	 */
	private static function build_assumptions( array $args, $post, string $intent, array $budget_context ): array {
		$post_type   = (string) $post->post_type;
		$assumptions = array();

		if ( self::INTENT_ECOMMERCE === $intent ) {
			$assumptions[] = isset( $args['goal'] ) && '' !== (string) $args['goal']
				? sprintf(
					/* translators: %s: user-supplied natural language campaign goal. */
					__( 'Goal "%s" suggests ecommerce intent, so the proposal uses traffic-oriented product defaults.', 'jetpack-blaze' ),
					(string) $args['goal']
				)
				: __( 'Target is a product, so the proposal uses ecommerce-oriented defaults.', 'jetpack-blaze' );
		} elseif ( self::INTENT_CONTENT === $intent ) {
			$assumptions[] = isset( $args['goal'] ) && '' !== (string) $args['goal']
				? sprintf(
					/* translators: %s: user-supplied natural language campaign goal. */
					__( 'Goal "%s" suggests content intent, so the proposal optimizes for visibility.', 'jetpack-blaze' ),
					(string) $args['goal']
				)
				: sprintf(
					/* translators: %s: WordPress post type. */
					__( 'Target type "%s" is treated as content, so the proposal optimizes for visibility.', 'jetpack-blaze' ),
					$post_type
				);
		} else {
			$assumptions[] = sprintf(
				/* translators: %s: WordPress post type. */
				__( 'Target type "%s" has unknown intent, so the proposal uses conservative visibility defaults.', 'jetpack-blaze' ),
				$post_type
			);
		}

		if ( ! $budget_context['has_budget_override'] ) {
			$assumptions[] = __( 'No budget was supplied, so the recommended option uses a conservative default total budget.', 'jetpack-blaze' );
		}
		if ( ! $budget_context['has_duration_override'] ) {
			$assumptions[] = __( 'No duration was supplied, so the recommended option uses a seven-day campaign.', 'jetpack-blaze' );
		}
		if ( isset( $args['revision_instruction'] ) && '' !== (string) $args['revision_instruction'] ) {
			$assumptions[] = sprintf(
				/* translators: %s: user-supplied revision instruction. */
				__( 'Revision requested: %s', 'jetpack-blaze' ),
				(string) $args['revision_instruction']
			);
		}

		return $assumptions;
	}

	/**
	 * Build compact campaign recommendations for clients to surface.
	 *
	 * @param string $intent         Inferred campaign intent.
	 * @param array  $budget_context Resolved budget defaults and options.
	 * @return array
	 */
	private static function build_recommendations( string $intent, array $budget_context ): array {
		$recommendations = array();

		if ( self::INTENT_ECOMMERCE === $intent ) {
			$recommendations[] = __( 'Use product-focused copy and send shoppers to the product page.', 'jetpack-blaze' );
		} elseif ( self::INTENT_CONTENT === $intent ) {
			$recommendations[] = __( 'Use visibility-focused copy and send readers to the post or page.', 'jetpack-blaze' );
		} else {
			$recommendations[] = __( 'Review the prepared copy and target before submitting because the target intent is uncertain.', 'jetpack-blaze' );
		}

		if ( $budget_context['include_options'] ) {
			$recommendations[] = __( 'The recommended budget option is conservative; the higher option is framed as broader reach, not guaranteed performance.', 'jetpack-blaze' );
		}

		return $recommendations;
	}

	/**
	 * Server-owned DSP objective for the inferred intent.
	 *
	 * @param string $intent Inferred campaign intent.
	 * @return string
	 */
	private static function objective_for_intent( string $intent ): string {
		return self::INTENT_ECOMMERCE === $intent ? 'CLICKS' : 'VIEWS';
	}

	/**
	 * Normalize an MCP-supplied interest code to a public Blaze page topic.
	 *
	 * Blaze's public targeting endpoint exposes a compact set of custom topic
	 * IDs, some of which group several IAB categories. If an agent supplies a
	 * bare IAB category that belongs to a public group, emit the supported group
	 * ID so the widget can display and submit it correctly.
	 *
	 * @param mixed $topic Raw topic value.
	 * @return string|null Supported public page topic ID, or null to drop it.
	 */
	private static function normalize_page_topic( $topic ): ?string {
		$topic = strtoupper( (string) $topic );
		if ( in_array( $topic, self::SUPPORTED_PAGE_TOPICS, true ) ) {
			return $topic;
		}
		if ( 1 !== preg_match( '/^IAB\d+$/', $topic ) ) {
			return null;
		}
		foreach ( self::SUPPORTED_PAGE_TOPICS as $supported_topic ) {
			$parts = explode( '_', $supported_topic );
			if ( in_array( $topic, $parts, true ) ) {
				return $supported_topic;
			}
		}
		return null;
	}

	/**
	 * Build the Blaze review deep-link with the encoded prefill payload.
	 *
	 * @param int   $post_id The target post ID.
	 * @param array $prefill The prefill payload to encode.
	 * @return string
	 */
	private static function build_prefill_url( int $post_id, array $prefill ): string {
		$base = '';
		if ( class_exists( '\Automattic\Jetpack\Blaze' ) && method_exists( '\Automattic\Jetpack\Blaze', 'get_campaign_management_url' ) ) {
			$url_data = \Automattic\Jetpack\Blaze::get_campaign_management_url( $post_id );
			if ( is_array( $url_data ) && isset( $url_data['link'] ) ) {
				$base = (string) $url_data['link'];
			}
		}
		if ( '' === $base ) {
			$base = admin_url( 'tools.php?page=advertising' );
		}

		$encoded = self::base64url_encode( (string) wp_json_encode( $prefill, JSON_UNESCAPED_SLASHES ) );
		$param   = 'blaze_prefill=' . rawurlencode( $encoded );

		$hash_pos = strpos( $base, '#' );
		if ( false === $hash_pos ) {
			$separator = ( false !== strpos( $base, '?' ) ) ? '&' : '?';
			return $base . $separator . $param;
		}

		$pre_hash  = substr( $base, 0, $hash_pos );
		$hash      = substr( $base, $hash_pos );
		$separator = ( false !== strpos( $pre_hash, '?' ) ) ? '&' : '?';

		return $pre_hash . $separator . $param . $hash;
	}

	/**
	 * URL-safe base64 encode (RFC 4648 section 5).
	 *
	 * @param string $input Bytes to encode.
	 * @return string
	 */
	private static function base64url_encode( string $input ): string {
		// phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode -- Encoding a structured prefill payload, not obfuscation.
		return rtrim( strtr( base64_encode( $input ), '+/', '-_' ), '=' );
	}

	/**
	 * Currency code for the prefill payload.
	 *
	 * @return string ISO 4217 currency code.
	 */
	private static function get_site_currency(): string {
		return 'USD';
	}

	/**
	 * Site timezone for DSP forecast requests.
	 *
	 * @return string IANA timezone name.
	 */
	private static function get_site_timezone(): string {
		$timezone = wp_timezone_string();
		return '' !== $timezone ? $timezone : 'UTC';
	}
}
