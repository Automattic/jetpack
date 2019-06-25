<?php

namespace Automattic\Jetpack\Analyzer;

class Warnings extends PersistentList {
	public function generate( $invocations, $differences ) {
		/**
		 * Scan every invocation to see if it depends on a Difference
		 */
		foreach( $invocations->get() as $invocation ) {
			foreach( $differences->get() as $difference ) {
				// $warning = $
				$difference->find_invocation_warnings( $invocation, $this );
			}
		}
	}
}