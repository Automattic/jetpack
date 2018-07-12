<?php
if ( defined( 'IS_WPCOM' ) && IS_WPCOM ) {
	$message     = __( 'Simple Payments is not supported by your current Plan. To learn more, and to upgrade to a supported plan, visit <a href="%s" %s>these resources</a>.', 'jetpack' );
	$support_url = 'https://support.wordpress.com/simple-payments/';
} else {
	$message     = __( 'Simple Payments is not supported by your Jetpack Plan. To learn more, and to upgrade to a supported plan, visit <a href="%s" %s>these resources</a>.', 'jetpack' );
	$support_url = 'https://jetpack.com/support/simple-payment-button/';
}
?>
<div class='jetpack-simple-payments error'>
	<p>
	<?php
	printf(
		wp_kses( $message, array( 'a' => array( 'href' => array(), 'target' => array() ) ) ),
		esc_url( $support_url ),
		'target="_blank"'
	);
	?>
	</p>
</div>
