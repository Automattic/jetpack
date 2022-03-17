<?php
/**
 * Template to display an exception.
 *
 * @package automattic/jetpack-beta
 */

// Check that the file is not accessed directly.
if ( ! defined( 'ABSPATH' ) ) {
	exit;
}

// @global Exception $exception Exception to display.
if ( ! isset( $exception ) ) {
	throw new InvalidArgumentException( 'Template parameter $exception missing' );
}
$exception = $exception; // Dummy assignment to fool VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable.

// -------------

?>
<div class="notice notice-error">
	<p><?php echo esc_html( $exception->getMessage() ); ?></p>
	<!--
<?php
// phpcs:ignore WordPress.Security.EscapeOutput.OutputNotEscaped
echo str_replace( '--', '−−', $exception->__toString() );
?>
	-->
</div>
