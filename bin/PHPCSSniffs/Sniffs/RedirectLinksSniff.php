<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Sniffer that looks for links to a8c domains and throw a warning if they are not being added using a redirect url
 */
class Jetpack_Sniffs_RedirectLinksSniff implements PHP_CodeSniffer_Sniff {
	/**
	 * Returns the token types that this sniff is interested in.
	 *
	 * @return array(int)
	 */
	public function register() {
		return array( T_CONSTANT_ENCAPSED_STRING, T_DOUBLE_QUOTED_STRING, T_INLINE_HTML );
	}

	/**
	 * Processes the tokens that this sniff is interested in.
	 *
	 * @param PHP_CodeSniffer_File $phpcs_file The file where the token was found.
	 * @param int                  $stack_ptr The position in the stack where the token was found.
	 */
	public function process( PHP_CodeSniffer_File $phpcs_file, $stack_ptr ) {

		$tokens = $phpcs_file->getTokens();

		$blacklist = array(
			'([^ ]*\.)?wordpress.com',
			'([^ ]*\.)?jetpack.com',
			'([^ ]*\.)?vaultpress.com',
			'([^ ]*\.)?akismet.com',
			'([^ ]*\.)?tumblr.com',
			'([^ ]*\.)?videopress.com',
			'([^ ]*\.)?wordpress.org',
		);

		$pattern = '/https?:\/\/(' . implode( '|', $blacklist ) . ')/';

		if ( preg_match( $pattern, $tokens[ $stack_ptr ]['content'] ) ) {

			// if string is inside a parenthesis.
			if ( isset( $tokens[ $stack_ptr ]['nested_parenthesis'] ) ) {
				// Gets the position of the most nested opening parenthesis (array_key_last).
				$open_parenthesis_positions = array_keys( $tokens[ $stack_ptr ]['nested_parenthesis'] );
				$open_parenthesis_position  = $open_parenthesis_positions[ count( $open_parenthesis_positions ) - 1 ];

				// gets the first T_STING before the open parenthesis, which should be the function call.
				$function_call = $tokens[ $phpcs_file->findPrevious( T_STRING, $open_parenthesis_position ) ];

				// if function call is get_url, we are fine, don't trigger the Warning.
				if ( 'get_url' === $function_call['content'] ) {
					return;
				}
			}

			$phpcs_file->addWarning(
				'Links must be added using the Jetpack redirect service. See Automattic\Jetpack\Redirects::get_url()',
				$stack_ptr,
				'UrlFoundWithoutRedirect'
			);
		}
	}
}
