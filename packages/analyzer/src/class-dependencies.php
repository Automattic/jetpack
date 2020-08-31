<?php
/**
 * This collects dependencies of invocations in Codebase A to declarations in codebase B.
 *
 * @package automattic/jetpack-analyzer
 */

namespace Automattic\Jetpack\Analyzer;

/**
 * This collects dependencies of invocations in Codebase A to declarations in codebase B
 */
class Dependencies extends PersistentList {
	/**
	 * Generates items for PersistentList
	 *
	 * @param object $invocations The invocation.
	 * @param object $declarations Declaration.
	 * @param null   $invocation_root Invocation root name.
	 * @throws \Exception If unable to add declaration.
	 */
	public function generate( $invocations, $declarations, $invocation_root = null ) {
		if ( $invocation_root ) {
			$invocation_root = $this->slashit( $invocation_root );
		}

		/**
		 * Scan every invocation to see if it depends on a declaration.
		 */
		foreach ( $invocations->get() as $invocation ) {
			foreach ( $declarations->get() as $declaration ) {
				if ( $invocation->depends_on( $declaration ) ) {
					$this->add( new Dependencies\Dependency( $invocation, $declaration, $invocation_root ) );
				}
			}
		}
	}

	/**
	 * Adds a slash to the end of the $path
	 *
	 * @param string $path Path to slash.
	 * @return string Slashed path.
	 */
	private function slashit( $path ) {
		$path .= ( substr( $path, -1 ) === '/' ? '' : '/' );
		return $path;
	}

	/**
	 * Returns summary of declarations.
	 *
	 * @return string
	 */
	public function declaration_summary() {
		if ( $this->count() === 0 ) {
			return '';
		}

		// assoc array of declarations and counts.
		$summary = array();
		foreach ( $this->get() as $dependency ) {
			$unique_issue_key = $dependency->declaration->display_name();

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

	/**
	 * Returns summary of external files involved.
	 *
	 * @return string
	 */
	public function external_file_summary() {
		if ( $this->count() === 0 ) {
			return '';
		}

		// assoc array of files and counts.
		$summary = array();
		foreach ( $this->get() as $dependency ) {
			$unique_issue_key = $dependency->full_path();

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
