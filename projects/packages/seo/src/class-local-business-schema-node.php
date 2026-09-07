<?php
/**
 * LocalBusiness Schema.org decorator for the site-level Organization node.
 *
 * Adds LocalBusiness properties to the existing Organization entity when the
 * admin has enabled local-business schema and configured an address. This keeps
 * all publisher references pointing at the same stable `#organization` node
 * instead of introducing a second business entity.
 *
 * @package automattic/jetpack-seo-package
 */

namespace Automattic\Jetpack\SEO;

/**
 * Decorates the site-level Organization node with LocalBusiness details.
 */
class Local_Business_Schema_Node {

	/**
	 * Schema.org opening-hours day-code order and emitted day names.
	 *
	 * @var array<string, string>
	 */
	const DAY_NAMES = array(
		'Mo' => 'Monday',
		'Tu' => 'Tuesday',
		'We' => 'Wednesday',
		'Th' => 'Thursday',
		'Fr' => 'Friday',
		'Sa' => 'Saturday',
		'Su' => 'Sunday',
	);

	/**
	 * Extend an Organization node with LocalBusiness properties.
	 *
	 * @param array|null $organization Built Organization node (null passes through).
	 * @param array      $settings     Effective values from Schema_Settings::get_local_business().
	 * @return array|null
	 */
	public static function extend( $organization, array $settings ) {
		if ( null === $organization || ! is_array( $organization ) ) {
			return $organization;
		}

		if ( empty( $settings['enabled'] ) ) {
			return $organization;
		}

		$address = self::postal_address( isset( $settings['address'] ) && is_array( $settings['address'] ) ? $settings['address'] : array() );
		if ( null === $address ) {
			return $organization;
		}

		$organization['@type']   = array( 'Organization', 'LocalBusiness' );
		$organization['address'] = $address;

		foreach ( array( 'telephone', 'priceRange' ) as $field ) {
			if ( ! empty( $settings[ $field ] ) && is_string( $settings[ $field ] ) ) {
				$organization[ $field ] = $settings[ $field ];
			}
		}

		if ( isset( $settings['geo'] ) && is_array( $settings['geo'] ) ) {
			$latitude  = $settings['geo']['latitude'] ?? '';
			$longitude = $settings['geo']['longitude'] ?? '';
			if ( is_numeric( $latitude ) && is_numeric( $longitude ) ) {
				$organization['geo'] = array(
					'@type'     => 'GeoCoordinates',
					'latitude'  => (float) $latitude,
					'longitude' => (float) $longitude,
				);
			}
		}

		$hours = self::opening_hours_specification( isset( $settings['openingHours'] ) && is_array( $settings['openingHours'] ) ? $settings['openingHours'] : array() );
		if ( ! empty( $hours ) ) {
			$organization['openingHoursSpecification'] = $hours;
		}

		return $organization;
	}

	/**
	 * Build a PostalAddress from non-empty address subfields.
	 *
	 * @param array $address Address settings.
	 * @return array|null
	 */
	private static function postal_address( array $address ) {
		$postal_address = array( '@type' => 'PostalAddress' );
		foreach ( array( 'streetAddress', 'addressLocality', 'addressRegion', 'postalCode', 'addressCountry' ) as $field ) {
			if ( ! empty( $address[ $field ] ) && is_string( $address[ $field ] ) ) {
				$postal_address[ $field ] = $address[ $field ];
			}
		}

		return count( $postal_address ) > 1 ? $postal_address : null;
	}

	/**
	 * Build OpeningHoursSpecification rows for fully configured days.
	 *
	 * @param array $opening_hours Opening-hours settings keyed by schema.org day code.
	 * @return array<int, array<string, string>>
	 */
	private static function opening_hours_specification( array $opening_hours ) {
		$specification = array();
		foreach ( self::DAY_NAMES as $code => $day_name ) {
			$entry  = isset( $opening_hours[ $code ] ) && is_array( $opening_hours[ $code ] ) ? $opening_hours[ $code ] : array();
			$opens  = isset( $entry['opens'] ) && is_string( $entry['opens'] ) ? $entry['opens'] : '';
			$closes = isset( $entry['closes'] ) && is_string( $entry['closes'] ) ? $entry['closes'] : '';

			if ( '' === $opens || '' === $closes ) {
				continue;
			}

			$specification[] = array(
				'@type'     => 'OpeningHoursSpecification',
				'dayOfWeek' => $day_name,
				'opens'     => $opens,
				'closes'    => $closes,
			);
		}

		return $specification;
	}
}
