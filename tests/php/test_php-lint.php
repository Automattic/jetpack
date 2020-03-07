<?php

class WP_Test_Jetpack_PHP_Lint extends WP_UnitTestCase {
	/**
	 * Props to cfinke for the amazing piece of code.
	 * @author zinigor
	 * @since 4.8.1
	 * @group lint
	 */
	public function test_php_lint() {
		if ( ! getenv( 'PHP_LINT' ) ) {
			$this->markTestSkipped( 'We only need to run PHP lint tests once for each PHP version.' );
		}

		$exclude_paths = array(
			'./docker',
			'./tools',
			'./tests',
			'./vendor',
		);

		// use -prune to prevent traversal of that path.
		// use -print0 and read -d '' to support filenames containing funny characters.
		$find = 'find . -path ' . join( ' -prune -o -path ', array_map( 'escapeshellarg', $exclude_paths ) ) . " -prune -o -name '*.php' -print0";
		// only output lint results for a file if the lint fails.
		$lint_all = $find . ' | while IFS= read -r -d "" file; do OUTPUT=$( php -l "$file" ); if [ 0 -ne $? ]; then echo "$OUTPUT"; fi; done';
		$lint_all_in_jetpack = sprintf( 'cd %s; %s', escapeshellarg( dirname( dirname( dirname( __FILE__ ) ) ) ), $lint_all );

		// read -d is a bashism
		$command = sprintf( 'bash -c %s', escapeshellarg( $lint_all_in_jetpack ) );

		exec( $command, $output );

		$this->assertEmpty( $output, join( PHP_EOL, $output ) );
	}
}
