<?php
/**
 * PayPal Partner Referrals onboarding handler.
 *
 * Implements the "Connect with PayPal" flow using PayPal's Partner Referrals
 * API (v2) as a THIRD_PARTY integration: the seller grants Automattic's
 * platform permission to act for them, and no credentials ever reach the site.
 *
 * @package automattic/jetpack-paypal-payments
 * @since 0.9.0
 * @see https://developer.paypal.com/docs/multiparty/seller-onboarding/build-onboarding/
 */

namespace Automattic\Jetpack\PaypalPayments;

use Automattic\Jetpack\Connection\Client;

if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

/**
 * Class PayPal_Partner_Onboarding
 *
 * Handles the Partner Referrals onboarding flow for one-click
 * "Connect with PayPal" merchant setup.
 */
class PayPal_Partner_Onboarding {

	/**
	 * WordPress.com proxy route that creates the Partner Referral.
	 *
	 * Automattic's PayPal platform credentials live on WordPress.com, so the
	 * referral is created there rather than from the site.
	 *
	 * @var string
	 */
	const WPCOM_SIGNUP_LINK_ROUTE = '/paypal/platform/signup-link';

	/**
	 * Transient holding the tracking ID of the referral in progress.
	 *
	 * PayPal's THIRD_PARTY flow hands the site nothing to identify the seller by
	 * once they finish, so the seller is found through the tracking ID the
	 * referral was created with. 30-minute TTL so abandoned flows auto-expire.
	 *
	 * @var string
	 */
	const TRACKING_ID_TRANSIENT_KEY = 'jetpack_paypal_payment_buttons_tracking_id';

	/**
	 * Option key for storing the onboarded merchant's PayPal merchant ID.
	 *
	 * @var string
	 */
	const MERCHANT_ID_OPTION_KEY = 'jetpack_paypal_payment_buttons_merchant_id';

	/**
	 * Option key for storing the onboarded merchant's PayPal email.
	 *
	 * @var string
	 */
	const MERCHANT_EMAIL_OPTION_KEY = 'jetpack_paypal_payment_buttons_merchant_email';

	/**
	 * Option key for storing the onboarding method used.
	 *
	 * @var string
	 */
	const ONBOARDING_METHOD_OPTION_KEY = 'jetpack_paypal_payment_buttons_onboarding_method';

	/**
	 * Option key for the platform's public client ID, which the JS SDK URL needs
	 * alongside the seller's merchant ID.
	 *
	 * @var string
	 */
	const PARTNER_CLIENT_ID_OPTION_KEY = 'jetpack_paypal_payment_buttons_partner_client_id';

	/**
	 * Option: the tracking ID this site onboarded the seller with.
	 *
	 * Sent with every proxied call as proof the site referred the seller. PayPal keeps
	 * it after the seller connects another site, which only moves the record's latest ID.
	 *
	 * @var string
	 */
	const REFERRAL_TRACKING_ID_OPTION_KEY = 'jetpack_paypal_payment_buttons_referral_tracking_id';

	/**
	 * The onboarding method recorded for a referred seller.
	 *
	 * @var string
	 */
	const ONBOARDING_METHOD = 'partner_referrals';

	/**
	 * Known PayPal scopes for each feature the WordPress.com referral requests.
	 *
	 * The keys must match WPCOM_REST_API_V2_Endpoint_PayPal_Onboarding::ONBOARDING_FEATURES.
	 * PayPal publishes no feature-to-scope map, so these come from a seller who
	 * approved every permission.
	 *
	 * @var array<string, string[]>
	 */
	private const FEATURE_SCOPES = array(
		'PAYMENT'                     => array(
			'https://uri.paypal.com/services/payments/realtimepayment',
			'https://uri.paypal.com/services/payments/partnerfee',
			'https://uri.paypal.com/services/payments/payment/authcapture',
		),
		'REFUND'                      => array( 'https://uri.paypal.com/services/payments/refund' ),
		'ACCESS_MERCHANT_INFORMATION' => array( 'https://uri.paypal.com/services/customer/merchant-integrations/read' ),
		'PAYMENT_LINKS_AND_BUTTONS'   => array( 'https://uri.paypal.com/services/checkout/payment-resources/readwrite' ),
	);

	/**
	 * PayPal's website for each environment, linked from the account status notices.
	 *
	 * @var array<string, string>
	 */
	private const PAYPAL_URLS = array(
		'sandbox'    => 'https://www.sandbox.paypal.com',
		'production' => 'https://www.paypal.com',
	);

	/**
	 * Get the onboarded merchant's PayPal merchant ID.
	 *
	 * @return string The merchant ID, or empty string if not onboarded.
	 */
	public static function get_merchant_id() {
		return get_option( self::MERCHANT_ID_OPTION_KEY, '' );
	}

	/**
	 * Get the onboarded merchant's PayPal email. Only Partner Referrals merchants have one.
	 *
	 * @return string The email, or empty string if not onboarded through Partner Referrals.
	 */
	public static function get_merchant_email() {
		return get_option( self::MERCHANT_EMAIL_OPTION_KEY, '' );
	}

	/**
	 * Get the tracking ID this site onboarded the seller with.
	 *
	 * @return string The tracking ID, or empty string for a site onboarded before it was kept.
	 */
	public static function get_referral_tracking_id() {
		return (string) get_option( self::REFERRAL_TRACKING_ID_OPTION_KEY, '' );
	}

	/**
	 * Get the platform's public client ID, as WordPress.com reported it.
	 *
	 * @return string The client ID, or empty string before the first referral.
	 */
	public static function get_partner_client_id() {
		return get_option( self::PARTNER_CLIENT_ID_OPTION_KEY, '' );
	}

	/**
	 * Whether PayPal calls for this site are made by WordPress.com on a referred seller's behalf.
	 *
	 * Credentials pasted by the merchant take precedence: a site holding its own
	 * credentials calls PayPal directly whatever else is stored.
	 *
	 * @return bool
	 */
	public static function is_platform_managed() {
		return '' !== self::get_merchant_id()
			&& self::ONBOARDING_METHOD === get_option( self::ONBOARDING_METHOD_OPTION_KEY, '' )
			&& ! PayPal_OAuth::has_credentials();
	}

	/**
	 * Generate a Partner Referrals signup link for the merchant.
	 *
	 * The referral itself is built and created by WordPress.com, which holds
	 * Automattic's PayPal platform credentials; this method asks for it through
	 * wpcom/v2/paypal/platform/signup-link using the site's blog token, and
	 * returns the action_url for the PayPal mini-browser lightbox.
	 *
	 * Prerequisite: the site must be connected to WordPress.com.
	 *
	 * @param string $return_url  The URL PayPal redirects to after onboarding.
	 * @param string $environment 'sandbox' or 'production'.
	 * @return array|\WP_Error Array with 'action_url', 'referral_id' and 'tracking_id', or WP_Error.
	 */
	public static function generate_signup_link( $return_url, $environment = 'production' ) {
		// Enforce HTTPS on the return URL to protect the onboarding result in transit.
		if ( 'production' === $environment && 0 !== strpos( $return_url, 'https://' ) ) {
			return new \WP_Error(
				'paypal_onboarding_insecure_url',
				__( 'The return URL must use HTTPS for production onboarding.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		// Every later call names the environment the referral was created for, so
		// it has to be the stored one.
		PayPal_OAuth::set_environment( $environment );

		// Automattic's PayPal platform credentials live on WordPress.com, so the
		// referral is created there and only the resulting URL comes back here.
		$response = Client::wpcom_json_api_request_as_blog(
			self::WPCOM_SIGNUP_LINK_ROUTE,
			'2',
			array(
				'method'  => 'POST',
				'timeout' => 30,
				'headers' => array(
					'Content-Type' => 'application/json',
					'Accept'       => 'application/json',
				),
			),
			wp_json_encode(
				array(
					'environment'            => $environment,
					'return_url'             => $return_url,
					'partner_attribution_id' => PayPal_Payment_Buttons::get_partner_attribution_id(),
				),
				JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE
			),
			'wpcom'
		);

		if ( is_wp_error( $response ) ) {
			return new \WP_Error(
				'paypal_referral_request_failed',
				sprintf(
					/* translators: %s: error message */
					__( 'Failed to create PayPal onboarding link: %s', 'jetpack-paypal-payments' ),
					$response->get_error_message()
				)
			);
		}

		$status_code = wp_remote_retrieve_response_code( $response );
		$body        = json_decode( wp_remote_retrieve_body( $response ), true );
		if ( ! is_array( $body ) ) {
			$body = array();
		}

		if ( 201 !== $status_code && 200 !== $status_code ) {
			/*
			 * Keep the merchant-facing message actionable, but carry PayPal's own
			 * diagnostics (the offending field, the issue code, and the debug ID
			 * PayPal support traces on) through in the error data. Without them a
			 * rejected referral is just a 400 with a generic sentence.
			 */
			$error_data = array( 'status' => $status_code );

			foreach ( array( 'paypal_error', 'paypal_details', 'paypal_debug_id' ) as $key ) {
				if ( isset( $body['data'][ $key ] ) ) {
					$error_data[ $key ] = $body['data'][ $key ];
				}
			}

			if ( ! empty( $body['code'] ) ) {
				$error_data['platform_error_code'] = $body['code'];
			}

			if ( ! empty( $body['message'] ) ) {
				$error_data['paypal_message'] = $body['message'];
			}

			/*
			 * A `platform_*` code means WordPress.com is missing or misconfigured
			 * the PayPal platform credentials. Retrying will never clear that, so
			 * telling the merchant to try again sends them in circles and hides
			 * the one message that says what to fix. Pass it through instead.
			 */
			$is_platform_misconfiguration = ! empty( $body['code'] )
				&& 0 === strpos( (string) $body['code'], 'platform_' );

			if ( $is_platform_misconfiguration && ! empty( $body['message'] ) ) {
				return new \WP_Error(
					'paypal_referral_failed',
					sanitize_text_field( $body['message'] ),
					$error_data
				);
			}

			$message = __( 'Could not create a PayPal onboarding link. Please try again or use the manual credentials option.', 'jetpack-paypal-payments' );

			// PayPal's generic top-level sentence never says what was rejected;
			// its `details` entries name the field and issue, so show those.
			$issues = array();
			if ( ! empty( $error_data['paypal_details'] ) && is_array( $error_data['paypal_details'] ) ) {
				foreach ( $error_data['paypal_details'] as $detail ) {
					if ( ! is_array( $detail ) ) {
						continue;
					}
					$issue = trim(
						implode(
							' ',
							array_filter(
								array(
									isset( $detail['field'] ) ? sanitize_text_field( $detail['field'] ) : '',
									isset( $detail['issue'] ) ? sanitize_text_field( $detail['issue'] ) : '',
									isset( $detail['description'] ) ? sanitize_text_field( $detail['description'] ) : '',
								)
							)
						)
					);
					if ( '' !== $issue ) {
						$issues[] = $issue;
					}
				}
			}

			if ( $issues || ! empty( $error_data['paypal_debug_id'] ) ) {
				$message .= ' ' . sprintf(
					/* translators: 1: what PayPal rejected, 2: PayPal's debug ID. */
					__( 'PayPal reported: %1$s (debug ID %2$s).', 'jetpack-paypal-payments' ),
					$issues ? implode( '; ', $issues ) : __( 'unknown error', 'jetpack-paypal-payments' ),
					! empty( $error_data['paypal_debug_id'] ) ? sanitize_text_field( $error_data['paypal_debug_id'] ) : '—'
				);
			}

			return new \WP_Error(
				'paypal_referral_failed',
				$message,
				$error_data
			);
		}

		if ( empty( $body['action_url'] ) ) {
			return new \WP_Error(
				'paypal_referral_no_url',
				__( 'PayPal returned a successful response but no onboarding URL was included.', 'jetpack-paypal-payments' )
			);
		}

		// Without the tracking ID the seller cannot be found once they finish.
		if ( empty( $body['tracking_id'] ) ) {
			return new \WP_Error(
				'paypal_referral_no_tracking_id',
				__( 'WordPress.com created the PayPal onboarding link without a tracking ID.', 'jetpack-paypal-payments' )
			);
		}

		$tracking_id = sanitize_text_field( $body['tracking_id'] );
		set_transient( self::TRACKING_ID_TRANSIENT_KEY, $tracking_id, 30 * MINUTE_IN_SECONDS );

		if ( ! empty( $body['partner_client_id'] ) ) {
			update_option( self::PARTNER_CLIENT_ID_OPTION_KEY, sanitize_text_field( $body['partner_client_id'] ), false );
		}

		return array(
			'action_url'  => $body['action_url'],
			'referral_id' => $body['referral_id'] ?? '',
			'tracking_id' => $tracking_id,
		);
	}

	/**
	 * Record the seller who just finished the PayPal onboarding flow.
	 *
	 * The seller is looked up through WordPress.com by the tracking ID the
	 * referral was created with. PayPal reports `merchantIdInPayPal` on the
	 * return URL, which this flow rarely sees; when a caller does have it, it
	 * stands in for an expired tracking ID.
	 *
	 * @param string $merchant_id_in_paypal The merchant's PayPal payer ID, when the caller has it.
	 * @return true|\WP_Error True on success, WP_Error on failure.
	 */
	public static function complete_onboarding( $merchant_id_in_paypal = '' ) {
		$tracking_id = (string) get_transient( self::TRACKING_ID_TRANSIENT_KEY );
		$merchant_id = sanitize_text_field( (string) $merchant_id_in_paypal );

		if ( '' === $tracking_id && '' === $merchant_id ) {
			return new \WP_Error(
				'paypal_onboarding_no_session',
				__( 'Onboarding session expired. Please try connecting again.', 'jetpack-paypal-payments' )
			);
		}

		$integration = '' !== $tracking_id
			? PayPal_Platform_Client::get_merchant_integration( '', $tracking_id )
			: PayPal_Platform_Client::get_merchant_integration( $merchant_id );

		// A tracking ID PayPal has not tied to a seller yet is not the end of the
		// road when the caller can name the seller.
		if ( is_wp_error( $integration ) && '' !== $tracking_id && '' !== $merchant_id ) {
			$integration = PayPal_Platform_Client::get_merchant_integration( $merchant_id );
		}

		if ( is_wp_error( $integration ) ) {
			return $integration;
		}

		// Checked before anything is written, so a declined permission leaves the site as it was.
		if ( ! self::has_required_scopes( $integration ) ) {
			return new \WP_Error(
				'paypal_onboarding_missing_scopes',
				self::get_missing_scopes_message(),
				array( 'status' => 403 )
			);
		}

		$merchant_id = sanitize_text_field( (string) ( $integration['merchant_id'] ?? $merchant_id ) );
		if ( '' === $merchant_id ) {
			return new \WP_Error(
				'paypal_onboarding_no_merchant_id',
				__( 'PayPal did not return a merchant ID for this account. Please try connecting again.', 'jetpack-paypal-payments' ),
				array( 'status' => 502 )
			);
		}

		// Pasted credentials would take precedence over the referral; this
		// connection replaces them.
		PayPal_OAuth::delete_credentials();

		update_option( self::MERCHANT_ID_OPTION_KEY, $merchant_id, false );
		update_option( self::ONBOARDING_METHOD_OPTION_KEY, self::ONBOARDING_METHOD, false );
		self::cache_merchant_email( $integration );

		// A caller naming the seller instead of a session falls back to the record's
		// latest ID, which WordPress.com has just checked is this site's.
		$referral_tracking_id = '' !== $tracking_id
			? $tracking_id
			: sanitize_text_field( (string) ( $integration['tracking_id'] ?? '' ) );
		if ( '' !== $referral_tracking_id ) {
			update_option( self::REFERRAL_TRACKING_ID_OPTION_KEY, $referral_tracking_id, false );
		} else {
			delete_option( self::REFERRAL_TRACKING_ID_OPTION_KEY );
		}

		// The tracking ID is single-use.
		delete_transient( self::TRACKING_ID_TRANSIENT_KEY );

		// Confirm the grant covers the Payment Links & Buttons API before calling the site connected.
		$api_access = PayPal_OAuth::validate_api_access();
		if ( is_wp_error( $api_access ) ) {
			return self::abandon_onboarding( $api_access );
		}

		return true;
	}

	/**
	 * Discard a half-finished connection and hand back the reason it failed.
	 *
	 * The seller is recorded before the grant is validated, so a failure past
	 * that point would otherwise leave the site connected while the editor
	 * reports an error -- and the merchant is told to reconnect an account that
	 * every other screen already treats as connected.
	 *
	 * @param \WP_Error $error Why onboarding was abandoned.
	 * @return \WP_Error The same error, once the partial state is gone.
	 */
	private static function abandon_onboarding( $error ) {
		delete_option( self::MERCHANT_ID_OPTION_KEY );
		delete_option( self::MERCHANT_EMAIL_OPTION_KEY );
		delete_option( self::ONBOARDING_METHOD_OPTION_KEY );
		delete_option( self::REFERRAL_TRACKING_ID_OPTION_KEY );

		return $error;
	}

	/**
	 * Check the merchant's integration status with PayPal.
	 *
	 * Verifies that the merchant can receive payments and has confirmed email,
	 * and lists the notices to show the seller.
	 *
	 * @return array|\WP_Error Integration status array, or WP_Error.
	 */
	public static function check_merchant_status() {
		$merchant_id = self::get_merchant_id();

		if ( empty( $merchant_id ) ) {
			return new \WP_Error(
				'paypal_no_merchant_info',
				__( 'Merchant integration info not available. Please reconnect your PayPal account.', 'jetpack-paypal-payments' ),
				array( 'status' => 400 )
			);
		}

		$data = PayPal_Platform_Client::get_merchant_integration( $merchant_id, self::get_referral_tracking_id() );
		if ( is_wp_error( $data ) ) {
			return $data;
		}

		self::cache_merchant_email( $data );

		$status = array(
			'merchant_id'             => $merchant_id,
			'payments_receivable'     => ! empty( $data['payments_receivable'] ),
			'primary_email_confirmed' => ! empty( $data['primary_email_confirmed'] ),
			'products'                => $data['products'] ?? array(),
			'notices'                 => array(),
		);

		// Missing permissions take priority over the account flags, so show only that message.
		if ( ! self::has_required_scopes( $data ) ) {
			$status['notices'][] = self::get_missing_scopes_message();
			return $status;
		}

		$paypal_url = self::PAYPAL_URLS[ PayPal_OAuth::get_environment() ] ?? self::PAYPAL_URLS['production'];

		// PayPal requires this wording and order.
		if ( ! $status['primary_email_confirmed'] ) {
			$status['notices'][] = sprintf(
				/* translators: %s: URL of the PayPal business profile settings page. */
				__( 'Attention: Please confirm your email address on %s in order to receive payments! You currently cannot receive payments.', 'jetpack-paypal-payments' ),
				$paypal_url . '/businessprofile/settings'
			);
		}

		if ( ! $status['payments_receivable'] ) {
			$status['notices'][] = sprintf(
				/* translators: %s: URL of the PayPal website. */
				__( 'Attention: You currently cannot receive payments due to restriction on your PayPal account. Please reach out to PayPal Customer Support or connect to %s for more information.', 'jetpack-paypal-payments' ),
				$paypal_url
			);
		}

		return $status;
	}

	/**
	 * The message asking the seller to connect again and approve all permissions.
	 *
	 * @return string Translated message.
	 */
	private static function get_missing_scopes_message() {
		return __( "PayPal didn't grant the permissions this block needs. Connect again and approve all permissions.", 'jetpack-paypal-payments' );
	}

	/**
	 * Whether the seller granted at least one known scope for every requested feature.
	 *
	 * @param array $integration PayPal's merchant integration record.
	 * @return bool
	 */
	private static function has_required_scopes( array $integration ) {
		$scopes = array();
		foreach ( (array) ( $integration['oauth_integrations'] ?? array() ) as $oauth_integration ) {
			foreach ( (array) ( $oauth_integration['oauth_third_party'] ?? array() ) as $third_party ) {
				$scopes = array_merge( $scopes, (array) ( $third_party['scopes'] ?? array() ) );
			}
		}

		foreach ( self::FEATURE_SCOPES as $feature_scopes ) {
			if ( ! array_intersect( $feature_scopes, $scopes ) ) {
				return false;
			}
		}

		return true;
	}

	/**
	 * Cache the email so get_connection_status() can serve it without another PayPal call.
	 *
	 * @param array $integration PayPal's merchant integration record.
	 */
	private static function cache_merchant_email( array $integration ) {
		$primary_email = sanitize_email( $integration['primary_email'] ?? '' );
		if ( '' !== $primary_email ) {
			update_option( self::MERCHANT_EMAIL_OPTION_KEY, $primary_email, false );
		}
	}

	/**
	 * Clean up all Partner Referrals onboarding data.
	 *
	 * Called during disconnect to remove the merchant and any referral in progress.
	 *
	 * @return void
	 */
	public static function cleanup() {
		delete_transient( self::TRACKING_ID_TRANSIENT_KEY );
		delete_option( self::MERCHANT_ID_OPTION_KEY );
		delete_option( self::MERCHANT_EMAIL_OPTION_KEY );
		delete_option( self::ONBOARDING_METHOD_OPTION_KEY );
		delete_option( self::REFERRAL_TRACKING_ID_OPTION_KEY );
		// Note: the partner client ID is not deleted — it's a site-level config, not per-merchant.
	}
}
