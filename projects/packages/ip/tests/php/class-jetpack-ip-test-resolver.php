<?php
/**
 * Canned DNS answers for the resolver shadows in resolver-stubs.php.
 *
 * @package automattic/jetpack-ip
 */

/**
 * Holds the answers the shadowed resolver functions return.
 */
class Jetpack_IP_Test_Resolver {

	/**
	 * Answers keyed by host name, each with optional 'ipv4' and 'ipv6' address
	 * lists. Null means fall through to real name resolution.
	 *
	 * @var array<string, array<string, string[]>>|null
	 */
	public static $answers = null;

	/**
	 * Restores real name resolution.
	 */
	public static function reset() {
		self::$answers = null;
	}

	/**
	 * Answers an A record lookup, in gethostbynamel()'s shape.
	 *
	 * @param string $hostname Host to look up.
	 * @return string[]|false Addresses, or false when the host is unknown.
	 */
	public static function ipv4( $hostname ) {
		$answers = self::$answers;
		if ( null === $answers ) {
			return \gethostbynamel( $hostname );
		}

		return $answers[ $hostname ]['ipv4'] ?? false;
	}

	/**
	 * Answers an AAAA record lookup, in dns_get_record()'s shape.
	 *
	 * @param string $hostname Host to look up.
	 * @param int    $type     Record type requested.
	 * @return array[] Records, empty when the host is unknown.
	 */
	public static function ipv6( $hostname, $type ) {
		$answers = self::$answers;
		if ( null === $answers ) {
			return \dns_get_record( $hostname, $type );
		}

		$records = array();
		if ( isset( $answers[ $hostname ]['ipv6'] ) ) {
			foreach ( $answers[ $hostname ]['ipv6'] as $address ) {
				$records[] = array(
					'type' => 'AAAA',
					'ipv6' => $address,
				);
			}
		}

		return $records;
	}
}
