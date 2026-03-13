<?php
/**
 * Form Webhooks for Jetpack Contact Forms.
 *
 * @package automattic/jetpack-forms
 */

namespace Automattic\Jetpack\Forms\Service;

use Automattic\Jetpack\Forms\ContactForm\Feedback;
use WP_Error;

/**
 * Class Form_Webhooks
 *
 * Hooks on Jetpack's Contact form to send form data to configured webhooks.
 */
class Form_Webhooks {
	/**
	 * Singleton instance
	 *
	 * @var Form_Webhooks
	 */
	private static $instance = null;

	private const FORMAT_URL_ENCODED       = 'urlencoded';
	private const FORMAT_JSON              = 'json';
	private const METHOD_POST              = 'POST';
	private const METHOD_GET               = 'GET';
	private const METHOD_PUT               = 'PUT';
	private const CONTENT_TYPE_URL_ENCODED = 'application/x-www-form-urlencoded';
	private const CONTENT_TYPE_JSON        = 'application/json';

	/**
	 * Valid methods for webhook requests.
	 *
	 * @var array
	 */
	private const VALID_METHODS = array( self::METHOD_POST, self::METHOD_GET, self::METHOD_PUT );

	/**
	 * Valid formats for webhook requests.
	 *
	 * @var array
	 */
	private const VALID_FORMATS_MAP = array(
		self::FORMAT_URL_ENCODED => self::CONTENT_TYPE_URL_ENCODED,
		self::FORMAT_JSON        => self::CONTENT_TYPE_JSON,
	);

	/**
	 * Initialize and return singleton instance.
	 *
	 * @return Form_Webhooks
	 */
	public static function init() {
		if ( null === self::$instance ) {
			self::$instance = new self();
		}

		return self::$instance;
	}

	/**
	 * Form_Webhooks class constructor.
	 * Hooks on `grunion_after_feedback_post_inserted` action to send form data to configured webhooks.
	 * NOTE: As a singleton, this constructor is private and only callable from ::init, which will return the singleton instance,
	 * effectively preventing multiple instances of this class (hence, multiple hooks triggering the webhook requests).
	 */
	private function __construct() {
		add_action( 'grunion_after_feedback_post_inserted', array( $this, 'send_webhooks' ), 10, 4 );
	}

	/**
	 * Send form data to configured webhooks.
	 *
	 * @param int   $post_id - the post_id for the CPT that is created.
	 * @param array $fields - a collection of Automattic\Jetpack\Forms\ContactForm\Contact_Form_Field instances.
	 * @param bool  $is_spam - marked as spam by Akismet.
	 * @param array $entry_values - extra fields added to from the contact form.
	 *
	 * @return null|void
	 */
	public function send_webhooks( $post_id, $fields, $is_spam, $entry_values ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		// Get the Feedback object from the post_id
		$feedback = Feedback::get( $post_id );

		if ( ! $feedback ) {
			return;
		}

		// if spam (hinted by akismet), don't process
		if ( $is_spam ) {
			return;
		}

		// Get the form from any of the fields to access form attributes (webhooks configuration)
		$form = null;
		foreach ( $fields as $field ) {
			if ( ! empty( $field->form ) ) {
				$form = $field->form;
				break;
			}
		}
		if ( ! $form || ! is_a( $form, 'Automattic\Jetpack\Forms\ContactForm\Contact_Form' ) ) {
			return;
		}

		$webhooks = $this->get_enabled_webhooks( $form->attributes );

		if ( empty( $webhooks ) ) {
			return;
		}

		$form_data = $feedback->get_compiled_fields( 'webhook', 'id-value' );

		// Iterate through each webhook and send the request
		foreach ( $webhooks as $webhook ) {
			$response = $this->send_webhook( $form_data, $webhook, $post_id );
			$this->log_response_to_post_meta( $post_id, $response );
		}
	}

	/**
	 * Log the response to post meta.
	 *
	 * @param int            $post_id The post ID.
	 * @param array|WP_Error $response The response from the webhook or the WP_Error if the request failed.
	 */
	private function log_response_to_post_meta( $post_id, $response ) {
		if ( is_wp_error( $response ) ) {
			update_post_meta( $post_id, '_jetpack_forms_webhook_error', sanitize_text_field( $response->get_error_message() ) );
			$this->track_webhook_request( 'error' );
			return $response;
		}

		$response_code = wp_remote_retrieve_response_code( $response );
		$response_body = wp_remote_retrieve_body( $response );
		$response_data = json_decode( $response_body, true );

		$response_data = array(
			'timestamp' => gmdate( 'Y-m-d H:i:s', time() ),
			'http_code' => $response_code,
			'headers'   => wp_remote_retrieve_headers( $response )->getAll(),
			'body'      => $response_data ?? $response_body, // If the response is not JSON, return the body as is.
		);

		update_post_meta( $post_id, '_jetpack_forms_webhook_response', sanitize_text_field( wp_json_encode( $response_data, JSON_UNESCAPED_SLASHES ) ) );

		// Track success (2xx) or failure based on HTTP response code
		$status = ( $response_code >= 200 && $response_code < 300 ) ? 'success' : 'failed';
		$this->track_webhook_request( $status );
	}

	/**
	 * Track webhook request stats.
	 *
	 * @param string $status The status of the webhook request ('success', 'failed', or 'error').
	 */
	private function track_webhook_request( $status ) {
		/**
		 * Fires when a webhook request is made, allowing stats tracking.
		 *
		 * @since 7.0.0
		 *
		 * @param string $stat_group The stat group name.
		 * @param string $status The status of the request: 'success', 'failed', or 'error'.
		 */
		do_action( 'jetpack_bump_stats_extras', 'jetpack_forms_webhook_request', $status );
	}

	/**
	 * Check if an IP address is in a blocked range.
	 *
	 * @param string $ip The IP address to check.
	 * @return bool True if the IP should be blocked.
	 */
	private function is_blocked_ip( $ip ) {
		// Strip IPv6 zone identifier if present (e.g., fe80::1%eth0 -> fe80::1)
		$ip = preg_replace( '/%.*$/', '', $ip );

		// Check IPv4 link-local addresses (169.254.0.0/16)
		// This range includes the AWS/cloud metadata endpoint (169.254.169.254)
		if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4 ) ) {
			$ip_long = ip2long( $ip );
			// 169.254.0.0/16 = 2851995648 to 2852061183
			if ( $ip_long !== false && $ip_long >= 2851995648 && $ip_long <= 2852061183 ) {
				return true;
			}

			// Block Azure Wire Server (168.63.129.16)
			// Used for Azure internal services including Instance Metadata Service
			if ( $ip === '168.63.129.16' ) {
				return true;
			}

			return false;
		}

		// Check IPv6 addresses for private/internal ranges
		if ( filter_var( $ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV6 ) ) {
			$ip_binary = inet_pton( $ip );
			if ( $ip_binary === false || strlen( $ip_binary ) < 2 ) {
				return false;
			}

			// Check for IPv6 loopback (::1) using binary comparison
			// This handles all valid representations (e.g., 0:0:0:0:0:0:0:1, ::0:1)
			if ( $ip_binary === inet_pton( '::1' ) ) {
				return true;
			}

			// Check for IPv4-mapped IPv6 addresses (::ffff:x.x.x.x)
			// These are 16 bytes where first 10 are zeros, next 2 are 0xff, last 4 are IPv4
			// phpcs:ignore Generic.Strings.UnnecessaryStringConcat.Found -- string concat for readability
			if ( strlen( $ip_binary ) === 16 &&
				substr( $ip_binary, 0, 10 ) === "\x00\x00\x00\x00\x00\x00\x00\x00\x00\x00" &&
				substr( $ip_binary, 10, 2 ) === "\xff\xff" ) {
				// Extract the embedded IPv4 address (last 4 bytes) and check it
				$ipv4 = inet_ntop( substr( $ip_binary, 12, 4 ) );
				if ( $ipv4 && $this->is_blocked_ip( $ipv4 ) ) {
					return true;
				}
			}

			$first_byte  = ord( $ip_binary[0] );
			$second_byte = ord( $ip_binary[1] );

			// Check for IPv6 link-local addresses (fe80::/10)
			// First byte is 0xfe (254), second byte's top 2 bits are 10 (0x80-0xbf)
			if ( $first_byte === 0xfe && ( $second_byte & 0xc0 ) === 0x80 ) {
				return true;
			}

			// Check for IPv6 unique local addresses (fc00::/7)
			// Covers fc00::/8 and fd00::/8 (used for private networks, cloud metadata)
			if ( ( $first_byte & 0xfe ) === 0xfc ) {
				return true;
			}

			// Check for IPv6 site-local addresses (fec0::/10) - deprecated but still blocked
			// First byte is 0xfe (254), second byte's top 2 bits are 11 (0xc0-0xff)
			if ( $first_byte === 0xfe && ( $second_byte & 0xc0 ) === 0xc0 ) {
				return true;
			}
		}

		return false;
	}

	/**
	 * Validate a webhook URL format, scheme, and check for blocked IP ranges.
	 *
	 * Performs validation:
	 * - Valid URL format
	 * - HTTPS scheme requirement
	 * - Blocks link-local and private IP ranges not covered by wp_safe_remote_request()
	 *
	 * @param string $url The webhook URL to validate.
	 * @return bool|WP_Error True if valid, WP_Error with reason if invalid.
	 */
	private function validate_webhook_url( $url ) {
		// Validate URL format before parsing to catch malformed URLs
		// e.g., "https:///example.com" or URLs with unusual syntax
		if ( ! filter_var( $url, FILTER_VALIDATE_URL ) ) {
			return new WP_Error( 'invalid_url', __( 'Invalid webhook URL format.', 'jetpack-forms' ) );
		}

		$parsed = wp_parse_url( $url );

		if ( ! $parsed || empty( $parsed['host'] ) ) {
			return new WP_Error( 'invalid_url', __( 'Invalid webhook URL format.', 'jetpack-forms' ) );
		}

		// Require HTTPS scheme
		if ( empty( $parsed['scheme'] ) || strtolower( $parsed['scheme'] ) !== 'https' ) {
			return new WP_Error( 'https_required', __( 'Webhook URL must use HTTPS.', 'jetpack-forms' ) );
		}

		// Check for blocked IP ranges (link-local, private IPv6)
		$host = $parsed['host'];
		// Strip brackets from IPv6 addresses if present (e.g., [::1] -> ::1)
		$host = trim( $host, '[]' );

		// URL-decode the host to prevent bypass attempts using encoded characters
		// e.g., 169%2e254%2e169%2e254 -> 169.254.169.254
		// e.g., fe80::1%25eth0 -> fe80::1%eth0 (zone identifier becomes visible)
		$host = rawurldecode( $host );

		// Strip IPv6 zone identifier if present (e.g., fe80::1%eth0 -> fe80::1)
		// Zone identifiers are used for link-local addresses and should be blocked
		// Must happen AFTER URL decoding since %25 decodes to %
		if ( strpos( $host, '%' ) !== false ) {
			$host = preg_replace( '/%.*$/', '', $host );
		}

		// If host is already an IP, check it directly
		if ( filter_var( $host, FILTER_VALIDATE_IP ) ) {
			if ( $this->is_blocked_ip( $host ) ) {
				return new WP_Error( 'blocked_ip', __( 'Webhook URL cannot point to private or internal networks.', 'jetpack-forms' ) );
			}
			return true;
		}

		// For hostnames, check IPv4 via gethostbyname
		$ipv4 = gethostbyname( $host );
		if ( $ipv4 !== $host && $this->is_blocked_ip( $ipv4 ) ) {
			return new WP_Error( 'blocked_ip', __( 'Webhook URL cannot point to private or internal networks.', 'jetpack-forms' ) );
		}

		// Check IPv6 via DNS AAAA records (gethostbyname only resolves IPv4)
		// This catches hostnames that resolve to blocked IPv6 addresses
		if ( function_exists( 'dns_get_record' ) ) {
			// phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged -- dns_get_record may fail on some systems
			$aaaa_records = @dns_get_record( $host, DNS_AAAA );
			if ( $aaaa_records ) {
				foreach ( $aaaa_records as $record ) {
					if ( isset( $record['ipv6'] ) && $this->is_blocked_ip( $record['ipv6'] ) ) {
						return new WP_Error( 'blocked_ip', __( 'Webhook URL cannot point to private or internal networks.', 'jetpack-forms' ) );
					}
				}
			}
		}

		return true;
	}

	/**
	 * Get the enabled webhooks from the form attributes.
	 *
	 * @param array $attributes - the attributes of the contact form.
	 * @return array Array of enabled webhooks.
	 */
	private function get_enabled_webhooks( $attributes = array() ) {
		if ( empty( $attributes['webhooks'] ) || ! is_array( $attributes['webhooks'] ) ) {
			return array();
		}

		$enabled_webhooks = array();
		foreach ( $attributes['webhooks'] as $webhook ) {
			$defaults = array(
				'webhook_id' => '',
				'url'        => '',
				'method'     => self::METHOD_POST,
				'verified'   => false,
				'format'     => self::FORMAT_JSON,
				'enabled'    => false,
			);

			$setup = wp_parse_args(
				is_array( $webhook ) && ! empty( $webhook ) ? $webhook : array(),
				$defaults
			);

			// Validate webhook configuration
			if ( empty( $setup['enabled'] ) ) {
				continue;
			}
			// Validate webhook configuration
			if ( empty( $setup['url'] ) ) {
				do_action( 'jetpack_forms_log', 'webhook_skipped', 'url_empty' );
				continue;
			}

			// Validate URL for security (SSRF protection)
			$url_validation = $this->validate_webhook_url( $setup['url'] );
			if ( is_wp_error( $url_validation ) ) {
				do_action( 'jetpack_forms_log', 'webhook_skipped', $url_validation->get_error_code(), $setup );
				continue;
			}

			// Validate format
			if ( ! array_key_exists( strtolower( $setup['format'] ), self::VALID_FORMATS_MAP ) ) {
				do_action( 'jetpack_forms_log', 'webhook_skipped', 'format_invalid', $setup );
				continue;
			}

			// Validate method
			if ( ! in_array( strtoupper( $setup['method'] ), self::VALID_METHODS, true ) ) {
				do_action( 'jetpack_forms_log', 'webhook_skipped', 'method_invalid', $setup );
				continue;
			}

			$enabled_webhooks[] = array(
				'webhook_id' => $setup['webhook_id'],
				'url'        => $setup['url'],
				'format'     => $setup['format'],
				'method'     => $setup['method'],
			);
		}

		return $enabled_webhooks;
	}

	/**
	 * Send webhook request
	 *
	 * Uses wp_safe_remote_request() for built-in SSRF protection including redirect validation.
	 *
	 * @param array $data The data key/value pairs to send.
	 * @param array $webhook Webhook configuration.
	 * @param int   $feedback_id The unique identifier for the feedback post.
	 *
	 * @return array|WP_Error The result value from wp_safe_remote_request
	 */
	private function send_webhook( $data, $webhook, $feedback_id ) {
		global $wp_version;

		/**
		 * Filters the form data before sending it to the webhook.
		 *
		 * Allows developers to modify or augment the form data before it's sent to the webhook endpoint.
		 * NOTE: data has to be the first argument so it can be defaulted.
		 *
		 * @since 6.21.0
		 *
		 * @param array  $form_data  The form data to be sent (field IDs as keys, values as values).
		 * @param string $webhook_id The unique identifier for this webhook.
		 * @param int    $feedback_id The unique identifier for the feedback post.
		 *
		 * @return array The form data to be sent (field IDs as keys, values as values).
		 */
		$data = apply_filters( 'jetpack_forms_before_webhook_request', $data, $webhook['webhook_id'], $feedback_id );

		$user_agent = "WordPress/{$wp_version} | Jetpack/" . constant( 'JETPACK__VERSION' ) . '; ' . get_bloginfo( 'url' );
		$url        = $webhook['url'];
		$format     = self::VALID_FORMATS_MAP[ $webhook['format'] ];
		$method     = $webhook['method'];
		// Encode body based on format
		$body = $webhook['format'] === self::FORMAT_JSON ? wp_json_encode( $data, JSON_UNESCAPED_SLASHES ) : $data;
		$args = array(
			'method'    => $method,
			'body'      => $body,
			'headers'   => array(
				'Content-Type' => $format,
				'user-agent'   => $user_agent,
			),
			'sslverify' => true,
		);

		// Use wp_safe_remote_request for built-in SSRF protection and redirect validation
		return wp_safe_remote_request( $url, $args );
	}
}
