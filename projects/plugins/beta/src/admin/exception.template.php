<?php // phpcs:ignore WordPress.Files.FileName.NotHyphenatedLowercase
/**
 * Template to display an exception.
 *
 * @html-template \Automattic\JetpackBeta\Admin::render
 * @html-template-var Exception $exception
 * @package automattic/jetpack-beta
 */

// phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable -- HTML template, let Phan handle it.

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

?>
<div class="notice notice-error">
	<p><?php echo esc_html( $exception->getMessage() ); ?></p>
	<!--
<?php
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped -- We're printing into a comment, and escaping any "--" (U+002D, ASCII hyphen-minus) to "−−" (U+2212, minus sign) to prevent ending the comment early.
echo str_replace( '--', '−−', $exception->__toString() );
?>
	-->
</div>
