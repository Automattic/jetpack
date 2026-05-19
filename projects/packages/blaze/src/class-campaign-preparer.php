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
		$args = self::normalize_target_args( $args );
		if ( is_wp_error( $args ) ) {
			return $args;
		}

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
		$summary         = self::build_campaign_summary( $post, $prefill, $intent, $budget_context );
		$payment_context = self::resolve_payment_context( $args, $prefill );
		$package         = self::build_prepared_campaign_identity( $prefill, $summary, $payment_context['selected_payment_method'] );
		$eligibility     = self::build_submit_eligibility( $args, $prefill, $prefill_url, $payment_context );

		$proposal = array(
			'status'               => 'pending_merchant_review',
			'prepared_campaign'    => $package,
			'rendered_preview'     => self::build_rendered_preview( $prefill, $package ),
			'campaign_summary'     => $summary,
			'fallback_url'         => $prefill_url,
			'submit_eligibility'   => $eligibility,
			'material_edit_policy' => self::build_material_edit_policy(),
			'intent'               => $intent,
			'forecast'             => $forecast,
			'assumptions'          => $assumptions,
			'recommendations'      => $recommendations,
			'prefill_url'          => $prefill_url,
			'prefill'              => $prefill,
		);

		if ( $budget_context['include_options'] ) {
			$proposal['budget_options'] = $budget_context['options'];
		}
		if ( $eligibility['chat_native_submit'] ) {
			$proposal['approval_block'] = self::build_approval_block( $package );
		}

		return $proposal;
	}

	/**
	 * Normalize public target input forms into the canonical target URN.
	 *
	 * @param array $args Preparation input.
	 * @return array|\WP_Error
	 */
	private static function normalize_target_args( array $args ) {
		if ( isset( $args['target_urn'] ) && '' !== (string) $args['target_urn'] ) {
			return $args;
		}

		$has_post_id    = isset( $args['post_id'] ) && '' !== (string) $args['post_id'];
		$has_product_id = isset( $args['product_id'] ) && '' !== (string) $args['product_id'];

		if ( $has_post_id && $has_product_id ) {
			return new \WP_Error(
				'blaze_ambiguous_target',
				__( 'Provide only one of post_id or product_id when target_urn is omitted.', 'jetpack-blaze' ),
				array( 'status' => 400 )
			);
		}

		if ( ! isset( $args['site_url'] ) || '' === (string) $args['site_url'] || ( ! $has_post_id && ! $has_product_id ) ) {
			return new \WP_Error(
				'blaze_missing_target',
				__( 'Provide target_urn, or provide site_url with exactly one of post_id or product_id.', 'jetpack-blaze' ),
				array( 'status' => 400 )
			);
		}

		$site_id = self::lookup_public_site_id( (string) $args['site_url'] );
		if ( is_wp_error( $site_id ) ) {
			return $site_id;
		}

		$target_id          = $has_product_id ? (int) $args['product_id'] : (int) $args['post_id'];
		$args['target_urn'] = sprintf( 'urn:wpcom:post:%d:%d', (int) $site_id, $target_id );

		return $args;
	}

	/**
	 * Resolve a public WordPress.com site URL/domain to its site ID.
	 *
	 * @param string $site_url Public site URL or domain.
	 * @return int|\WP_Error
	 */
	private static function lookup_public_site_id( string $site_url ) {
		$response = wp_remote_get(
			'https://public-api.wordpress.com/rest/v1.1/sites/' . rawurlencode( $site_url ),
			array(
				'timeout' => 5,
			)
		);

		if ( is_wp_error( $response ) || 200 !== wp_remote_retrieve_response_code( $response ) ) {
			return new \WP_Error(
				'blaze_site_lookup_failed',
				__( 'Could not resolve site_url through the public WordPress.com sites API.', 'jetpack-blaze' ),
				array( 'status' => 400 )
			);
		}

		$data = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $data ) || empty( $data['ID'] ) ) {
			return new \WP_Error(
				'blaze_site_not_connected',
				__( 'The supplied site_url did not resolve to a connected WordPress.com site.', 'jetpack-blaze' ),
				array( 'status' => 400 )
			);
		}

		return (int) $data['ID'];
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
	 * Build the immutable package identity for a prepared campaign.
	 *
	 * @param array      $prefill                 Recommended campaign prefill payload.
	 * @param array      $summary                 Structured campaign summary.
	 * @param array|null $selected_payment_method Selected saved payment method summary.
	 * @return array
	 */
	private static function build_prepared_campaign_identity( array $prefill, array $summary, $selected_payment_method = null ): array {
		$identity_payload = array(
			'contract_version'        => 'v1',
			'prefill'                 => $prefill,
			'campaign_summary'        => $summary,
			'selected_payment_method' => $selected_payment_method,
		);
		$hash             = hash( 'sha256', (string) wp_json_encode( $identity_payload, JSON_UNESCAPED_SLASHES ) );

		return array(
			'id'      => $hash,
			'hash'    => $hash,
			'version' => 'v1',
		);
	}

	/**
	 * Resolve saved payment methods for chat-native submit.
	 *
	 * @param array $args    Preparation input.
	 * @param array $prefill Recommended campaign prefill payload.
	 * @return array
	 */
	private static function resolve_payment_context( array $args, array $prefill ): array {
		/**
		 * Filters existing saved payment methods available to the prepared
		 * campaign.
		 *
		 * Return an array of payment methods when known, an empty array when no
		 * usable methods exist, or null when the caller cannot determine saved
		 * payment method eligibility.
		 *
		 * @since $$next-version$$
		 *
		 * @param array|null $payment_methods Existing saved payment methods.
		 * @param array      $args            Preparation input.
		 * @param array      $prefill         Recommended campaign prefill payload.
		 */
		$payment_methods = apply_filters( 'jetpack_blaze_prepare_campaign_payment_methods', null, $args, $prefill );

		if ( is_array( $payment_methods ) ) {
			$methods             = self::normalize_payment_methods( $payment_methods );
			$requested_method_id = isset( $args['payment_method_id'] ) ? (string) $args['payment_method_id'] : '';
			$selected            = self::select_payment_method( $methods, $requested_method_id );

			return array(
				'known'                       => true,
				'available_payment_methods'  => $methods,
				'selected_payment_method'    => $selected,
				'requested_payment_method_id' => $requested_method_id,
			);
		}

		return array(
			'known'                       => false,
			'available_payment_methods'  => array(),
			'selected_payment_method'    => null,
			'requested_payment_method_id' => isset( $args['payment_method_id'] ) ? (string) $args['payment_method_id'] : '',
		);
	}

	/**
	 * Normalize saved payment methods into a compact safe display summary.
	 *
	 * @param array $payment_methods Raw payment methods.
	 * @return array
	 */
	private static function normalize_payment_methods( array $payment_methods ): array {
		$normalized = array();

		foreach ( $payment_methods as $payment_method ) {
			if ( ! is_array( $payment_method ) ) {
				continue;
			}

			$method = self::normalize_payment_method( $payment_method );
			if ( null !== $method ) {
				$normalized[] = $method;
			}
		}

		return $normalized;
	}

	/**
	 * Normalize one saved payment method.
	 *
	 * @param array $payment_method Raw payment method.
	 * @return array|null
	 */
	private static function normalize_payment_method( array $payment_method ) {
		$id = self::first_non_empty_string( $payment_method, array( 'id', 'payment_method_id', 'paymentMethodId', 'token_id', 'tokenId' ) );
		if ( '' === $id || ! self::is_usable_payment_method( $payment_method ) ) {
			return null;
		}

		$card      = isset( $payment_method['card'] ) && is_array( $payment_method['card'] ) ? $payment_method['card'] : array();
		$type      = self::first_non_empty_string( $payment_method, array( 'type', 'payment_method_type', 'paymentMethodType', 'method' ) );
		$brand     = self::first_non_empty_string( $payment_method, array( 'brand', 'card_brand', 'cardBrand' ) );
		$last4     = self::first_non_empty_string( $payment_method, array( 'last4', 'last_4', 'card_last4', 'cardLast4' ) );
		$exp_month = self::first_integer( $payment_method, array( 'exp_month', 'expMonth', 'expiry_month', 'expiryMonth' ) );
		$exp_year  = self::first_integer( $payment_method, array( 'exp_year', 'expYear', 'expiry_year', 'expiryYear' ) );

		if ( '' === $brand ) {
			$brand = self::first_non_empty_string( $card, array( 'brand', 'card_brand', 'cardBrand' ) );
		}
		if ( '' === $last4 ) {
			$last4 = self::first_non_empty_string( $card, array( 'last4', 'last_4', 'card_last4', 'cardLast4' ) );
		}
		if ( null === $exp_month ) {
			$exp_month = self::first_integer( $card, array( 'exp_month', 'expMonth', 'expiry_month', 'expiryMonth' ) );
		}
		if ( null === $exp_year ) {
			$exp_year = self::first_integer( $card, array( 'exp_year', 'expYear', 'expiry_year', 'expiryYear' ) );
		}
		if ( '' === $type ) {
			$type = '' !== $last4 ? 'card' : 'saved_payment_method';
		}

		$summary = array(
			'id'         => $id,
			'type'       => $type,
			'brand'      => $brand,
			'last4'      => $last4,
		);

		if ( null !== $exp_month ) {
			$summary['exp_month'] = $exp_month;
		}
		if ( null !== $exp_year ) {
			$summary['exp_year'] = $exp_year;
		}

		$summary['label']      = self::build_payment_method_label( $type, $brand, $last4 );
		$summary['is_default'] = self::is_default_payment_method( $payment_method );

		return $summary;
	}

	/**
	 * Whether a saved payment method is usable for chat-native submit.
	 *
	 * @param array $payment_method Raw payment method.
	 * @return bool
	 */
	private static function is_usable_payment_method( array $payment_method ): bool {
		foreach ( array( 'usable', 'is_usable', 'isUsable', 'eligible', 'enabled' ) as $key ) {
			if ( array_key_exists( $key, $payment_method ) ) {
				return (bool) $payment_method[ $key ];
			}
		}

		foreach ( array( 'invalid', 'disabled', 'expired' ) as $key ) {
			if ( ! empty( $payment_method[ $key ] ) ) {
				return false;
			}
		}

		if ( isset( $payment_method['status'] ) ) {
			$status = strtolower( (string) $payment_method['status'] );
			return in_array( $status, array( 'active', 'valid', 'usable', 'enabled' ), true );
		}

		return true;
	}

	/**
	 * Whether a saved payment method is the server-owned default.
	 *
	 * @param array $payment_method Raw payment method.
	 * @return bool
	 */
	private static function is_default_payment_method( array $payment_method ): bool {
		foreach ( array( 'is_default', 'isDefault', 'default' ) as $key ) {
			if ( array_key_exists( $key, $payment_method ) ) {
				return (bool) $payment_method[ $key ];
			}
		}

		return false;
	}

	/**
	 * Select the requested saved payment method, the default, or the first usable.
	 *
	 * @param array  $payment_methods     Normalized payment methods.
	 * @param string $requested_method_id Requested payment method ID.
	 * @return array|null
	 */
	private static function select_payment_method( array $payment_methods, string $requested_method_id ) {
		if ( '' !== $requested_method_id ) {
			foreach ( $payment_methods as $method ) {
				if ( isset( $method['id'] ) && $requested_method_id === (string) $method['id'] ) {
					return $method;
				}
			}

			return null;
		}

		foreach ( $payment_methods as $method ) {
			if ( ! empty( $method['is_default'] ) ) {
				return $method;
			}
		}

		return $payment_methods[0] ?? null;
	}

	/**
	 * Build a compact display label for a saved payment method.
	 *
	 * @param string $type  Payment method type.
	 * @param string $brand Payment brand.
	 * @param string $last4 Last four digits.
	 * @return string
	 */
	private static function build_payment_method_label( string $type, string $brand, string $last4 ): string {
		if ( '' !== $last4 ) {
			$display_brand = '' !== $brand ? ucwords( str_replace( array( '_', '-' ), ' ', $brand ) ) : __( 'Card', 'jetpack-blaze' );
			return sprintf(
				/* translators: 1: payment card brand, 2: last four digits. */
				__( '%1$s ending in %2$s', 'jetpack-blaze' ),
				$display_brand,
				$last4
			);
		}

		if ( '' !== $brand ) {
			return ucwords( str_replace( array( '_', '-' ), ' ', $brand ) );
		}

		return ucwords( str_replace( array( '_', '-' ), ' ', $type ) );
	}

	/**
	 * Return the first non-empty string field from an array.
	 *
	 * @param array $source Source array.
	 * @param array $keys   Candidate keys.
	 * @return string
	 */
	private static function first_non_empty_string( array $source, array $keys ): string {
		foreach ( $keys as $key ) {
			if ( isset( $source[ $key ] ) && '' !== (string) $source[ $key ] ) {
				return (string) $source[ $key ];
			}
		}

		return '';
	}

	/**
	 * Return the first integer field from an array.
	 *
	 * @param array $source Source array.
	 * @param array $keys   Candidate keys.
	 * @return int|null
	 */
	private static function first_integer( array $source, array $keys ) {
		foreach ( $keys as $key ) {
			if ( isset( $source[ $key ] ) && is_numeric( $source[ $key ] ) ) {
				return (int) $source[ $key ];
			}
		}

		return null;
	}

	/**
	 * Build a Blaze-owned HTML preview artifact for chat clients.
	 *
	 * @param array $prefill  Recommended campaign prefill payload.
	 * @param array $package  Prepared campaign identity.
	 * @return array
	 */
	private static function build_rendered_preview( array $prefill, array $package ): array {
		$image = isset( $prefill['main_image'] ) && is_array( $prefill['main_image'] ) ? $prefill['main_image'] : array();

		$html  = '<article class="blaze-prepared-campaign-preview" data-blaze-prepared-campaign-id="';
		$html .= esc_attr( $package['id'] ) . '">';
		$html .= '<div class="blaze-prepared-campaign-preview__body">';
		if ( ! empty( $image['url'] ) ) {
			$html .= '<img class="blaze-prepared-campaign-preview__image" src="';
			$html .= esc_url( (string) $image['url'] ) . '" alt="" />';
		}
		$html .= '<h3 class="blaze-prepared-campaign-preview__heading">';
		$html .= esc_html( $prefill['site_name'] ?? '' ) . '</h3>';
		$html .= '<p class="blaze-prepared-campaign-preview__copy">';
		$html .= esc_html( $prefill['text_snippet'] ?? '' ) . '</p>';
		$html .= '<span class="blaze-prepared-campaign-preview__cta">';
		$html .= esc_html( $prefill['cta_text'] ?? '' ) . '</span>';
		$html .= '</div>';
		$html .= '</article>';

		return array(
			'type' => 'html',
			'html' => $html,
		);
	}

	/**
	 * Build structured campaign summary values for chat display.
	 *
	 * @param \WP_Post $post           The target post.
	 * @param array    $prefill        Recommended campaign prefill payload.
	 * @param string   $intent         Inferred campaign intent.
	 * @param array    $budget_context Resolved budget defaults and options.
	 * @return array
	 */
	private static function build_campaign_summary( $post, array $prefill, string $intent, array $budget_context ): array {
		$duration_days = isset( $prefill['duration_days'] ) ? max( 1, (int) $prefill['duration_days'] ) : self::DEFAULT_DURATION_DAYS;
		$budget        = isset( $prefill['budget'] ) && is_array( $prefill['budget'] ) ? $prefill['budget'] : array();
		$total_amount  = isset( $budget['amount'] ) ? (float) $budget['amount'] : self::DEFAULT_BUDGET_TOTAL;
		$currency      = isset( $budget['currency'] ) ? (string) $budget['currency'] : $budget_context['currency'];
		$start_date    = gmdate( 'Y-m-d' );
		$end_date      = gmdate( 'Y-m-d', strtotime( '+' . ( $duration_days - 1 ) . ' days' ) );

		return array(
			'destination'       => array(
				'url'        => isset( $prefill['target_url'] ) ? (string) $prefill['target_url'] : '',
				'target_urn' => isset( $prefill['target_urn'] ) ? (string) $prefill['target_urn'] : '',
			),
			'creative'          => array(
				'heading'        => isset( $prefill['site_name'] ) ? (string) $prefill['site_name'] : '',
				'copy'           => isset( $prefill['text_snippet'] ) ? (string) $prefill['text_snippet'] : '',
				'call_to_action' => isset( $prefill['cta_text'] ) ? (string) $prefill['cta_text'] : '',
				'image_url'      => isset( $prefill['main_image']['url'] ) ? (string) $prefill['main_image']['url'] : '',
			),
			'budget'            => array(
				'mode'  => isset( $budget['mode'] ) ? (string) $budget['mode'] : 'total',
				'total' => array(
					'amount'   => $total_amount,
					'currency' => $currency,
				),
				'daily' => array(
					'amount'   => round( $total_amount / $duration_days, 2 ),
					'currency' => $currency,
				),
			),
			'cadence'           => array(
				'duration_days' => $duration_days,
				'is_evergreen'  => isset( $prefill['is_evergreen'] ) ? (bool) $prefill['is_evergreen'] : true,
			),
			'schedule'          => array(
				'start_date' => $start_date,
				'end_date'   => $end_date,
				'time_zone'  => self::get_site_timezone(),
			),
			'targeting_summary' => array(
				'countries'   => isset( $prefill['countries'] ) ? array_values( (array) $prefill['countries'] ) : array(),
				'languages'   => isset( $prefill['languages'] ) ? array_values( (array) $prefill['languages'] ) : array(),
				'devices'     => isset( $prefill['devices'] ) ? array_values( (array) $prefill['devices'] ) : array(),
				'page_topics' => isset( $prefill['page_topics'] ) ? array_values( (array) $prefill['page_topics'] ) : array(),
			),
			'source_context'    => array(
				'source'     => 'wordpress_post',
				'post_id'    => (int) $post->ID,
				'post_type'  => (string) $post->post_type,
				'target_urn' => isset( $prefill['target_urn'] ) ? (string) $prefill['target_urn'] : '',
				'intent'     => $intent,
			),
		);
	}

	/**
	 * Build chat-native submit eligibility hints.
	 *
	 * @param array  $args            Preparation input.
	 * @param array  $prefill         Recommended campaign prefill payload.
	 * @param string $fallback_url    Blaze widget/dashboard fallback URL.
	 * @param array  $payment_context Saved payment method context.
	 * @return array
	 */
	private static function build_submit_eligibility( array $args, array $prefill, string $fallback_url, array $payment_context ): array {
		if ( $payment_context['known'] ) {
			$base = array(
				'fallback_url'                       => $fallback_url,
				'selected_payment_method'            => $payment_context['selected_payment_method'],
				'available_payment_methods'          => $payment_context['available_payment_methods'],
				'supports_payment_method_switching' => count( $payment_context['available_payment_methods'] ) > 1,
			);

			if ( is_array( $payment_context['selected_payment_method'] ) ) {
				return array_merge(
					array(
						'chat_native_submit' => true,
						'payment_method'     => 'saved_payment_method',
						'reason'             => null,
					),
					$base
				);
			}

			return array_merge(
				array(
					'chat_native_submit' => false,
					'payment_method'     => 'missing_saved_payment_method',
					'reason'             => '' !== $payment_context['requested_payment_method_id']
						? 'requested_payment_method_unavailable'
						: 'saved_payment_method_required',
				),
				$base
			);
		}

		/**
		 * Filters whether the prepared campaign can use an existing saved payment
		 * method for chat-native submit.
		 *
		 * Return true when the site/user has a saved payment method available,
		 * false when Blaze knows one is missing, or null when eligibility is
		 * unknown and the caller should use the fallback URL.
		 *
		 * @since $$next-version$$
		 *
		 * @param bool|null $has_saved_payment_method Saved-payment eligibility.
		 * @param array     $args                     Preparation input.
		 * @param array     $prefill                  Recommended campaign prefill payload.
		 */
		$has_saved_payment_method = apply_filters( 'jetpack_blaze_prepare_campaign_has_saved_payment_method', null, $args, $prefill );

		$base = array(
			'fallback_url'                       => $fallback_url,
			'selected_payment_method'            => null,
			'available_payment_methods'          => array(),
			'supports_payment_method_switching' => false,
		);

		if ( true === $has_saved_payment_method ) {
			return array_merge(
				array(
					'chat_native_submit' => true,
					'payment_method'     => 'saved_payment_method',
					'reason'             => null,
				),
				$base
			);
		}

		return array_merge(
			array(
				'chat_native_submit' => false,
				'payment_method'     => false === $has_saved_payment_method
					? 'missing_saved_payment_method'
					: 'unknown',
				'reason'             => false === $has_saved_payment_method
					? 'saved_payment_method_required'
					: 'payment_eligibility_unknown',
			),
			$base
		);
	}

	/**
	 * Build approval wording data for chat-native submit.
	 *
	 * @param array $package Prepared campaign identity.
	 * @return array
	 */
	private static function build_approval_block( array $package ): array {
		return array(
			'prepared_campaign_id'     => $package['id'],
			'prepared_campaign_hash'   => $package['hash'],
			'title_key'                => 'blaze.approval.title',
			'body_key'                 => 'blaze.approval.body',
			'confirmation_label_key'   => 'blaze.approval.confirm_prepared_campaign',
			'approval_statement'       => __( 'Approve this exact prepared Blaze campaign package for submission.', 'jetpack-blaze' ),
			'requires_exact_identity'  => true,
			'requires_reprepare_edits' => true,
		);
	}

	/**
	 * Describe which edits invalidate the prepared package identity.
	 *
	 * @return array
	 */
	private static function build_material_edit_policy(): array {
		return array(
			'requires_reprepare' => true,
			'material_fields'    => array(
				'destination',
				'creative',
				'budget',
				'cadence',
				'schedule',
				'targeting',
				'payment_method',
			),
			'message'            => __(
				'Changing destination, creative, budget, cadence, schedule, targeting, or payment method requires preparing a new Blaze campaign package before approval or submit.',
				'jetpack-blaze'
			),
		);
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
