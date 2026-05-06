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

		$prefill     = self::build_prefill_payload( $args, $post );
		$prefill_url = self::build_prefill_url( $post->ID, $prefill );

		return array(
			'status'      => 'pending_merchant_review',
			'prefill_url' => $prefill_url,
			'prefill'     => $prefill,
		);
	}

	/**
	 * Build the campaign prefill payload from caller input and the target post.
	 *
	 * @param array    $args Preparation input.
	 * @param \WP_Post $post The target post.
	 * @return array
	 */
	private static function build_prefill_payload( array $args, $post ): array {
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
				'amount'   => (float) ( $args['budget_total'] ?? self::DEFAULT_BUDGET_TOTAL ),
				'currency' => self::get_site_currency(),
			),
			'duration_days' => (int) ( $args['duration_days'] ?? self::DEFAULT_DURATION_DAYS ),
			'is_evergreen'  => isset( $args['is_evergreen'] ) ? (bool) $args['is_evergreen'] : true,
			'objective'     => 'VIEWS',
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
						return '' !== $code;
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

		return $payload;
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
}
