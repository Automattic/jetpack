<?php
namespace Automattic\Jetpack_Boost\Lib;

use Automattic\Jetpack_Boost\Contracts\Boost_API_Client;

class WPCOM_Boost_API_Client implements Boost_API_Client {

	/**
	 * @inheritDoc
	 */
	// phpcs:ignore VariableAnalysis.CodeAnalysis.VariableAnalysis.UnusedVariable
	public function post( $path, $payload = array() ) {
		// TODO: Implement method.
		wp_die(
			'Not yet implemented',
			'Not yet implemented'
		);
	}
}
