<?php
/**
 * IXR_ClientMulticall
 *
 * @package automattic/jetpack-connection
 *
 * @since 1.5
 * @since 7.7 Moved to the jetpack-connection package.
 */

/**
 * A Jetpack implementation of the WordPress core IXR client, capable of multiple calls in a single request.
 */
class Jetpack_IXR_ClientMulticall extends Jetpack_IXR_Client {
	/**
	 * Storage for the IXR calls.
	 *
	 * @var array
	 */
	public $calls = array();

	/**
	 * Add a IXR call to the client.
	 * First argument is the method name.
	 * The rest of the arguments are the params specified to the method.
	 *
	 * @param string[] ...$args IXR args.
	 */
	public function addCall( ...$args ) {
		$method_name   = array_shift( $args );
		$struct        = array(
			'methodName' => $method_name,
			'params'     => $args,
		);
		$this->calls[] = $struct;
	}

	/**
	 * Perform the IXR multicall request.
	 *
	 * @param string[] ...$args IXR args.
	 *
	 * @return bool True if request succeeded, false otherwise.
	 */
	public function query( ...$args ) { // phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
		$this->calls = $this->sort_calls( $this->calls );

		// Prepare multicall, then call the parent::query() method.
		return parent::query( 'system.multicall', $this->calls );
	}

	/**
	 * Sort the IXR calls.
	 * Make sure syncs are always done first.
	 *
	 * @param array $calls Calls to sort.
	 * @return array Sorted calls.
	 */
	public function sort_calls( $calls ) {
		usort(
			$calls,
			function ( $a, $b ) use ( $calls ) {
				if ( 'jetpack.syncContent' === $a['methodName'] && 'jetpack.syncContent' !== $b['methodName'] ) {
					return -1;
				}

				if ( 'jetpack.syncContent' === $b['methodName'] && 'jetpack.syncContent' !== $a['methodName'] ) {
					return 1;
				}

				// The following will put equal values next to each other based on the index of the first one.
				$a_index = array_search( $a, $calls, true );
				$b_index = array_search( $b, $calls, true );

				return $a_index - $b_index;
			}
		);

		return $calls;
	}
}
