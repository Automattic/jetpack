<?php
/**
 * Stand-in for the Atomic platform's Atomic_Persistent_Data, which wpcomsh only ships as a blank stub.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Answers from `$data` instead of the platform.
 */
final class Atomic_Persistent_Data {

	/**
	 * Persistent data keyed by name.
	 *
	 * @var array<string, string>
	 */
	public static $data = array();

	/**
	 * Returns a persistent data value, or null when it is not set.
	 *
	 * @param string $key The persistent data key.
	 * @return string|null
	 */
	public function __get( $key ) {
		return self::$data[ $key ] ?? null;
	}
}
