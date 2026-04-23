<?php
/**
 * PHP syntax checker for uploaded plugins.
 *
 * @package automattic/jetpack-mu-wpcom
 */

/**
 * Walks every `.php` file in a directory and reports any that fail to
 * tokenize — i.e. classic parse errors ("syntax error, unexpected ...")
 * that would fatal the site at activation time.
 *
 * Limitations: only catches errors visible at tokenization. Undefined
 * classes, incompatible signatures, use-of-uninitialized-properties,
 * etc. need real static analysis (Phan/PHPStan) and are out of scope.
 * The admin page labels the check accordingly.
 */
class PCG_Syntax_Checker {

	/**
	 * Check every `.php` file under the directory recursively.
	 *
	 * @param string $plugin_dir Absolute path to scan.
	 * @return array<int,array{file:string,line:int,message:string}>
	 */
	public function check_dir( $plugin_dir ) {
		if ( '' === (string) $plugin_dir || ! is_dir( $plugin_dir ) ) {
			return array();
		}

		$errors = array();
		$iter   = new RecursiveIteratorIterator( new RecursiveDirectoryIterator( $plugin_dir, FilesystemIterator::SKIP_DOTS ) );
		foreach ( $iter as $path => $file ) {
			if ( ! $file->isFile() || 'php' !== strtolower( $file->getExtension() ) ) {
				continue;
			}
			$error = $this->check_file( (string) $path );
			if ( null !== $error ) {
				$errors[] = $error;
			}
		}
		return $errors;
	}

	/**
	 * Tokenize one file with `TOKEN_PARSE` — PHP throws a ParseError on
	 * invalid syntax. Everything else (permission errors, binary files
	 * misnamed .php) is swallowed so a single bad entry doesn't abort
	 * the whole scan.
	 *
	 * @param string $path Absolute file path.
	 * @return array{file:string,line:int,message:string}|null
	 */
	private function check_file( $path ) {
		$code = @file_get_contents( $path ); // phpcs:ignore WordPress.PHP.NoSilencedErrors.Discouraged,WordPress.WP.AlternativeFunctions.file_get_contents_file_get_contents -- local read; errors are non-fatal and returned as null.
		if ( false === $code ) {
			return null;
		}
		try {
			token_get_all( $code, TOKEN_PARSE );
			return null;
		} catch ( \ParseError $e ) {
			return array(
				'file'    => $path,
				'line'    => (int) $e->getLine(),
				'message' => (string) $e->getMessage(),
			);
		} catch ( \Throwable $e ) { // phpcs:ignore Generic.CodeAnalysis.EmptyStatement.DetectedCatch -- tolerate anything else.
			return null;
		}
	}
}
