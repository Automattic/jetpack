<?php
/**
 * Package-owned store for the site-level Schema.org settings.
 *
 * Persists the admin-configurable values WordPress has no native source for —
 * social profiles (`sameAs`), a contact `email`, optional `name` /
 * `description` overrides, and LocalBusiness details. The Organization node
 * reads the effective values via {@see self::get_organization()} and
 * {@see self::get_local_business()}; the Settings UI round-trips them through
 * {@see Schema_Settings_Controller}.
 *
 * The option is a container keyed by schema type so later types slot in without
 * breaking the contract. Empty Organization overrides fall back to site identity
 * at read time, so an unconfigured site still emits a valid node and later Site
 * Title changes track.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Reads, sanitizes, and persists the site-level Schema settings.
 */
class Schema_Settings {

	/**
	 * Versioned option name. The `_v1` suffix lets a future shape change ship a
	 * new option rather than migrate in place.
	 *
	 * @var string
	 */
	const OPTION_NAME = 'jetpack_seo_schema_settings_v1';

	/**
	 * Schema.org day-code order for stored opening-hours settings.
	 *
	 * @var array<int, string>
	 */
	const OPENING_DAYS = array( 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su' );

	/**
	 * The editing payload for the Settings form / REST route: the raw stored
	 * overrides (empty where unset) plus the site-identity defaults the form shows
	 * as field placeholders. Keeping the two separate lets an empty field track the
	 * Site Title instead of freezing its value.
	 *
	 * @return array{organization: array{name: string, description: string, sameAs: array<int, string>, email: string}, localBusiness: array{enabled: bool, address: array{streetAddress: string, addressLocality: string, addressRegion: string, postalCode: string, addressCountry: string}, telephone: string, geo: array{latitude: string, longitude: string}, openingHours: array<string, array{opens: string, closes: string}>, priceRange: string}, defaults: array{organization: array{name: string, description: string}, localBusiness: array{address: array{streetAddress: string, addressLocality: string, addressRegion: string, postalCode: string, addressCountry: string}}}}
	 */
	public static function get_editable() {
		$defaults = self::get_defaults();
		$stored   = self::get_stored();

		return array(
			'organization'  => $stored['organization'],
			'localBusiness' => $stored['localBusiness'],
			'defaults'      => array(
				'organization'  => array(
					'name'        => $defaults['organization']['name'],
					'description' => $defaults['organization']['description'],
				),
				'localBusiness' => array(
					'address' => $defaults['localBusiness']['address'],
				),
			),
		);
	}

	/**
	 * Site-identity defaults for the fields WordPress has a source for: `name` /
	 * `description` from the Site Title and Tagline. Shown as placeholders and used
	 * as the fallback. WooCommerce store address settings, when WooCommerce is
	 * active, provide LocalBusiness address placeholders and read-time fallbacks.
	 * `sameAs` / `email` and the other LocalBusiness fields have no source, so they
	 * aren't defaulted.
	 *
	 * @return array{organization: array{name: string, description: string}, localBusiness: array{address: array{streetAddress: string, addressLocality: string, addressRegion: string, postalCode: string, addressCountry: string}}}
	 */
	public static function get_defaults() {
		return array(
			'organization'  => array(
				'name'        => self::text( get_bloginfo( 'name' ) ),
				'description' => self::text( get_bloginfo( 'description' ) ),
			),
			'localBusiness' => array(
				'address' => self::woo_address_defaults(),
			),
		);
	}

	/**
	 * The effective Organization settings the node consumes: stored overrides where
	 * present, site-identity defaults otherwise. `sameAs` / `email` are stored-only.
	 * Computed live so an unconfigured `name` / `description` tracks site identity.
	 *
	 * @return array{name: string, description: string, sameAs: array<int, string>, email: string}
	 */
	public static function get_organization() {
		$defaults = self::get_defaults();
		$stored   = self::get_stored();

		$organization = $stored['organization'];
		$fallbacks    = $defaults['organization'];

		return array(
			'name'        => '' !== $organization['name'] ? $organization['name'] : $fallbacks['name'],
			'description' => '' !== $organization['description'] ? $organization['description'] : $fallbacks['description'],
			'sameAs'      => $organization['sameAs'],
			'email'       => $organization['email'],
		);
	}

	/**
	 * The effective LocalBusiness settings the node consumes: stored values, with
	 * each address subfield falling back to WooCommerce store-address defaults when
	 * the stored value is empty. Other LocalBusiness properties are stored-only.
	 *
	 * @return array{enabled: bool, address: array{streetAddress: string, addressLocality: string, addressRegion: string, postalCode: string, addressCountry: string}, telephone: string, geo: array{latitude: string, longitude: string}, openingHours: array<string, array{opens: string, closes: string}>, priceRange: string}
	 */
	public static function get_local_business() {
		$defaults = self::get_defaults();
		$stored   = self::get_stored();

		$local_business = $stored['localBusiness'];
		$fallbacks      = $defaults['localBusiness']['address'];

		foreach ( array( 'streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry' ) as $field ) {
			if ( '' === $local_business['address'][ $field ] ) {
				$local_business['address'][ $field ] = $fallbacks[ $field ];
			}
		}

		return $local_business;
	}

	/**
	 * Sanitize a raw submission and persist it, then return the new editing payload
	 * (so the caller can hand it straight back to the client).
	 *
	 * @param mixed $raw Raw input (expected to be the container array).
	 * @return array{organization: array{name: string, description: string, sameAs: array<int, string>, email: string}, localBusiness: array{enabled: bool, address: array{streetAddress: string, addressLocality: string, addressRegion: string, postalCode: string, addressCountry: string}, telephone: string, geo: array{latitude: string, longitude: string}, openingHours: array<string, array{opens: string, closes: string}>, priceRange: string}, defaults: array{organization: array{name: string, description: string}, localBusiness: array{address: array{streetAddress: string, addressLocality: string, addressRegion: string, postalCode: string, addressCountry: string}}}}
	 */
	public static function update( $raw ) {
		$raw    = is_array( $raw ) ? $raw : array();
		$stored = self::get_stored();
		foreach ( array( 'organization', 'localBusiness' ) as $section ) {
			if ( ! array_key_exists( $section, $raw ) ) {
				$raw[ $section ] = $stored[ $section ];
			}
		}

		update_option( self::OPTION_NAME, self::sanitize( $raw ) );
		return self::get_editable();
	}

	/**
	 * Normalize and sanitize raw input into the stored option shape: trimmed plain
	 * text for `name` / `description`, validated + deduped URLs for `sameAs`, a
	 * sanitized `email`, and normalized LocalBusiness fields. Defensive against
	 * non-array / non-string input.
	 *
	 * @param mixed $raw Raw input.
	 * @return array{organization: array{name: string, description: string, sameAs: array<int, string>, email: string}, localBusiness: array{enabled: bool, address: array{streetAddress: string, addressLocality: string, addressRegion: string, postalCode: string, addressCountry: string}, telephone: string, geo: array{latitude: string, longitude: string}, openingHours: array<string, array{opens: string, closes: string}>, priceRange: string}}
	 */
	public static function sanitize( $raw ) {
		$raw          = is_array( $raw ) ? $raw : array();
		$organization = isset( $raw['organization'] ) && is_array( $raw['organization'] )
			? $raw['organization']
			: array();

		return array(
			'organization'  => array(
				'name'        => self::text( $organization['name'] ?? '' ),
				'description' => self::text( $organization['description'] ?? '' ),
				'sameAs'      => self::sanitize_url_list( $organization['sameAs'] ?? array() ),
				'email'       => self::email( $organization['email'] ?? '' ),
			),
			'localBusiness' => self::sanitize_local_business( $raw['localBusiness'] ?? array() ),
		);
	}

	/**
	 * Normalize a list of profile URLs (`sameAs`): keep only valid absolute http(s)
	 * URLs and drop duplicates. Shared by the settings store and the Organization
	 * node so what the form stores is exactly what the schema graph emits.
	 *
	 * @param mixed $value Raw value (expected to be an array of URLs).
	 * @return array<int, string>
	 */
	public static function sanitize_url_list( $value ) {
		if ( ! is_array( $value ) ) {
			return array();
		}

		$urls = array();
		foreach ( $value as $url ) {
			if ( ! is_string( $url ) ) {
				continue;
			}

			$url = trim( $url );
			if ( '' === $url ) {
				continue;
			}

			// Absolute http(s) URLs with a host only. Deliberately not
			// wp_http_validate_url(): that resolves DNS (gethostbyname), which
			// blocks front-end rendering and drops valid-but-unresolvable hosts.
			// These URLs are emitted as markup, never fetched.
			$scheme = strtolower( (string) wp_parse_url( $url, PHP_URL_SCHEME ) );
			if ( ! in_array( $scheme, array( 'http', 'https' ), true ) || ! wp_parse_url( $url, PHP_URL_HOST ) ) {
				continue;
			}

			$clean = esc_url_raw( $url, array( 'http', 'https' ) );
			if ( '' !== $clean ) {
				$urls[] = $clean;
			}
		}

		return array_values( array_unique( $urls ) );
	}

	/**
	 * The stored settings, normalized to the full option shape (so callers can
	 * rely on every key being present even when the option is absent or partial).
	 *
	 * @return array{organization: array{name: string, description: string, sameAs: array<int, string>, email: string}, localBusiness: array{enabled: bool, address: array{streetAddress: string, addressLocality: string, addressRegion: string, postalCode: string, addressCountry: string}, telephone: string, geo: array{latitude: string, longitude: string}, openingHours: array<string, array{opens: string, closes: string}>, priceRange: string}}
	 */
	private static function get_stored() {
		return self::sanitize( get_option( self::OPTION_NAME, array() ) );
	}

	/**
	 * Normalize and sanitize raw LocalBusiness input into the stored option shape.
	 *
	 * @param mixed $raw Raw LocalBusiness input.
	 * @return array{enabled: bool, address: array{streetAddress: string, addressLocality: string, addressRegion: string, postalCode: string, addressCountry: string}, telephone: string, geo: array{latitude: string, longitude: string}, openingHours: array<string, array{opens: string, closes: string}>, priceRange: string}
	 */
	private static function sanitize_local_business( $raw ) {
		$raw     = is_array( $raw ) ? $raw : array();
		$address = isset( $raw['address'] ) && is_array( $raw['address'] ) ? $raw['address'] : array();

		return array(
			'enabled'      => ! empty( $raw['enabled'] ),
			'address'      => array(
				'streetAddress'   => self::text( $address['streetAddress'] ?? '' ),
				'addressLocality' => self::text( $address['addressLocality'] ?? '' ),
				'addressRegion'   => self::text( $address['addressRegion'] ?? '' ),
				'postalCode'      => self::text( $address['postalCode'] ?? '' ),
				'addressCountry'  => self::country_code( $address['addressCountry'] ?? '' ),
			),
			'telephone'    => self::telephone( $raw['telephone'] ?? '' ),
			'geo'          => self::geo( $raw['geo'] ?? array() ),
			'openingHours' => self::opening_hours( $raw['openingHours'] ?? array() ),
			'priceRange'   => self::price_range( $raw['priceRange'] ?? '' ),
		);
	}

	/**
	 * WooCommerce store-address defaults for LocalBusiness address placeholders.
	 *
	 * @return array{streetAddress: string, addressLocality: string, addressRegion: string, postalCode: string, addressCountry: string}
	 */
	private static function woo_address_defaults() {
		$address = array(
			'streetAddress'   => '',
			'addressLocality' => '',
			'addressRegion'   => '',
			'postalCode'      => '',
			'addressCountry'  => '',
		);

		if ( ! class_exists( 'WooCommerce' ) ) {
			return $address;
		}

		$street_1 = self::text( (string) get_option( 'woocommerce_store_address', '' ) );
		$street_2 = self::text( (string) get_option( 'woocommerce_store_address_2', '' ) );
		if ( '' !== $street_1 ) {
			$address['streetAddress'] = $street_1;
		}
		if ( '' !== $street_2 ) {
			$address['streetAddress'] = '' !== $address['streetAddress'] ? $address['streetAddress'] . ', ' . $street_2 : $street_2;
		}

		$address['addressLocality'] = self::text( (string) get_option( 'woocommerce_store_city', '' ) );
		$address['postalCode']      = self::text( (string) get_option( 'woocommerce_store_postcode', '' ) );

		$country_region            = explode( ':', self::text( (string) get_option( 'woocommerce_default_country', '' ) ), 2 );
		$address['addressCountry'] = self::country_code( $country_region[0] ?? '' );
		$address['addressRegion']  = $country_region[1] ?? '';

		return $address;
	}

	/**
	 * Normalize latitude/longitude settings. A half-coordinate is useless, so any
	 * invalid or missing endpoint clears both.
	 *
	 * @param mixed $raw Raw geo input.
	 * @return array{latitude: string, longitude: string}
	 */
	private static function geo( $raw ) {
		$empty = array(
			'latitude'  => '',
			'longitude' => '',
		);

		if ( ! is_array( $raw ) ) {
			return $empty;
		}

		$latitude  = self::coordinate( $raw['latitude'] ?? null, 90 );
		$longitude = self::coordinate( $raw['longitude'] ?? null, 180 );

		if ( null === $latitude || null === $longitude ) {
			return $empty;
		}

		return array(
			'latitude'  => $latitude,
			'longitude' => $longitude,
		);
	}

	/**
	 * Validate and normalize one coordinate.
	 *
	 * @param mixed $value Raw coordinate.
	 * @param int   $max   Absolute allowed bound.
	 * @return string|null
	 */
	private static function coordinate( $value, $max ) {
		if ( ! is_scalar( $value ) ) {
			return null;
		}

		$value = trim( (string) $value );
		if ( '' === $value || ! is_numeric( $value ) ) {
			return null;
		}

		$number = (float) $value;
		if ( abs( $number ) > $max ) {
			return null;
		}

		return $value;
	}

	/**
	 * Normalize opening hours to all seven schema.org day codes.
	 *
	 * @param mixed $raw Raw opening-hours input.
	 * @return array<string, array{opens: string, closes: string}>
	 */
	private static function opening_hours( $raw ) {
		$raw   = is_array( $raw ) ? $raw : array();
		$hours = array();

		foreach ( self::OPENING_DAYS as $day ) {
			$entry  = isset( $raw[ $day ] ) && is_array( $raw[ $day ] ) ? $raw[ $day ] : array();
			$opens  = self::time( $entry['opens'] ?? '' );
			$closes = self::time( $entry['closes'] ?? '' );

			if ( '' === $opens || '' === $closes ) {
				$opens  = '';
				$closes = '';
			}

			$hours[ $day ] = array(
				'opens'  => $opens,
				'closes' => $closes,
			);
		}

		return $hours;
	}

	/**
	 * Validate an `HH:MM` 24-hour time value.
	 *
	 * @param mixed $value Raw time value.
	 * @return string
	 */
	private static function time( $value ) {
		if ( ! is_string( $value ) ) {
			return '';
		}

		$value = trim( $value );
		return preg_match( '/^([01][0-9]|2[0-3]):[0-5][0-9]$/', $value ) ? $value : '';
	}

	/**
	 * Normalize an optional ISO 3166-1 alpha-2 country code.
	 *
	 * @param mixed $value Raw country code.
	 * @return string
	 */
	private static function country_code( $value ) {
		$value = self::text( $value );
		if ( '' === $value || 1 !== preg_match( '/^[A-Za-z]{2}$/D', $value ) ) {
			return '';
		}

		return strtoupper( $value );
	}

	/**
	 * Normalize an optional telephone number using a permissive common format.
	 *
	 * @param mixed $value Raw telephone number.
	 * @return string
	 */
	private static function telephone( $value ) {
		$value = self::text( $value );
		if ( '' === $value ) {
			return '';
		}

		$has_valid_characters = 1 === preg_match( '/^\+?[0-9 ()-]+$/D', $value );
		$has_digit            = 1 === preg_match( '/[0-9]/', $value );

		return $has_valid_characters && $has_digit ? $value : '';
	}

	/**
	 * Normalize an optional LocalBusiness price range.
	 *
	 * @param mixed $value Raw price range.
	 * @return string
	 */
	private static function price_range( $value ) {
		$value = self::text( $value );
		return self::unicode_length( $value ) < 100 ? $value : '';
	}

	/**
	 * Count Unicode code points, including when the mbstring extension is absent.
	 *
	 * @param string $value Value to measure.
	 * @return int
	 */
	private static function unicode_length( $value ) {
		if ( function_exists( 'mb_strlen' ) ) {
			return mb_strlen( $value, 'UTF-8' );
		}

		$length = preg_match_all( '/./us', $value, $matches );
		return false === $length ? strlen( $value ) : $length;
	}

	/**
	 * Normalize a scalar value to trimmed plain text.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private static function text( $value ) {
		if ( ! is_string( $value ) ) {
			return '';
		}
		return trim( wp_strip_all_tags( $value ) );
	}

	/**
	 * Normalize an email value.
	 *
	 * @param mixed $value Raw value.
	 * @return string
	 */
	private static function email( $value ) {
		if ( ! is_string( $value ) ) {
			return '';
		}
		return sanitize_email( $value );
	}
}
