<?php
/**
 * Interface for Depends_On.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer\Invocations;

interface Depends_On {
	/**
	 * Interface for identifying declarations that are depended upon.
	 *
	 * @param \Automattic\Jetpack\Analyzer\Declarations $declaration Declaration of code.
	 *
	 * @return mixed
	 */
	public function depends_on( $declaration );
}
