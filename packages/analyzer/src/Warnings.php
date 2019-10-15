<?php

namespace Automattic\Jetpack\Analyzer;

class Warnings extends PersistentList {
	public function generate( $invocations, $differences ) {
		/**
		 * Scan every invocation to see if it depends on a Difference
		 */
		foreach ( $invocations->get() as $invocation ) {
			foreach ( $differences->get() as $difference ) {
				// $warning = $
				$difference->find_invocation_warnings( $invocation, $this );
			}
		}
	}

	public function summary() {
		if ( $this->count() === 0 ) {
			return '';
		}

		// assoc array of issues and counts
		$summary = array();
		foreach ( $this->get() as $warning ) {
			$unique_issue_key = $warning->unique_issue_key();

			if ( ! isset( $summary[ $unique_issue_key ] ) ) {
				$summary[ $unique_issue_key ] = 0;
			}

			$summary[ $unique_issue_key ] += 1;
		}

		arsort( $summary );

		$summary_string = '';
		foreach ( $summary as $issue => $count ) {
			$summary_string .= "$issue,$count\n";
		}

		return $summary_string;
	}
}
