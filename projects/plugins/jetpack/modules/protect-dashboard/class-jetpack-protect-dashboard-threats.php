<?php
/**
 * Shapes threats for the `@automattic/jetpack-scan` threat list.
 *
 * @package automattic/jetpack
 */

if ( ! defined( 'ABSPATH' ) ) {
	exit( 0 );
}

/**
 * Converts Protect threat models into the camelCase shape the JS threat list reads.
 *
 * @since $$next-version$$
 */
class Jetpack_Protect_Dashboard_Threats {

	/**
	 * Shape one threat.
	 *
	 * @param object $threat A Threat_Model, or a raw threat with the same properties.
	 * @return array
	 */
	public static function format( $threat ) {
		$extension = $threat->extension ?? null;

		return array(
			'id'            => $threat->id ?? null,
			'signature'     => $threat->signature ?? null,
			'title'         => $threat->title ?? null,
			'description'   => $threat->description ?? null,
			'status'        => $threat->status ?? null,
			'severity'      => $threat->severity ?? null,
			'firstDetected' => $threat->first_detected ?? null,
			'fixedIn'       => $threat->fixed_in ?? null,
			'fixedOn'       => $threat->fixed_on ?? null,
			'fixable'       => empty( $threat->fixable ) ? false : $threat->fixable,
			'filename'      => $threat->filename ?? null,
			'extension'     => $extension ? array(
				'slug'    => $extension->slug ?? null,
				'name'    => $extension->name ?? null,
				'version' => $extension->version ?? null,
				// History names extension types in the singular; the threat list reads the plural.
				'type'    => in_array( $extension->type ?? '', array( 'plugin', 'theme' ), true ) ? $extension->type . 's' : ( $extension->type ?? null ),
			) : null,
		);
	}

	/**
	 * Shape a list of threats.
	 *
	 * @param iterable $threats Threats.
	 * @return array
	 */
	public static function format_all( $threats ) {
		$formatted = array();
		foreach ( (array) $threats as $threat ) {
			$formatted[] = self::format( $threat );
		}
		return $formatted;
	}
}
