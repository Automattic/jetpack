<?php
/**
 * Atomic_Persistent_Data file.
 *
 * @package wpcomsh
 */

/**
 * The class Atomic_Persistent_Data.
 *
 * @property string $WPCOM_PURCHASES
 * @property string $WPCOM_MARKETPLACE
 * @property string $WPCOM_MARKETPLACE_SOFTWARE
 */
final class Atomic_Persistent_Data {

	/**
	 * The get function.
	 *
	 * @param string $key The persistent data key.
	 *
	 * @return null
	 */
	public function __get( $key ) { //phpcs:ignore Generic.CodeAnalysis.UnusedFunctionParameter.Found, VariableAnalysis.CodeAnalysis.VariableAnalysis
		return null;
	}
}
