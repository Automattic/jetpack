<?php
/**
 * Converts wp_mail() arguments into a MailChannels send payload.
 *
 * @package automattic/jetpack-send
 */

namespace Automattic\Jetpack\Send;

use WP_Error;

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Builds MailChannels `/send` payloads from wp_mail() arguments.
 */
class Message_Builder {

	/**
	 * Raw attachment budget; base64 adds a third, keeping payloads under MailChannels' 30 MB cap.
	 *
	 * @var int
	 */
	const MAX_ATTACHMENT_BYTES = 20971520;

	/**
	 * Headers MailChannels won't accept as custom headers, lowercased.
	 *
	 * @var string[]
	 */
	const FORBIDDEN_HEADERS = array(
		'authentication-results',
		'bcc',
		'cc',
		'content-transfer-encoding',
		'content-type',
		'dkim-signature',
		'from',
		'message-id',
		'received',
		'reply-to',
		'subject',
		'to',
	);

	/**
	 * Build a payload.
	 *
	 * Applies `wp_mail_content_type`, `wp_mail_from` and `wp_mail_from_name` itself, because
	 * short-circuiting `pre_wp_mail` skips the point where core applies them.
	 *
	 * @param array $atts     wp_mail() attributes: to, subject, message, headers, attachments, embeds.
	 * @param array $settings Send settings, as returned by Settings::get().
	 * @param array $account  The provisioned account; only `domain` is read.
	 * @return array|WP_Error The payload, or why MailChannels can't send this message.
	 */
	public static function build( array $atts, array $settings, array $account ) {
		$headers = self::parse_headers( $atts['headers'] ?? '' );

		$to = self::parse_address_list( $atts['to'] ?? array() );
		if ( empty( $to ) ) {
			// Core can send Cc- or Bcc-only mail; MailChannels requires a To.
			if ( $headers['cc'] || $headers['bcc'] ) {
				return self::unsupported();
			}
			return new WP_Error( 'jetpack_send_no_recipients', __( 'The email has no valid recipient.', 'jetpack-send-pkg' ) );
		}

		/** This filter is documented in wp-includes/pluggable.php */
		$content_type = (string) apply_filters( 'wp_mail_content_type', '' !== $headers['content_type'] ? $headers['content_type'] : 'text/plain' );
		if (
			! empty( $atts['embeds'] )
			|| '' !== $headers['boundary']
			|| 0 === stripos( $content_type, 'multipart/' )
			|| ( '' !== $headers['charset'] && ! in_array( strtolower( $headers['charset'] ), array( 'utf-8', 'utf8' ), true ) )
		) {
			return self::unsupported();
		}

		$attachments = self::encode_attachments( $atts['attachments'] ?? array() );
		if ( is_wp_error( $attachments ) ) {
			return $attachments;
		}

		$domain     = strtolower( (string) $account['domain'] );
		$from_email = '' !== $headers['from']['email'] ? $headers['from']['email'] : self::configured_from_email( $settings, $domain );
		$from_name  = '' !== $headers['from']['name'] ? $headers['from']['name'] : self::configured_from_name( $settings );
		/** This filter is documented in wp-includes/pluggable.php */
		$from_email = (string) apply_filters( 'wp_mail_from', $from_email );
		/** This filter is documented in wp-includes/pluggable.php */
		$from_name = (string) apply_filters( 'wp_mail_from_name', $from_name );
		$reply_to  = $headers['reply_to'];

		// Domain Lockdown rejects any other domain, so keep the original sender reachable via Reply-To.
		if ( ! self::is_on_domain( $from_email, $domain ) ) {
			if ( empty( $reply_to ) && is_email( $from_email ) ) {
				$reply_to = array( self::address( $from_email, $from_name ) );
			}
			$from_email = self::configured_from_email( $settings, $domain );
		}

		$personalization = array( 'to' => $to );
		if ( $headers['cc'] ) {
			$personalization['cc'] = $headers['cc'];
		}
		if ( $headers['bcc'] ) {
			$personalization['bcc'] = $headers['bcc'];
		}

		$payload = array(
			'personalizations' => array( $personalization ),
			'from'             => self::address( $from_email, $from_name ),
			'subject'          => (string) ( $atts['subject'] ?? '' ),
			'content'          => self::content( (string) ( $atts['message'] ?? '' ), $content_type ),
		);
		if ( $reply_to ) {
			$payload['reply_to'] = reset( $reply_to );
		}
		if ( $headers['custom'] ) {
			$payload['headers'] = $headers['custom'];
		}
		if ( $attachments ) {
			$payload['attachments'] = $attachments;
		}

		return $payload;
	}

	/**
	 * The error for a message Send can't represent faithfully, which Mailer hands to core.
	 *
	 * @return WP_Error
	 */
	private static function unsupported() {
		return new WP_Error( 'jetpack_send_unsupported', __( 'This email uses features Send does not support.', 'jetpack-send-pkg' ) );
	}

	/**
	 * Parse wp_mail() headers the way core does.
	 *
	 * @param string|array $headers Raw headers.
	 * @return array
	 */
	public static function parse_headers( $headers ) {
		$parsed = array(
			'from'         => array(
				'email' => '',
				'name'  => '',
			),
			'cc'           => array(),
			'bcc'          => array(),
			'reply_to'     => array(),
			'content_type' => '',
			'charset'      => '',
			'boundary'     => '',
			'custom'       => array(),
		);

		if ( empty( $headers ) ) {
			return $parsed;
		}
		if ( ! is_array( $headers ) ) {
			$headers = explode( "\n", str_replace( "\r\n", "\n", (string) $headers ) );
		}

		foreach ( $headers as $header ) {
			if ( ! is_string( $header ) ) {
				continue;
			}
			if ( false === strpos( $header, ':' ) ) {
				// A folded `boundary=` line continues the previous Content-Type header.
				if ( false !== stripos( $header, 'boundary=' ) ) {
					$parts              = preg_split( '/boundary=/i', trim( $header ) );
					$parsed['boundary'] = trim( str_replace( array( "'", '"' ), '', (string) $parts[1] ) );
				}
				continue;
			}

			list( $name, $value ) = explode( ':', trim( $header ), 2 );
			$name                 = trim( $name );
			$value                = trim( $value );

			switch ( strtolower( $name ) ) {
				case 'from':
					$address = self::parse_address( $value );
					if ( $address ) {
						$parsed['from'] = array(
							'email' => $address['email'],
							'name'  => $address['name'] ?? '',
						);
					}
					break;
				case 'cc':
					$parsed['cc'] = array_merge( $parsed['cc'], self::parse_address_list( $value ) );
					break;
				case 'bcc':
					$parsed['bcc'] = array_merge( $parsed['bcc'], self::parse_address_list( $value ) );
					break;
				case 'reply-to':
					$parsed['reply_to'] = array_merge( $parsed['reply_to'], self::parse_address_list( $value ) );
					break;
				case 'content-type':
					$parts                  = explode( ';', $value, 2 );
					$parsed['content_type'] = strtolower( trim( $parts[0] ) );
					if ( isset( $parts[1] ) && false !== stripos( $parts[1], 'boundary=' ) ) {
						$parsed['boundary'] = trim( str_ireplace( array( 'boundary=', '"' ), '', $parts[1] ) );
					}
					if ( isset( $parts[1] ) && preg_match( '/charset\s*=\s*["\']?([^"\';\s]+)/i', $parts[1], $charset ) ) {
						$parsed['charset'] = $charset[1];
					}
					break;
				default:
					if ( ! in_array( strtolower( $name ), self::FORBIDDEN_HEADERS, true ) ) {
						$parsed['custom'][ $name ] = $value;
					}
			}
		}

		return $parsed;
	}

	/**
	 * Parse a comma-separated string or array of addresses, dropping invalid ones.
	 *
	 * @param string|array $value Addresses.
	 * @return array[] MailChannels address objects.
	 */
	private static function parse_address_list( $value ) {
		$items     = is_array( $value ) ? $value : explode( ',', (string) $value );
		$addresses = array();
		foreach ( $items as $item ) {
			$address = self::parse_address( (string) $item );
			if ( $address ) {
				$addresses[] = $address;
			}
		}
		return $addresses;
	}

	/**
	 * Parse `email` or `Name <email>`.
	 *
	 * @param string $raw Address.
	 * @return array|null MailChannels address object, or null when invalid.
	 */
	private static function parse_address( $raw ) {
		$raw  = trim( $raw );
		$name = '';
		if ( preg_match( '/^(.*)<([^>]+)>\s*$/', $raw, $matches ) ) {
			$name = trim( str_replace( '"', '', $matches[1] ) );
			$raw  = trim( $matches[2] );
		}
		if ( ! is_email( $raw ) ) {
			return null;
		}
		return self::address( $raw, $name );
	}

	/**
	 * A MailChannels address object, omitting an empty name.
	 *
	 * @param string $email Email.
	 * @param string $name  Display name.
	 * @return array
	 */
	private static function address( $email, $name ) {
		$address = array( 'email' => $email );
		if ( '' !== $name ) {
			$address['name'] = $name;
		}
		return $address;
	}

	/**
	 * The configured From address on the sending domain.
	 *
	 * @param array  $settings Send settings.
	 * @param string $domain   Sending domain.
	 * @return string
	 */
	private static function configured_from_email( array $settings, $domain ) {
		$local_part = '' !== ( $settings['from_local_part'] ?? '' ) ? $settings['from_local_part'] : 'wordpress'; // phpcs:ignore WordPress.WP.CapitalPDangit.MisspelledInText -- Lowercase mailbox name, as core's default.
		return $local_part . '@' . $domain;
	}

	/**
	 * The configured From name, defaulting to the site title.
	 *
	 * @param array $settings Send settings.
	 * @return string
	 */
	private static function configured_from_name( array $settings ) {
		if ( '' !== ( $settings['from_name'] ?? '' ) ) {
			return $settings['from_name'];
		}
		return wp_specialchars_decode( (string) get_bloginfo( 'name' ), ENT_QUOTES );
	}

	/**
	 * Whether an address is on exactly the given domain.
	 *
	 * @param string $email  Email.
	 * @param string $domain Domain, lowercase.
	 * @return bool
	 */
	private static function is_on_domain( $email, $domain ) {
		$at = strrchr( $email, '@' );
		return false !== $at && strtolower( substr( $at, 1 ) ) === $domain;
	}

	/**
	 * Content parts; MailChannels requires text/plain before text/html.
	 *
	 * @param string $message      Body.
	 * @param string $content_type Content type after filters.
	 * @return array[]
	 */
	private static function content( $message, $content_type ) {
		if ( 'text/html' === strtolower( $content_type ) ) {
			return array(
				array(
					'type'  => 'text/plain',
					'value' => self::html_to_text( $message ),
				),
				array(
					'type'  => 'text/html',
					'value' => $message,
				),
			);
		}

		return array(
			array(
				'type'  => 'text/plain',
				'value' => $message,
			),
		);
	}

	/**
	 * A readable plain-text version of an HTML body.
	 *
	 * @param string $html HTML.
	 * @return string
	 */
	private static function html_to_text( $html ) {
		$text = preg_replace( '#<br\s*/?>#i', "\n", $html );
		$text = preg_replace( '#</(p|div|h[1-6]|li|tr|table|ul|ol|blockquote)>#i', "\n\n", $text );
		$text = html_entity_decode( wp_strip_all_tags( $text ), ENT_QUOTES, 'UTF-8' );
		$text = preg_replace( '/[ \t]+/', ' ', $text );
		$text = preg_replace( '/ *\n */', "\n", $text );
		return trim( preg_replace( "/\n{3,}/", "\n\n", $text ) );
	}

	/**
	 * Attachment paths with the file name each is sent as.
	 *
	 * @param string|array $attachments Newline-separated paths, a list of paths, or `name => path`.
	 * @return array[] `{filename, path}` pairs.
	 */
	public static function attachment_files( $attachments ) {
		if ( empty( $attachments ) ) {
			return array();
		}
		if ( ! is_array( $attachments ) ) {
			$attachments = explode( "\n", str_replace( "\r\n", "\n", (string) $attachments ) );
		}

		$files = array();
		foreach ( $attachments as $name => $path ) {
			$path = trim( (string) $path );
			if ( '' !== $path ) {
				$files[] = array(
					'filename' => is_string( $name ) ? $name : wp_basename( $path ),
					'path'     => $path,
				);
			}
		}
		return $files;
	}

	/**
	 * Read and encode attachments.
	 *
	 * @param string|array $attachments Newline-separated paths, a list of paths, or `name => path`.
	 * @return array[]|WP_Error
	 */
	private static function encode_attachments( $attachments ) {
		$encoded = array();
		$total   = 0;
		foreach ( self::attachment_files( $attachments ) as $file ) {
			$path = $file['path'];
			// Stream wrappers such as phar:// can trigger deserialization; core's PHPMailer refuses them too.
			if ( preg_match( '#^[a-z][a-z\d+.-]*://#i', $path ) || ! is_file( $path ) || ! is_readable( $path ) ) {
				return new WP_Error(
					'jetpack_send_attachment_unreadable',
					/* translators: %s: attachment file name. */
					sprintf( __( 'The attachment %s could not be read.', 'jetpack-send-pkg' ), wp_basename( $path ) )
				);
			}

			$total += (int) filesize( $path );
			if ( $total > self::MAX_ATTACHMENT_BYTES ) {
				return new WP_Error( 'jetpack_send_attachment_too_large', __( 'The attachments are larger than 20 MB.', 'jetpack-send-pkg' ) );
			}

			$type      = wp_check_filetype( $file['filename'] );
			$encoded[] = array(
				'content'  => base64_encode( (string) file_get_contents( $path ) ), // phpcs:ignore WordPress.PHP.DiscouragedPHPFunctions.obfuscation_base64_encode, WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- MailChannels requires base64; local file.
				'filename' => $file['filename'],
				'type'     => $type['type'] ? $type['type'] : 'application/octet-stream',
			);
		}

		return $encoded;
	}
}
