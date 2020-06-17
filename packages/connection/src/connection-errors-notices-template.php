<?php // phpcs:disable VariableAnalysis.CodeAnalysis.VariableAnalysis.UndefinedVariable ?>
<div class="error notice is-dismissible">
	<p>There's a problem with yout connection to WordPress.com: <b><?php echo esc_html( $error->get_error_message() ); ?></b></p>
	<p><?php //echo nl2br( esc_html( $error->get_fix_tip() ) ); ?></p>
	<textarea><?php echo wp_json_encode( $error->get_error_data() ); ?></textarea>
</div>
