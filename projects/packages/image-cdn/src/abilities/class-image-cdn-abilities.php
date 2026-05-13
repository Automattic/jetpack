<?php
/**
 * Jetpack Image CDN Abilities Registration.
 *
 * Registers Jetpack Image CDN abilities with the WordPress Abilities API.
 *
 * @package automattic/jetpack-image-cdn
 */

// @phan-file-suppress PhanUndeclaredFunction, PhanUndeclaredClassMethod @phan-suppress-current-line UnusedSuppression -- Abilities API added in WP 6.9; suppressions needed for older-WP compatibility runs.

namespace Automattic\Jetpack\Image_CDN\Abilities;

use Automattic\Jetpack\Image_CDN\Image_CDN;
use Automattic\Jetpack\WP_Abilities\Registrar;

/**
 * Registers Jetpack Image CDN abilities with the WordPress Abilities API.
 *
 * Exposes a single read-only ability that lets an agent inspect whether
 * the Image CDN (Photon) is active on the current site, the effective
 * CDN domain, and the set of image types eligible for proxying. Reads
 * only — no writes are exposed from this package. Consumers (Jetpack
 * plugin's Photon module, Boost, ...) own the activation toggle and
 * any per-site settings UI; this ability surface is intentionally a
 * status reporter, not a controller.
 */
class Image_CDN_Abilities extends Registrar {

	const CATEGORY_SLUG = 'jetpack-image-cdn';

	/**
	 * Default Photon CDN host used by Image_CDN_Core::cdn_url() when no
	 * site-specific override is registered via the `jetpack_photon_domain`
	 * filter. Kept in sync with class-image-cdn-core.php.
	 */
	const DEFAULT_CDN_DOMAIN = 'https://i0.wp.com';

	/**
	 * Map of supported file extensions to their canonical IANA MIME types.
	 *
	 * Mirrors Image_CDN::$extensions and converts each entry to a MIME
	 * type so callers can match against `get_post_mime_type()` results
	 * without re-deriving the mapping. `jpg` and `jpeg` both map to
	 * `image/jpeg`; downstream callers should de-duplicate by MIME type
	 * rather than by extension if they need a unique set.
	 */
	const EXTENSION_TO_MIME = array(
		'gif'  => 'image/gif',
		'jpg'  => 'image/jpeg',
		'jpeg' => 'image/jpeg',
		'png'  => 'image/png',
		'webp' => 'image/webp',
		'heic' => 'image/heic',
	);

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_slug(): string {
		return self::CATEGORY_SLUG;
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_category_definition(): array {
		return array(
			// "Jetpack" is a product name and should not be translated.
			'label'       => 'Jetpack Image CDN',
			'description' => __( 'Abilities for inspecting the Jetpack Image CDN (Photon) status, effective CDN domain, and supported image types.', 'jetpack-image-cdn' ),
		);
	}

	/**
	 * {@inheritDoc}
	 */
	public static function get_abilities(): array {
		return array(
			'jetpack-image-cdn/get-status' => self::spec_get_status(),
		);
	}

	/**
	 * Spec: jetpack-image-cdn/get-status.
	 */
	private static function spec_get_status(): array {
		return array(
			'label'               => __( 'Get Image CDN status', 'jetpack-image-cdn' ),
			'description'         => __(
				'Return the current Image CDN (Photon) configuration for this site in one zero-argument call. Shape: { active: bool, settings: { quality: int|null, formats: [string]|null, srcset_enabled: bool, cdn_domain: string }, supported_mime_types: [string] }. `active` is true when some consumer plugin (Jetpack\'s Photon module, Boost, ...) has loaded the Image CDN; when false, the other fields describe the would-be configuration if it were enabled. `cdn_domain` is the effective host after the `jetpack_photon_domain` filter runs and defaults to `https://i0.wp.com`. `srcset_enabled` is true iff the CDN is active — the package always wires srcset substitution when loaded and exposes no per-site toggle. `quality` and `formats` are `null` because this package owns neither setting; the consumer plugin controls them. `supported_mime_types` is a deduplicated list derived from the package\'s supported extension whitelist. Read-only, idempotent — safe to poll.',
				'jetpack-image-cdn'
			),
			'input_schema'        => array(
				'type'                 => 'object',
				'properties'           => new \stdClass(),
				'additionalProperties' => false,
			),
			'output_schema'       => array(
				'type'       => 'object',
				'properties' => array(
					'active'               => array( 'type' => 'boolean' ),
					'settings'             => array(
						'type'       => 'object',
						'properties' => array(
							'quality'        => array( 'type' => array( 'integer', 'null' ) ),
							'formats'        => array( 'type' => array( 'array', 'null' ) ),
							'srcset_enabled' => array( 'type' => 'boolean' ),
							'cdn_domain'     => array( 'type' => 'string' ),
						),
					),
					'supported_mime_types' => array(
						'type'  => 'array',
						'items' => array( 'type' => 'string' ),
					),
				),
			),
			'execute_callback'    => array( __CLASS__, 'get_status' ),
			'permission_callback' => array( __CLASS__, 'can_view_status' ),
			'meta'                => array(
				'annotations'  => array(
					'readonly'    => true,
					'destructive' => false,
					'idempotent'  => true,
				),
				'show_in_rest' => true,
			),
		);
	}

	/**
	 * Permission callback: status reads require `manage_options`.
	 *
	 * The Image CDN package has no domain-specific capability of its own
	 * — activation is owned by the consumer plugin. Reuse the site-admin
	 * cap so reads are gated against the same audience that owns the
	 * activation toggle in the consumer plugin's UI.
	 *
	 * @return bool
	 */
	public static function can_view_status(): bool {
		return current_user_can( 'manage_options' );
	}

	/**
	 * Execute: get-status.
	 *
	 * Composes the package's static state — activation flag, supported
	 * extension list, and the effective `jetpack_photon_domain` filter
	 * output — into the documented response shape. Always returns an
	 * array; never errors.
	 *
	 * @param array|null $input Ignored — zero-arg ability.
	 * @return array
	 */
	public static function get_status( $input = null ) {
		unset( $input );

		$active = Image_CDN::is_enabled();

		// Default applied inside Image_CDN_Core::cdn_url() — mirror the same
		// filter call here so consumers that override the domain see their
		// effective value reflected in the status response.
		/** This filter is documented in src/class-image-cdn-core.php */
		$cdn_domain = (string) apply_filters( 'jetpack_photon_domain', self::DEFAULT_CDN_DOMAIN, '' );
		if ( '' === $cdn_domain ) {
			$cdn_domain = self::DEFAULT_CDN_DOMAIN;
		}

		return array(
			'active'               => $active,
			'settings'             => array(
				// `quality` and `formats` are owned by the consumer plugin's
				// settings UI (Jetpack's Photon module, Boost's image
				// optimizer, etc.) — this package does not store either, so
				// the only honest answer is `null`. Callers that need them
				// should consult the consumer plugin's own abilities surface.
				'quality'        => null,
				'formats'        => null,
				'srcset_enabled' => $active,
				'cdn_domain'     => $cdn_domain,
			),
			'supported_mime_types' => self::get_supported_mime_types(),
		);
	}

	/**
	 * Return the de-duplicated list of MIME types the CDN can proxy.
	 *
	 * Image_CDN::get_supported_extensions() returns extensions, with
	 * `jpg` and `jpeg` both present. Project to canonical MIME types
	 * and de-duplicate by MIME so callers see a clean set.
	 *
	 * @return string[]
	 */
	private static function get_supported_mime_types(): array {
		$mimes = array();
		foreach ( Image_CDN::get_supported_extensions() as $extension ) {
			$key = strtolower( (string) $extension );
			if ( isset( self::EXTENSION_TO_MIME[ $key ] ) ) {
				$mimes[ self::EXTENSION_TO_MIME[ $key ] ] = true;
			}
		}
		return array_keys( $mimes );
	}
}
