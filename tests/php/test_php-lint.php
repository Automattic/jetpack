<?php

class WP_Test_Jetpack_PHP_Lint extends WP_UnitTestCase {

	/**
	 * Props to cfinke for the amazing piece of code.
	 * @author zinigor
	 * @since 4.8.1
	 */
	public function test_php_lint() {
		$command =
			'for file in `find . -name "*.php"`; '
			. 'do php -l "$file" | '
			. 'grep -v "No syntax errors detected" | '
			. 'grep -v "./tools/" | '
			. 'grep -v "jetpack-cli.php" | '
			. 'grep -v -e \'^$\'; '
			. 'done';

		exec( $command, $output );

		$this->assertEmpty( $output, join( PHP_EOL, $output ) );
	}
}
