<?php
/**
 * Warnings class.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer;

/**
 * Class Warnings
 */
class Warnings extends PersistentList {
	/**
	 * Generates if a invocation is due to a difference.
	 *
	 * @param object $invocations The invocations.
	 * @param object $differences The differences.
	 */
	public function generate( $invocations, $differences ) {
		/**
		 * Scan every invocation to see if it depends on a Difference.
		 */
		foreach ( $invocations->get() as $invocation ) {
			foreach ( $differences->get() as $difference ) {
				$difference->find_invocation_warnings( $invocation, $this );
			}
		}
	}

	/**
	 * Summary of Warnings by count.
	 *
	 * @return string
	 */
	public function summary() {
		if ( $this->count() === 0 ) {
			return '';
		}

		// assoc array of issues and counts.
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
